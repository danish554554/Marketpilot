import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDemo = () => {
    setEmail('admin@marketpilot.local');
    setPassword('demo123');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-canvas py-20 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-soft border border-brand-line p-8">
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

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-ink mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-brand-line rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-brand-ink">Password</label>
              <button
                type="button"
                onClick={handleDemo}
                className="text-xs text-brand-green underline hover:text-brand-green-dark"
              >
                Fill Demo Credentials
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-brand-line rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-green text-white font-bold py-3 rounded-xl hover:bg-brand-green-dark transition flex justify-center items-center mt-6"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Log in'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-brand-muted">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-green font-medium hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
