import React, { useState } from 'react';
import { X, Lock, Mail, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api/endpoints';
import { setAuthToken } from '../api/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isRegister) {
        const res = await api.register(email, password, fullName);
        if (res.access_token) {
          setAuthToken(res.access_token);
          onSuccess(email);
          onClose();
        } else {
          setMessage('Registration submitted. Please check email or login directly.');
        }
      } else {
        const res = await api.login(email, password);
        if (res.access_token) {
          setAuthToken(res.access_token);
          onSuccess(email);
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials or backend status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 md:p-8 max-w-[420px] w-full relative shadow-2xl border border-brand-line">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1"
        >
          <X size={18} />
        </button>

        <small className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase block mb-1">
          FASTAPI BACKEND AUTHENTICATION
        </small>
        <h2 className="text-xl font-display font-bold text-brand-ink mb-1">
          {isRegister ? 'Create Account' : 'Sign in to MarketPilot'}
        </h2>
        <p className="text-[12px] text-slate-500 mb-5">
          Connect your frontend to your Supabase tenant database on <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">http://127.0.0.1:8000</code>.
        </p>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl mb-4 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl mb-4 flex items-start gap-2">
            <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Sarah Khan"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border border-brand-line focus:outline-none focus:border-brand-green"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border border-brand-line focus:outline-none focus:border-brand-green"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-lg border border-brand-line focus:outline-none focus:border-brand-green"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : isRegister ? 'Register & Connect' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setEmail('admin@marketpilot.local');
              setPassword('MarketPilot123!');
              setFullName('Administrator');
            }}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] py-2 rounded-lg transition-all"
          >
            Fill Demo Credentials (admin@marketpilot.local)
          </button>

          <div className="text-center mt-1">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-brand-green font-bold hover:underline"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
