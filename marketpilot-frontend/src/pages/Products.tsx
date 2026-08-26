import React, { useState } from 'react';
import { Package, Plus, Upload, Trash2, DollarSign, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { api } from '../api/endpoints';
import { useCurrency } from '../context/CurrencyContext';

interface ProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export const Products: React.FC<ProductsProps> = ({ products, setProducts }) => {
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const priceNum = parseFloat(price) || 0;
    const costNum = parseFloat(costPrice) || 0;
    const margin = priceNum > 0 ? (((priceNum - costNum) / priceNum) * 100).toFixed(1) : '0';
    const marginTier = parseFloat(margin) >= 60 ? 'high' : parseFloat(margin) >= 30 ? 'medium' : 'low';

    const newProd: Partial<Product> = {
      name,
      description,
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
      setProducts((prev) => [saved, ...prev]);
    } catch {
      // Local fallback
      setProducts((prev) => [
        {
          ...(newProd as Product),
          id: Math.random().toString(),
          workspace_id: 'ws1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        ...prev,
      ]);
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

  const handleDelete = async (id: string) => {
    try {
      await api.deleteProduct(id);
    } catch {
      // ignore
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
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
            Manage inventory, profit margin tiers, and customer pain points to drive high-margin marketing.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
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
              {products.map((prod) => (
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
              ))}
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
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 2-in-1 Rechargeable Hair Remover"
                  className="w-full text-xs p-2.5 rounded-lg border border-brand-line focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Retail Price ({currencySymbol})</label>
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
                    required
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

              <div className="flex items-center justify-end gap-2 pt-3">
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
                  className="bg-brand-green hover:bg-brand-green-dark text-white text-xs font-extrabold px-4 py-2 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
