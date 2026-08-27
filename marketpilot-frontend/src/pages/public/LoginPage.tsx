import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

export function LoginPage() {
  const { login, enterDemoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState((location.state as any)?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState((location.state as any)?.message || '');

  const handleDemo = () => {
    setEmail('admin@marketpilot.local');
    setPassword('demo123');
  };

  const handleExploreDemo = () => {
    enterDemoMode();
    navigate('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || "We couldn't connect to MarketPilot. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-canvas py-20 px-4 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-soft border border-brand-line p-8">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <span className="text-brand-green text-xl font-black">◇</span>
            <span className="font-display font-extrabold text-brand-ink text-xl">
              MarketPilot <span className="text-brand-green">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-brand-ink mb-2">Welcome back</h1>
          <p className="text-sm text-brand-muted">Log in to your marketing command center</p>
        </div>

        {successMessage && !error && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-brand-green" />
            <div>
              <strong className="font-bold block mb-0.5">Verification Successful</strong>
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
            <div>
              <strong className="font-bold block mb-0.5">Connection Error</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-ink mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-brand-line rounded-xl px-4 py-3 w-full text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-brand-ink">Password</label>
              <button
                type="button"
                onClick={handleDemo}
                className="text-[11px] font-bold text-brand-green underline hover:text-brand-green-dark"
              >
                Fill Demo Credentials
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-brand-line rounded-xl px-4 py-3 w-full text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              placeholder="••••••••"
            />
            <div className="text-right mt-1.5">
              <Link
                to="/forgot-password"
                className="text-[11px] font-bold text-slate-500 hover:text-brand-green transition"
              >
                Forgot password?
              </Link>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-green text-white font-extrabold py-3 rounded-xl hover:bg-brand-green-dark transition flex justify-center items-center mt-6 text-xs shadow-sm"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Log in'
            )}
          </button>
        </form>

        {/* Explicit Demo Mode Button */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-center space-y-2">
          <button
            type="button"
            onClick={handleExploreDemo}
            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2.5 px-3 rounded-xl text-xs border border-slate-200 transition flex items-center justify-center gap-1.5"
          >
            <Sparkles size={13} className="text-amber-600" />
            <span>Explore Interactive Demo Preview</span>
            <ArrowRight size={12} />
          </button>
        </div>

        <div className="mt-5 text-center text-xs text-brand-muted">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-green font-bold hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
