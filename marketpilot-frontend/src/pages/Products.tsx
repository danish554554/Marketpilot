import React, { useState, useRef, useEffect } from 'react';
import {
  Package, Plus, Trash2, AlertCircle, CheckCircle2, FileSpreadsheet, Loader2,
  Sparkles, Video, BarChart2, Download, HelpCircle, X, Zap, Target,
  Copy, Check, ArrowRight, Laptop, Cpu
} from 'lucide-react';
import { Product } from '../types';
import { api } from '../api/endpoints';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { getIndustryProfile, isTechIndustry } from '../utils/industry';
import { generateProductMarketingFunnel, ProductMarketingFunnel } from '../utils/funnel';

interface ProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  onNavigate?: (page: string, productId?: string) => void;
}

export const Products: React.FC<ProductsProps> = ({ products, setProducts, onNavigate }) => {
  const { user, industry } = useAuth();
  const activeProfile = getIndustryProfile(industry);
  const isGlobalTech = isTechIndustry(industry);
  const { formatAmount, currencySymbol, currencyConfig } = useCurrency();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showFormatGuide, setShowFormatGuide] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  // Modal mode: 'tech' (SaaS/AI/GaaS/Digital) vs 'physical' (E-commerce/D2C Retail)
  const [productMode, setProductMode] = useState<'tech' | 'physical'>(() => isGlobalTech ? 'tech' : 'physical');

  // Common Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [painPoints, setPainPoints] = useState('');
  const [features, setFeatures] = useState('');

  // Tech / SaaS Specific Fields
  const [techType, setTechType] = useState('B2B SaaS Web Application');
  const [pricingModel, setPricingModel] = useState('Monthly Subscription (MRR)');
  const [targetAudience, setTargetAudience] = useState('');

  // Physical E-Commerce Specific Fields
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('100');

  // Funnel State
  const [showFunnelModal, setShowFunnelModal] = useState(false);
  const [activeFunnel, setActiveFunnel] = useState<ProductMarketingFunnel | null>(null);
  const [previewFunnel, setPreviewFunnel] = useState<ProductMarketingFunnel | null>(null);
  const [copiedStage, setCopiedStage] = useState<string | null>(null);
  const [copiedFullFunnel, setCopiedFullFunnel] = useState(false);

  const [loading, setLoading] = useState(false);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const userEmail = user?.email || localStorage.getItem('marketpilot_email') || 'sarah@glowsilk.com';

  // Automatically adapt product mode if global industry changes
  useEffect(() => {
    setProductMode(isGlobalTech ? 'tech' : 'physical');
  }, [industry, isGlobalTech]);

  const updateCachedProducts = (updated: Product[]) => {
    if (userEmail) {
      try {
        localStorage.setItem(`marketpilot_prods_${userEmail}`, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to cache products locally:', err);
      }
    }
  };

  // Sync cloud products on mount
  useEffect(() => {
    let isMounted = true;
    const syncCatalogue = async () => {
      try {
        const cloudProducts = await api.getProducts();
        if (isMounted && Array.isArray(cloudProducts)) {
          setProducts(cloudProducts);
          updateCachedProducts(cloudProducts);
        }
      } catch (err) {
        console.warn('Background products sync note:', err);
      }
    };
    syncCatalogue();
    return () => {
      isMounted = false;
    };
  }, [userEmail]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setStatusMessage(null);

    const isTech = productMode === 'tech';
    const priceNum = parseFloat(price) || 0;
    const costNum = isTech ? 0 : (parseFloat(costPrice) || 0);
    const margin = priceNum > 0 ? (((priceNum - costNum) / priceNum) * 100).toFixed(1) : (isTech ? '95.0' : '0');
    const marginTier = isTech ? 'high' : (parseFloat(margin) >= 60 ? 'high' : parseFloat(margin) >= 30 ? 'medium' : 'low');
    const effectiveStock = isTech ? 999999 : (parseInt(stock, 10) || 100);

    const fullDescription = isTech && targetAudience.trim()
      ? `${description.trim()} | Target Audience: ${targetAudience.trim()} | Architecture: ${techType} (${pricingModel})`
      : description.trim() || `${name.trim()} - High quality solution.`;

    const newProd: Partial<Product> = {
      name: name.trim(),
      description: fullDescription,
      price: priceNum,
      cost_price: costNum,
      profit_margin: margin,
      margin_tier: marginTier as any,
      stock_quantity: effectiveStock,
      status: 'active',
      priority: 'high',
      pain_points: painPoints.split(',').map((p) => p.trim()).filter(Boolean),
      features: features.split(',').map((f) => f.trim()).filter(Boolean),
    };

    try {
      const saved = await api.addProduct(newProd);
      setProducts((prev) => {
        const updated = [saved, ...prev.filter((p) => p.id !== saved.id)];
        updateCachedProducts(updated);
        return updated;
      });

      setStatusMessage({
        type: 'success',
        text: `"${saved.name}" successfully saved! Marketing funnel synthesized below.`,
      });
      setShowAddModal(false);

      // Generate & automatically display marketing funnel for this product
      const funnel = generateProductMarketingFunnel(saved, isTech ? 'SaaS & Tech Products' : industry);
      setActiveFunnel(funnel);
      setShowFunnelModal(true);

      // Reset form fields
      setName('');
      setDescription('');
      setPrice('');
      setCostPrice('');
      setPainPoints('');
      setFeatures('');
      setTargetAudience('');
      setPreviewFunnel(null);
    } catch (err: any) {
      console.error('Backend addProduct error:', err);
      const errDetail = err.response?.data?.detail || err.message || 'Unable to save product to database.';
      setStatusMessage({
        type: 'error',
        text: `Failed to save product: ${typeof errDetail === 'string' ? errDetail : JSON.stringify(errDetail)}.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewFunnel = () => {
    if (!name.trim() && !description.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a product name and description first.' });
      return;
    }
    const tempProduct: Partial<Product> = {
      name: name.trim() || 'Your Tech Product',
      description: description.trim() || 'Innovative digital solution delivering automated efficiency.',
      price: parseFloat(price) || 29,
      features: features.split(',').map((f) => f.trim()).filter(Boolean),
      pain_points: painPoints.split(',').map((p) => p.trim()).filter(Boolean),
    };
    const funnel = generateProductMarketingFunnel(tempProduct, productMode === 'tech' ? 'SaaS & Tech Products' : industry);
    setPreviewFunnel(funnel);
  };

  const handleInspectFunnel = (prod: Product) => {
    const isTech = isTechIndustry(industry) || isTechIndustry(prod.name) || isTechIndustry(prod.description);
    const funnel = generateProductMarketingFunnel(prod, isTech ? 'SaaS & Tech Products' : industry);
    setActiveFunnel(funnel);
    setShowFunnelModal(true);
  };

  const copyStageScript = (stageId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStage(stageId);
    setTimeout(() => setCopiedStage(null), 2000);
  };

  const copyFullFunnelToClipboard = () => {
    if (!activeFunnel) return;
    const markdown = `# Marketing Funnel Playbook: ${activeFunnel.productName}
**Category:** ${activeFunnel.productType}
**Pricing Model:** ${activeFunnel.pricingSummary}
**Target Audience:** ${activeFunnel.targetAudience}
**Core Hook:** ${activeFunnel.coreHook}

---
${activeFunnel.stages.map((s, idx) => `
### Stage ${idx + 1}: ${s.stageName}
* **Badge:** ${s.badgeLabel}
* **Channels:** ${s.channels.join(', ')}
* **Strategic Objective:** ${s.objective}
* **Headline Hook:** ${s.headlineHook}
* **Lead Magnet / Offer:** ${s.leadMagnetOrOffer}
* **Call to Action:** ${s.callToAction}
* **KPI Metric:** ${s.kpi}

**Ready-to-Use Copy / Script:**
\`\`\`
${s.sampleScriptOrCopy}
\`\`\`
`).join('\n---\n')}

*Generated by MarketPilot AI Autonomous Marketing Strategist*`;

    navigator.clipboard.writeText(markdown);
    setCopiedFullFunnel(true);
    setTimeout(() => setCopiedFullFunnel(false), 2500);
  };

  const handleSpreadsheetFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    const isSupported = lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv');
    if (!isSupported) {
      setStatusMessage({
        type: 'error',
        text: 'Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.',
      });
      return;
    }

    setUploadingCsv(true);
    setStatusMessage(null);

    try {
      const response = await api.importProductsSpreadsheet(file);
      try {
        const fresh = await api.getProducts();
        if (Array.isArray(fresh) && fresh.length > 0) {
          setProducts(fresh);
          updateCachedProducts(fresh);
        }
      } catch {}

      setStatusMessage({
        type: 'success',
        text: response.message || `File imported successfully! ${response.imported || 0} products added.`,
      });
    } catch (err: any) {
      console.error('Spreadsheet import error:', err);
      const errorDetail = err.response?.data?.detail || err.message || 'Unable to import file.';
      setStatusMessage({
        type: 'error',
        text: typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail),
      });
    } finally {
      setUploadingCsv(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await api.downloadProductExcelTemplate();
    } catch (err: any) {
      console.error('Failed to download template:', err);
      setStatusMessage({
        type: 'error',
        text: 'Could not generate template file. Please try again.',
      });
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this offering?')) return;
    try {
      await api.deleteProduct(id);
    } catch (err) {
      console.warn('Backend delete notification handled:', err);
    }
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      updateCachedProducts(updated);
      return updated;
    });
  };

  const isTechCurrent = productMode === 'tech';

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Notifications Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-[11px] underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Package size={12} className="text-brand-green" />
            {isGlobalTech ? '💻 TECH, SAAS & AI' : activeProfile.icon} {activeProfile.label.toUpperCase()} — {isGlobalTech ? 'PRODUCT CATALOG & FUNNELS' : activeProfile.offeringPlural.toUpperCase()}
          </small>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-ink tracking-tight mt-1">
            {isGlobalTech ? 'Your Product Engines & AI Funnels' : `${activeProfile.offeringPlural} are the foundation of every plan.`}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isGlobalTech
              ? 'Manage your SaaS, AI, and GaaS products with relevant tech fields. MarketPilot AI analyzes product descriptions to automatically suggest high-converting marketing funnels.'
              : activeProfile.growthPlaybook}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Hidden Spreadsheet Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv, .xlsx, .xls"
            onChange={handleSpreadsheetFileSelect}
            className="hidden"
          />

          {/* Format Guide Button */}
          <button
            onClick={() => setShowFormatGuide(true)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-brand-line font-semibold text-xs px-3 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            title="View Excel / CSV format guidelines"
          >
            <HelpCircle size={14} className="text-emerald-600" />
            <span className="hidden md:inline">Format Guide</span>
          </button>

          {/* Download Template Button */}
          <button
            onClick={handleDownloadTemplate}
            disabled={downloadingTemplate}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-brand-line font-semibold text-xs px-3 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Download ready-to-use sample Excel template"
          >
            {downloadingTemplate ? (
              <Loader2 size={14} className="animate-spin text-emerald-600" />
            ) : (
              <Download size={14} className="text-emerald-600" />
            )}
            <span className="hidden sm:inline">Excel Template</span>
          </button>

          {/* Upload Excel / CSV Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingCsv}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-brand-line font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Upload product spreadsheet"
          >
            {uploadingCsv ? (
              <>
                <Loader2 size={14} className="animate-spin text-brand-green" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet size={14} className="text-emerald-600" />
                <span>Upload Excel / CSV</span>
              </>
            )}
          </button>

          {/* Add Product Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-brand-green hover:bg-brand-green-dark text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>+ Add {isGlobalTech ? 'Tech / SaaS Product' : activeProfile.offeringSingular}</span>
          </button>
        </div>
      </div>

      {/* Catalog KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-brand-line p-3.5 rounded-xl shadow-soft">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            {isGlobalTech ? 'Active Offerings' : `Active ${activeProfile.offeringPlural}`}
          </span>
          <b className="text-lg font-display font-bold text-brand-ink">{products.length} Active</b>
          <small className="text-[10px] text-slate-500 block mt-0.5">Enriched for AI campaigns</small>
        </div>
        <div className="bg-white border border-brand-line p-3.5 rounded-xl shadow-soft">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">High-Yield Tier</span>
          <b className="text-lg font-display font-bold text-emerald-700">
            {products.filter((p) => Number(p.profit_margin || 0) >= 60 || p.cost_price === 0).length} Scalable
          </b>
          <small className="text-[10px] text-emerald-600/80 block mt-0.5">Primary growth anchors</small>
        </div>
        <div className="bg-white border border-brand-line p-3.5 rounded-xl shadow-soft">
          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">
            {isGlobalTech ? 'Gross Software Margin' : 'Avg Profit Margin'}
          </span>
          <b className="text-lg font-display font-bold text-blue-700">
            {products.length > 0 ? Math.round(products.reduce((acc, p) => acc + Number(p.profit_margin || 0), 0) / products.length) : (isGlobalTech ? 95 : 0)}%
          </b>
          <small className="text-[10px] text-blue-600/80 block mt-0.5">Unit economics health</small>
        </div>
        <div className="bg-white border border-brand-line p-3.5 rounded-xl shadow-soft">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            {isGlobalTech ? 'Fulfillment Scale' : activeProfile.stockLabel}
          </span>
          <b className="text-lg font-display font-bold text-brand-ink">
            {isGlobalTech ? 'Cloud Scale' : products.reduce((acc, p) => acc + (p.stock_quantity || 0), 0)}
          </b>
          <small className="text-[10px] text-slate-500 block mt-0.5">
            {isGlobalTech ? 'Infinite digital capacity' : 'Ready for dispatch'}
          </small>
        </div>
      </div>

      {/* Catalogue Table */}
      <article className="bg-white border border-brand-line rounded-2xl shadow-card overflow-hidden">
        <div className="p-5 border-b border-brand-line flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-display font-bold text-brand-ink m-0 flex items-center gap-2">
              <span>{isGlobalTech ? '💻' : activeProfile.icon}</span>
              <span>{isGlobalTech ? 'Product & Software Offerings' : activeProfile.offeringPlural} ({products.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click <b>"AI Funnel"</b> on any product to inspect its tailored Top, Middle, and Bottom-of-funnel marketing blueprint.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Currency: <b className="text-brand-ink font-mono font-bold">{currencyConfig.code} ({currencySymbol})</b>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-brand-line bg-slate-50/70 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Product / Offering</th>
                <th className="py-3 px-4">Architecture</th>
                <th className="py-3 px-4">Price / Plan</th>
                <th className="py-3 px-4">Margin %</th>
                <th className="py-3 px-4">Scale / Capacity</th>
                <th className="py-3 px-4">AI Readiness</th>
                <th className="py-3 px-4 text-right">Strategic Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center text-slate-400">
                    <Package size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">No products in your catalog yet.</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Add your tech product, SaaS platform, or e-commerce offering to unlock automated marketing funnels and ad scripts.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-brand-green text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-emerald-700 transition-all cursor-pointer"
                      >
                        + Add {isGlobalTech ? 'Tech / SaaS Product' : activeProfile.offeringSingular}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const isTechItem = isTechIndustry(industry) || isTechIndustry(prod.name) || isTechIndustry(prod.description) || prod.cost_price === 0;

                  let readiness = 0;
                  if (prod.name) readiness += 25;
                  if (prod.price) readiness += 25;
                  if (prod.description && prod.description.length > 20) readiness += 25;
                  if ((prod.pain_points && prod.pain_points.length > 0) || (prod.features && prod.features.length > 0)) readiness += 25;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-brand-ink">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{isTechItem ? '💻' : '🛍️'}</span>
                          <div>
                            <span className="text-xs font-extrabold text-brand-ink block">{prod.name}</span>
                            {prod.pain_points?.[0] ? (
                              <small className="block text-[10px] text-slate-500 font-normal line-clamp-1 max-w-xs">
                                🎯 Solves: {prod.pain_points[0]}
                              </small>
                            ) : (
                              <small className="text-[10px] text-slate-400 line-clamp-1 max-w-xs font-normal">
                                {prod.description?.slice(0, 50)}...
                              </small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${
                            isTechItem
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          <span>{isTechItem ? '💻 SaaS / Digital' : '🛍️ Physical D2C'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-bold text-slate-800">
                          {formatAmount(prod.price)}
                          {isTechItem && <span className="text-[10px] text-slate-400 font-normal"> /mo</span>}
                        </div>
                        <small className="text-[10px] text-slate-400 block">
                          {isTechItem ? 'Tier: Pro / Cloud' : `Cost: ${prod.cost_price ? formatAmount(prod.cost_price) : '—'}`}
                        </small>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-emerald-700">
                            {isTechItem && !prod.profit_margin ? '95%' : (prod.profit_margin ? `${prod.profit_margin}%` : '90%')}
                          </span>
                          <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase bg-emerald-100 text-emerald-800">
                            High Yield
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {isTechItem ? (
                          <span className="text-indigo-600 font-extrabold flex items-center gap-1 text-[11px]">
                            <Cpu size={12} />
                            <span>Cloud (Infinite)</span>
                          </span>
                        ) : prod.stock_quantity > 0 ? (
                          <span className={prod.stock_quantity < 20 ? 'text-amber-600 font-extrabold' : 'text-emerald-700'}>
                            {prod.stock_quantity} units
                          </span>
                        ) : (
                          <span className="text-rose-600 font-extrabold">0 (Out of stock)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-20">
                          <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 mb-1">
                            <span>Ready</span>
                            <span>{readiness}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                readiness >= 80 ? 'bg-emerald-500' : readiness >= 60 ? 'bg-amber-500' : 'bg-slate-400'
                              }`}
                              style={{ width: `${readiness}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* AI Funnel Inspection Button */}
                          <button
                            onClick={() => handleInspectFunnel(prod)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Inspect 4-Stage Marketing Funnel for this product"
                          >
                            <Zap size={12} className="text-indigo-600 fill-indigo-600" />
                            <span>AI Funnel</span>
                          </button>

                          <button
                            onClick={() => onNavigate?.('studio', prod.id)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-2xs"
                            title="Write viral video scripts, LinkedIn posts & ads in Studio"
                          >
                            <Video size={11} className="text-emerald-700" />
                            <span>Write Content</span>
                          </button>

                          <button
                            onClick={() => onNavigate?.('planner', prod.id)}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
                            title="Plan full organic + paid marketing budget"
                          >
                            <BarChart2 size={11} className="text-slate-500" />
                            <span>Plan</span>
                          </button>

                          <button
                            onClick={() => handleDelete(prod.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors cursor-pointer rounded-lg hover:bg-rose-50"
                            title="Delete product"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </article>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full relative shadow-2xl border border-brand-line my-8 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-brand-line">
              <div>
                <h2 className="text-lg font-display font-extrabold text-brand-ink flex items-center gap-2">
                  <span>{isTechCurrent ? '💻' : '🛍️'}</span>
                  <span>{isTechCurrent ? 'Add Tech, SaaS or AI Product' : 'Add Physical Product'}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isTechCurrent
                    ? 'Enter your product description and pricing. MarketPilot AI will synthesize a complete 4-stage marketing funnel.'
                    : 'Enter physical product pricing and margins for inventory management.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Smart Product Mode Toggle */}
            <div className="mt-4 flex items-center gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setProductMode('tech')}
                className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                  isTechCurrent
                    ? 'bg-white text-indigo-700 shadow-sm font-extrabold border border-indigo-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Laptop size={14} className="text-indigo-600" />
                <span>💻 Tech / SaaS / AI / GaaS</span>
              </button>
              <button
                type="button"
                onClick={() => setProductMode('physical')}
                className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                  !isTechCurrent
                    ? 'bg-white text-emerald-800 shadow-sm font-extrabold border border-emerald-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Package size={14} className="text-emerald-600" />
                <span>🛍️ Physical E-Commerce</span>
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="mt-5 space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isTechCurrent ? 'Product / Software Name *' : 'Product Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isTechCurrent ? 'e.g. Packing Proof App / AI Video Copilot' : 'e.g. Ionic Hair Dryer Brush / Travel Jewelry Box'}
                  className="w-full text-xs p-3 rounded-xl border border-brand-line focus:outline-none focus:border-brand-green bg-slate-50/50 font-medium"
                />
              </div>

              {/* Tech Specific Selectors */}
              {isTechCurrent && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tech Product Architecture *
                    </label>
                    <select
                      value={techType}
                      onChange={(e) => setTechType(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-brand-line focus:outline-none focus:border-brand-green bg-white font-semibold"
                    >
                      <option value="B2B SaaS Web Application">💻 B2B SaaS Web Platform</option>
                      <option value="AI Autonomous Tool / Wrapper">🤖 AI Agent & Copilot Tool</option>
                      <option value="Mobile App (iOS & Android)">📱 Mobile App (iOS / Android)</option>
                      <option value="Gaming & GaaS (Games as a Service)">🎮 Gaming & GaaS Platform</option>
                      <option value="Micro-SaaS & Chrome Extension">🧩 Micro-SaaS / Browser Extension</option>
                      <option value="API / Developer Cloud Service">⚡ API / Developer Cloud Service</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Monetization & Pricing Model *
                    </label>
                    <select
                      value={pricingModel}
                      onChange={(e) => setPricingModel(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-brand-line focus:outline-none focus:border-brand-green bg-white font-semibold"
                    >
                      <option value="Monthly Subscription (MRR)">Monthly Subscription (MRR)</option>
                      <option value="Free Trial + Paid Tier">Free Trial + Paid Tier (PLG)</option>
                      <option value="Freemium / Usage Credits">Freemium / Usage Credits</option>
                      <option value="Lifetime Deal (LTD)">One-Time / Lifetime Deal (LTD)</option>
                      <option value="Annual Contract (ARR)">Annual Contract (ARR)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Pricing & (Physical Only) Delivery Cost */}
              <div className={`grid ${isTechCurrent ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isTechCurrent ? `Subscription / Plan Price (${currencySymbol}) *` : `Retail Price (${currencySymbol}) *`}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={currencyConfig.code === 'PKR' ? '4500' : '29.00'}
                    className="w-full text-xs p-2.5 rounded-xl border border-brand-line focus:outline-none focus:border-brand-green bg-slate-50/50 font-bold"
                  />
                  {isTechCurrent && (
                    <small className="text-[10px] text-slate-400 mt-1 block">
                      Monthly or base tier pricing. Cloud unit costs default to 0% to reflect 95%+ software margins.
                    </small>
                  )}
                </div>

                {!isTechCurrent && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Delivery / Sourcing Cost ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder={currencyConfig.code === 'PKR' ? '1200' : '9.50'}
                      className="w-full text-xs p-2.5 rounded-xl border border-brand-line focus:outline-none focus:border-brand-green bg-slate-50/50"
                    />
                  </div>
                )}
              </div>

              {/* Physical Only Inventory Stock */}
              {!isTechCurrent && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Physical Inventory Stock (Units)
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="100"
                    className="w-full text-xs p-2.5 rounded-xl border border-brand-line focus:outline-none focus:border-brand-green bg-slate-50/50"
                  />
                </div>
              )}

              {/* Tech Specific Target Audience */}
              {isTechCurrent && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Target Audience / Ideal Customer Profile (ICP) *</span>
                    <span className="text-[10px] text-slate-400 font-normal">Who buys this software?</span>
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. E-commerce merchants, warehouse packing teams, logistics directors, Shopify stores"
                    className="w-full text-xs p-2.5 rounded-xl border border-brand-line focus:outline-none focus:border-brand-green bg-slate-50/50 font-medium"
                  />
                </div>
              )}

              {/* Product Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>{isTechCurrent ? 'Product Description & Workflow (How it works) *' : 'Product Description'}</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">Powers AI Funnel Generation</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    isTechCurrent
                      ? 'e.g. Packing Proof App is a mobile and web barcode scanner that video-records warehouse packing workers packing orders. It attaches a timestamped 1080p video clip to the order ID so when a customer claims a missing item or fraud return, the merchant sends a 1-click proof link and avoids losing money on COD returns.'
                      : 'Briefly describe this product, who it is for, and why customers love it...'
                  }
                  className="w-full text-xs p-3 rounded-xl border border-brand-line focus:outline-none focus:border-brand-green bg-slate-50/50 resize-none font-medium leading-relaxed"
                />
              </div>

              {/* Key Features & Pain Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isTechCurrent ? 'Key Features / Capabilities (comma-separated)' : 'Key Features'}
                  </label>
                  <input
                    type="text"
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    placeholder={
                      isTechCurrent
                        ? 'Barcode scanner trigger, 1080p packing video, 1-click proof link, cloud AWS sync'
                        : activeProfile.placeholderFeatures
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-brand-line focus:outline-none focus:border-brand-green bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isTechCurrent ? 'Customer Pain Points Solved (comma-separated)' : 'Pain Points Solved'}
                  </label>
                  <input
                    type="text"
                    value={painPoints}
                    onChange={(e) => setPainPoints(e.target.value)}
                    placeholder={
                      isTechCurrent
                        ? 'Fake return claims, lost COD dispute money, hours wasted searching manual CCTV footage'
                        : activeProfile.placeholderPains
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-brand-line focus:outline-none focus:border-brand-green bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Live Funnel Preview Box (if user triggers preview) */}
              {previewFunnel && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-xs space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between font-bold text-indigo-950">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-600" />
                      <span>Synthesized 4-Stage Marketing Funnel Preview:</span>
                    </div>
                    <span className="text-[10px] bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full">
                      {previewFunnel.productType}
                    </span>
                  </div>
                  <p className="text-indigo-900 font-semibold italic text-[11px]">
                    "{previewFunnel.coreHook}"
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px]">
                    {previewFunnel.stages.map((st) => (
                      <div key={st.stageId} className="bg-white p-2 rounded-lg border border-indigo-100 shadow-2xs">
                        <b className="text-indigo-800 block">{st.stageId}</b>
                        <span className="text-slate-500 block truncate">{st.badgeLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handlePreviewFunnel}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={13} />
                  <span>⚡ Preview Marketing Funnel</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-brand-green hover:bg-brand-green-dark text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {loading && <Loader2 size={13} className="animate-spin" />}
                    <span>{loading ? 'Saving...' : 'Save & Launch Funnel ➔'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL MARKETING FUNNEL MODAL */}
      {showFunnelModal && activeFunnel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-3xl w-full relative shadow-2xl border border-brand-line my-8 max-h-[92vh] overflow-y-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-brand-line">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-wider flex items-center gap-1">
                    <Zap size={11} className="fill-indigo-600 text-indigo-600" />
                    <span>AI Full-Funnel Architecture</span>
                  </span>
                  <span className="text-xs text-slate-400 font-mono">• {activeFunnel.productType}</span>
                </div>
                <h2 className="text-xl font-display font-extrabold text-brand-ink">
                  {activeFunnel.productName} — 4-Stage Marketing Funnel
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  {activeFunnel.summary}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFunnelModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Core Hook & Target ICP Callout */}
            <div className="p-4 bg-gradient-to-r from-indigo-50/80 via-emerald-50/50 to-indigo-50/80 border border-indigo-200/80 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                  <Target size={15} className="text-indigo-600" />
                  <span>Target ICP: {activeFunnel.targetAudience}</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                  Model: {activeFunnel.pricingSummary}
                </span>
              </div>
              <div className="text-xs text-indigo-900 font-semibold italic bg-white/80 p-3 rounded-xl border border-indigo-100">
                "{activeFunnel.coreHook}"
              </div>
            </div>

            {/* 4 Funnel Stages Cards */}
            <div className="space-y-4">
              {activeFunnel.stages.map((stage, idx) => (
                <div
                  key={stage.stageId}
                  className="bg-white border border-brand-line rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-brand-ink m-0">
                          {stage.stageName}
                        </h3>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {stage.objective}
                        </span>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-extrabold px-3 py-1 rounded-full text-white self-start sm:self-auto shadow-2xs"
                      style={{ backgroundColor: stage.badgeColor }}
                    >
                      {stage.badgeLabel}
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2.5 text-xs">
                    {/* Strategy & Hook */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Headline Hook
                        </span>
                        <b className="text-brand-ink text-xs block leading-snug">{stage.headlineHook}</b>
                        <p className="text-[11px] text-slate-500 mt-1">{stage.contentAngle}</p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Conversion Offer & CTA
                        </span>
                        <b className="text-emerald-700 text-xs block leading-snug">{stage.leadMagnetOrOffer}</b>
                        <span className="inline-block mt-1 text-[11px] font-bold text-brand-ink bg-white px-2 py-0.5 rounded border border-slate-200">
                          CTA: {stage.callToAction}
                        </span>
                      </div>
                    </div>

                    {/* Channels & KPI */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-500">Recommended Channels:</span>
                        {stage.channels.map((ch) => (
                          <span
                            key={ch}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[10px] border border-slate-200"
                          >
                            {ch.replace('_', ' ').toUpperCase()}
                          </span>
                        ))}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        🎯 <b>Target KPI:</b> {stage.kpi}
                      </div>
                    </div>

                    {/* Ready Script / Copy Drawer */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Ready-to-Use Copy / Script Asset:
                        </span>
                        <button
                          type="button"
                          onClick={() => copyStageScript(stage.stageId, stage.sampleScriptOrCopy)}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedStage === stage.stageId ? (
                            <>
                              <Check size={12} className="text-emerald-600" />
                              <span className="text-emerald-600">Copied to Clipboard!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy Script</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto border border-slate-800">
                        {stage.sampleScriptOrCopy}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-brand-line">
              <button
                type="button"
                onClick={copyFullFunnelToClipboard}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedFullFunnel ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedFullFunnel ? 'Full Funnel Playbook Copied!' : 'Copy Full Funnel (.md)'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowFunnelModal(false);
                    const prod = products.find((p) => p.name === activeFunnel.productName) || products[0];
                    onNavigate?.('planner', prod?.id);
                  }}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <BarChart2 size={13} />
                  <span>🚀 Launch in Strategy Planner</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowFunnelModal(false);
                    const prod = products.find((p) => p.name === activeFunnel.productName) || products[0];
                    onNavigate?.('studio', prod?.id);
                  }}
                  className="bg-brand-green hover:bg-brand-green-dark text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Video size={13} />
                  <span>✍️ Write Funnel in Studio</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Format Guide Modal */}
      {showFormatGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-brand-line max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-brand-line">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-brand-ink">
                    Excel & CSV Spreadsheet Format Guide
                  </h3>
                  <p className="text-xs text-slate-500">
                    Import your products or SaaS offerings with automatic profit calculations and AI funnel readiness.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFormatGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs">
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1.5 text-xs">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>Required Columns (Minimum Needed)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs">
                    <b className="text-brand-ink block">1. Product Name</b>
                    <span className="text-[11px] text-slate-500">Aliases: <code>Name</code>, <code>Title</code>, <code>Product</code></span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs">
                    <b className="text-brand-ink block">2. Price</b>
                    <span className="text-[11px] text-slate-500">Aliases: <code>Price</code>, <code>Selling Price</code>, <code>Rate</code></span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-brand-line rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1.5 text-xs">
                  <Sparkles size={15} className="text-amber-500" />
                  <span>Recommended Columns for AI Funnels & Scripts</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <b className="text-brand-ink block">Product Description</b>
                    <span className="text-[10px] text-slate-400">Aliases: <code>Description</code>, <code>Details</code></span>
                    <p className="text-[11px] text-slate-600 mt-0.5">Detailed explanation of what the product does and workflow.</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <b className="text-brand-ink block">Customer Pain Points</b>
                    <span className="text-[10px] text-slate-400">Aliases: <code>Pain Points</code>, <code>Problems</code></span>
                    <p className="text-[11px] text-slate-600 mt-0.5">Comma-separated problems solved for AI hooks.</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <b className="text-brand-ink block">Key Features</b>
                    <span className="text-[10px] text-slate-400">Aliases: <code>Features</code>, <code>Specs</code></span>
                    <p className="text-[11px] text-slate-600 mt-0.5">Comma-separated core benefits and tech capabilities.</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <b className="text-brand-ink block">Cost Price (Physical only)</b>
                    <span className="text-[10px] text-slate-400">Aliases: <code>Cost Price</code>, <code>Unit Cost</code></span>
                    <p className="text-[11px] text-slate-600 mt-0.5">Optional for SaaS/Tech (auto-defaults to $0 / 95% margin).</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-brand-line">
              <button
                onClick={() => setShowFormatGuide(false)}
                className="bg-brand-green text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-brand-green-dark transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
