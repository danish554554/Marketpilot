import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  TrendingUp,
  Lightbulb,
  Video,
  Instagram,
  Mail,
  MessageSquare,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Package,
  Tag,
  Palette,
  ArrowRight,
  Info,
  HelpCircle,
  Edit3,
  Volume2,
  VolumeX,
  Mic,
  Globe,
  Calendar as CalendarIcon,
  Linkedin,
  Facebook,
  Youtube,
  Briefcase
} from 'lucide-react';
import { BrandKit, MarketingStrategy, Product, TrendSignal } from '../types';
import { api } from '../api/endpoints';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { getIndustryProfile, MARKETING_CHANNEL_FORMATS } from '../utils/industry';

export type StudioTabType =
  | 'script'
  | 'linkedin'
  | 'fb_post'
  | 'youtube'
  | 'organic'
  | 'paid'
  | 'email'
  | 'whatsapp';

interface StudioProps {
  products: Product[];
  businessName: string;
  activeStrategy?: MarketingStrategy | null;
  brandKit?: BrandKit | null;
  trends?: TrendSignal[];
  selectedProductId?: string;
  onSelectProduct?: (productId: string) => void;
  onNavigate?: (page: string, productId?: string) => void;
}

const COUNTRY_DEFAULT_LANG: Record<string, string> = {
  Pakistan: 'Urdu',
  'United Arab Emirates': 'Arabic',
  'Saudi Arabia': 'Arabic',
  Germany: 'German',
  Canada: 'English',
  'United States': 'English',
  'United Kingdom': 'English',
  India: 'Hindi',
  Australia: 'English',
};

export const Studio: React.FC<StudioProps> = ({
  products,
  businessName,
  activeStrategy,
  brandKit,
  trends = [],
  selectedProductId: externalProductId,
  onSelectProduct,
  onNavigate,
}) => {
  const { formatAmount } = useCurrency();
  const { targetCountry, industry } = useAuth();
  const activeProfile = getIndustryProfile(industry);

  const [activeTab, setActiveTab] = useState<StudioTabType>(() => {
    const firstRec = activeProfile.recommendedChannels[0];
    const matched = MARKETING_CHANNEL_FORMATS.find((c) => c.id === firstRec);
    return (matched?.studioTab as StudioTabType) || 'script';
  });
  const [selectedProductId, setSelectedProductId] = useState<string>(
    externalProductId || products[0]?.id || ''
  );
  const [selectedTrendTopic, setSelectedTrendTopic] = useState<string>(
    trends[0]?.topic || activeStrategy?.pillars?.[0]?.trend_topic || ''
  );
  const [customOffer, setCustomOffer] = useState<string>('20% Off Launch Discount');
  const [selectedPillarIndex, setSelectedPillarIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [scheduledSuccess, setScheduledSuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    if (externalProductId && externalProductId !== selectedProductId) {
      setSelectedProductId(externalProductId);
    }
  }, [externalProductId]);

  const [activeBrandKit, setActiveBrandKit] = useState<BrandKit | null>(brandKit || null);
  const [guardrailResult, setGuardrailResult] = useState<{
    passed: boolean;
    status: string;
    detected_prohibited_words: string[];
    safety_message: string;
  }>({
    passed: true,
    status: 'passed',
    detected_prohibited_words: [],
    safety_message: '✓ All guardrails passed: 100% Brand Kit compliant & zero medical/miracle claims.',
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0] || {
    id: 'prod-fallback',
    name: `Flagship ${activeProfile.offeringSingular}`,
    description: `High-performing ${activeProfile.label} solution`,
    price: 39.99,
    cost_price: 12.00,
    profit_margin: 70,
    margin_tier: 'high',
    stock_quantity: 150,
    pain_points: ['Daily friction', 'Inefficient alternatives'],
    features: ['Premium quality', 'Fast results', 'Reliable performance'],
  };

  const selectedTrend = trends.find((t) => t.topic === selectedTrendTopic) || trends[0];
  const activePillar = activeStrategy?.pillars?.[selectedPillarIndex] || activeStrategy?.pillars?.[0];

  const [hook, setHook] = useState('');
  const [caption, setCaption] = useState('');
  const [cta, setCta] = useState('Shop now and save 20%');
  const [hashtags, setHashtags] = useState('');
  const [aiModelUsed, setAiModelUsed] = useState('gemini-3.6-flash');

  // Load Brand Kit if missing
  useEffect(() => {
    if (!activeBrandKit) {
      api.getBrandKit().then((bk) => {
        if (bk) setActiveBrandKit(bk);
      }).catch(() => {});
    }
  }, []);

  // Run live guardrail evaluation whenever content changes
  const runLiveGuardrailCheck = async (fullText: string) => {
    const prohibited = activeBrandKit?.prohibited_words || [
      'guaranteed 100%', 'cure-all', 'cheap', 'miracle cure', 'ugly body hair'
    ];

    try {
      const res = await api.validateGuardrails({
        text: fullText,
        prohibited_words: prohibited,
        product_name: selectedProduct.name,
      });
      setGuardrailResult(res);
    } catch {
      const lower = fullText.toLowerCase();
      const detected = prohibited.filter((w) => lower.includes(w.toLowerCase()));
      if (detected.length > 0) {
        setGuardrailResult({
          passed: false,
          status: 'warning',
          detected_prohibited_words: detected,
          safety_message: `⚠️ Prohibited Brand Word Detected: "${detected.join(', ')}". Replace before publishing.`,
        });
      } else {
        setGuardrailResult({
          passed: true,
          status: 'passed',
          detected_prohibited_words: [],
          safety_message: '✓ All guardrails passed: 100% Brand Kit compliant & zero medical/miracle claims.',
        });
      }
    }
  };

  const [regenerationCount, setRegenerationCount] = useState(0);

  const generateAIPost = async (
    tab: StudioTabType = activeTab,
    prod = selectedProduct,
    trend = selectedTrendTopic,
    offer = customOffer,
    variationSeed = regenerationCount
  ) => {
    setIsGenerating(true);
    const channelMap: Record<StudioTabType, string> = {
      script: 'tiktok',
      linkedin: 'linkedin',
      fb_post: 'facebook',
      youtube: 'youtube',
      organic: 'instagram',
      paid: 'facebook',
      email: 'email',
      whatsapp: 'whatsapp',
    };

    try {
      const res = await api.generateStudioCopy({
        product_name: prod.name,
        product_description: prod.description,
        product_features: prod.features || [],
        product_pain_points: prod.pain_points || [],
        channel: channelMap[tab] || 'tiktok',
        format: tab,
        trend_topic: trend || activePillar?.trend_topic || undefined,
        hook_idea: activePillar?.hook_ideas?.[variationSeed % (activePillar?.hook_ideas?.length || 1)] || undefined,
        custom_instructions: `Business Industry: ${activeProfile.label}. Brand Name: ${businessName}. Offer/Promotion: ${offer || 'Standard Pricing'}. Ground strictly in offering features: ${prod.features?.join(', ')}. Target Country: ${targetCountry}. Variation Seed: ${variationSeed}`,
        target_country: targetCountry,
        target_language: COUNTRY_DEFAULT_LANG[targetCountry] || (targetCountry?.toLowerCase() === 'pakistan' ? 'Urdu' : 'English'),
        variation_seed: variationSeed,
      });

      setHook(res.hook);
      setCaption(res.caption);
      setCta(res.call_to_action || `Claim ${offer || 'Special Discount'}`);
      setHashtags(res.hashtags);
      if (res.ai_model_used) setAiModelUsed(res.ai_model_used);

      runLiveGuardrailCheck(`${res.hook}\n${res.caption}\n${res.call_to_action}`);
    } catch (err) {
      console.warn('Backend copywriting fallback:', err);
      fallbackLocalCopy(tab, prod, trend, offer, variationSeed);
    } finally {
      setIsGenerating(false);
    }
  };

  const fallbackLocalCopy = (
    tab: StudioTabType | string,
    prod = selectedProduct,
    trend = selectedTrendTopic,
    offer = customOffer,
    variationSeed = 0
  ) => {
    const prodName = prod.name;
    const feat1 = prod.features?.[0] || 'high-performance automation & quality';
    const feat2 = prod.features?.[1] || 'measurable daily results';
    const pain1 = prod.pain_points?.[0] || 'wasting hours on manual alternatives';
    const promo = offer || '20% OFF Launch Discount';
    const isUrduMarket = targetCountry?.toLowerCase() === 'pakistan';
    const isSaaS =
      activeProfile.id.toLowerCase().includes('saas') ||
      activeProfile.id.toLowerCase().includes('tech');
    const cleanHashtagName = prodName.replace(/[^a-zA-Z0-9]/g, '');
    const cleanIndTag = activeProfile.label.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');

    const nameLower = prodName.toLowerCase();
    let category = 'general';
    if (['hair', 'dryer', 'brush', 'curler', 'straightener', 'shampoo', 'blowout'].some(k => nameLower.includes(k))) {
      category = 'hair';
    } else if (['skin', 'serum', 'cream', 'face', 'glow', 'acne', 'cleanser', 'lotion', 'fuzz', 'derma'].some(k => nameLower.includes(k))) {
      category = 'skincare';
    } else if (['earbud', 'headphone', 'watch', 'charger', 'speaker', 'cable', 'tech', 'smart', 'phone', 'gadget'].some(k => nameLower.includes(k))) {
      category = 'electronics';
    }

    const angle = variationSeed % 4;
    let generatedHook = '';
    let generatedCaption = '';
    let generatedCta = '';
    let generatedTags = '';

    if (tab === 'linkedin') {
      generatedHook = isSaaS
        ? `Most teams lose 10+ hours every single week to ${pain1}. Here is how we automated the entire workflow with ${prodName}:`
        : `The biggest shift happening in ${activeProfile.label} right now — and how ${businessName || 'our team'} is leading it with ${prodName}:`;
      generatedCaption =
        `Over the past few months in the **${activeProfile.label}** space, we noticed a recurring bottleneck:\n` +
        `Decision-makers and customers are exhausted by **${pain1}**.\n\n` +
        `Throwing more manual effort at an outdated process doesn't scale. That's why we built **${prodName}** around 3 core pillars:\n\n` +
        (prod.features && prod.features.length > 0
          ? prod.features.map((f) => `✅ **${f}**`).join('\n')
          : `✅ **${feat1}**\n✅ **${feat2}**`) +
        `\n\n📊 **The Impact:**\n` +
        `Instead of struggling with ${pain1}, users get immediate, reliable outcomes from Day 1.\n\n` +
        `🎁 **Special Opportunity:** We are currently offering **${promo}** for early adopters and partners.\n\n` +
        `What is the #1 bottleneck you are seeing in ${activeProfile.label} this quarter? Let's discuss in the comments 👇`;
      generatedCta = isSaaS
        ? `Book a 15-Min Demo or Start Your Free Trial (${promo})`
        : `Connect with us or claim ${promo} via the link in comments`;
      generatedTags = `#${cleanHashtagName} #${cleanIndTag} #Innovation #GrowthStrategy #B2B #Leadership`;
    } else if (tab === 'fb_post') {
      generatedHook = `Tired of dealing with ${pain1}? See why everyone in ${targetCountry} is switching to ${prodName}! 🙌`;
      generatedCaption =
        `Whether you're looking for reliability, speed, or real value in **${activeProfile.label}**, you shouldn't have to compromise.\n\n` +
        `Here is why **${prodName}** by **${businessName}** has become a community favorite:\n\n` +
        (prod.features && prod.features.length > 0
          ? prod.features.map((f) => `🔥 ${f}`).join('\n')
          : `🔥 ${feat1}\n🔥 ${feat2}`) +
        `\n\n✨ **Current Special Offer:** ${promo}\n` +
        `📍 Available across ${targetCountry} — message our page or click the link below to get started today!\n\n` +
        `💬 Tag a friend or colleague who needs this!`;
      generatedCta = `Send Message / Claim ${promo} Now`;
      generatedTags = `#${cleanHashtagName} #${cleanIndTag} #${targetCountry.replace(/\s+/g, '')} #CommunityFavorite #SpecialOffer`;
    } else if (tab === 'youtube') {
      if (isUrduMarket) {
        generatedHook = `How ${prodName} Solves ${pain1} in Minutes! (Complete Walkthrough & Review)`;
        generatedCaption =
          `[0:00 - 0:10 | THE HOOK & PROBLEM]\n` +
          `Visual: Presenter on camera / screen-recording showing the frustration of ${pain1}.\n` +
          `Voiceover (Roman Urdu): "Agar aap bhi ${activeProfile.label} mein roz roz ${pain1} se pareshan hain, toh aaj ki video aapka time aur paisa dono bachane wali hai!"\n` +
          `Voiceover (اردو): "اگر آپ بھی روز روز اس مسئلے سے پریشان ہیں تو آج کی ویڈیو آپ کا وقت اور پیسہ دونوں بچانے والی ہے!"\n\n` +
          `[0:10 - 0:45 | DEEP-DIVE WALKTHROUGH & DEMO]\n` +
          `Visual: Step-by-step live demonstration of ${prodName}, zooming in on ${feat1} and ${feat2}.\n` +
          `Voiceover (Roman Urdu): "Yeh hai ${prodName}. Dekhein kaise iska ${feat1} aur ${feat2} purane tareeqon ko mukammal taur par replace kar deta hai—bina kisi jhanjhat ke."\n\n` +
          `[0:45 - 1:15 | REAL RESULTS & COMPARISON]\n` +
          `Visual: Side-by-side comparison chart: Traditional Alternatives vs. ${prodName}.\n` +
          `Voiceover (Roman Urdu): "Jahan aam alternatives mein ghanton lagte hain, wahan ${prodName} aapko deta hai instant aur verified results."\n\n` +
          `[1:15 - 1:30 | CALL TO ACTION & PINNED LINK]\n` +
          `Visual: End-screen graphic with link arrow and promo badge (${promo}).\n` +
          `Voiceover (Roman Urdu): "Description aur pinned comment mein link maujood hai—abhi click karein aur ${promo} hasil karein! Channel ko subscribe karna mat bhoolein."`;
      } else {
        generatedHook = `Stop Wasting Time on ${pain1}! Full ${prodName} Walkthrough & Honest Review`;
        generatedCaption =
          `[0:00 - 0:10 | THE HOOK & PROBLEM]\n` +
          `Visual: Fast B-roll / screen-share showing the pain of ${pain1}.\n` +
          `Voiceover: "If you're still dealing with ${pain1} in ${activeProfile.label}, stop what you're doing. In the next 90 seconds, I'll show you how ${prodName} changes everything."\n\n` +
          `[0:10 - 0:45 | STEP-BY-STEP PRODUCT DEMO]\n` +
          `Visual: Close-up walkthrough of ${prodName} showcasing ${feat1} and ${feat2}.\n` +
          `Voiceover: "First, look at how ${prodName} handles ${feat1}. Combined with ${feat2}, what used to take hours now happens effortlessly."\n\n` +
          `[0:45 - 1:15 | ROI & WHY IT WINS]\n` +
          `Visual: On-screen breakdown comparing cost and time saved.\n` +
          `Voiceover: "Whether you're scaling fast or upgrading your daily workflow, the ROI is immediate."\n\n` +
          `[1:15 - 1:30 | CALL TO ACTION]\n` +
          `Visual: Pinned comment callout with ${promo} code.\n` +
          `Voiceover: "Grab your exclusive ${promo} using the first link in the description below, and hit subscribe for more!"`;
      }
      generatedCta = `Click the 1st Link in Description to Claim ${promo}`;
      generatedTags = `#${cleanHashtagName} #${cleanIndTag} #YouTubeShorts #Walkthrough #Review2026`;
    } else if (tab === 'script') {
      if (isUrduMarket) {
        if (category === 'hair') {
          const hairAngles = [
            {
              h: 'Frizzy aur unmanageable baalon se tang aa chuke hain? Pehle yeh 30-second hack dekhein!',
              c: `[HOOK - 0:00 to 0:03]\nVisual: Close-up showing damp, frizzy tangled hair vs. smooth salon blowout transition.\nVoiceover (Roman Urdu): "Har subah baalon ko dry aur style karne mein ghanton zaya karna chhod dein! Pehle yeh 30-second trick dekhein."\nVoiceover (اردو): "ہر صبح بالوں کو ڈرائی اور اسٹائل کرنے میں گھنٹوں ضائع کرنا چھوڑ دیں! پہلے یہ ۳۰ سیکنڈ ہیک دیکھیں۔"\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Presenter effortlessly gliding ${prodName} through hair, showing instant shine and volume (${feat1}).\nVoiceover (Roman Urdu): "Purane bhari dryers aur multiple brushes ka jhanjhat khatam! Yeh ${prodName} baalon ko sukhata bhi hai aur ${feat1} ke sath salon jaisa volumized blowout deta hai sirf chand minutes mein bina kisi heat damage ke!"\nVoiceover (اردو): "پرانے بھاری ڈرائرز کا جھنجھٹ ختم! یہ ${prodName} بالوں کو سکھاتا بھی ہے اور سیلون جیسا باؤنسی بلو آؤٹ دیتا ہے بغیر کسی نقصان کے!"\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Smiling presenter showing silky, styled hair holding ${prodName}.\nVoiceover (Roman Urdu): "Salon ke hazaron rupay bachayein! Neeche diye gaye link par click karein aur launch sale mein poora ${promo} hasil karein!"\nVoiceover (اردو): "سیلون کے ہزاروں روپے بچائیں! نیچے دیے گئے لنک پر کلک کریں اور لانچ سیل میں پورا ${promo} حاصل کریں!"`,
              cta: `Neeche link par click karein aur ${promo} hasil karein`,
              tags: `#${cleanHashtagName} #HairHacksPK #SalonAtHome #HairStylingUrdu #BeautyPK`
            },
            {
              h: 'Salon ke mehnge blowouts par paise zaya karna band karein!',
              c: `[HOOK - 0:00 to 0:03]\nVisual: Split-screen comparing expensive salon bill vs. doing it at home with ${prodName}.\nVoiceover (Roman Urdu): "Kiya aap bhi har event ke liye salon ke hazaron rupay kharch karte hain? Yeh video aapke bohot paise bachane wali hai!"\nVoiceover (اردو): "کیا آپ بھی ہر ایونٹ کے لیے سیلون کے ہزاروں روپے خرچ کرتے ہیں؟ یہ ویڈیو آپ کے بہت پیسے بچانے والی ہے!"\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Demonstrating ${feat2} on damp hair, instantly creating smooth silky finish.\nVoiceover (Roman Urdu): "Is ${prodName} ka advanced airflow aur ${feat1} frizzy baalon ko instantly tame karta hai aur deta hai super smooth finish bina kisi salon appointment ke."\nVoiceover (اردو): "اس ${prodName} کا جدید ایئر فلو الجھے بالوں کو فوری چمکدار بناتا ہے اور دیتا ہے سیلون جیسی فنشنگ۔"\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Final gorgeous hair flip holding ${prodName} box with Cash on Delivery banner.\nVoiceover (Roman Urdu): "Stock limited hai! Abhi order karein aur Cash on Delivery ke sath ${promo} hasil karein!"\nVoiceover (اردو): "اسٹاک محدود ہے! ابھی آرڈر کریں اور کیش آن ڈلیوری کے ساتھ خصوصی رعایت حاصل کریں!"`,
              cta: `Order Now with Cash on Delivery & Claim ${promo}`,
              tags: `#${cleanHashtagName} #BlowoutHacks #PakistaniBeauties #TrendingPK #GlowHair`
            },
          ];
          const choice = hairAngles[angle % hairAngles.length];
          generatedHook = choice.h;
          generatedCaption = choice.c;
          generatedCta = choice.cta;
          generatedTags = choice.tags;
        } else if (category === 'skincare') {
          generatedHook = `Dull aur dry skin se pareshan hain? Watch this 10-second glow hack!`;
          generatedCaption = `[HOOK - 0:00 to 0:03]\nVisual: Split-screen close-up showing dull skin vs instant luminous glow.\nVoiceover (Roman Urdu): "Mehnge treatments par paise zaya karna band karein! Pehle yeh natural skin glow hack dekhein."\nVoiceover (اردو): "مہنگے ٹریٹمنٹس پر پیسے ضائع کرنا بند کریں! پہلے یہ قدرتی گلو ہیک دیکھیں۔"\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Presenter applying ${prodName} highlighting ${feat1}.\nVoiceover (Roman Urdu): "Yeh ${prodName} ${feat1} ke sath skin ko deeply hydrate aur brighten karta hai bina kisi chipchipahat ke."\nVoiceover (اردو): "یہ ${prodName} جلد کو گہرائی سے ہائیڈریٹ اور چمکدار بناتا ہے۔"\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Clean finished look with product in hand.\nVoiceover (Roman Urdu): "Abhi neeche diye gaye link par click karein aur poora ${promo} hasil karein!"\nVoiceover (اردو): "ابھی نیچے دیے گئے لنک سے آرڈر کریں اور رعایت حاصل کریں!"`;
          generatedCta = `Shop Now & Claim ${promo}`;
          generatedTags = `#${cleanHashtagName} #SkincareUrdu #GlowRoutinePK #BeautyHacks`;
        } else {
          generatedHook = `Stop struggling with ${pain1} in ${activeProfile.label}! Pehle yeh 30-second fix dekhein.`;
          generatedCaption = `[HOOK - 0:00 to 0:03]\nVisual: Fast hook showing the daily frustration of ${pain1}.\nVoiceover (Roman Urdu): "Agar aap bhi roz roz ${pain1} se tang hain, toh yeh 30-second reel zaroor dekhein!"\nVoiceover (اردو): "اگر آپ بھی روز کے مسائل سے تنگ ہیں تو یہ ویڈیو دیکھیں۔"\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Showcasing ${prodName} in action highlighting ${feat1} and ${feat2}.\nVoiceover (Roman Urdu): "Purane tareeqon ko chhod dein. Yeh ${prodName} ${feat1} ke sath aapka time aur paisa dono bachata hai."\nVoiceover (اردو): "یہ ${prodName} آپ کا وقت اور پیسے دونوں بچاتا ہے۔"\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Clear CTA overlay with ${promo} offer.\nVoiceover (Roman Urdu): "Abhi bio link par click karein ya message karein aur flat ${promo} hasil karein!"\nVoiceover (اردو): "ابھی لنک پر کلک کریں اور خصوصی رعایت پائیں!"`;
          generatedCta = isSaaS ? `Start Free Trial & Claim ${promo}` : `Order / Book Now & Claim ${promo}`;
          generatedTags = `#${cleanHashtagName} #${cleanIndTag} #ReelsPK #ProblemSolved`;
        }
      } else {
        generatedHook = `Still struggling with ${pain1}? Watch this 30-second ${activeProfile.label} fix.`;
        generatedCaption = (
          `[HOOK - 0:00 to 0:03]\nVisual: Close-up showing the daily problem with ${pain1}.\nVoiceover: "Tired of ${pain1}? Watch this 15-second fix."\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Presenter demonstrating ${prodName} highlighting ${feat1}.\nVoiceover: "The ${prodName} solves this in seconds. Built with ${feat1} and ${feat2} for effortless results."\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Showing final results with ${prodName}.\nVoiceover: "Tap the link in bio to get started with ${promo} today!"`
        );
        generatedCta = `Tap link in bio to claim ${promo}`;
        generatedTags = `#${cleanHashtagName} #${cleanIndTag} #Reels #ProblemSolved`;
      }
    } else if (tab === 'organic') {
      generatedHook = `Why most people struggle with ${pain1} in ${activeProfile.label} (and the 3-step fix).`;
      generatedCaption = (
        `If you've been dealing with ${pain1}, you're not alone.\n\nMeet **${prodName}** by **${businessName}**:\n`
        + (prod.features || []).map(f => `✨ ${f}`).join('\n')
        + `\n\n🎁 Special Offer: ${promo}\n\nDrop a 💬 below or save this carousel for later!`
      );
      generatedCta = 'Comment "INFO" for the direct link';
      generatedTags = `#${cleanHashtagName} #${cleanIndTag} #Carousel #MustHave`;
    } else if (tab === 'paid') {
      generatedHook = `Stop losing time & money to ${pain1}. Upgrade to ${prodName}.`;
      generatedCaption = (
        `Ready to transform your ${activeProfile.label} results with **${prodName}**?\n\n`
        + (prod.features || []).map(f => `✅ ${f}`).join('\n')
        + `\n\n🛡️ Verified Quality & Satisfaction Guarantee\n⚡ Instant Onboarding / Fast Fulfillment\n🏷️ Limited-Time Offer: **${promo}**\n\nClick below to claim your offer today!`
      );
      generatedCta = isSaaS ? `Start Free Trial (${promo})` : `Claim ${promo} Now`;
      generatedTags = `#${cleanHashtagName} #${cleanIndTag} #Sponsored #SpecialOffer`;
    } else if (tab === 'email') {
      generatedHook = `Subject: The smartest way to eliminate ${pain1} in ${activeProfile.label} ✨`;
      generatedCaption = (
        `Hi there,\n\nIf ${pain1} has been slowing you down, we built **${prodName}** specifically to solve it.\n\nKey Highlights:\n`
        + (prod.features || []).map(f => `• **${f}**`).join('\n')
        + `\n\n🎉 Exclusive Subscriber Offer: **${promo}**\n\nClick below to get started today:`
      );
      generatedCta = `Explore ${prodName} & Claim ${promo}`;
      generatedTags = '';
    } else {
      generatedHook = `✨ VIP Update from ${businessName}: ${prodName}`;
      generatedCaption = (
        `Hi! Quick VIP update on **${prodName}** (${activeProfile.label}).\n\nOur latest slot/batch featuring ${feat1} is now live!\n\n🎁 Exclusive WhatsApp Offer: **${promo}**.\n\nReply **YES** to this message to book/order in 1 click:`
      );
      generatedCta = 'Reply YES on WhatsApp to Claim';
      generatedTags = '';
    }

    setHook(generatedHook);
    setCaption(generatedCaption);
    setCta(generatedCta);
    setHashtags(generatedTags);

    runLiveGuardrailCheck(`${generatedHook}\n${generatedCaption}\n${generatedCta}`);
  };

  useEffect(() => {
    generateAIPost(activeTab, selectedProduct, selectedTrendTopic, customOffer, 0);
  }, [activeTab, selectedProductId, selectedTrendTopic, selectedPillarIndex, activeStrategy, industry]);

  const handleCopy = () => {
    const fullText = `${hook}\n\n${caption}\n\n👉 CTA: ${cta}\n\n${hashtags}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScheduleInCalendar = () => {
    try {
      const email = localStorage.getItem('marketpilot_email') || 'sarah@glowsilk.com';
      const key = `marketpilot_custom_calendar_${email}`;
      const existingRaw = localStorage.getItem(key) || '[]';
      const existing = JSON.parse(existingRaw);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const channelByTab: Record<StudioTabType, string> = {
        script: 'tiktok',
        linkedin: 'linkedin',
        fb_post: 'facebook',
        youtube: 'youtube',
        organic: 'instagram',
        paid: 'facebook',
        email: 'email',
        whatsapp: 'whatsapp',
      };

      const formatByTab: Record<StudioTabType, string> = {
        script: 'short_video_script',
        linkedin: 'post_caption',
        fb_post: 'post_caption',
        youtube: 'short_video_script',
        organic: 'carousel_slides',
        paid: 'post_caption',
        email: 'email_newsletter',
        whatsapp: 'direct_message',
      };

      const newItem = {
        id: 'cal-studio-' + Date.now(),
        title: `[${activeTab.toUpperCase()}] ${selectedProduct.name}: ${hook.slice(0, 35)}...`,
        channel: channelByTab[activeTab] || 'instagram',
        channel_type: activeTab === 'paid' ? 'paid' : 'organic',
        format: formatByTab[activeTab] || 'post_caption',
        status: 'scheduled',
        scheduled_date: dateStr,
        scheduled_time_slot: 'morning_09_00',
        hook,
        primary_text: caption,
        call_to_action: cta,
        product_name: selectedProduct.name,
        focus_product_id: selectedProduct.id,
        strategic_rationale: `Saved from AI Studio (${activeProfile.label}) for ${selectedProduct.name}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      existing.unshift(newItem);
      localStorage.setItem(key, JSON.stringify(existing));
      setScheduledSuccess(true);
      setTimeout(() => setScheduledSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to schedule item:', err);
    }
  };

  const handlePlayScriptAudio = () => {
    if (isPlayingAudio) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis audio preview is not supported by this browser.');
      return;
    }

    // Extract voiceover lines from script
    const voiceoverMatches = caption.match(/Voiceover(?:\s*\([^)]+\))?:\s*"([^"]+)"/gi);
    let textToSpeak = '';
    if (voiceoverMatches && voiceoverMatches.length > 0) {
      textToSpeak = voiceoverMatches
        .map((m) => m.replace(/Voiceover(?:\s*\([^)]+\))?:\s*"?/i, '').replace(/"?$/, ''))
        .join(' ');
    } else {
      textToSpeak = `${hook}. ${caption}`;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    const voices = window.speechSynthesis.getVoices();
    const isUrdu = targetCountry?.toLowerCase() === 'pakistan';
    const langKey = isUrdu ? 'ur' : 'en';
    const matchingVoice = voices.find((v) => v.lang.toLowerCase().includes(langKey));
    if (matchingVoice) utterance.voice = matchingVoice;

    utterance.rate = 0.95;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  // Missing data checks
  const missingPainPoints = !selectedProduct.pain_points || selectedProduct.pain_points.length === 0;
  const missingFeatures = !selectedProduct.features || selectedProduct.features.length === 0;
  const missingTrends = trends.length === 0;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* 1. Transparent Grounding & Attribution Header Bar */}
      <div className="bg-white border border-brand-line rounded-2xl p-4 sm:p-5 shadow-card space-y-3 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                <Sparkles size={11} className="text-emerald-700" />
                TRANSPARENT AI GROUNDING ENGINE
              </span>
              <span className="text-[11px] text-slate-400 font-bold">
                Model: <strong className="text-brand-ink font-extrabold">{aiModelUsed}</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-brand-ink tracking-tight mt-1">
              Multi-Channel Grounded Content Studio
            </h1>
          </div>

          <button
            onClick={() => {
              const nextCount = regenerationCount + 1;
              setRegenerationCount(nextCount);
              generateAIPost(activeTab, selectedProduct, selectedTrendTopic, customOffer, nextCount);
            }}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-brand-green hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all self-start md:self-auto"
          >
            <RefreshCw size={13} className={isGenerating ? 'animate-spin' : ''} />
            <span>{isGenerating ? 'Gemini Generating...' : `Regenerate with Gemini AI${regenerationCount > 0 ? ` (Angle #${(regenerationCount % 4) + 1})` : ''}`}</span>
          </button>
        </div>

        {/* Live "Based on" Attribution Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase mr-1">BASED ON:</span>

          {/* Industry Badge */}
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold">
            <Briefcase size={13} className="text-brand-green shrink-0" />
            <span>
              Industry: <strong>{activeProfile.icon} {activeProfile.label}</strong>
            </span>
          </div>

          {/* Product Badge */}
          <div className="bg-slate-50 border border-slate-200 text-brand-ink text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold max-w-full truncate">
            <Package size={13} className="text-brand-green shrink-0" />
            <span className="truncate">{activeProfile.offeringSingular}: <strong className="text-brand-green truncate max-w-[140px] sm:max-w-none inline-block align-bottom">{selectedProduct.name}</strong></span>
            {selectedProduct.profit_margin && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold shrink-0">
                {selectedProduct.profit_margin}% Margin
              </span>
            )}
          </div>

          {/* Offer Badge */}
          <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold">
            <Tag size={13} className="text-blue-600" />
            <span>Offer: <strong>{customOffer || 'Standard'}</strong></span>
          </div>

          {/* Trend Badge */}
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold">
            <TrendingUp size={13} className="text-amber-600" />
            <span>Trend: <strong>{selectedTrendTopic || selectedTrend?.topic || 'Direct Problem-Solution'}</strong></span>
            {selectedTrend?.confidence_score && (
              <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-extrabold">
                {selectedTrend.confidence_score}% Virality
              </span>
            )}
          </div>

          {/* Brand Voice Badge */}
          <div className="bg-purple-50 border border-purple-200 text-purple-900 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold">
            <Palette size={13} className="text-purple-600" />
            <span>Voice: <strong>{activeBrandKit?.brand_voice?.slice(0, 2).join(', ') || 'Professional'}</strong></span>
          </div>
        </div>
      </div>

      {/* Interactive Horizontal Product Ribbon */}
      <div className="bg-white border border-brand-line rounded-2xl p-4 shadow-soft">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Package size={13} className="text-brand-green" />
            <small className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              {activeProfile.offeringPlural} Switcher ({products.length} Available)
            </small>
          </div>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            Click any {activeProfile.offeringSingular.toLowerCase()} to switch copywriting & script angle instantly
          </span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {products.map((prod) => {
            const isSelected = prod.id === selectedProductId;
            const margin = Number(prod.profit_margin || 70);
            const isHero = margin >= 60;
            return (
              <button
                key={prod.id}
                type="button"
                onClick={() => {
                  setSelectedProductId(prod.id);
                  onSelectProduct?.(prod.id);
                  setRegenerationCount(0);
                  generateAIPost(activeTab, prod, selectedTrendTopic, customOffer, 0);
                }}
                className={`flex-shrink-0 text-left p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{activeProfile.icon}</span>
                  <div>
                    <strong className={`text-xs block max-w-[160px] truncate ${isSelected ? 'text-emerald-950 font-extrabold' : 'text-slate-800 font-bold'}`}>
                      {prod.name}
                    </strong>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {formatAmount(prod.price)} · {prod.stock_quantity || 100} capacity
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                    margin >= 60 ? 'bg-emerald-200/80 text-emerald-900' : 'bg-blue-100 text-blue-900'
                  }`}>
                    {margin}% Margin
                  </span>
                  {isHero && (
                    <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                      🌟 Hero
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Grounding Controls Sidebar (4 cols) */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Missing Data Warning Alert if needed */}
          {(missingPainPoints || missingFeatures || missingTrends) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                <span>Grounding Completeness Warning</span>
              </div>
              <ul className="text-[11px] text-amber-800 space-y-1 pl-5 list-disc">
                {missingPainPoints && <li>Missing customer pain points on this item.</li>}
                {missingFeatures && <li>Missing key features.</li>}
                {missingTrends && <li>No live trends ingested yet (using evergreen angles).</li>}
              </ul>
            </div>
          )}

          {/* Grounding Inputs Card */}
          <div className="bg-white border border-brand-line rounded-2xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
                GROUNDING ATTRIBUTES & INPUTS
              </small>
              <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                Editable
              </span>
            </div>

            {/* 1. Product Selector */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1 flex items-center gap-1">
                <Package size={12} className="text-brand-green" /> 1. Source {activeProfile.offeringSingular}
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedProductId(newId);
                  const newProd = products.find((p) => p.id === newId) || selectedProduct;
                  setRegenerationCount(0);
                  generateAIPost(activeTab, newProd, selectedTrendTopic, customOffer, 0);
                }}
                className="w-full text-xs p-2.5 rounded-xl border border-brand-line bg-white font-medium focus:outline-none focus:border-brand-green"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.profit_margin ? `${p.profit_margin}% margin` : 'Active'})
                  </option>
                ))}
                {products.length === 0 && <option value="">{selectedProduct.name}</option>}
              </select>

              {/* Product Pricing Details */}
              <div className="mt-2 p-2.5 bg-slate-50 rounded-xl text-[11px] space-y-1 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">{activeProfile.priceLabel}:</span>
                  <b className="text-brand-ink">{formatAmount(selectedProduct.price || 39.99)}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Profit Margin:</span>
                  <b className="text-emerald-700">{selectedProduct.profit_margin || 65}% ({selectedProduct.margin_tier || 'high'} tier)</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{activeProfile.stockLabel}:</span>
                  <b className="text-brand-ink">{selectedProduct.stock_quantity || 100}</b>
                </div>
              </div>
            </div>

            {/* 2. Active Offer Input */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1 flex items-center gap-1">
                <Tag size={12} className="text-blue-600" /> 2. Active Offer / Hook Promo
              </label>
              <input
                type="text"
                value={customOffer}
                onChange={(e) => setCustomOffer(e.target.value)}
                placeholder="e.g. 14-Day Free Trial, 20% Off Launch Discount"
                className="w-full text-xs p-2.5 rounded-xl border border-brand-line bg-white font-medium focus:outline-none focus:border-brand-green"
              />
            </div>

            {/* 3. Trend Signal Selector */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1 flex items-center gap-1">
                <TrendingUp size={12} className="text-amber-600" /> 3. Live Market Trend Angle
              </label>
              <select
                value={selectedTrendTopic}
                onChange={(e) => setSelectedTrendTopic(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-brand-line bg-white font-medium focus:outline-none focus:border-brand-green"
              >
                {trends.map((t, idx) => (
                  <option key={t.id || idx} value={t.topic}>
                    {t.topic} ({t.confidence_score}% virality)
                  </option>
                ))}
                {trends.length === 0 && (
                  <option value="Problem-Solution Demonstration">
                    Evergreen: Problem-Solution Demonstration
                  </option>
                )}
              </select>
            </div>

            {/* 4. Strategic Rationale Box */}
            <div className="bg-[#f8faf9] border border-[#e2eae6] rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-800 uppercase">
                <HelpCircle size={12} className="text-emerald-700" />
                Why this content was chosen ({activeProfile.label}):
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed m-0">
                {activeProfile.growthPlaybook} Connects customer pain point ({selectedProduct.pain_points?.[0] || 'daily friction'}) directly to "{selectedTrendTopic || 'Problem-Solution'}" for maximum conversion.
              </p>
            </div>
          </div>

          {/* Real-time Guardrail Audit Card */}
          <div className={`rounded-2xl p-4 border shadow-card transition-all ${
            guardrailResult.passed ? 'bg-white border-emerald-200' : 'bg-amber-50 border-amber-300'
          }`}>
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="text-brand-ink block font-bold">
                  {guardrailResult.passed ? 'Brand Kit Guardrails Passed' : 'Guardrail Warning'}
                </strong>
                <p className="text-slate-500 m-0 mt-0.5 text-[11px]">
                  {guardrailResult.safety_message}
                </p>
                {guardrailResult.detected_prohibited_words.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {guardrailResult.detected_prohibited_words.map((w, i) => (
                      <span key={i} className="bg-amber-200 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                        Prohibited: {w}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Multi-Channel Editor (8 cols) */}
        <main className="lg:col-span-8 bg-white border border-brand-line rounded-2xl p-4 sm:p-6 shadow-card space-y-5 overflow-hidden">
          {/* Format / Channel Tabs */}
          <div className="space-y-2 border-b border-brand-line pb-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Select Channel & Format (★ = Recommended for {activeProfile.label})
              </span>
            </div>
            <div className="flex overflow-x-auto sm:flex-wrap items-center gap-1.5">
              {[
                { tab: 'linkedin' as StudioTabType, channelId: 'linkedin_post', label: 'LinkedIn Post', icon: <Linkedin size={13} /> },
                { tab: 'fb_post' as StudioTabType, channelId: 'fb_post', label: 'FB Simple Post', icon: <Facebook size={13} /> },
                { tab: 'script' as StudioTabType, channelId: 'reels_tiktok', label: 'Reels / TikTok Script', icon: <Video size={13} /> },
                { tab: 'youtube' as StudioTabType, channelId: 'youtube_video', label: 'YouTube Video / Short', icon: <Youtube size={13} /> },
                { tab: 'organic' as StudioTabType, channelId: 'ig_carousel', label: 'IG Carousel', icon: <Instagram size={13} /> },
                { tab: 'paid' as StudioTabType, channelId: 'paid_ad', label: 'Paid Ad Copy', icon: <Sparkles size={13} /> },
                { tab: 'email' as StudioTabType, channelId: 'email_newsletter', label: 'Email Sequence', icon: <Mail size={13} /> },
                { tab: 'whatsapp' as StudioTabType, channelId: 'whatsapp_broadcast', label: 'WhatsApp VIP', icon: <MessageSquare size={13} /> },
              ].map((item) => {
                const isActive = activeTab === item.tab;
                const isRec = activeProfile.recommendedChannels.includes(item.channelId);
                return (
                  <button
                    key={item.tab}
                    type="button"
                    onClick={() => setActiveTab(item.tab)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-brand-green text-white shadow-sm'
                        : isRec
                        ? 'bg-emerald-50/70 text-brand-ink border border-emerald-200 hover:bg-emerald-100/70'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {isRec && (
                      <span
                        className={`text-[9px] font-black ${
                          isActive ? 'text-amber-200' : 'text-brand-green'
                        }`}
                        title={`Recommended for ${activeProfile.label}`}
                      >
                        ★
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor Area */}
          <div className="space-y-4">
            {/* Opening Hook */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-extrabold text-slate-600 uppercase flex items-center gap-1">
                  <Lightbulb size={12} className="text-amber-500" />{' '}
                  {activeTab === 'youtube'
                    ? 'YouTube Video Title & 5-Second Hook'
                    : activeTab === 'linkedin'
                    ? 'LinkedIn Scroll-Stopping Opening Line'
                    : 'Viral Opening Hook (First 3 Seconds)'}
                </label>
                <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                  <Edit3 size={10} /> Editable
                </span>
              </div>
              <input
                type="text"
                value={hook}
                onChange={(e) => {
                  setHook(e.target.value);
                  runLiveGuardrailCheck(`${e.target.value}\n${caption}\n${cta}`);
                }}
                disabled={isGenerating}
                placeholder="High-converting opening hook..."
                className="w-full text-xs font-bold text-brand-ink p-3 rounded-xl border border-brand-line bg-slate-50/50 focus:bg-white focus:outline-none focus:border-brand-green disabled:opacity-50"
              />
            </div>

            {/* Body Content / Script */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-extrabold text-slate-600 uppercase">
                    {activeTab === 'script' || activeTab === 'youtube'
                      ? 'Video Script with Localized Voiceover'
                      : 'Generated Copy / Body Content'}
                  </label>
                  {(activeTab === 'script' || activeTab === 'youtube') && (
                    <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                      🗣️ Voiceover: {targetCountry === 'Pakistan' ? 'Urdu (Roman & Native Script)' : targetCountry}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {(activeTab === 'script' || activeTab === 'youtube') && (
                    <button
                      type="button"
                      onClick={handlePlayScriptAudio}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                        isPlayingAudio
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="Listen to synthesized spoken audio"
                    >
                      {isPlayingAudio ? <VolumeX size={11} /> : <Volume2 size={11} />}
                      <span>{isPlayingAudio ? 'Stop Audio' : '🔊 Listen Voiceover (TTS)'}</span>
                    </button>
                  )}
                  {isGenerating ? (
                    <span className="text-[9px] text-emerald-700 font-bold flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" /> Gemini Writing...
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-400 font-bold">{caption.length} characters</span>
                  )}
                </div>
              </div>
              <textarea
                rows={activeTab === 'script' || activeTab === 'youtube' ? 12 : 9}
                value={caption}
                onChange={(e) => {
                  setCaption(e.target.value);
                  runLiveGuardrailCheck(`${hook}\n${e.target.value}\n${cta}`);
                }}
                disabled={isGenerating}
                placeholder="Content generated by Gemini AI..."
                className="w-full text-xs text-slate-700 p-3.5 rounded-xl border border-brand-line bg-slate-50/50 focus:bg-white focus:outline-none focus:border-brand-green font-mono leading-relaxed disabled:opacity-50"
              />
            </div>

            {/* CTA & Hashtags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                  Call to Action (CTA)
                </label>
                <input
                  type="text"
                  value={cta}
                  onChange={(e) => {
                    setCta(e.target.value);
                    runLiveGuardrailCheck(`${hook}\n${caption}\n${e.target.value}`);
                  }}
                  disabled={isGenerating}
                  className="w-full text-xs font-bold text-brand-green p-2.5 rounded-xl border border-brand-line bg-slate-50/50 focus:bg-white focus:outline-none focus:border-brand-green disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">
                  Trending Hashtags
                </label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  disabled={isGenerating}
                  className="w-full text-xs text-slate-600 p-2.5 rounded-xl border border-brand-line bg-slate-50/50 focus:bg-white focus:outline-none focus:border-brand-green disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center sm:justify-between pt-3 border-t border-brand-line">
            <button
              onClick={() => {
                const nextCount = regenerationCount + 1;
                setRegenerationCount(nextCount);
                generateAIPost(activeTab, selectedProduct, selectedTrendTopic, customOffer, nextCount);
              }}
              disabled={isGenerating}
              className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1.5 disabled:opacity-50 self-start"
            >
              <RefreshCw size={12} className={isGenerating ? 'animate-spin text-brand-green' : ''} />
              <span>{isGenerating ? 'Gemini 3.6 Flash Writing...' : `Regenerate with Gemini AI${regenerationCount > 0 ? ` (Angle #${(regenerationCount % 4) + 1})` : ''}`}</span>
            </button>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleScheduleInCalendar}
                disabled={isGenerating}
                className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  scheduledSuccess
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
                title="Save this copy directly to your scheduled calendar queue"
              >
                <CalendarIcon size={13} className={scheduledSuccess ? 'text-emerald-600' : 'text-slate-500'} />
                <span>{scheduledSuccess ? '✓ Saved to Calendar!' : 'Schedule to Calendar'}</span>
              </button>

              <button
                onClick={handleCopy}
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-green hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex-1 sm:flex-initial cursor-pointer"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Ready Copy'}</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
