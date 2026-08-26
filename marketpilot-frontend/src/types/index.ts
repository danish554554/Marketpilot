export type Role = 'business_owner' | 'team_member' | 'administrator';

export type MarginTier = 'low' | 'medium' | 'high';
export type ProductPriority = 'low' | 'normal' | 'high';
export type ProductStatus = 'active' | 'archived';

export type DiscountType = 'percentage' | 'fixed_amount';
export type OfferStatus = 'draft' | 'active' | 'expired' | 'archived';

export type TrendPlatform = 'tiktok' | 'instagram' | 'facebook' | 'linkedin' | 'x' | 'youtube' | 'google_trends' | 'general';
export type GuardrailStatus = 'passed' | 'warnings' | 'failed' | 'sanitized';
export type StrategyStatus = 'draft' | 'approved' | 'active' | 'archived';
export type CampaignChannel = 'instagram' | 'tiktok' | 'facebook' | 'linkedin' | 'x' | 'youtube' | 'email' | 'whatsapp' | 'general';
export type StrategyTimeframe = 'weekly' | 'monthly' | 'quarterly';

export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type ContentFormat = 'post_caption' | 'carousel_slides' | 'short_video_script' | 'email_newsletter' | 'direct_message';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface BusinessWorkspace {
  id: string;
  owner_id: string;
  business_name: string;
  industry: string;
  country: string;
  currency: string;
  target_audience_summary?: string;
  marketing_goals: string[];
  created_at: string;
  updated_at: string;
}

export interface BrandKit {
  id: string;
  workspace_id: string;
  brand_voice: string[];
  prohibited_words: string[];
  approved_cta_examples: string[];
  primary_color_hex?: string;
  secondary_color_hex?: string;
  accent_color_hex?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  sku?: string;
  price: string | number;
  cost_price?: string | number;
  profit_margin?: string | number;
  margin_tier?: MarginTier;
  stock_quantity: number;
  status: ProductStatus;
  priority: ProductPriority;
  features: string[];
  pain_points: string[];
  is_on_offer?: boolean;
  active_offer_title?: string;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  workspace_id: string;
  title: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: string | number;
  start_date?: string;
  end_date?: string;
  status: OfferStatus;
  applicable_product_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface MarketingBudget {
  id: string;
  workspace_id: string;
  total_monthly_budget: string | number;
  organic_percentage: string | number;
  paid_percentage: string | number;
  currency: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TrendSignal {
  id: string;
  topic: string;
  headline: string;
  summary: string;
  platform: TrendPlatform;
  category: string;
  target_audience?: string;
  source_name: string;
  source_url: string;
  collection_date: string;
  confidence_score: number;
  suggested_angles?: string[];
  hashtags?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CampaignPillar {
  id: string;
  strategy_id: string;
  pillar_name: string;
  objective: string;
  channel_type: string;
  platform: CampaignChannel;
  focus_product_id?: string;
  product_name?: string;
  offer_id?: string;
  offer_title?: string;
  trend_signal_id?: string;
  trend_topic?: string;
  creative_angle: string;
  hook_ideas: string[];
  suggested_ctas: string[];
  content_formats: string[];
  estimated_effort: string;
  rationale: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface MarketingStrategy {
  id: string;
  workspace_id: string;
  created_by: string;
  title: string;
  timeframe: StrategyTimeframe;
  status: StrategyStatus;
  executive_summary: string;
  target_audience_summary: string;
  budget_allocation_summary: {
    total_budget?: string | number;
    currency?: string;
    organic_budget?: string | number;
    paid_budget?: string | number;
    organic_percentage?: string | number;
    paid_percentage?: string | number;
    channel_spend_recommendations?: Record<string, string | number>;
  };
  product_priorities_summary: {
    hero_products?: Array<{ name: string; margin_tier?: string; stock_quantity?: number }>;
    high_margin_drivers?: Array<{ name: string; margin_tier?: string }>;
    clearance_or_offer_items?: Array<{ name: string; is_on_offer?: boolean }>;
  };
  strategic_rationale: Record<string, string> | string;
  pillars: CampaignPillar[];
  created_at: string;
  updated_at: string;
}

export interface PlannerContentItem {
  id: string;
  workspace_id: string;
  created_by: string;
  strategy_id?: string;
  strategy_title?: string;
  pillar_id?: string;
  pillar_name?: string;
  focus_product_id?: string;
  product_name?: string;
  offer_id?: string;
  offer_title?: string;
  trend_signal_id?: string;
  trend_topic?: string;
  title: string;
  channel: CampaignChannel;
  channel_type: string;
  format: ContentFormat;
  status: ContentStatus;
  scheduled_date: string;
  scheduled_time_slot: string;
  hook: string;
  primary_text: string;
  structured_content: {
    carousel_slides?: Array<{ slide_number: number; header: string; body: string; visual_direction_note?: string }>;
    script_scenes?: Array<{ scene_number: number; timing_seconds: number; visual_direction_note: string; spoken_narration: string; onscreen_text?: string }>;
    email_subject_lines?: string[];
    email_preview_text?: string;
    hashtags?: string[];
    total_runtime_seconds?: number;
  };
  call_to_action: string;
  strategic_rationale: string;
  created_at: string;
  updated_at: string;
}

export interface HealthDimensionCheck {
  dimension: string;
  passed: boolean;
  score: number;
  max_score: number;
  details: string;
}

export interface WorkspaceHealthReport {
  workspace_id: string;
  business_name: string;
  overall_score: number;
  status: 'excellent' | 'good' | 'needs_attention' | 'incomplete';
  dimensions: HealthDimensionCheck[];
  recommendations: string[];
  generated_at: string;
}

export interface AIComplianceReport {
  workspace_id: string;
  total_generations: number;
  pass_rate_percentage: number;
  clean_passes: number;
  warnings_count: number;
  sanitized_count: number;
  failed_count: number;
  violations_by_type: Record<string, number>;
  average_latency_ms: number;
  generated_at: string;
}
