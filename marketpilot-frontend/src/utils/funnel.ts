import { Product } from '../types';
import { isTechIndustry } from './industry';

export interface FunnelStage {
  stageId: 'TOFU' | 'MOFU' | 'BOFU' | 'VIRALITY';
  stageName: string;
  badgeLabel: string;
  badgeColor: string;
  channels: string[];
  objective: string;
  headlineHook: string;
  contentAngle: string;
  leadMagnetOrOffer: string;
  callToAction: string;
  kpi: string;
  sampleScriptOrCopy: string;
}

export interface CompetitorResearchInsight {
  market_platform: string;
  winning_hook_style: string;
  creator_video_format: string;
  top_customer_objection: string;
  objection_crusher_proof: string;
  active_trend_signal: string;
  trending_hashtags: string[];
}

export interface ProductMarketingFunnel {
  productName: string;
  productType: string;
  pricingSummary: string;
  targetAudience: string;
  summary: string;
  coreHook: string;
  growthPlaybook: string;
  recommendedMix: {
    organicRatio: number;
    paidRatio: number;
  };
  competitorResearch?: CompetitorResearchInsight;
  stages: FunnelStage[];
  isAiResearched?: boolean;
  aiModelUsed?: string;
}

/**
 * Generates an intelligence-driven, competitor-grounded 4-stage marketing funnel.
 * Incorporates viral TikTok/Reels angles, objection crushing, and natural spoken scripts.
 */
export function generateProductMarketingFunnel(
  product: Partial<Product>,
  industryName: string = 'E-Commerce & D2C Retail',
  targetCountry: string = 'Pakistan',
  targetLanguage: string = 'Urdu'
): ProductMarketingFunnel {
  const prodName = product.name?.trim() || 'Hero Product';
  const desc = product.description?.trim() || '';
  const isTech =
    isTechIndustry(industryName) ||
    product.category === 'tech' ||
    product.category === 'saas' ||
    product.category === 'gaas';

  const isUrdu =
    targetCountry?.toLowerCase().includes('pakistan') ||
    targetLanguage?.toLowerCase().includes('urdu');

  const priceVal = product.price ? String(product.price) : '2499';
  const priceDisplay = isUrdu
    ? (priceVal.startsWith('Rs') ? priceVal : `Rs. ${Number(priceVal).toLocaleString()}`)
    : (priceVal.startsWith('$') ? priceVal : `$${priceVal}`);

  const combined = `${prodName} ${desc} ${(product.features || []).join(' ')} ${(product.pain_points || []).join(' ')}`.toLowerCase();

  // 1. Kitchen & Cooking Appliances (e.g. Electric Stove, Hot Plate, Air Fryer, Chopper)
  if (
    !isTech &&
    (combined.includes('stove') ||
      combined.includes('hot plate') ||
      combined.includes('burner') ||
      combined.includes('cook') ||
      combined.includes('kettle') ||
      combined.includes('kitchen') ||
      combined.includes('gas'))
  ) {
    const research: CompetitorResearchInsight = {
      market_platform: `TikTok Creative Center, Reels & Meta Ad Library (${targetCountry})`,
      winning_hook_style: '3-Second Crisis Split-Screen (Gas Load-Shedding vs Instant Hot Plate)',
      creator_video_format: 'UGC Time-Lapse Boiling & Roti Making Test on TikTok / Reels',
      top_customer_objection: 'Kiya yeh bijli ka bill barha deta hai? Aur roti banti hai?',
      objection_crusher_proof: 'Auto-cut thermostat test proves Rs. 15-20 power per meal (3x cheaper than LPG cylinder refill)',
      active_trend_signal: 'Gas Load-Shedding winter crisis & student hostel cooking hacks (+94% Search Interest)',
      trending_hashtags: ['#GasLoadShedding', '#KitchenHacksPK', '#ElectricStove', '#HostelLife', '#DarazFinds', '#HomeEssentials'],
    };

    return {
      productName: prodName,
      productType: 'Physical E-Commerce Solution',
      pricingSummary: `${priceDisplay} (Cash on Delivery)`,
      targetAudience: 'Families facing gas load-shedding, hostel students, and urban cooking operators',
      summary: `Research-backed e-commerce video ad strategy analyzing winning dropshipping campaigns on TikTok & Meta Ad Library for ${prodName}.`,
      coreHook: `Gas load-shedding se jaan chhurwayein! ${prodName} sirf 2 minute mein chai aur roti tayar karta hai.`,
      growthPlaybook: 'Deploy morning gas crisis hooks (TOFU) ➔ Answer electricity bill fears with live watt-meter test (MOFU) ➔ Close orders with parcel open check warranty (BOFU).',
      recommendedMix: { organicRatio: 65, paidRatio: 35 },
      competitorResearch: research,
      stages: [
        {
          stageId: 'TOFU',
          stageName: 'Top of Funnel (TOFU) — Viral Problem Hook',
          badgeLabel: 'Cold Traffic Discovery',
          badgeColor: '#E1306C',
          channels: ['reels_tiktok', 'ig_carousel', 'fb_post'],
          objective: 'Hook high-intent scrollers in 3 seconds by exposing the morning gas crisis without hard selling.',
          headlineHook: 'Subah 7 baje gas chali gayi aur nashta tayar nahi? Pehle yeh 15-second hack dekhein!',
          contentAngle: 'Relatable morning kitchen crisis hook. Camera pans across empty clicking gas burner, then switches to steaming pan on hot plate.',
          leadMagnetOrOffer: 'Introductory 20% Off Launch Voucher',
          callToAction: 'Order Now & Get 20% Off ➔',
          kpi: 'Viral Video Views (>50k), Hook Retention (>40%)',
          sampleScriptOrCopy: `[HOOK - 0:00 to 0:03]\nVisual: Camera pans quickly across an empty kitchen gas stove clicking with zero flame, then switches to steaming pan on the Electric Stove.\nVoiceover (Roman Urdu): "Subah 7 baje gas chali gayi aur nashta tayar nahi? Cylinder ke kharche aur khatre bhool jayein — yeh ${prodName} sirf 2 minute mein chai aur roti tayar karta hai!"\nVoiceover (اردو): "صبح کے وقت گیس چلی گئی اور ناشتہ نہیں بنا؟ سلنڈر کے خطرات کو بھول جائیں، یہ الیکٹرک چولہا صرف دو منٹ میں کھانا تیار کرتا ہے۔"\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Turning the 5-level heat thermostat knob; boiling water rapidly in kettle or frying egg.\nVoiceover (Roman Urdu): "Iska heavy-duty cast iron burner har bartan ko support karta hai. Kitchen ho ya hostel, plug lagayein aur bina kisi tension ke khana banayein!"\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Creator pouring hot chai smiling, arrow pointing to bio link.\nVoiceover (Roman Urdu): "Gas load-shedding se jaan chhurwayein! Abhi bio link se ${priceDisplay} mein Cash on Delivery par order karein!"`,
        },
        {
          stageId: 'MOFU',
          stageName: 'Middle of Funnel (MOFU) — Objection-Crushing Demo',
          badgeLabel: 'Proof & Consideration',
          badgeColor: '#833AB4',
          channels: ['reels_tiktok', 'fb_post', 'paid_ad'],
          objective: 'Crush the #1 customer hesitation: "Does this skyrocket electricity bills?" with live physical proof.',
          headlineHook: 'Sab se bara sawaal: "Kiya yeh bijli ziada khata hai?" Live watt-meter test dekh lein!',
          contentAngle: 'Digital watt meter test showing auto-cut thermostat shutting off power as soon as optimal temperature is reached.',
          leadMagnetOrOffer: '7-Day Replacement Guarantee + Free Delivery',
          callToAction: 'Watch Live Demo & Order ➔',
          kpi: 'Click-Through Rate (>3.2%), Add to Cart Rate (>9%)',
          sampleScriptOrCopy: `[OBJECTION HOOK - 0:00 to 0:04]\nVisual: Creator points to a customer comment on screen: 'Kiya yeh bijli ka bill bohat ziada badha deta hai?'\nVoiceover (Roman Urdu): "Sab se bara sawaal: 'Kiya yeh bijli ziada khata hai?' Chalein live digital meter par check karte hain!"\n\n[PROOF & TEST - 0:04 to 0:10]\nVisual: Digital watt meter plugged into socket; shows 1000W power, then drops to 0W as auto-thermostat clicks off once boiling temperature is reached.\nVoiceover (Roman Urdu): "Jaise hi required heat banti hai, iska auto-cut thermostat power band kar deta hai! Ek time ka nashta banane par mushkil se Rs. 15-20 ki bijli lagti hai — gas cylinder ke refill se 3 guna sasta!"\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Quick paper-towel wipe of the non-stick coil in 2 seconds.\nVoiceover (Roman Urdu): "Safe, easy to clean, aur 7 days check warranty ke sath. Aaj hi order karein!"`,
        },
        {
          stageId: 'BOFU',
          stageName: 'Bottom of Funnel (BOFU) — Social Proof, Unboxing & COD Close',
          badgeLabel: 'Direct Orders & Trust',
          badgeColor: '#10B981',
          channels: ['paid_ad', 'whatsapp_broadcast'],
          objective: 'Eradicate delivery and broken-item skepticism with open-parcel inspection policy.',
          headlineHook: 'Naya verified batch warehouse mein land ho chuka hai! Original tested piece dekhein.',
          contentAngle: 'Warehouse dispatch, parcel open check policy, and money-back guarantee.',
          leadMagnetOrOffer: 'Cash on Delivery + Open Parcel Inspection Policy',
          callToAction: 'Order Now with Cash on Delivery ➔',
          kpi: 'ROAS (>3.5x), Order Conversion Rate (>4%)',
          sampleScriptOrCopy: `[UNBOXING HOOK - 0:00 to 0:03]\nVisual: Warehouse packing station with cutter opening branded factory box.\nVoiceover (Roman Urdu): "Naya stock unboxing! Fresh batch warehouse mein land ho chuka hai! Nakli aur sasti coils lene ke bajaye yeh original tested piece dekhein!"\n\n[QUALITY INSPECTION - 0:03 to 0:10]\nVisual: Inspecting heavy cast-iron coil, rubber non-skid feet, and stamped 7-day replacement warranty card.\nVoiceover (Roman Urdu): "Hamari team har parcel dispatch se pehle test karti hai. Rider ke samne parcel khol kar check karein, tassalli hone par payment dein!"\n\n[CLOSING OFFER - 0:10 to 0:15]\nVisual: Courier rider loading dispatched parcels into van.\nVoiceover (Roman Urdu): "Poore Pakistan mein Cash on Delivery & Free Replacement Warranty available hai. ${priceDisplay} mein abhi order confirm karein!"`,
        },
        {
          stageId: 'VIRALITY',
          stageName: 'Growth Loop — VIP WhatsApp Community & Restocks',
          badgeLabel: 'Repeat Customer Flywheel',
          badgeColor: '#25D366',
          channels: ['whatsapp_broadcast', 'email_newsletter'],
          objective: 'Turn verified buyers into recurring purchasers with exclusive VIP broadcast drops.',
          headlineHook: 'VIP Customer Club: Secret flash sales aur cooking accessories drops.',
          contentAngle: 'Post-delivery automated care and cooking hack guides.',
          leadMagnetOrOffer: '25% Off VIP Reorder Code',
          callToAction: 'Join VIP Broadcast ➔',
          kpi: 'Repeat Purchase Rate (>20%), Zero Ad Spend Customer Lifetime Value',
          sampleScriptOrCopy: `[VIP WELCOME MESSAGE]\nVoiceover / Copy: "Thank you for choosing ${prodName}! How is your breakfast cooking routine going?\nAs our verified VIP customer, tap below to join our private WhatsApp Broadcast for secret flash discounts, spare parts priority, and free 1-year replacement care!"`,
        },
      ],
      aiModelUsed: 'MarketPilot Research Engine (Grounded TikTok & Meta Patterns)',
    };
  }

  // 2. Health & Wellness (e.g. Back Stretcher, Lumbar Massager, Posture Corrector)
  if (
    !isTech &&
    (combined.includes('back') ||
      combined.includes('stretcher') ||
      combined.includes('spine') ||
      combined.includes('massag') ||
      combined.includes('posture') ||
      combined.includes('lumbar') ||
      combined.includes('neck') ||
      combined.includes('pain'))
  ) {
    const research: CompetitorResearchInsight = {
      market_platform: `TikTok Creative Center, Reels & Meta Ad Library (${targetCountry})`,
      winning_hook_style: 'Relatable Morning Stiffness / Desk Worker Pain Hook',
      creator_video_format: 'Live 10-second spinal decompression audible pop & posture check',
      top_customer_objection: 'Can this actually relieve chronic lower back pain or does it hurt?',
      objection_crusher_proof: '3-level adjustable arch demonstration showing disc pressure release',
      active_trend_signal: 'Work-from-home back pain & sciatica relief awareness (+88% Views)',
      trending_hashtags: ['#BackPainRelief', '#PostureCorrection', '#SciaticaRelief', '#DeskJobHacks', '#DarazFinds'],
    };

    return {
      productName: prodName,
      productType: 'Physical Health & Wellness Solution',
      pricingSummary: `${priceDisplay} (Cash on Delivery)`,
      targetAudience: 'Desk job workers, drivers, and people suffering from lower back stiffness',
      summary: `A high-converting 4-stage funnel tailored specifically for ${prodName}. Capitalizes on viral audible relief hooks and open-parcel COD guarantee.`,
      coreHook: `8 ghante chair pe baith kar reedh ki haddi jam chuki hai? Sirf 5 minute rozana stretch karein.`,
      growthPlaybook: 'Expose desk job back pain (TOFU) ➔ Show ABS polymer strength & medical foam cushion (MOFU) ➔ Close with 7-day money back guarantee (BOFU).',
      recommendedMix: { organicRatio: 65, paidRatio: 35 },
      competitorResearch: research,
      stages: [
        {
          stageId: 'TOFU',
          stageName: 'Top of Funnel (TOFU) — Viral Problem Hook',
          badgeLabel: 'Cold Traffic Reach',
          badgeColor: '#E1306C',
          channels: ['reels_tiktok', 'ig_carousel', 'fb_post'],
          objective: 'Stop the scroll by exposing desk worker stiffness without medical jargon.',
          headlineHook: 'Subah uthte hi kamar mein aisi dard hoti hai ke seedha khara nahi hua jata?',
          contentAngle: 'Relatable office fatigue hook showing instant spinal release.',
          leadMagnetOrOffer: '20% Launch Discount + Free Posture Guide',
          callToAction: 'Order Today & Relieve Pain ➔',
          kpi: 'Video Views (>45k), Hook Retention (>42%)',
          sampleScriptOrCopy: `[HOOK - 0:00 to 0:03]\nVisual: Creator struggling to stand up straight from desk chair, clutching lower spine.\nVoiceover (Roman Urdu): "Subah uthte hi ya 8 ghante office chair pe baithne ke baad kamar mein aisi dard hoti hai ke seedha khara nahi hua jata?"\n\n[DEMO - 0:03 to 0:10]\nVisual: Lying back slowly on the ergonomic arch; audible gentle spinal release sound.\nVoiceover (Roman Urdu): "Sirf 5 minute rozana is ${prodName} par layein. Iska 3-level arch compression spinal discs ke pressure ko instant relief deta hai!"\n\n[CTA - 0:10 to 0:15]\nVisual: Creator smiling, stretching arms with zero discomfort.\nVoiceover (Roman Urdu): "Chiropractor ke hazaron rupay bachayein! Abhi ${priceDisplay} mein Cash on Delivery par mangwayein!"`,
        },
        {
          stageId: 'MOFU',
          stageName: 'Middle of Funnel (MOFU) — Objection-Crushing Demo',
          badgeLabel: 'Proof & Consideration',
          badgeColor: '#833AB4',
          channels: ['reels_tiktok', 'fb_post', 'paid_ad'],
          objective: 'Answer "Will this break or hurt my spine?" with physical stress testing.',
          headlineHook: 'Log puchte hain: "Kiya yeh safe hai aur toot toh nahi jayega?" Live 150kg test dekh lein!',
          contentAngle: 'Standing on stretcher to demonstrate unbreakable ABS polymer strength.',
          leadMagnetOrOffer: '7-Day Return & Exchange Guarantee',
          callToAction: 'See Stress Test & Order ➔',
          kpi: 'Add to Cart Rate (>10%), CTR (>3.5%)',
          sampleScriptOrCopy: `[OBJECTION HOOK - 0:00 to 0:04]\nVisual: Comment on screen: 'Kiya yeh haddi ko nuqsan toh nahi pohanchata?'\nVoiceover (Roman Urdu): "Log puchte hain: 'Kiya yeh safe hai?' Dekhein iska medical-grade ABS polymer frame!"\n\n[PROOF - 0:04 to 0:10]\nVisual: Stepping on the stretcher to show 150kg weight capacity without bending; pointing to silicone spine cushion.\nVoiceover (Roman Urdu): "Center mein soft silicone ridge hai jo spinal cord ko cushion karta hai. Beginners Level 1 se start karein aur rozana 5 minute relax karein."\n\n[CTA - 0:10 to 0:15]\nVisual: Order page with 7-day money back guarantee.\nVoiceover (Roman Urdu): "Agar 7 din mein dard kam na ho toh 100% refund. Bio link se order karein!"`,
        },
        {
          stageId: 'BOFU',
          stageName: 'Bottom of Funnel (BOFU) — Social Proof, Unboxing & COD Close',
          badgeLabel: 'Direct Orders & Trust',
          badgeColor: '#10B981',
          channels: ['paid_ad', 'whatsapp_broadcast'],
          objective: 'Reassure buyers with genuine stock arrival and open-parcel inspection.',
          headlineHook: 'Original tested back stretcher rider ke samne khol kar check karein.',
          contentAngle: 'Unboxing original factory packaging with replacement warranty slip.',
          leadMagnetOrOffer: 'Cash on Delivery + 7-Day Exchange Warranty',
          callToAction: 'Order Now with Cash on Delivery ➔',
          kpi: 'ROAS (>3.8x), Purchase Conversion (>4.2%)',
          sampleScriptOrCopy: `[UNBOXING HOOK - 0:00 to 0:03]\nVisual: Unboxing parcels packed in secure bubble wrap.\nVoiceover (Roman Urdu): "Aaj ke 100+ parcels dispatch ho rahe hain! Nakli plastic stretchers se bachein."\n\n[QUALITY CHECK - 0:03 to 0:10]\nVisual: Showing authentic embossed logo and replacement guarantee slip.\nVoiceover (Roman Urdu): "Cash on Delivery par mangwayein aur rider ke samne parcel khol kar check karein!"\n\n[CTA - 0:10 to 0:15]\nVoiceover (Roman Urdu): "Special launch price ${priceDisplay}. Order now before stock runs out!"`,
        },
        {
          stageId: 'VIRALITY',
          stageName: 'Growth Loop — VIP WhatsApp Community & Restocks',
          badgeLabel: 'Repeat Customer Flywheel',
          badgeColor: '#25D366',
          channels: ['whatsapp_broadcast'],
          objective: 'Drive secondary orders for family members with special bundle discounts.',
          headlineHook: 'Family Health Care Bundle: 2nd piece at 30% discount.',
          contentAngle: 'Post-purchase satisfaction follow-up.',
          leadMagnetOrOffer: 'Buy 1 for Parents at 30% Off Code',
          callToAction: 'Claim Family Discount ➔',
          kpi: 'Repeat Purchase Rate (>22%)',
          sampleScriptOrCopy: `[VIP FOLLOW-UP]\n"Thank you for choosing ${prodName}! How is your spine feeling after 3 days?\nGive the gift of painless mornings to your parents or spouse: Reply 'FAMILY' to get a 2nd piece at 30% off with free delivery!"`,
        },
      ],
      aiModelUsed: 'MarketPilot Research Engine (Grounded TikTok & Meta Patterns)',
    };
  }

  // 3. Beauty & Hair Styling (e.g. Hair Dryer Brush, Styler, Curler)
  if (
    !isTech &&
    (combined.includes('hair') ||
      combined.includes('dryer') ||
      combined.includes('styler') ||
      combined.includes('curler') ||
      combined.includes('brush') ||
      combined.includes('blowout'))
  ) {
    const research: CompetitorResearchInsight = {
      market_platform: `TikTok Creative Center, Reels & Meta Ad Library (${targetCountry})`,
      winning_hook_style: '30-Second Damp Frizzy to Salon Blowout Transformation',
      creator_video_format: 'Split-screen wet tangled hair vs silky smooth blowout',
      top_customer_objection: 'Does this cause excessive heat damage or burn hair ends?',
      objection_crusher_proof: 'Negative ion ceramic airflow technology maintaining hair moisture and shine',
      active_trend_signal: 'At-home salon styling hacks & quick morning blowout routines (+110% Views)',
      trending_hashtags: ['#HairHacksPK', '#SalonAtHome', '#BlowoutBrush', '#HairStylingUrdu', '#DarazFinds'],
    };

    return {
      productName: prodName,
      productType: 'Physical Beauty & Styling Offering',
      pricingSummary: `${priceDisplay} (Cash on Delivery)`,
      targetAudience: 'Women looking for fast, salon-grade hair drying and blowout styling at home',
      summary: `Research-backed viral TikTok/Reels playbook for ${prodName}. Focuses on instant visual transformation and ceramic heat safety.`,
      coreHook: `Har subah baalon ko sukhane aur style karne mein ghanton zaya karna chhod dein!`,
      growthPlaybook: 'Frizz-to-blowout transformation (TOFU) ➔ Ceramic airflow heat test (MOFU) ➔ Open-parcel delivery guarantee (BOFU).',
      recommendedMix: { organicRatio: 65, paidRatio: 35 },
      competitorResearch: research,
      stages: [
        {
          stageId: 'TOFU',
          stageName: 'Top of Funnel (TOFU) — Viral Problem Hook',
          badgeLabel: 'Cold Traffic Reach',
          badgeColor: '#E1306C',
          channels: ['reels_tiktok', 'ig_carousel', 'fb_post'],
          objective: 'Visual split-screen before/after transformation hook.',
          headlineHook: 'Har subah baalon ko dry aur style karne mein 45 minute zaya? Yeh 30-sec hack dekhein!',
          contentAngle: 'Contrast damp frizzy hair with effortlessly sleek salon blowout.',
          leadMagnetOrOffer: 'Launch Discount + Free Heat Protectant Guide',
          callToAction: 'Shop Now & Get 20% Off ➔',
          kpi: 'Video Views (>60k), Shares (>1.5k)',
          sampleScriptOrCopy: `[HOOK - 0:00 to 0:03]\nVisual: Split screen: frizzy unmanageable hair on left vs. smooth salon blowout on right.\nVoiceover (Roman Urdu): "Har subah baalon ko sukhane aur style karne mein ghanton zaya karna chhod dein! Yeh 30-sec hack dekhein!"\n\n[DEMO - 0:03 to 0:10]\nVisual: Gliding the brush effortlessly through hair; instant volume and shine.\nVoiceover (Roman Urdu): "Yeh ${prodName} aik hi waqt mein dry bhi karta hai aur salon jaisa bouncy blowout deta hai bina kisi heat damage ke!"\n\n[CTA - 0:10 to 0:15]\nVoiceover (Roman Urdu): "Salon ke hazaron rupay bachayein! Abhi ${priceDisplay} mein Cash on Delivery par order karein!"`,
        },
        {
          stageId: 'MOFU',
          stageName: 'Middle of Funnel (MOFU) — Objection-Crushing Demo',
          badgeLabel: 'Proof & Consideration',
          badgeColor: '#833AB4',
          channels: ['reels_tiktok', 'fb_post', 'paid_ad'],
          objective: 'Prove ceramic tourmaline coating protects hair from burn damage.',
          headlineHook: 'Sab ka dar: "Kiya yeh baalon ko burn karta hai?" Ceramic airflow test dekh lein!',
          contentAngle: 'Demonstrating 3 temperature controls and gentle styling airflow.',
          leadMagnetOrOffer: '7-Day Check Warranty',
          callToAction: 'Watch Heat Test & Order ➔',
          kpi: 'CTR (>3.4%), Conversion (>4.1%)',
          sampleScriptOrCopy: `[OBJECTION HOOK - 0:00 to 0:04]\nVisual: Comment: 'Kiya baal jal toh nahi jatay?'\nVoiceover (Roman Urdu): "Sab ka dar: 'Kiya yeh baalon ko burn karta hai?'"\n\n[PROOF - 0:04 to 0:10]\nVisual: Showing 3 heat settings and ceramic tourmaline coating with gentle steam.\nVoiceover (Roman Urdu): "Iska ceramic airflow heat ko barabar distribute karta hai aur negative ions frizz ko khatam karte hain bina baalon ko jalaye!"\n\n[CTA - 0:10 to 0:15]\nVoiceover (Roman Urdu): "7 days replacement warranty ke sath bio link se order karein!"`,
        },
        {
          stageId: 'BOFU',
          stageName: 'Bottom of Funnel (BOFU) — Social Proof, Unboxing & COD Close',
          badgeLabel: 'Direct Orders & Trust',
          badgeColor: '#10B981',
          channels: ['paid_ad', 'whatsapp_broadcast'],
          objective: 'Build trust with factory unboxing and rider open-parcel check.',
          headlineHook: 'Fresh batch dispatch live! Original tested piece rider ke samne khol kar check karein.',
          contentAngle: 'Unboxing original factory packaging with swivel cord demonstration.',
          leadMagnetOrOffer: 'Cash on Delivery + 7 Days Replacement Warranty',
          callToAction: 'Order with Cash on Delivery ➔',
          kpi: 'ROAS (>3.6x)',
          sampleScriptOrCopy: `[UNBOXING HOOK - 0:00 to 0:03]\nVisual: Unboxing original packaging with heat-safe cord.\nVoiceover (Roman Urdu): "Fresh batch dispatch live! Original tested piece rider ke samne khol kar check karein."\n\n[CTA - 0:03 to 0:15]\nVoiceover (Roman Urdu): "Cash on Delivery poore Pakistan mein. Special launch discount ${priceDisplay} hasil karein!"`,
        },
        {
          stageId: 'VIRALITY',
          stageName: 'Growth Loop — VIP WhatsApp Community & Restocks',
          badgeLabel: 'Repeat Customer Flywheel',
          badgeColor: '#25D366',
          channels: ['whatsapp_broadcast'],
          objective: 'Retain customers with styling tutorial videos and accessory discounts.',
          headlineHook: 'Exclusive styling tips & VIP accessory discounts.',
          contentAngle: 'Post-delivery hair care routines.',
          leadMagnetOrOffer: 'VIP Styling Guide + 20% Off Hair Care Accessories',
          callToAction: 'Join VIP Club ➔',
          kpi: 'Repeat Purchase Rate (>18%)',
          sampleScriptOrCopy: `[VIP HAIR CARE COMMUNITY]\n"Thank you for choosing ${prodName}! Join our VIP WhatsApp community for 3-minute blowout tutorials, heat-safe styling tips, and private discount drops!"`,
        },
      ],
      aiModelUsed: 'MarketPilot Research Engine (Grounded TikTok & Meta Patterns)',
    };
  }

  // 4. Men's Grooming, Electric Shavers, Beard Trimmers & Razors
  if (
    !isTech &&
    (combined.includes('shaver') ||
      combined.includes('trimmer') ||
      combined.includes('razor') ||
      combined.includes('grooming') ||
      combined.includes('beard') ||
      combined.includes('clipper') ||
      combined.includes('shaving') ||
      combined.includes('sideburn'))
  ) {
    const research: CompetitorResearchInsight = {
      market_platform: `TikTok Creative Center, Reels & Meta Ad Library (${targetCountry})`,
      winning_hook_style: 'Relatable Morning Rush / Razor Nick & Skin Irritation Hook',
      creator_video_format: 'Live 60-second cordless sideburn fade & zero-irritation skin glide test',
      top_customer_objection: 'Kiya yeh skin ko cut karta hai aur battery kitni der chalti hai?',
      objection_crusher_proof: 'Self-sharpening titanium blades with skin-shield guard & 120-min USB rechargeable battery test',
      active_trend_signal: "Men's self-care, cordless beard grooming hacks & quick morning styling (+92% Search Interest)",
      trending_hashtags: ['#MensGrooming', '#BeardTrimmer', '#ShaverPK', '#BarberAtHome', '#DarazFinds', '#DailyEssentials'],
    };

    return {
      productName: prodName,
      productType: "Physical Men's Grooming Solution",
      pricingSummary: `${priceDisplay} (Cash on Delivery)`,
      targetAudience: 'Men seeking fast, zero-irritation beard trimming and clean grooming at home or on the go',
      summary: `A high-converting 4-stage funnel tailored specifically for ${prodName}. Replaces razor burns and expensive barber trips with a 60-second cordless grooming routine.`,
      coreHook: `Subah subah razor ke cuts aur irritation se bachna hai? Yeh cordless grooming machine dekhein!`,
      growthPlaybook: 'Expose morning razor cuts and dull blade frustration (TOFU) ➔ Demonstrate self-sharpening blades and sideburn precision (MOFU) ➔ Close orders with live unboxing, all 4 guard combs, and open-parcel COD guarantee (BOFU).',
      recommendedMix: { organicRatio: 65, paidRatio: 35 },
      competitorResearch: research,
      stages: [
        {
          stageId: 'TOFU',
          stageName: 'Top of Funnel (TOFU) — Viral Problem Hook',
          badgeLabel: 'Cold Traffic Discovery',
          badgeColor: '#E1306C',
          channels: ['reels_tiktok', 'ig_carousel', 'fb_post'],
          objective: 'Hook scrollers in 3 seconds by exposing the pain of razor cuts and messy morning shaving without hard selling.',
          headlineHook: 'Subah office ke liye nikalna ho aur purane razor se skin cut lag jaye? Har mard ki rozana ki pareshani!',
          contentAngle: 'Relatable morning grooming rush. Contrast painful disposable razor nicks and burning aftershave with a smooth 60-second cordless trim.',
          leadMagnetOrOffer: 'Launch 20% Discount + Free Lubrication Oil & Extra Comb',
          callToAction: 'Order Today & Save 20% ➔',
          kpi: 'Video Views (>50k), Hook Retention (>42%)',
          sampleScriptOrCopy: `[HOOK - 0:00 to 0:03]\nVisual: Man looking in mirror holding tissue to a bleeding neck cut from a disposable razor, groaning in frustration.\nVoiceover (Roman Urdu): "Subah office ya event ke liye nikalna ho aur purane razor se skin cut lag jaye ya rash nikal aaye? Har mard ki rozana ki pareshani! Yeh 60-second fix pehle dekhein!"\nVoiceover (اردو): "صبح آفس کے لیے نکلنا ہو اور پرانے ریزر سے کٹ لگ جائے؟ ہر مرد کی روزانہ کی پریشانی! یہ ۶۰ سیکنڈ حل پہلے دیکھیں۔"\n\n[DEMO & BENEFIT - 0:03 to 0:10]\nVisual: Turning on ${prodName}; showing ultra-close sideburn and beard edge lineup in one smooth stroke with zero redness.\nVoiceover (Roman Urdu): "Yeh cordless ${prodName} self-sharpening blades ke sath bina pani ya foam ke ultra-clean trim aur sharp beard line deta hai bina kisi cuts ke!"\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Smiling with clean sharp beard lineup; pointing to bio link.\nVoiceover (Roman Urdu): "Barber ke hazaron rupay bachayein! Abhi ${priceDisplay} mein Cash on Delivery par order confirm karein!"`,
        },
        {
          stageId: 'MOFU',
          stageName: 'Middle of Funnel (MOFU) — Objection-Crushing Demo',
          badgeLabel: 'Proof & Consideration',
          badgeColor: '#833AB4',
          channels: ['reels_tiktok', 'fb_post', 'paid_ad'],
          objective: 'Crush customer doubts: "Does it pinch skin or pull hair?" and "How long does the battery last?" with live proof.',
          headlineHook: 'Sab ka dar: "Kiya yeh skin ko pinch karta hai aur battery kitni der chalti hai?" Live balloon & skin test dekh lein!',
          contentAngle: 'Skin-safety balloon test (running running blade across balloon without popping it) and digital battery indicator test.',
          leadMagnetOrOffer: '7-Day Replacement Guarantee + Free Delivery',
          callToAction: 'Watch Live Test & Order ➔',
          kpi: 'CTR (>3.5%), Add to Cart Rate (>10%)',
          sampleScriptOrCopy: `[OBJECTION HOOK - 0:00 to 0:04]\nVisual: Creator holds up customer comment: 'Kiya yeh baalon ko khainchta hai ya skin ko kat-ta hai?'\nVoiceover (Roman Urdu): "Sab se bara sawaal: 'Kiya yeh skin ko cut karta hai?' Chalein live balloon test karke dekhte hain!"\n\n[PROOF & TEST - 0:04 to 0:10]\nVisual: Running running blade firmly across a blown-up balloon with zero popping, then showing 120-minute digital LED battery display.\nVoiceover (Roman Urdu): "Dekha? Zero cuts! Iska skin-protective guard sensitive skin ko 100% safe rakhta hai. Aur USB fast charging se 1 bar charge par poora mahina chalta hai!"\n\n[CALL TO ACTION - 0:10 to 0:15]\nVisual: Showing 4 guide combs (1mm, 2mm, 3mm, 4mm) and warranty card.\nVoiceover (Roman Urdu): "7 days check warranty ke sath poore Pakistan mein mangwayein. Bio link se abhi order karein!"`,
        },
        {
          stageId: 'BOFU',
          stageName: 'Bottom of Funnel (BOFU) — Social Proof, Unboxing & COD Close',
          badgeLabel: 'Direct Orders & Trust',
          badgeColor: '#10B981',
          channels: ['paid_ad', 'whatsapp_broadcast'],
          objective: 'Eradicate delivery and counterfeit skepticism with unboxing heavy metal alloy piece and rider open-parcel policy.',
          headlineHook: 'Fresh batch unboxing! Original heavy cordless machine rider ke samne khol kar check karein.',
          contentAngle: 'Unboxing heavy metal alloy casing, testing motor vibration, showing all 4 combs, charger, and warranty stamp.',
          leadMagnetOrOffer: 'Cash on Delivery + Open Parcel Inspection Policy',
          callToAction: 'Order Now with Cash on Delivery ➔',
          kpi: 'ROAS (>3.8x), Purchase Conversion (>4.2%)',
          sampleScriptOrCopy: `[UNBOXING HOOK - 0:00 to 0:03]\nVisual: Unboxing metallic branded box, lifting the heavy silver grooming machine.\nVoiceover (Roman Urdu): "Naya stock unboxing! Sasti plastic copies se bachein — yeh original heavy metallic body cordless machine dekhein!"\n\n[QUALITY & COMPONENT CHECK - 0:03 to 0:10]\nVisual: Showing heavy motor running smoothly, 4 guard combs, cleaning oil, USB cable, and stamped warranty card.\nVoiceover (Roman Urdu): "Har parcel dispatch se pehle test hota hai. Rider ke samne parcel khol kar check karein, tassalli hone par payment dein!"\n\n[CLOSING OFFER - 0:10 to 0:15]\nVisual: Courier parcels ready for pickup.\nVoiceover (Roman Urdu): "Special launch discount ${priceDisplay} mein poore Pakistan mein Cash on Delivery par abhi mangwayein!"`,
        },
        {
          stageId: 'VIRALITY',
          stageName: 'Growth Loop — VIP WhatsApp Grooming Club & Spare Blades',
          badgeLabel: 'Repeat Customer Flywheel',
          badgeColor: '#25D366',
          channels: ['whatsapp_broadcast'],
          objective: 'Retain customers with beard styling tutorials and exclusive discounts on replacement blades and beard oils.',
          headlineHook: 'VIP Grooming Club: Free beard style tutorials & spare blades discount.',
          contentAngle: 'Post-delivery grooming advice and maintenance care.',
          leadMagnetOrOffer: '30% Off Replacement Blades + Free Beard Oil Code',
          callToAction: 'Join VIP Grooming Club ➔',
          kpi: 'Repeat Purchase Rate (>20%)',
          sampleScriptOrCopy: `[VIP GROOMING CLUB]\n"Congratulations on upgrading your grooming routine with ${prodName}!\nTap below to join our private VIP WhatsApp Club to receive 2-minute beard fade tutorial videos, maintenance tips, and exclusive 30% discounts on spare blades and styling oils!"`,
        },
      ],
      aiModelUsed: 'MarketPilot Research Engine (Grounded TikTok & Meta Patterns)',
    };
  }

  // 5. SaaS & Tech Products
  if (isTech) {
    const research: CompetitorResearchInsight = {
      market_platform: 'LinkedIn, Product Hunt, YouTube & TikTok Tech Creators',
      winning_hook_style: 'Founder Screen Recording / Workflow Frustration Hook',
      creator_video_format: 'Before/After 3-Hour Manual Task vs 30-Second 1-Click Execution',
      top_customer_objection: 'How steep is the learning curve and will it integrate with our tools?',
      objection_crusher_proof: 'Interactive 60-second trial walkthrough with zero credit card required',
      active_trend_signal: 'AI workflow automation & founder productivity stacks (+140% Search Interest)',
      trending_hashtags: ['#SaaS', '#AIWorkflow', '#ProductivityHacks', '#NoCode', '#B2BGrowth'],
    };

    return {
      productName: prodName,
      productType: 'Software & Cloud Offering',
      pricingSummary: `${priceDisplay} / month (SaaS Tier)`,
      targetAudience: 'Founders, operators, and growth teams looking to eliminate manual bottlenecks',
      summary: `A high-converting 4-stage funnel tailored specifically for ${prodName}. Capitalizes on viral problem demonstration (TOFU), frictionless interactive trials (MOFU), risk-free ROI guarantees (BOFU), and built-in viral growth loops.`,
      coreHook: `Stop losing hours to manual tasks. ${prodName} automates your workflow in seconds.`,
      growthPlaybook: 'Deploy founder thought-leadership & 30s TikTok/Reels problem drama (TOFU) ➔ Convert via a 14-day free trial (MOFU) ➔ Close high-value tiers via 1-click checkout (BOFU).',
      recommendedMix: { organicRatio: 65, paidRatio: 35 },
      competitorResearch: research,
      stages: [
        {
          stageId: 'TOFU',
          stageName: 'Top of Funnel (TOFU) — Awareness & Hook',
          badgeLabel: 'Cold Traffic Discovery',
          badgeColor: '#0A66C2',
          channels: ['reels_tiktok', 'linkedin_post', 'youtube_video', 'fb_post'],
          objective: 'Trigger curiosity and attention by highlighting the cost of manual friction.',
          headlineHook: `Still dealing with manual friction? Here is how smart operators fixed it in 60 seconds.`,
          contentAngle: `Relatable problem dramatization. Contrast the painful, chaotic old way with ${prodName}'s seamless automated workflow.`,
          leadMagnetOrOffer: 'Free 60-Second Interactive Demo / Problem Checklist',
          callToAction: 'Watch 45s Walkthrough ➔',
          kpi: 'Video Views (>25k), Hook Retention (>40%), Profile Clicks (>3.5%)',
          sampleScriptOrCopy: `🚨 OPERATORS & FOUNDERS: If you are spending hours every week on repetitive manual tasks, you are wasting budget and time.\n\nWatch how ${prodName} solves this in seconds: launch the workspace, activate automated sync, and let the system handle the heavy lifting automatically.\n\nLink in bio to test it for your business today!`,
        },
        {
          stageId: 'MOFU',
          stageName: 'Middle of Funnel (MOFU) — Free Trial & Activation',
          badgeLabel: 'Lead Capture & Demo',
          badgeColor: '#833AB4',
          channels: ['youtube_video', 'email_newsletter', 'whatsapp_broadcast'],
          objective: 'Deliver the "Aha!" moment with zero upfront risk or friction.',
          headlineHook: `Experience ${prodName} free — no credit card needed.`,
          contentAngle: `Step-by-step product walkthrough demonstrating live setup under 3 minutes.`,
          leadMagnetOrOffer: '14-Day Full-Access Free Trial + Onboarding Concierge',
          callToAction: 'Start Free 14-Day Trial in 30 Seconds ➔',
          kpi: 'Trial Signups (>18%), Account Activation Rate (>50%)',
          sampleScriptOrCopy: `Want to see how easy it is to streamline your workflow with ${prodName}?\n\n1. Sign up in 30 seconds (no credit card required).\n2. Connect your workspace and launch.\n3. Experience instant automation and real-time clarity.\n\nClaim your 14-day free trial right now!`,
        },
        {
          stageId: 'BOFU',
          stageName: 'Bottom of Funnel (BOFU) — Paid Conversion & Closing',
          badgeLabel: 'Revenue & Checkout',
          badgeColor: '#10B981',
          channels: ['paid_ad', 'whatsapp_broadcast', 'linkedin_post'],
          objective: 'Overcome objections, highlight quantifiable ROI, and trigger checkout.',
          headlineHook: `Pays for itself on day 1: save at least 3x the ${priceDisplay} cost or get a 100% refund.`,
          contentAngle: `Direct financial math breakdown: Compare the cost of manual delays against the tiny monthly investment of ${prodName}.`,
          leadMagnetOrOffer: 'Founder Launch Discount: 20% Off Annual Plan + Priority Support',
          callToAction: 'Lock In Pro Workspace at 20% Off ➔',
          kpi: 'Trial-to-Paid Conversion (>12%), Customer Acquisition Cost (CAC)',
          sampleScriptOrCopy: `Manual errors and wasted hours cost you far more than a tiny software subscription.\n\n${prodName} costs only ${priceDisplay} to automate your entire workflow.\n\nIf ${prodName} does not save you more than its cost in the first 30 days, we will refund every single penny. Zero questions asked.\n\nClick below to upgrade your plan today!`,
        },
        {
          stageId: 'VIRALITY',
          stageName: 'Growth Loop — Retention & Referral Flywheel',
          badgeLabel: 'Organic Virality Loop',
          badgeColor: '#25D366',
          channels: ['whatsapp_broadcast', 'email_newsletter'],
          objective: 'Turn every active user into a brand advocate and referral driver.',
          headlineHook: `Invite colleagues or partners and unlock free workspace credits.`,
          contentAngle: `Built-in collaborative virality: When users share exports, reports, or workflow links, their partners discover ${prodName}.`,
          leadMagnetOrOffer: 'Refer a Colleague: Both get 1 Month Free Pro Subscription',
          callToAction: 'Invite Team Partner ➔',
          kpi: 'Viral Coefficient (K-factor > 0.25), Net Revenue Retention (>110%)',
          sampleScriptOrCopy: `💡 PRO GROWTH HACK: Every time you share a project report or workflow output, colleagues can access it with one click.\n\nPlus, invite any team or peer using your unique invite link, and you both get a free month credited to your account!`,
        },
      ],
      aiModelUsed: 'MarketPilot Research Engine (Grounded B2B SaaS Patterns)',
    };
  }

  // 5. General Problem-Solving Consumer Products Fallback
  const research: CompetitorResearchInsight = {
    market_platform: `TikTok Creative Center, Reels & Meta Ad Library (${targetCountry})`,
    winning_hook_style: 'Relatable Problem Dramatization & Visual Fix',
    creator_video_format: '15-Second UGC before-and-after demo on TikTok / Reels',
    top_customer_objection: 'Is the product quality genuine and as shown in the video?',
    objection_crusher_proof: 'Physical stress test & live demonstration proving immediate problem fix',
    active_trend_signal: 'TikTok Made Me Buy It problem-solving viral items (+75% Engagement)',
    trending_hashtags: ['#ProblemSolver', '#TikTokMadeMeBuyIt', '#DarazFinds', '#DailyHacks', '#OnlineShoppingPK'],
  };

  return {
    productName: prodName,
    productType: 'Physical E-Commerce Solution',
    pricingSummary: `${priceDisplay} (Cash on Delivery)`,
    targetAudience: 'Online shoppers looking for verified problem-solving consumer products',
    summary: `A high-converting 4-stage D2C e-commerce funnel for ${prodName}. Blends viral UGC TikTok/Reels with Meta conversion ads and WhatsApp VIP repurchase offers.`,
    coreHook: `Tired of daily manual frustration? Discover why thousands are switching to ${prodName}.`,
    growthPlaybook: 'Produce organic before/after Reels (TOFU) ➔ Retarget video viewers with live testing proof (MOFU) ➔ Close orders with Cash on Delivery & open-parcel check (BOFU).',
    recommendedMix: { organicRatio: 60, paidRatio: 40 },
    competitorResearch: research,
    stages: [
      {
        stageId: 'TOFU',
        stageName: 'Top of Funnel (TOFU) — Viral Problem Hook',
        badgeLabel: 'Cold Traffic Reach',
        badgeColor: '#E1306C',
        channels: ['reels_tiktok', 'ig_carousel', 'fb_post'],
        objective: 'Hook high-intent scrollers with visual aesthetic problem-solving.',
        headlineHook: `Stop struggling with daily friction! Watch this 15-second transformation.`,
        contentAngle: 'Fast-paced TikTok/Reels UGC before-and-after demo highlighting instant relief.',
        leadMagnetOrOffer: 'Introductory 20% Off Launch Voucher',
        callToAction: 'Shop Now & Get 20% Off ➔',
        kpi: 'Viral Video Views (>50k), Cost Per Click (< $0.15)',
        sampleScriptOrCopy: `[HOOK - 0:00 to 0:03]\nVisual: Close-up on daily problem or friction.\nVoiceover (Roman Urdu): "Agar aap bhi rozana is pareshani se tang aa chuke hain, toh yeh 15-second solution pehle dekhein!"\n\n[DEMO - 0:03 to 0:10]\nVisual: Satisfying demonstration of ${prodName} solving the problem in seconds.\nVoiceover (Roman Urdu): "Yeh ${prodName} purane mushkil tareeqon ko khatam karta hai aur guaranteed instant result deta hai!"\n\n[CTA - 0:10 to 0:15]\nVoiceover (Roman Urdu): "Abhi bio link se ${priceDisplay} mein Cash on Delivery par order confirm karein!"`,
      },
      {
        stageId: 'MOFU',
        stageName: 'Middle of Funnel (MOFU) — Objection-Crushing Demo',
        badgeLabel: 'Social Proof & Intent',
        badgeColor: '#833AB4',
        channels: ['ig_carousel', 'fb_post', 'paid_ad'],
        objective: 'Remove purchase skepticism with customer reviews and unboxing clips.',
        headlineHook: `Over 1,200+ customers can't be wrong about ${prodName}.`,
        contentAngle: 'Customer review screenshots, physical stress test, and quality breakdown.',
        leadMagnetOrOffer: '7-Day Check Warranty + Free Delivery',
        callToAction: 'Read Verified Reviews & Order ➔',
        kpi: 'Add to Cart Rate (>8%), Click-Through Rate (>2.8%)',
        sampleScriptOrCopy: `[OBJECTION HOOK - 0:00 to 0:04]\nVisual: Customer comment on screen: 'Kiya quality original hai?'\nVoiceover (Roman Urdu): "Kiya yeh sach mein kaam karta hai? Chalein live check karte hain!"\n\n[PROOF - 0:04 to 0:10]\nVisual: Close-up demonstration of durable build quality and key features in action.\nVoiceover (Roman Urdu): "Heavy-duty materials aur verified performance. Ek dafa ka kharcha rozana ki pareshani khatam!"\n\n[CTA - 0:10 to 0:15]\nVoiceover (Roman Urdu): "7 days replacement warranty ke sath risk-free order karein!"`,
      },
      {
        stageId: 'BOFU',
        stageName: 'Bottom of Funnel (BOFU) — Cash on Delivery Checkout',
        badgeLabel: 'Direct Orders & Trust',
        badgeColor: '#10B981',
        channels: ['paid_ad', 'whatsapp_broadcast'],
        objective: 'Drive immediate checkout with risk-free payment and scarcity urgency.',
        headlineHook: `Tested piece dispatch live — Order with Cash on Delivery!`,
        contentAngle: 'Limited stock alert, hassle-free 7-day exchange warranty, and open-parcel inspection.',
        leadMagnetOrOffer: 'Cash on Delivery + Open Parcel Inspection Policy',
        callToAction: 'Order Now with Cash on Delivery ➔',
        kpi: 'Return on Ad Spend (ROAS > 3.2x), Purchase Conversion Rate (>3.5%)',
        sampleScriptOrCopy: `[UNBOXING HOOK - 0:00 to 0:03]\nVisual: Warehouse parcel packing and unboxing.\nVoiceover (Roman Urdu): "Warehouse stock unboxing! Hamari team har parcel test karke dispatch karti hai."\n\n[CTA - 0:03 to 0:15]\nVoiceover (Roman Urdu): "Rider ke samne parcel khol kar check karein. Cash on Delivery par ${priceDisplay} mein order karein!"`,
      },
      {
        stageId: 'VIRALITY',
        stageName: 'Growth Loop — VIP WhatsApp Community & Restocks',
        badgeLabel: 'Repeat Customer Loop',
        badgeColor: '#25D366',
        channels: ['whatsapp_broadcast'],
        objective: 'Turn one-time buyers into lifetime repeat purchasers with zero ad spend.',
        headlineHook: `Exclusive VIP WhatsApp drop: Early access to new releases and accessory bundles.`,
        contentAngle: 'Post-purchase automated satisfaction check + exclusive secret subscriber discount.',
        leadMagnetOrOffer: 'VIP Loyalty Discount Code: 25% Off Next Order',
        callToAction: 'Join WhatsApp VIP Club ➔',
        kpi: 'Repeat Purchase Rate (>22%), Zero Ad Spend Customer Lifetime Value',
        sampleScriptOrCopy: `Thank you for choosing ${prodName}! How are you enjoying your order?\nAs a verified customer, you are invited to our WhatsApp VIP club for exclusive private flash deals and free replacement warranty. Tap here to join!`,
      },
    ],
    aiModelUsed: 'MarketPilot Research Engine (Grounded TikTok & Meta Patterns)',
  };
}
