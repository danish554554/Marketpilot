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
  stages: FunnelStage[];
}

/**
 * Automatically synthesizes a 4-Stage Marketing Funnel tailored specifically
 * to the product's description, features, pain points, and business model.
 */
export function generateProductMarketingFunnel(
  product: Partial<Product>,
  industryName: string = 'SaaS & Tech Products'
): ProductMarketingFunnel {
  const prodName = product.name?.trim() || 'Tech Product';
  const desc = product.description?.trim() || `${prodName} solves operational inefficiencies and delivers measurable ROI.`;
  const isTech = isTechIndustry(industryName) || isTechIndustry(prodName) || isTechIndustry(desc);

  const priceVal = product.price ? String(product.price) : '29';
  const priceDisplay = priceVal.startsWith('$') || priceVal.startsWith('Rs') ? priceVal : `$${priceVal}`;

  // Extract or synthesize key pain point and feature
  const rawPains = Array.isArray(product.pain_points) ? product.pain_points.filter(Boolean) : [];
  const rawFeats = Array.isArray(product.features) ? product.features.filter(Boolean) : [];

  const mainPain = rawPains[0] || (desc.length > 20 ? desc.slice(0, 60) : 'manual errors and wasted money');
  const secondaryPain = rawPains[1] || 'slow, fragmented workflows';
  const mainFeature = rawFeats[0] || 'automated real-time workflow';
  const secondaryFeature = rawFeats[1] || '1-click cloud sync & dispute verification';

  // Infer Target Audience
  let targetAudience = 'Business owners, founders, and operators looking for automation';
  const lowerDesc = desc.toLowerCase() + ' ' + prodName.toLowerCase();
  if (lowerDesc.includes('pack') || lowerDesc.includes('warehouse') || lowerDesc.includes('order') || lowerDesc.includes('ship') || lowerDesc.includes('cod')) {
    targetAudience = 'E-commerce merchants, warehouse managers, fulfillment centers & Shopify/Daraz sellers';
  } else if (lowerDesc.includes('ai') || lowerDesc.includes('agent') || lowerDesc.includes('llm') || lowerDesc.includes('content')) {
    targetAudience = 'Marketing agencies, content creators, growth operators & tech founders';
  } else if (lowerDesc.includes('game') || lowerDesc.includes('player') || lowerDesc.includes('gaming')) {
    targetAudience = 'Gamers, streamer communities, indie game players & esports enthusiasts';
  } else if (lowerDesc.includes('invoice') || lowerDesc.includes('finance') || lowerDesc.includes('b2b') || lowerDesc.includes('lead')) {
    targetAudience = 'B2B sales directors, finance operators & SMB owners';
  }

  // Determine Product Model
  let productType = 'B2B SaaS Web Application';
  if (lowerDesc.includes('mobile') || lowerDesc.includes('ios') || lowerDesc.includes('android')) {
    productType = 'Mobile App & Cloud Platform';
  } else if (lowerDesc.includes('ai') || lowerDesc.includes('agent')) {
    productType = 'AI Autonomous Tech Tool';
  } else if (lowerDesc.includes('game') || lowerDesc.includes('gaas')) {
    productType = 'GaaS (Game as a Service) Platform';
  } else if (!isTech) {
    productType = 'Direct-to-Consumer Physical Product';
  }

  if (isTech) {
    return {
      productName: prodName,
      productType,
      pricingSummary: `${priceDisplay} / month (SaaS Tier)`,
      targetAudience,
      summary: `A high-converting 4-stage funnel tailored for ${prodName}. Capitalizes on viral problem demonstration (TOFU), frictionless interactive trials (MOFU), risk-free ROI guarantees (BOFU), and built-in dispute link virality.`,
      coreHook: `Stop losing thousands to ${mainPain}. ${prodName} automates ${mainFeature} in seconds.`,
      growthPlaybook: `Deploy LinkedIn founder thought-leadership & 30s TikTok/Reels problem drama to capture cold demand ➔ Convert via a 14-day free trial & interactive demo ➔ Close high-value tiers via 1-click WhatsApp checkout.`,
      recommendedMix: { organicRatio: 65, paidRatio: 35 },
      stages: [
        {
          stageId: 'TOFU',
          stageName: 'Top of Funnel (TOFU) — Awareness & Hook',
          badgeLabel: 'Cold Traffic Discovery',
          badgeColor: '#0A66C2',
          channels: ['reels_tiktok', 'linkedin_post', 'youtube_video', 'fb_post'],
          objective: 'Trigger shock & curiosity by exposing the exact cost of the problem.',
          headlineHook: `Are you still dealing with ${mainPain}? Here is how smart operators fixed it in 60 seconds.`,
          contentAngle: `Relatable problem dramatization. Contrast the painful, chaotic old way (spreadsheets, manual searches, lost money) with ${prodName}'s seamless ${mainFeature}.`,
          leadMagnetOrOffer: 'Free 60-Second Interactive Demo / Problem Checklist',
          callToAction: 'Watch 45s Walkthrough ➔',
          kpi: 'Video Views (>25k), Hook Retention (>40%), Profile Clicks (>3.5%)',
          sampleScriptOrCopy: `🚨 E-COMMERCE OWNERS: If you ship over 20 orders a day, you are almost certainly losing money to ${mainPain}.\n\nHere is what happens: a customer claims their package was empty or damaged. You waste 45 minutes searching through CCTV footage or arguing with courier reps, only to end up paying the penalty.\n\nWatch how ${prodName} ends this immediately: scan the order barcode, record a 10-second packing clip, and generate an irrefutable proof link on the spot.\n\nLink in bio to test it on your store today!`,
        },
        {
          stageId: 'MOFU',
          stageName: 'Middle of Funnel (MOFU) — Free Trial & Activation',
          badgeLabel: 'Lead Capture & Demo',
          badgeColor: '#833AB4',
          channels: ['youtube_video', 'email_newsletter', 'whatsapp_broadcast'],
          objective: 'Deliver the "Aha!" moment with zero upfront risk or friction.',
          headlineHook: `Test ${prodName} free on your next 50 shipments — no credit card needed.`,
          contentAngle: `Step-by-step product walkthrough demonstrating ${mainFeature} and ${secondaryFeature}. Show how fast setup takes (under 3 minutes).`,
          leadMagnetOrOffer: '14-Day Full-Access Free Trial + Onboarding Concierge',
          callToAction: 'Start Free 14-Day Trial in 30 Seconds ➔',
          kpi: 'Trial Signups (>18%), Account Activation Rate (>50%)',
          sampleScriptOrCopy: `Want to see how easy it is to protect your business with ${prodName}?\n\n1. Sign up in 30 seconds (zero credit card required).\n2. Connect your store or open the web camera.\n3. Record and verify your first order pack in under 10 seconds.\n\nExperience the peace of mind firsthand. Claim your 14-day free trial right now!`,
        },
        {
          stageId: 'BOFU',
          stageName: 'Bottom of Funnel (BOFU) — Paid Conversion & Closing',
          badgeLabel: 'Revenue & Checkout',
          badgeColor: '#10B981',
          channels: ['paid_ad', 'whatsapp_broadcast', 'linkedin_post'],
          objective: 'Overcome objections, highlight quantifiable ROI, and trigger checkout.',
          headlineHook: `Pays for itself on day 1: save at least 3x the ${priceDisplay} cost or get a 100% refund.`,
          contentAngle: `Direct financial math breakdown: Compare the cost of one single customer return or fraud dispute against the tiny monthly subscription of ${prodName}.`,
          leadMagnetOrOffer: 'Founder Launch Discount: 20% Off Annual Plan + Priority Support',
          callToAction: 'Lock In Pro Workspace at 20% Off ➔',
          kpi: 'Trial-to-Paid Conversion (>12%), Customer Acquisition Cost (CAC)',
          sampleScriptOrCopy: `A single fraudulent return costs you Rs. 3,500 to Rs. 8,000 in lost merchandise and courier shipping fees.\n\n${prodName} costs only ${priceDisplay} to protect your entire catalog.\n\nIf ${prodName} does not save you more than its cost in the first 30 days, we will refund every single penny. Zero questions asked.\n\nClick below to upgrade your plan today!`,
        },
        {
          stageId: 'VIRALITY',
          stageName: 'Growth Loop — Retention & Referral Flywheel',
          badgeLabel: 'Organic Virality Loop',
          badgeColor: '#25D366',
          channels: ['whatsapp_broadcast', 'email_newsletter'],
          objective: 'Turn every active customer and dispute link into a viral B2B lead generator.',
          headlineHook: `"Powered by ${prodName}" link transforms every dispute into incoming buyer inquiries.`,
          contentAngle: `Built-in product virality: When the merchant shares a timestamped video link with buyers or courier dispute desks, the page includes a subtle "Verified by ${prodName}" badge.`,
          leadMagnetOrOffer: 'Refer a Merchant Friend: Both get 1 Month Free Pro Subscription',
          callToAction: 'Share Proof Link / Invite Warehouse Partner ➔',
          kpi: 'Viral Coefficient (K-factor > 0.25), Net Revenue Retention (>110%)',
          sampleScriptOrCopy: `💡 PRO GROWTH HACK: Every time you resolve a claim by sending an automated proof link, the recipient sees: "Verified authentic pack by ${prodName} — Protect your store too."\n\nPlus, invite any fellow store owner using your unique link in settings, and you both get a free month added to your account!`,
        },
      ],
    };
  }

  // E-Commerce Physical Product Funnel Fallback
  return {
    productName: prodName,
    productType: 'Physical E-Commerce Product',
    pricingSummary: `${priceDisplay} (Retail Price)`,
    targetAudience: 'Online shoppers looking for verified problem-solving consumer products',
    summary: `A high-converting 4-stage D2C e-commerce funnel for ${prodName}. Blends viral UGC TikTok/Reels with Meta conversion ads and WhatsApp VIP repurchase offers.`,
    coreHook: `Tired of ${mainPain}? Discover why thousands are switching to ${prodName}.`,
    growthPlaybook: `Produce organic unboxing & before/after Reels (TOFU) ➔ Retarget video viewers with Meta Dynamic Product Ads (MOFU) ➔ Close orders with Cash on Delivery & bundle offers (BOFU) ➔ Drive VIP repeat orders on WhatsApp (Loop).`,
    recommendedMix: { organicRatio: 60, paidRatio: 40 },
    stages: [
      {
        stageId: 'TOFU',
        stageName: 'Top of Funnel (TOFU) — Viral Problem Hook',
        badgeLabel: 'Cold Traffic Reach',
        badgeColor: '#E1306C',
        channels: ['reels_tiktok', 'ig_carousel', 'fb_post'],
        objective: 'Hook high-intent scrollers with visual aesthetic problem-solving.',
        headlineHook: `Stop struggling with ${mainPain}! Watch this 15-second transformation.`,
        contentAngle: 'Fast-paced TikTok/Reels UGC before-and-after demo highlighting instant relief.',
        leadMagnetOrOffer: 'Introductory 20% Off Launch Voucher',
        callToAction: 'Shop Now & Get 20% Off ➔',
        kpi: 'Viral Video Views (>50k), Cost Per Click (< $0.15)',
        sampleScriptOrCopy: `If you struggle with ${mainPain}, stop scrolling! Look at how ${prodName} completely transforms the experience with its ${mainFeature}.\n\nTap the link below to get yours today with Cash on Delivery across the country!`,
      },
      {
        stageId: 'MOFU',
        stageName: 'Middle of Funnel (MOFU) — Social Proof & Carousels',
        badgeLabel: 'Social Proof & Intent',
        badgeColor: '#833AB4',
        channels: ['ig_carousel', 'fb_post', 'paid_ad'],
        objective: 'Remove purchase skepticism with customer reviews and unboxing clips.',
        headlineHook: `Over 1,200+ customers can't be wrong about ${prodName}.`,
        contentAngle: 'Customer review screenshots, unboxing video clips, and material quality breakdown.',
        leadMagnetOrOffer: 'Free Delivery on Orders Above Rs. 3,000 / $40',
        callToAction: 'Read Verified Reviews & Order ➔',
        kpi: 'Add to Cart Rate (>8%), Click-Through Rate (>2.8%)',
        sampleScriptOrCopy: `Here is why customers rate ${prodName} 4.9/5 stars:\n\n⭐ "${mainFeature} saves me so much time every day."\n⭐ "Zero regrets, quality exceeded expectations."\n\nOrder today and get free insured shipping!`,
      },
      {
        stageId: 'BOFU',
        stageName: 'Bottom of Funnel (BOFU) — Cash on Delivery Checkout',
        badgeLabel: 'Direct Orders',
        badgeColor: '#10B981',
        channels: ['paid_ad', 'whatsapp_broadcast'],
        objective: 'Drive immediate checkout with risk-free payment and scarcity urgency.',
        headlineHook: `Only 24 units left at ${priceDisplay} — Order with Cash on Delivery!`,
        contentAngle: 'Limited stock alert, hassle-free 7-day exchange warranty, and fast doorstep delivery.',
        leadMagnetOrOffer: 'Buy 2 Get 10% Extra Off + Free Express Delivery',
        callToAction: 'Order Now with Cash on Delivery ➔',
        kpi: 'Return on Ad Spend (ROAS > 3.2x), Purchase Conversion Rate (>3.5%)',
        sampleScriptOrCopy: `FINAL BATCH SALE: Grab ${prodName} for only ${priceDisplay}.\n\n✅ Pay Cash on Delivery at your doorstep\n✅ 7-Day Money Back Guarantee\n✅ Dispatched in 24 hours\n\nClick order now before stock runs out!`,
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
        sampleScriptOrCopy: `Thank you for choosing ${prodName}! How are you enjoying your order?\n\nAs a verified customer, you are invited to our WhatsApp VIP club for exclusive private flash deals and free replacement warranty. Tap here to join!`,
      },
    ],
  };
}
