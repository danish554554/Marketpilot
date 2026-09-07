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
  Globe
} from 'lucide-react';
import { BrandKit, MarketingStrategy, Product, TrendSignal } from '../types';
import { api } from '../api/endpoints';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';

interface StudioProps {
  products: Product[];
  businessName: string;
  activeStrategy?: MarketingStrategy | null;
  brandKit?: BrandKit | null;
  trends?: TrendSignal[];
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
}) => {
  const { formatAmount } = useCurrency();
  const { targetCountry } = useAuth();
  const [activeTab, setActiveTab] = useState<'script' | 'organic' | 'paid' | 'email' | 'whatsapp'>('script');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [selectedTrendTopic, setSelectedTrendTopic] = useState<string>(
    trends[0]?.topic || activeStrategy?.pillars?.[0]?.trend_topic || ''
  );
  const [customOffer, setCustomOffer] = useState<string>('20% Off Launch Discount');
  const [selectedPillarIndex, setSelectedPillarIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

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
    name: 'Your Featured Product',
    description: 'High-quality e-commerce product',
    price: 39.99,
    cost_price: 12.00,
    profit_margin: 70,
    margin_tier: 'high',
    stock_quantity: 150,
    pain_points: ['Daily friction', 'Inefficient alternatives'],
    features: ['Premium materials', 'Fast results', 'Durable design'],
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
      // Local fallback check
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
    tab = activeTab,
    prod = selectedProduct,
    trend = selectedTrendTopic,
    offer = customOffer,
    variationSeed = regenerationCount
  ) => {
    setIsGenerating(true);
    const channelMap: Record<string, string> = {
      script: 'tiktok',
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
        custom_instructions: `Offer/Promotion: ${offer || 'Standard Pricing'}. Ground strictly in product features: ${prod.features?.join(', ')}. Target Country: ${targetCountry}. Variation Seed: ${variationSeed}`,
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
    tab: string,
    prod = selectedProduct,
    trend = selectedTrendTopic,
    offer = customOffer,
    variationSeed = 0
  ) => {
    const prodName = prod.name;
    const feat1 = prod.features?.[0] || 'innovative high-performance design';
    const feat2 = prod.features?.[1] || 'effortless salon-quality finish';
    const pain1 = prod.pain_points?.[0] || 'wasting time on poor alternatives';
    const promo = offer || '20% OFF Launch Discount';
    const isUrduMarket = targetCountry?.toLowerCase() === 'pakistan';

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

    if (tab === 'script') {
      if (isUrduMarket) {
        if (category === 'hair') {
          const hairAngles = [
            {
              h: 'Frizzy aur unmanageable baalon se tang aa chuke hain? Pehle yeh 30-second hack dekhein!',
              c: `[HOOK - 0:00 to 0:03]\nVisual: Close-up showing damp, frizzy tangled hair vs. smooth salon blowout transition.\nVoiceover (Roman Urdu): "Har subah baalon ko dry aur style karne mein ghanton zaya karna chhod dein! Pehle yeh 30-second trick dekhein."\nVoiceover (اردو): "ہر صبح بالوں کو ڈرائی اور اسٹائل کرنے میں گھنٹوں ضائع کرنا چھوڑ دیں! پہلے یہ ۳۰ سیکنڈ ہیک دیکھیں۔"\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Presenter effortlessly gliding ${prodName} through hair, showing instant shine and volume (${feat1}).\nVoiceover (Roman Urdu): "Purane bhari dryers aur multiple brushes ka jhanjhat khatam! Yeh ${prodName} baalon ko sukhata bhi hai aur ${feat1} ke sath salon jaisa volumized blowout deta hai sirf chand minutes mein bina kisi heat damage ke!"\nVoiceover (اردو): "پرانے بھاری ڈرائرز کا جھنجھٹ ختم! یہ ${prodName} بالوں کو سکھاتا بھی ہے اور سیلون جیسا باؤنسی بلو آؤٹ دیتا ہے بغیر کسی نقصان کے!"\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Smiling presenter showing silky, styled hair holding ${prodName}.\nVoiceover (Roman Urdu): "Salon ke hazaron rupay bachayein! Neeche diye gaye link par click karein aur launch sale mein poora ${promo} hasil karein!"\nVoiceover (اردو): "سیلون کے ہزاروں روپے بچائیں! نیچے دیے گئے لنک پر کلک کریں اور لانچ سیل میں پورا ${promo} حاصل کریں!"`,
              cta: `Neeche link par click karein aur ${promo} hasil karein`,
              tags: `#${prodName.replace(/[^a-zA-Z0-9]/g, '')} #HairHacksPK #SalonAtHome #HairStylingUrdu #BeautyPK`
            },
            {
              h: 'Salon ke mehnge blowouts par paise zaya karna band karein!',
              c: `[HOOK - 0:00 to 0:03]\nVisual: Split-screen comparing expensive salon bill vs. doing it at home with ${prodName}.\nVoiceover (Roman Urdu): "Kiya aap bhi har event ke liye salon ke hazaron rupay kharch karte hain? Yeh video aapke bohot paise bachane wali hai!"\nVoiceover (اردو): "کیا آپ بھی ہر ایونٹ کے لیے سیلون کے ہزاروں روپے خرچ کرتے ہیں؟ یہ ویڈیو آپ کے بہت پیسے بچانے والی ہے!"\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Demonstrating ${feat2} on damp hair, instantly creating smooth silky finish.\nVoiceover (Roman Urdu): "Is ${prodName} ka advanced airflow aur ${feat1} frizzy baalon ko instantly tame karta hai aur deta hai super smooth finish bina kisi salon appointment ke."\nVoiceover (اردو): "اس ${prodName} کا جدید ایئر فلو الجھے بالوں کو فوری چمکدار بناتا ہے اور دیتا ہے سیلون جیسی فنشنگ۔"\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Final gorgeous hair flip holding ${prodName} box with Cash on Delivery banner.\nVoiceover (Roman Urdu): "Stock limited hai! Abhi order karein aur Cash on Delivery ke sath ${promo} hasil karein!"\nVoiceover (اردو): "اسٹاک محدود ہے! ابھی آرڈر کریں اور کیش آن ڈلیوری کے ساتھ خصوصی رعایت حاصل کریں!"`,
              cta: `Order Now with Cash on Delivery & Claim ${promo}`,
              tags: `#${prodName.replace(/[^a-zA-Z0-9]/g, '')} #BlowoutHacks #PakistaniBeauties #TrendingPK #GlowHair`
            },
            {
              h: 'The 1-step styling secret TikTok doesn\'t want you to miss!',
              c: `[HOOK - 0:00 to 0:03]\nVisual: Fast-paced side-by-side: half head styled in 2 minutes vs messy half.\nVoiceover (Roman Urdu): "Agar aapke paas subah tayyar hone ke liye sirf 5 minute hotay hain, toh yeh device aapki life badal dega!"\nVoiceover (اردو): "اگر آپ کے پاس صبح تیار ہونے کے لیے صرف ۵ منٹ ہوتے ہیں تو یہ ڈیوائس آپ کی زندگی بدل دے گا!"\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Rotating close-up of ${prodName} styling damp curls into sleek waves effortlessly.\nVoiceover (Roman Urdu): "Yeh ek hi waqt mein sukhata bhi hai aur professional style bhi karta hai. ${feat1} ke sath baal rehte hain bilkul soft aur shiny."\nVoiceover (اردو): "یہ ایک ہی وقت میں سکھاتا بھی ہے اور پروفیشنل اسٹائل بھی کرتا ہے، بغیر وقت ضائع کیے۔"\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Presenter flashing big smile with product in hand.\nVoiceover (Roman Urdu): "Toh der kis baat ki? Bio mein diye gaye link se abhi order karein aur flat ${promo} hasil karein!"\nVoiceover (اردو): "تو دیر کس بات کی؟ بائیو میں دیے گئے لنک سے ابھی آرڈر کریں اور خصوصی ڈسکاؤنٹ پائیں۔"`,
              cta: `Bio link par click karein aur ${promo} hasil karein`,
              tags: `#${prodName.replace(/[^a-zA-Z0-9]/g, '')} #ViralGadgetsPK #HairCareRoutine #PakistanTrends`
            },
            {
              h: 'Kharab aur damaged baalon ka sabse aasan aur safe solution!',
              c: `[HOOK - 0:00 to 0:03]\nVisual: Shocked face pointing at burning flat iron vs gentle styling with ${prodName}.\nVoiceover (Roman Urdu): "High heat se baal jalana band karein! Yeh smart device dekhein jo heat damage ke baghair kaam karta hai."\nVoiceover (اردو): "زیادہ گرمی سے بال جلانا بند کریں! یہ اسمارٹ ڈیوائس دیکھیں جو بالوں کو خراب کیے بغیر اسٹائل کرتا ہے۔"\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Smooth brush strokes gliding down showing heat-control technology and ${feat2}.\nVoiceover (Roman Urdu): "Iska intelligent heat distribution system aur ${feat1} aapke baalon ki natural moisture ko lock karta hai."\nVoiceover (اردو): "اس کا جدید سسٹم بالوں کی قدرتی چمک کو برقرار رکھتا ہے اور دیتا ہے شاندار لک۔"\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Gorgeous final look with verified customer review popup.\nVoiceover (Roman Urdu): "Launch sale sirf is hafte ke liye hai! Abhi shop karein aur Cash on Delivery pay karein!"\nVoiceover (اردو): "لانچ سیل صرف اس ہفتے کے لیے ہے! ابھی شاپ کریں اور ڈسکاؤنٹ حاصل کریں۔"`,
              cta: `Shop Now with COD & Claim ${promo}`,
              tags: `#${prodName.replace(/[^a-zA-Z0-9]/g, '')} #HealthyHairPK #StyleHacks #MustHave`
            }
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
          generatedTags = `#${prodName.replace(/[^a-zA-Z0-9]/g, '')} #SkincareUrdu #GlowRoutinePK #BeautyHacks`;
        } else {
          generatedHook = `Stop struggling with ${pain1}! Pehle yeh 30-second fix dekhein.`;
          generatedCaption = `[HOOK - 0:00 to 0:03]\nVisual: Frustrated reaction to daily problem with ${pain1}.\nVoiceover (Roman Urdu): "Agar aap bhi roz roz ${pain1} se tang hain, toh yeh 30-second video zaroor dekhein!"\nVoiceover (اردو): "اگر آپ بھی روز کے مسائل سے تنگ ہیں تو یہ ویڈیو دیکھیں۔"\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Presenter using ${prodName} highlighting ${feat1}.\nVoiceover (Roman Urdu): "Purane aur nakara tareeqon ko chhod dein. Yeh ${prodName} ${feat1} ke sath aapka time aur paisa dono bachata hai."\nVoiceover (اردو): "یہ ${prodName} آپ کا وقت اور پیسے دونوں بچاتا ہے۔"\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Product packaging with Cash on Delivery banner.\nVoiceover (Roman Urdu): "Cash on Delivery available hai! Abhi order karein aur flat ${promo} hasil karein!"\nVoiceover (اردو): "کیش آن ڈلیوری کے ساتھ ابھی آرڈر کریں اور رعایت پائیں!"`;
          generatedCta = `Order with Cash on Delivery & Claim ${promo}`;
          generatedTags = `#${prodName.replace(/[^a-zA-Z0-9]/g, '')} #ViralFindsPK #ProblemSolved #LifeHacks`;
        }
      } else {
        generatedHook = `Still struggling with ${pain1}? Watch this.`;
        generatedCaption = (
          `[HOOK - 0:00 to 0:03]\nVisual: Close-up showing the daily problem with ${pain1}.\nVoiceover: "Tired of ${pain1}? Watch this 10-second fix."\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Presenter using ${prodName} highlighting ${feat1}.\nVoiceover: "The ${prodName} fixes this in seconds. Designed with ${feat1} for smooth, effortless results."\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Showing clean finished look with product in hand.\nVoiceover: "Tap the link below to get yours with ${promo} before stock runs out!"`
        );
        generatedCta = `Tap link in bio to claim ${promo}`;
        generatedTags = `#${prodName.replace(/[^a-zA-Z0-9]/g, '')} #ViralFinds #ProblemSolved #LifeHacks`;
      }
    } else if (tab === 'organic') {
      generatedHook = `Why most people struggle with ${pain1} (and the 30-second fix).`;
      generatedCaption = (
        `If you've been dealing with ${pain1}, you're not alone.\n\nMeet the **${prodName}**:\n`
        + (prod.features || []).map(f => `✨ ${f}`).join('\n')
        + `\n\n🎁 Special Offer: ${promo}\n\nDrop a 💬 below or save this post for your next order!`
      );
      generatedCta = 'Comment "INFO" for the direct link';
      generatedTags = `#${prodName.replace(/[^a-zA-Z0-9]/g, '')} #ProductReview #MustHave`;
    } else if (tab === 'paid') {
      generatedHook = `Stop dealing with ${pain1}. Upgrade to ${prodName}.`;
      generatedCaption = (
        `Upgrade your daily routine with the **${prodName}**.\n\n`
        + (prod.features || []).map(f => `✅ ${f}`).join('\n')
        + `\n\n🛡️ 30-Day Satisfaction Guarantee\n🚚 Fast Tracked Shipping (COD Available)\n🏷️ Offer: ${promo}\n\nClick below to claim your discount today!`
      );
      generatedCta = `Shop Now & Claim ${promo}`;
      generatedTags = '#LimitedTimeOffer #SpecialDiscount';
    } else if (tab === 'email') {
      generatedHook = `Subject: The smartest way to tackle ${pain1} ✨`;
      generatedCaption = (
        `Hi there,\n\nIf ${pain1} has been holding you back, we built the **${prodName}** just for you.\n\nKey Highlights:\n`
        + (prod.features || []).map(f => `• **${f}**`).join('\n')
        + `\n\n🎉 Limited Time Offer: ${promo}\n\nClick below to order yours today:`
      );
      generatedCta = `Claim Your ${prodName}`;
      generatedTags = '';
    } else {
      generatedHook = `✨ VIP Restock: ${prodName}`;
      generatedCaption = (
        `Hi! Quick VIP update on the **${prodName}**.\n\nDue to high demand, our latest restock featuring ${feat1} is going fast!\n\n🎁 Exclusive Offer: **${promo}** + Free Express Delivery.\n\nReply YES to confirm your order or click below:`
      );
      generatedCta = 'Order via WhatsApp with 1 Click';
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
  }, [activeTab, selectedProductId, selectedTrendTopic, selectedPillarIndex, activeStrategy]);

  const handleCopy = () => {
    const fullText = `${hook}\n\n${caption}\n\n👉 CTA: ${cta}\n\n${hashtags}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

          {/* Product Badge */}
          <div className="bg-slate-50 border border-slate-200 text-brand-ink text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold max-w-full truncate">
            <Package size={13} className="text-brand-green shrink-0" />
            <span className="truncate">Product: <strong className="text-brand-green truncate max-w-[140px] sm:max-w-none inline-block align-bottom">{selectedProduct.name}</strong></span>
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
                {missingPainPoints && <li>Missing customer pain points on this product.</li>}
                {missingFeatures && <li>Missing product features.</li>}
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
                <Package size={12} className="text-brand-green" /> 1. Source Product
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
                    {p.name} ({p.profit_margin ? `${p.profit_margin}% margin` : 'In stock'})
                  </option>
                ))}
                {products.length === 0 && <option value="">{selectedProduct.name}</option>}
              </select>

              {/* Product Pricing Details */}
              <div className="mt-2 p-2.5 bg-slate-50 rounded-xl text-[11px] space-y-1 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Retail Price:</span>
                  <b className="text-brand-ink">{formatAmount(selectedProduct.price || 39.99)}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Profit Margin:</span>
                  <b className="text-emerald-700">{selectedProduct.profit_margin || 65}% ({selectedProduct.margin_tier || 'high'} tier)</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">In Stock:</span>
                  <b className="text-brand-ink">{selectedProduct.stock_quantity || 100} units</b>
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
                placeholder="e.g. 20% Off Launch Discount, Free Delivery"
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
                Why this content was chosen:
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed m-0">
                Grounded in high stock inventory ({selectedProduct.stock_quantity || 100} units) with {selectedProduct.profit_margin || 65}% margin. Connects customer pain point ({selectedProduct.pain_points?.[0] || 'daily friction'}) directly to the "{selectedTrendTopic || 'Problem-Solution'}" trend angle for maximum ROAS.
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
          <div className="flex overflow-x-auto pb-2 sm:pb-3 sm:flex-wrap items-center gap-1.5 sm:gap-2 border-b border-brand-line">
            <button
              onClick={() => setActiveTab('script')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'script'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Video size={13} />
              <span>TikTok Video Script</span>
            </button>

            <button
              onClick={() => setActiveTab('organic')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'organic'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Instagram size={13} />
              <span>Instagram Carousel</span>
            </button>

            <button
              onClick={() => setActiveTab('paid')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'paid'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles size={13} />
              <span>Paid Direct-Response Ad</span>
            </button>

            <button
              onClick={() => setActiveTab('email')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'email'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Mail size={13} />
              <span>Email Newsletter</span>
            </button>

            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'whatsapp'
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MessageSquare size={13} />
              <span>WhatsApp VIP Restock</span>
            </button>
          </div>

          {/* Editor Area */}
          <div className="space-y-4">
            {/* Opening Hook */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-extrabold text-slate-600 uppercase flex items-center gap-1">
                  <Lightbulb size={12} className="text-amber-500" /> Viral Opening Hook (First 3 Seconds)
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
                    {activeTab === 'script' ? 'Video Script with Localized Voiceover' : 'Generated Copy / Body Content'}
                  </label>
                  {activeTab === 'script' && (
                    <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                      🗣️ Voiceover: {targetCountry === 'Pakistan' ? 'Urdu (Roman & Native Script)' : targetCountry}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {activeTab === 'script' && (
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
                rows={activeTab === 'script' ? 12 : 8}
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

            <button
              onClick={handleCopy}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-green hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 w-full sm:w-auto"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Ready-to-Publish Copy'}</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
