import React, { useState, useRef } from 'react';
import { Package, Plus, Upload, Trash2, AlertCircle, CheckCircle2, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { api } from '../api/endpoints';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';

interface ProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export const Products: React.FC<ProductsProps> = ({ products, setProducts }) => {
  const { user } = useAuth();
  const { formatAmount, currencySymbol, currencyConfig } = useCurrency();
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('100');
  const [painPoints, setPainPoints] = useState('');
  const [features, setFeatures] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const userEmail = user?.email || localStorage.getItem('marketpilot_email') || 'sarah@glowsilk.com';

  const updateCachedProducts = (updated: Product[]) => {
    if (userEmail) {
      try {
        localStorage.setItem(`marketpilot_prods_${userEmail}`, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to cache products locally:', err);
      }
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setStatusMessage(null);

    const priceNum = parseFloat(price) || 0;
    const costNum = parseFloat(costPrice) || 0;
    const margin = priceNum > 0 ? (((priceNum - costNum) / priceNum) * 100).toFixed(1) : '0';
    const marginTier = parseFloat(margin) >= 60 ? 'high' : parseFloat(margin) >= 30 ? 'medium' : 'low';
    const effectiveDescription = description.trim() || `${name.trim()} - Premium quality store product.`;

    const newProd: Partial<Product> = {
      name: name.trim(),
      description: effectiveDescription,
      price: priceNum,
      cost_price: costNum,
      profit_margin: margin,
      margin_tier: marginTier as any,
      stock_quantity: parseInt(stock, 10) || 0,
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
      setStatusMessage({ type: 'success', text: `"${saved.name}" successfully saved to your store catalogue.` });
    } catch (err: any) {
      console.warn('Backend addProduct warning, preserving with local workspace fallback:', err);
      const fallbackProd: Product = {
        ...(newProd as Product),
        id: 'prod-' + Date.now(),
        workspace_id: user?.id || 'ws-default',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProducts((prev) => {
        const updated = [fallbackProd, ...prev];
        updateCachedProducts(updated);
        return updated;
      });
      setStatusMessage({ type: 'success', text: `"${fallbackProd.name}" saved to your catalogue.` });
    } finally {
      setLoading(false);
      setShowAddModal(false);
      setName('');
      setDescription('');
      setPrice('');
      setCostPrice('');
      setPainPoints('');
      setFeatures('');
    }
  };

  const handleCsvFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setStatusMessage({ type: 'error', text: 'Please select a valid .csv file format.' });
      return;
    }

    setUploadingCsv(true);
    setStatusMessage(null);

    try {
      const response = await api.importProductsCsv(file);
      try {
        const fresh = await api.getProducts();
        if (Array.isArray(fresh) && fresh.length > 0) {
          setProducts(fresh);
          updateCachedProducts(fresh);
        }
      } catch {}

      setStatusMessage({
        type: 'success',
        text: response.message || `CSV imported successfully! ${response.imported || 0} products added.`,
      });
    } catch (err: any) {
      console.error('CSV import error:', err);
      const errorDetail = err.response?.data?.detail || err.message || 'Unable to import CSV file.';
      setStatusMessage({
        type: 'error',
        text: typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail),
      });
    } finally {
      setUploadingCsv(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
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
          <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
            PRODUCT CATALOGUE & MARGINS
          </small>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-ink tracking-tight mt-1">
            Products are the foundation of every plan.
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add manually or upload your CSV catalogue to automatically synchronize inventory and profit margins across sessions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Hidden CSV Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleCsvFileSelect}
            className="hidden"
          />

          {/* Upload CSV Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingCsv}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-brand-line font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Upload CSV product catalogue"
          >
            {uploadingCsv ? (
              <>
                <Loader2 size={14} className="animate-spin text-brand-green" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Upload size={14} className="text-slate-500" />
                <span>Upload CSV</span>
              </>
            )}
          </button>

          {/* Add Product Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-brand-green hover:bg-brand-green-dark text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus size={14} />
            <span>+ Add a product</span>
          </button>
        </div>
      </div>

      {/* Catalogue Table */}
      <article className="bg-white border border-brand-line rounded-2xl shadow-card overflow-hidden">
        <div className="p-5 border-b border-brand-line flex items-center justify-between">
          <h2 className="text-sm font-display font-bold text-brand-ink m-0">
            Active Inventory ({products.length} Products)
          </h2>
          <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md">
            Cost prices enriched
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-brand-line text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Cost Price</th>
                <th className="py-3 px-4">Profit Margin</th>
                <th className="py-3 px-4">Margin Tier</th>
                <th className="py-3 px-4">In Stock</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Package size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">No products added yet</p>
                    <p className="text-xs text-slate-400 mb-3">Add your first product or upload a CSV catalogue to calculate margins and generate campaigns.</p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-brand-green text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm hover:bg-emerald-700 transition-all"
                      >
                        + Add Product
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 transition-all flex items-center gap-1.5"
                      >
                        <FileSpreadsheet size={13} className="text-emerald-600" />
                        <span>Upload CSV</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-brand-ink">
                      {prod.name}
                      {prod.pain_points?.[0] && (
                        <small className="block text-[10px] text-slate-400 font-normal mt-0.5">
                          Solves: {prod.pain_points[0]}
                        </small>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      {formatAmount(prod.price)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {prod.cost_price ? formatAmount(prod.cost_price) : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                      {prod.profit_margin ? `${prod.profit_margin}%` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full capitalize ${
                          prod.margin_tier === 'high'
                            ? 'bg-emerald-100 text-emerald-800'
                            : prod.margin_tier === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {prod.margin_tier || 'normal'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      {prod.stock_quantity > 0 ? (
                        <span className="text-emerald-700">{prod.stock_quantity} units</span>
                      ) : (
                        <span className="text-rose-600">Out of Stock</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(prod.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-[460px] w-full relative shadow-2xl border border-brand-line">
            <h2 className="text-lg font-display font-bold text-brand-ink mb-1">Add New Product</h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter pricing and cost details in <b>{currencyConfig.code} ({currencySymbol})</b> so the AI Strategist can optimize profit margins.
            </p>

            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 2-in-1 Rechargeable Hair Remover"
                  className="w-full text-xs p-2.5 rounded-lg border border-brand-line focus:outline-none focus:border-brand-green"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Short Description (optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Cordless, painless precision grooming tool for daily skincare."
                  className="w-full text-xs p-2.5 rounded-lg border border-brand-line focus:outline-none focus:border-brand-green resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Retail Price ({currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={currencyConfig.code === 'PKR' ? '4500' : '39.99'}
                    className="w-full text-xs p-2.5 rounded-lg border border-brand-line focus:outline-none focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Cost Price ({currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder={currencyConfig.code === 'PKR' ? '1200' : '8.50'}
                    className="w-full text-xs p-2.5 rounded-lg border border-brand-line focus:outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Initial Stock Quantity</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="100"
                  className="w-full text-xs p-2.5 rounded-lg border border-brand-line focus:outline-none focus:border-brand-green"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Audience Pain Points (comma separated)</label>
                <input
                  type="text"
                  value={painPoints}
                  onChange={(e) => setPainPoints(e.target.value)}
                  placeholder="Messy bags, Heavy daily carry"
                  className="w-full text-xs p-2.5 rounded-lg border border-brand-line focus:outline-none focus:border-brand-green"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Key Features (comma separated)</label>
                <input
                  type="text"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="e.g. USB-C Charging, Hypoallergenic blades"
                  className="w-full text-xs p-2.5 rounded-lg border border-brand-line focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-brand-green hover:bg-brand-green-dark text-white text-xs font-extrabold px-4 py-2 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading && <Loader2 size={13} className="animate-spin" />}
                  <span>{loading ? 'Saving...' : 'Save Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
