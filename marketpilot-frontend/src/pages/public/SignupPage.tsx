import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, CheckCircle2, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';

export function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState('');
  const [targetCountry, setTargetCountry] = useState('Pakistan');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, businessName, undefined, targetCountry);
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } catch (err: any) {
      const msg = err.message || "We couldn't connect to MarketPilot. Please try again.";
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setError('This email is already registered. Please log in with your password.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-canvas py-16 px-4 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-soft border border-brand-line p-8">
        <div className="flex flex-col items-center mb-6">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <span className="text-brand-green text-xl font-black">◇</span>
            <span className="font-display font-extrabold text-brand-ink text-xl">
              MarketPilot <span className="text-brand-green">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-brand-ink mb-1">Create your workspace</h1>
          <p className="text-xs text-brand-muted text-center">
            Set up your AI autonomous marketing agent in 30 seconds
          </p>
        </div>

        {success && (
          <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-3 leading-relaxed shadow-xs">
            <CheckCircle2 size={20} className="text-brand-green shrink-0" />
            <div>
              <strong className="font-bold block text-sm text-emerald-950">Workspace Created!</strong>
              <span>Launching your marketing dashboard now...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1">
              <strong className="font-bold block mb-0.5">Notice</strong>
              <span>{error}</span>
              {error.includes('already registered') && (
                <div className="mt-2">
                  <Link
                    to="/login"
                    state={{ email }}
                    className="inline-flex items-center gap-1 font-extrabold text-brand-green hover:underline text-xs"
                  >
                    <span>Log in with your password</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSignupSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-ink mb-1">Business / Brand Name *</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="border border-brand-line rounded-xl px-4 py-3 w-full text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white text-brand-ink"
              placeholder="e.g. GlowSilk Beauty"
              disabled={loading || success}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-ink mb-1 flex items-center justify-between">
              <span>Target Market Country *</span>
              <span className="text-[10px] text-brand-muted font-normal">Sets trends & voice-over</span>
            </label>
            <select
              value={targetCountry}
              onChange={(e) => setTargetCountry(e.target.value)}
              className="border border-brand-line rounded-xl px-4 py-3 w-full text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white text-brand-ink font-semibold"
              disabled={loading || success}
            >
              <option value="Pakistan">🇵🇰 Pakistan (Urdu Voice-Over & Local Trends)</option>
              <option value="United States">🇺🇸 United States (Global Trends)</option>
              <option value="United Kingdom">🇬🇧 United Kingdom</option>
              <option value="United Arab Emirates">🇦🇪 United Arab Emirates (Arabic Voice-Over)</option>
              <option value="Saudi Arabia">🇸🇦 Saudi Arabia (Arabic Voice-Over)</option>
              <option value="Canada">🇨🇦 Canada</option>
              <option value="Germany">🇩🇪 Germany (German Voice-Over)</option>
              <option value="India">🇮🇳 India (Hindi Voice-Over)</option>
              <option value="Australia">🇦🇺 Australia</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-ink mb-1">Work Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-brand-line rounded-xl px-4 py-3 w-full text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white text-brand-ink"
              placeholder="sarah@glowsilk.com"
              disabled={loading || success}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-ink mb-1">Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-brand-line rounded-xl px-4 py-3 w-full text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white text-brand-ink"
              placeholder="At least 6 characters"
              disabled={loading || success}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-ink mb-1">Confirm Password *</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border border-brand-line rounded-xl px-4 py-3 w-full text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white text-brand-ink"
              placeholder="Re-enter password"
              disabled={loading || success}
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-brand-green text-white font-extrabold py-3.5 rounded-xl hover:bg-brand-green-dark transition flex justify-center items-center gap-2 mt-6 text-xs shadow-sm cursor-pointer disabled:opacity-75"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin" />
                Setting up your workspace...
              </span>
            ) : success ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 size={14} />
                Launching Dashboard...
              </span>
            ) : (
              <>
                <span>Create Account & Launch Workspace</span>
                <Sparkles size={14} />
              </>
            )}
          </button>

          <div className="mt-6 text-center text-xs text-brand-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-green font-bold hover:underline">
              Log in directly
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
