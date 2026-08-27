import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle } from 'lucide-react';

export function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, businessName);
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
          <h1 className="text-2xl font-display font-bold text-brand-ink mb-2">Create your account</h1>
          <p className="text-sm text-brand-muted">Start planning smarter marketing in minutes.</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
            <div>
              <strong className="font-bold block mb-0.5">Registration Error</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-ink mb-1">Business Name *</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="border border-brand-line rounded-xl px-4 py-3 w-full text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              placeholder="GlowSilk Beauty"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-ink mb-1">Work Email *</label>
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
            <label className="block text-xs font-bold text-brand-ink mb-1">Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-brand-line rounded-xl px-4 py-3 w-full text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-ink mb-1">Confirm Password *</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border border-brand-line rounded-xl px-4 py-3 w-full text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              placeholder="••••••••"
            />
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
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-brand-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-green font-bold hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
