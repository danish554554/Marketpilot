export interface ChannelFormatOption {
  id: string;
  label: string;
  shortLabel: string;
  platform: 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'email' | 'whatsapp';
  studioTab: 'linkedin' | 'fb_post' | 'youtube' | 'script' | 'organic' | 'paid' | 'email' | 'whatsapp';
  badgeColor: string;
  description: string;
}

export const MARKETING_CHANNEL_FORMATS: ChannelFormatOption[] = [
  {
    id: 'linkedin_post',
    label: 'LinkedIn Simple Post / Carousel',
    shortLabel: 'LinkedIn Post',
    platform: 'linkedin',
    studioTab: 'linkedin',
    badgeColor: '#0A66C2',
    description: 'B2B thought leadership, founder stories, SaaS product launches & industry case studies',
  },
  {
    id: 'fb_post',
    label: 'Facebook Simple Post',
    shortLabel: 'FB Simple Post',
    platform: 'facebook',
    studioTab: 'fb_post',
    badgeColor: '#1877F2',
    description: 'Community updates, local offers, social proof stories & shareable discussion posts',
  },
  {
    id: 'reels_tiktok',
    label: 'IG / TikTok / FB Reels Script',
    shortLabel: 'Reels & TikTok',
    platform: 'tiktok',
    studioTab: 'script',
    badgeColor: '#E1306C',
    description: '15–30s vertical hook-demo-CTA video scripts for maximum viral organic reach',
  },
  {
    id: 'youtube_video',
    label: 'YouTube Video & Shorts Script',
    shortLabel: 'YouTube Video',
    platform: 'youtube',
    studioTab: 'youtube',
    badgeColor: '#FF0000',
    description: 'Product walkthroughs, SaaS demos, deep-dive tutorials & 60s YouTube Shorts',
  },
  {
    id: 'ig_carousel',
    label: 'Instagram Carousel & Caption',
    shortLabel: 'IG Carousel',
    platform: 'instagram',
    studioTab: 'organic',
    badgeColor: '#833AB4',
    description: 'Multi-slide educational breakdowns, visual lookbooks & feature spotlights',
  },
  {
    id: 'paid_ad',
    label: 'Direct-Response Paid Ad Copy',
    shortLabel: 'Paid Ad Copy',
    platform: 'facebook',
    studioTab: 'paid',
    badgeColor: '#F59E0B',
    description: 'High-converting Meta, LinkedIn & Google paid acquisition ad creatives',
  },
  {
    id: 'email_newsletter',
    label: 'Email Drip & Newsletter',
    shortLabel: 'Email Sequence',
    platform: 'email',
    studioTab: 'email',
    badgeColor: '#10B981',
    description: 'Onboarding sequences, product release notes, weekly digests & VIP offers',
  },
  {
    id: 'whatsapp_broadcast',
    label: 'WhatsApp Direct Broadcast',
    shortLabel: 'WhatsApp VIP',
    platform: 'whatsapp',
    studioTab: 'whatsapp',
    badgeColor: '#25D366',
    description: '1-click conversational booking, restock alerts, deal vouchers & lead closing',
  },
];

export interface IndustryPreset {
  id: string;
  label: string;
  icon: string;
  offeringSingular: string;
  offeringPlural: string;
  stockLabel: string;
  priceLabel: string;
  placeholderName: string;
  placeholderFeatures: string;
  placeholderPains: string;
  recommendedChannels: string[];
  defaultPromoMode: 'hybrid' | 'organic' | 'paid';
  organicRatio: number;
  paidRatio: number;
  audienceSummary: string;
  growthPlaybook: string;
}

export const PRESET_INDUSTRIES: IndustryPreset[] = [
  {
    id: 'E-Commerce & Retail',
    label: 'E-Commerce & D2C Retail',
    icon: '🛍️',
    offeringSingular: 'Product',
    offeringPlural: 'Product Catalog',
    stockLabel: 'Inventory Stock (Units)',
    priceLabel: 'Retail Price',
    placeholderName: 'e.g. Ionic Hair Dryer Brush / Wireless Earbuds',
    placeholderFeatures: '3 heat settings, ceramic tourmaline barrel, 360 swivel cord',
    placeholderPains: 'Takes 45 mins to style hair, expensive salon visits, heat damage',
    recommendedChannels: ['reels_tiktok', 'ig_carousel', 'fb_post', 'paid_ad', 'whatsapp_broadcast'],
    defaultPromoMode: 'hybrid',
    organicRatio: 60,
    paidRatio: 40,
    audienceSummary: 'High-intent online shoppers looking for problem-solving products, fast delivery, and verified reviews.',
    growthPlaybook: 'Combine viral short-form UGC Reels/TikToks (Organic) with Meta Conversion Ads & WhatsApp COD retargeting (Paid).',
  },
  {
    id: 'SaaS & Tech Products',
    label: 'SaaS, AI & Tech Products',
    icon: '💻',
    offeringSingular: 'SaaS Plan / Feature',
    offeringPlural: 'SaaS Products & Plans',
    stockLabel: 'Seat / License Capacity',
    priceLabel: 'Subscription / MRR Price',
    placeholderName: 'e.g. MarketPilot Pro Plan / Automated Invoicing Engine',
    placeholderFeatures: '1-click workflow automation, real-time analytics dashboard, API integrations',
    placeholderPains: '10+ hours wasted on manual spreadsheets, fragmented tools, high agency costs',
    recommendedChannels: ['linkedin_post', 'youtube_video', 'reels_tiktok', 'fb_post', 'email_newsletter', 'paid_ad'],
    defaultPromoMode: 'hybrid',
    organicRatio: 65,
    paidRatio: 35,
    audienceSummary: 'Founders, B2B decision-makers, developers, and operators seeking workflow automation and measurable ROI.',
    growthPlaybook: 'Drive authority via LinkedIn Founder Posts, YouTube Product Walkthroughs & 45s Feature Reels (Organic) + retargeting Lead Ads & Trial Email Drips (Paid).',
  },
  {
    id: 'Food & Restaurant',
    label: 'Food, Cafe & Restaurant',
    icon: '🍔',
    offeringSingular: 'Menu Item / Deal',
    offeringPlural: 'Menu Items & Combos',
    stockLabel: 'Daily Prep Capacity',
    priceLabel: 'Menu Price',
    placeholderName: 'e.g. Smoked Brisket Platter / Family Fiesta Platter',
    placeholderFeatures: '12-hour slow smoked beef, house-made secret sauce, fresh artisan brioche',
    placeholderPains: 'Bland fast food, slow delivery times, overpriced small portions',
    recommendedChannels: ['reels_tiktok', 'fb_post', 'ig_carousel', 'whatsapp_broadcast', 'paid_ad'],
    defaultPromoMode: 'hybrid',
    organicRatio: 55,
    paidRatio: 45,
    audienceSummary: 'Local foodies, families, office lunch groups, and late-night delivery customers within a 5–10km radius.',
    growthPlaybook: 'Hook hungry locals with ASMR kitchen Reels & Facebook Simple Community Posts (Organic) + geo-fenced 5km Meta Lunch/Dinner Offer Ads (Paid).',
  },
  {
    id: 'Clothing & Fashion',
    label: 'Clothing, Apparel & Fashion',
    icon: '👗',
    offeringSingular: 'Apparel Piece / Collection',
    offeringPlural: 'Collections & Apparel',
    stockLabel: 'Available Pieces',
    priceLabel: 'Retail Price',
    placeholderName: 'e.g. Embroidered Lawn 3-Piece / Minimalist Oversized Hoodie',
    placeholderFeatures: '100% breathable combed cotton, fade-resistant dye, tailored modern fit',
    placeholderPains: 'Fabric shrinks after one wash, uncomfortable stitching, limited sizing',
    recommendedChannels: ['reels_tiktok', 'ig_carousel', 'fb_post', 'paid_ad', 'whatsapp_broadcast'],
    defaultPromoMode: 'hybrid',
    organicRatio: 60,
    paidRatio: 40,
    audienceSummary: 'Style-conscious shoppers looking for seasonal drops, styling inspiration, and premium fabric quality.',
    growthPlaybook: 'Showcase GRWM ("Get Ready With Me") Reels & Instagram Lookbook Carousels (Organic) + Dynamic Catalog Retargeting Ads (Paid).',
  },
  {
    id: 'Real Estate & Property',
    label: 'Real Estate & Property',
    icon: '🏢',
    offeringSingular: 'Property / Listing',
    offeringPlural: 'Property Listings & Projects',
    stockLabel: 'Available Units / Plots',
    priceLabel: 'Listing / Downpayment Price',
    placeholderName: 'e.g. 3-Bed Luxury Penthouse / Commercial Retail Suite',
    placeholderFeatures: 'Prime main-boulevard location, 3-year flexible installment plan, 15% annual rental yield',
    placeholderPains: 'Unclear legal documentation, delayed possession, low rental return',
    recommendedChannels: ['youtube_video', 'reels_tiktok', 'linkedin_post', 'fb_post', 'paid_ad', 'whatsapp_broadcast'],
    defaultPromoMode: 'hybrid',
    organicRatio: 50,
    paidRatio: 50,
    audienceSummary: 'High-net-worth investors, overseas buyers, and families seeking verified, high-yield residential or commercial properties.',
    growthPlaybook: 'Publish Drone Walkthrough YouTube Videos, 60s Property Tour Reels & LinkedIn ROI Breakdowns (Organic) + Lead-Gen Form Ads to WhatsApp (Paid).',
  },
  {
    id: 'Salon, Spa & Wellness',
    label: 'Salon, Spa & Aesthetics',
    icon: '💇‍♀️',
    offeringSingular: 'Service / Package',
    offeringPlural: 'Services & Bridal Packages',
    stockLabel: 'Weekly Appointment Slots',
    priceLabel: 'Service Package Price',
    placeholderName: 'e.g. HydraFacial Glow Package / Keratin Glass-Hair Treatment',
    placeholderFeatures: 'FDA-approved serums, certified aestheticians, zero downtime instant glow',
    placeholderPains: 'Harsh chemicals damaging skin/hair, long salon wait times, inconsistent results',
    recommendedChannels: ['reels_tiktok', 'ig_carousel', 'fb_post', 'whatsapp_broadcast', 'paid_ad'],
    defaultPromoMode: 'hybrid',
    organicRatio: 65,
    paidRatio: 35,
    audienceSummary: 'Local clients seeking self-care, bridal/party makeovers, skincare treatments, and trusted beauty specialists.',
    growthPlaybook: 'Post Before/After Transformation Reels & Client Testimonial Carousels (Organic) + Local Click-to-WhatsApp Appointment Ads (Paid).',
  },
  {
    id: 'Logistics & B2B Supply Chain',
    label: 'Logistics, Fleet & B2B Supply Chain',
    icon: '🚚',
    offeringSingular: 'Logistics Service / Solution',
    offeringPlural: 'B2B Services & Solutions',
    stockLabel: 'Fleet / Monthly Capacity',
    priceLabel: 'Contract / Tariff Rate',
    placeholderName: 'e.g. Same-Day Cold Chain Fulfillment / Nationwide COD Fleet',
    placeholderFeatures: '99.4% on-time SLA, real-time GPS API tracking, 24-hour COD remittance',
    placeholderPains: 'High parcel return (RTO) rates, delayed COD payouts, damaged cargo in transit',
    recommendedChannels: ['linkedin_post', 'youtube_video', 'fb_post', 'email_newsletter', 'paid_ad'],
    defaultPromoMode: 'hybrid',
    organicRatio: 70,
    paidRatio: 30,
    audienceSummary: 'Supply chain directors, e-commerce operations managers, and enterprise wholesale distributors.',
    growthPlaybook: 'Publish LinkedIn Case Studies, Supply Chain Reliability Posts & Warehouse Tour Videos (Organic) + B2B LinkedIn/Search Lead Ads (Paid).',
  },
  {
    id: 'Healthcare & Clinics',
    label: 'Healthcare, Dental & Clinics',
    icon: '🩺',
    offeringSingular: 'Treatment / Consultation',
    offeringPlural: 'Treatments & Care Plans',
    stockLabel: 'Weekly Consultation Slots',
    priceLabel: 'Consultation / Procedure Fee',
    placeholderName: 'e.g. 3D Digital Smile Design / Executive Full-Body Checkup',
    placeholderFeatures: 'Board-certified specialists, painless laser technology, same-day digital diagnostics',
    placeholderPains: 'Dental anxiety, long hospital queues, unclear treatment pricing',
    recommendedChannels: ['youtube_video', 'reels_tiktok', 'fb_post', 'ig_carousel', 'whatsapp_broadcast'],
    defaultPromoMode: 'organic',
    organicRatio: 75,
    paidRatio: 25,
    audienceSummary: 'Patients and families looking for trusted medical/dental specialists, educational health advice, and easy appointment booking.',
    growthPlaybook: 'Build patient trust with Doctor Explainer Reels, YouTube Q&As & Facebook Health Tips (Organic) + Local Awareness & WhatsApp Booking (Paid).',
  },
  {
    id: 'Education & Coaching',
    label: 'Education, EdTech & Coaching',
    icon: '🎓',
    offeringSingular: 'Course / Cohort Program',
    offeringPlural: 'Courses & Programs',
    stockLabel: 'Cohort Seats Available',
    priceLabel: 'Enrollment Tuition',
    placeholderName: 'e.g. Full-Stack AI Engineering Bootcamp / IELTS Band 8 Accelerator',
    placeholderFeatures: 'Live mentor code reviews, 4 portfolio capstone projects, career placement support',
    placeholderPains: 'Outdated pre-recorded tutorials, zero mentor feedback, struggling to land interviews',
    recommendedChannels: ['youtube_video', 'linkedin_post', 'reels_tiktok', 'fb_post', 'email_newsletter', 'paid_ad'],
    defaultPromoMode: 'hybrid',
    organicRatio: 65,
    paidRatio: 35,
    audienceSummary: 'Students, career switchers, and professionals upskilling for higher-paying roles or certifications.',
    growthPlaybook: 'Share Value Tutorials on YouTube, Student Success Posts on LinkedIn & 60s Tips on Reels (Organic) + Webinar/Lead Magnet Ads (Paid).',
  },
];

export const OTHER_INDUSTRY_OPTION = 'Other (Custom Industry)';

/**
 * Resolves any preset or custom ("Other") industry name into a complete IndustryPreset profile.
 * Even if the user types a custom industry like "Solar Energy", "Auto Detailing", "Law Firm", or "Gym",
 * this function intelligently infers B2B vs Local vs Consumer channels and terminology.
 */
export function getIndustryProfile(rawIndustry?: string | null): IndustryPreset {
  const clean = (rawIndustry || 'E-Commerce & Retail').trim();
  const exact = PRESET_INDUSTRIES.find(
    (p) => p.id.toLowerCase() === clean.toLowerCase() || p.label.toLowerCase() === clean.toLowerCase()
  );
  if (exact) return exact;

  const lower = clean.toLowerCase();

  // Intelligent matching if user typed custom industry or partial keyword
  if (lower.includes('saas') || lower.includes('software') || lower.includes('tech') || lower.includes('app') || lower.includes('ai') || lower.includes('cloud') || lower.includes('cyber')) {
    return { ...PRESET_INDUSTRIES[1], id: clean, label: clean };
  }
  if (lower.includes('food') || lower.includes('restaurant') || lower.includes('cafe') || lower.includes('bakery') || lower.includes('catering') || lower.includes('pizza') || lower.includes('burger')) {
    return { ...PRESET_INDUSTRIES[2], id: clean, label: clean };
  }
  if (lower.includes('cloth') || lower.includes('fashion') || lower.includes('apparel') || lower.includes('boutique') || lower.includes('wear') || lower.includes('shoe') || lower.includes('jewelry')) {
    return { ...PRESET_INDUSTRIES[3], id: clean, label: clean };
  }
  if (lower.includes('real estate') || lower.includes('property') || lower.includes('housing') || lower.includes('construction') || lower.includes('architect') || lower.includes('interior')) {
    return { ...PRESET_INDUSTRIES[4], id: clean, label: clean };
  }
  if (lower.includes('salon') || lower.includes('saloon') || lower.includes('spa') || lower.includes('beauty') || lower.includes('barber') || lower.includes('gym') || lower.includes('fitness') || lower.includes('wellness')) {
    return { ...PRESET_INDUSTRIES[5], id: clean, label: clean };
  }
  if (lower.includes('logistic') || lower.includes('supply') || lower.includes('freight') || lower.includes('b2b') || lower.includes('agency') || lower.includes('consulting') || lower.includes('law') || lower.includes('accounting') || lower.includes('solar')) {
    return { ...PRESET_INDUSTRIES[6], id: clean, label: clean };
  }
  if (lower.includes('health') || lower.includes('clinic') || lower.includes('dental') || lower.includes('medical') || lower.includes('hospital') || lower.includes('pharma')) {
    return { ...PRESET_INDUSTRIES[7], id: clean, label: clean };
  }
  if (lower.includes('educat') || lower.includes('coach') || lower.includes('academy') || lower.includes('school') || lower.includes('course') || lower.includes('training')) {
    return { ...PRESET_INDUSTRIES[8], id: clean, label: clean };
  }

  // Dynamic Custom Industry Profile for any user-specified branch of business
  return {
    id: clean,
    label: clean,
    icon: '🏢',
    offeringSingular: 'Product / Service',
    offeringPlural: `${clean} Offerings`,
    stockLabel: 'Available Capacity / Units',
    priceLabel: 'Price / Package Rate',
    placeholderName: `e.g. Flagship ${clean} Package or Solution`,
    placeholderFeatures: `Premium quality, trusted ${clean.toLowerCase()} expertise, fast turnaround`,
    placeholderPains: `Unreliable providers, hidden costs, slow customer support in ${clean.toLowerCase()}`,
    recommendedChannels: ['reels_tiktok', 'linkedin_post', 'fb_post', 'youtube_video', 'paid_ad', 'whatsapp_broadcast'],
    defaultPromoMode: 'hybrid',
    organicRatio: 60,
    paidRatio: 40,
    audienceSummary: `High-intent clients and buyers actively looking for trusted ${clean} solutions and proven results.`,
    growthPlaybook: `Combine educational Reels, YouTube explainers, LinkedIn authority posts & Facebook community updates (Organic) with targeted Lead/Conversion Ads (Paid).`,
  };
}
