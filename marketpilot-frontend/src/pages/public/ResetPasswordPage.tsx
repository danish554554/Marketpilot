import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/endpoints';
import { getAuthToken, setAuthToken } from '../../api/client';
import { AlertCircle, CheckCircle2, ArrowRight, Lock, KeyRound, RefreshCw } from 'lucide-react';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 1. Check URL hash for access_token (e.g. #access_token=...&type=recovery)
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const hashClean = hash.startsWith('#') ? hash.substring(1) : hash;
      const params = new URLSearchParams(hashClean);
      const hashToken = params.get('access_token');
      if (hashToken) {
        setToken(hashToken);
        setAuthToken(hashToken);
        sessionStorage.setItem('marketpilot_recovery_token', hashToken);
        // Clean up hash from address bar without reloading
        window.history.replaceState(null, '', window.location.pathname);
        return;
      }
    }

    // 2. Check query string
    const searchParams = new URLSearchParams(window.location.search);
    const queryToken = searchParams.get('token') || searchParams.get('access_token');
    if (queryToken) {
      setToken(queryToken);
      setAuthToken(queryToken);
      return;
    }

    // 3. Check sessionStorage or existing client token
    const savedToken = sessionStorage.getItem('marketpilot_recovery_token') || getAuthToken();
    if (savedToken) {
      setToken(savedToken);
      setAuthToken(savedToken);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      if (token) {
        setAuthToken(token);
      }
      await api.updatePassword(password);
      setSuccess(true);
      sessionStorage.removeItem('marketpilot_recovery_token');
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message;
      if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Failed to update password. Your reset link may have expired.');
      }
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

          <div className="w-14 h-14 bg-emerald-50 text-brand-green rounded-full grid place-items-center mb-3 ring-8 ring-emerald-50/50">
            <KeyRound size={26} className="text-brand-green" />
          </div>
          <h1 className="text-2xl font-display font-bold text-brand-ink mb-2">Set new password</h1>
          <p className="text-xs text-brand-muted text-center max-w-xs">
            Create a strong password of at least 6 characters for your MarketPilot account.
          </p>
        </div>

        {success ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-14 h-14 bg-emerald-100 text-brand-green rounded-full grid place-items-center mx-auto text-xl">
              <CheckCircle2 size={30} />
            </div>
            <h3 className="font-display font-bold text-lg text-brand-ink">Password updated!</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your password has been changed successfully. You can now log into your workspace.
            </p>
            <div className="pt-4">
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 bg-brand-green text-white font-extrabold py-3.5 px-6 rounded-xl hover:bg-brand-green-dark transition text-xs shadow-sm"
              >
                <span>Continue to Log In</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : !token ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full grid place-items-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <h3 className="font-display font-bold text-base text-brand-ink">Reset link not detected</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We couldn't detect a valid password reset token in your browser. Please request a fresh reset link.
            </p>
            <div className="pt-3">
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:underline"
              >
                <span>Request password reset link</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-brand-ink mb-1">New Password *</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-brand-line rounded-xl pl-9 pr-4 py-3 w-full text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  placeholder="At least 6 characters"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-ink mb-1">Confirm New Password *</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border border-brand-line rounded-xl pl-9 pr-4 py-3 w-full text-xs focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  placeholder="Re-enter new password"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full bg-brand-green text-white font-extrabold py-3.5 rounded-xl hover:bg-brand-green-dark transition flex justify-center items-center gap-2 mt-4 text-xs shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Updating password...</span>
                </span>
              ) : (
                <>
                  <span>Save New Password & Continue</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>

            <div className="text-center pt-3">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
