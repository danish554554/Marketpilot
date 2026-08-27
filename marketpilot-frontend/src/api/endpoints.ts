import { apiClient, API_BASE_URL } from './client';
import {
  AIComplianceReport,
  BrandKit,
  BusinessWorkspace,
  MarketingBudget,
  MarketingStrategy,
  Offer,
  PlannerContentItem,
  Product,
  TrendSignal,
  UserProfile,
  WorkspaceHealthReport,
} from '../types';

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (email: string, password: string, fullName: string) => {
    const res = await apiClient.post('/auth/register', { email, password, full_name: fullName });
    return res.data;
  },
  requestPasswordReset: async (email: string) => {
    const res = await apiClient.post('/auth/password-reset', { email });
    return res.data;
  },
  getProfile: async (): Promise<UserProfile> => {
    const res = await apiClient.get('/profile');
    return res.data;
  },

  // Workspace
  getWorkspaceMe: async (): Promise<BusinessWorkspace> => {
    const res = await apiClient.get('/workspaces/me');
    return res.data;
  },
  createWorkspace: async (data: Partial<BusinessWorkspace>): Promise<BusinessWorkspace> => {
    const res = await apiClient.post('/workspaces', data);
    return res.data;
  },
  updateWorkspace: async (data: Partial<BusinessWorkspace>): Promise<BusinessWorkspace> => {
    const res = await apiClient.patch('/workspaces/me', data);
    return res.data;
  },

  // Brand Kit
  getBrandKit: async (): Promise<BrandKit> => {
    const res = await apiClient.get('/brand-kit/me');
    return res.data;
  },
  saveBrandKit: async (data: Partial<BrandKit>): Promise<BrandKit> => {
    try {
      const res = await apiClient.post('/brand-kit', data);
      return res.data;
    } catch {
      const res = await apiClient.patch('/brand-kit/me', data);
      return res.data;
    }
  },

  // Products
  getProducts: async (availableOnly = false): Promise<Product[]> => {
    const endpoint = availableOnly ? '/products/available' : '/products';
    const res = await apiClient.get(endpoint);
    return res.data;
  },
  addProduct: async (data: Partial<Product>): Promise<Product> => {
    const res = await apiClient.post('/products', data);
    return res.data;
  },
  deleteProduct: async (id: string) => {
    await apiClient.delete(`/products/${id}`);
  },

  // Offers
  getOffers: async (): Promise<Offer[]> => {
    const res = await apiClient.get('/offers');
    return res.data;
  },
  createOffer: async (data: Partial<Offer>): Promise<Offer> => {
    const res = await apiClient.post('/offers', data);
    return res.data;
  },

  // Budget
  getBudget: async (): Promise<MarketingBudget> => {
    const res = await apiClient.get('/budget/me');
    return res.data;
  },
  saveBudget: async (data: Partial<MarketingBudget>): Promise<MarketingBudget> => {
    try {
      const res = await apiClient.post('/budget', data);
      return res.data;
    } catch {
      const res = await apiClient.patch('/budget/me', data);
      return res.data;
    }
  },

  // Trends
  getTrends: async (): Promise<TrendSignal[]> => {
    const res = await apiClient.get('/trends');
    return res.data;
  },
  getMatchedTrends: async (): Promise<TrendSignal[]> => {
    const res = await apiClient.get('/trends/match');
    return res.data;
  },
  ingestLiveTrends: async (params?: {
    geo?: string;
    category_hint?: string;
    limit_per_source?: number;
  }): Promise<{ ingested_count: number; skipped_count: number; model_used: string; signals: TrendSignal[] }> => {
    const res = await apiClient.post('/trends/ingest', params || {});
    return res.data;
  },

  // Strategy Engine
  generateStrategy: async (params: {
    title?: string;
    timeframe: 'weekly' | 'monthly' | 'quarterly';
    primary_goal?: string;
    include_trends?: boolean;
    custom_instructions?: string;
  }): Promise<MarketingStrategy> => {
    const res = await apiClient.post('/strategy/generate', params);
    return res.data;
  },
  getStrategies: async (): Promise<MarketingStrategy[]> => {
    const res = await apiClient.get('/strategy');
    return res.data.strategies || [];
  },
  getActiveStrategy: async (): Promise<MarketingStrategy> => {
    const res = await apiClient.get('/strategy/active');
    return res.data;
  },
  updateStrategyStatus: async (strategyId: string, status: string): Promise<MarketingStrategy> => {
    const res = await apiClient.patch(`/strategy/${strategyId}`, { status });
    return res.data;
  },

  // Planner
  generateBatchCalendar: async (params: {
    start_date: string;
    end_date: string;
    days_per_week: number;
    strategy_id?: string;
  }): Promise<PlannerContentItem[]> => {
    const res = await apiClient.post('/planner/generate-batch', params);
    return res.data.items || [];
  },
  getCalendar: async (startDate: string, endDate: string): Promise<PlannerContentItem[]> => {
    const res = await apiClient.get(`/planner/calendar?start_date=${startDate}&end_date=${endDate}`);
    return res.data.items || [];
  },
  getPlannerItems: async (): Promise<PlannerContentItem[]> => {
    const res = await apiClient.get('/planner/items');
    return res.data || [];
  },
  updatePlannerItem: async (itemId: string, data: Partial<PlannerContentItem>): Promise<PlannerContentItem> => {
    const res = await apiClient.patch(`/planner/items/${itemId}`, data);
    return res.data;
  },
  generateStudioCopy: async (params: {
    product_name: string;
    product_description?: string;
    product_features?: string[];
    product_pain_points?: string[];
    channel: string;
    format: string;
    trend_topic?: string;
    hook_idea?: string;
    custom_instructions?: string;
  }): Promise<{ hook: string; caption: string; call_to_action: string; hashtags: string; ai_model_used: string }> => {
    const res = await apiClient.post('/planner/generate-copy', params);
    return res.data;
  },
  validateGuardrails: async (params: {
    text: string;
    prohibited_words: string[];
    product_name?: string;
    product_stock?: number;
  }): Promise<{ passed: boolean; status: string; detected_prohibited_words: string[]; violations: string[]; safety_message: string }> => {
    const res = await apiClient.post('/planner/validate-guardrails', params);
    return res.data;
  },

  // Reporting & Export
  getWorkspaceHealth: async (): Promise<WorkspaceHealthReport> => {
    const res = await apiClient.get('/reporting/workspace-health');
    return res.data;
  },
  getAiCompliance: async (): Promise<AIComplianceReport> => {
    const res = await apiClient.get('/reporting/ai-compliance');
    return res.data;
  },
  exportStrategyUrl: (strategyId: string, format: 'markdown' | 'csv' | 'html' | 'json') => {
    return `${API_BASE_URL}/export/strategy/${strategyId}?format=${format}`;
  },
  exportCalendarUrl: (startDate: string, endDate: string, format: 'csv' | 'markdown' | 'html' | 'json') => {
    return `${API_BASE_URL}/export/calendar?start_date=${startDate}&end_date=${endDate}&format=${format}`;
  },
  downloadWorkspaceBackup: async () => {
    const res = await apiClient.get('/export/workspace-backup');
    return res.data;
  },
};
