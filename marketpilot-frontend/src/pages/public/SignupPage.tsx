import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/endpoints';
import { AlertCircle, CheckCircle2, ArrowRight, Mail, Sparkles, RefreshCw, Send, KeyRound } from 'lucide-react';

export function SignupPage() {
  const { register, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<'signup' | 'verify'>('signup');
  const [businessName, setBusinessName] = useState('');
  const [targetCountry, setTargetCountry] = useState('Pakistan');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [countdown, setCountdown] = useState(60);

  // Background listener: detects when user verifies via Gmail link
  useEffect(() => {
    if (step !== 'verify') return;

    const checkToken = () => {
      const token = localStorage.getItem('marketpilot_token');
      if (token) {
        navigate('/dashboard');
      }
    };

    const interval = setInterval(checkToken, 2000);
    window.addEventListener('storage', checkToken);
    window.addEventListener('focus', checkToken);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkToken);
      window.removeEventListener('focus', checkToken);
    };
  }, [step, navigate]);

  // Resend countdown timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (step === 'verify' && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

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
      const res = await register(email, password, businessName, undefined, targetCountry);
      if (res && res.requires_verification === false) {
        navigate('/dashboard');
        return;
      }
      // Require email verification link click
      setStep('verify');
      setCountdown(60);
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

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = otpCode.trim();
    if (!cleanCode) {
      setError('Please enter the verification code sent to your Gmail.');
      return;
    }
    setError('');
    setVerifyingOtp(true);
    try {
      await verifyOtp(email, cleanCode);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code. Please check your Gmail or click Resend.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError('');
    setResendSuccess('');
    try {
      await api.resendOtp(email);
      setCountdown(60);
      setResendSuccess('A fresh verification code was sent to your Gmail inbox.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Could not resend code. Please try again shortly.');
    } finally {
      setResending(false);
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

          {step === 'signup' ? (
            <>
              <h1 className="text-2xl font-display font-bold text-brand-ink mb-1">Create your workspace</h1>
              <p className="text-xs text-brand-muted text-center">
                Set up your autonomous marketing agent in 30 seconds
              </p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-brand-green grid place-items-center mb-3 ring-8 ring-emerald-50/50">
                <KeyRound size={28} className="animate-pulse text-brand-green" />
              </div>
              <h1 className="text-2xl font-display font-bold text-brand-ink mb-1">Enter verification code</h1>
              <p className="text-xs text-brand-muted text-center max-w-xs">
                We sent a confirmation code to <strong className="text-brand-ink font-semibold">{email}</strong>
              </p>
            </>
          )}
        </div>

        {resendSuccess && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-brand-green shrink-0" />
            <span>{resendSuccess}</span>
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

        {step === 'signup' ? (
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-green text-white font-extrabold py-3.5 rounded-xl hover:bg-brand-green-dark transition flex justify-center items-center gap-2 mt-6 text-xs shadow-sm cursor-pointer disabled:opacity-75"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin" />
                  Sending verification code...
                </span>
              ) : (
                <>
                  <span>Create Account & Send Verification Code</span>
                  <Send size={13} />
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
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="p-4 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl text-xs space-y-1.5 text-center">
              <p className="text-slate-700 leading-relaxed">
                Enter the verification code sent to <strong className="text-brand-ink font-semibold">{email}</strong> to activate your workspace.
              </p>
              <p className="text-[11px] text-slate-500">
                Check your Gmail inbox (or spam folder) for the confirmation code.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-ink mb-1.5 text-center">
                Enter Verification Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={8}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\s+/g, ''))}
                  className="border-2 border-brand-line focus:border-brand-green rounded-xl px-4 py-3.5 w-full text-center text-xl tracking-[0.35em] font-mono font-bold focus:outline-none focus:ring-4 focus:ring-brand-green/20 bg-slate-50/50 text-brand-ink transition placeholder:text-slate-300 placeholder:tracking-normal"
                  placeholder="• • • • • •"
                  disabled={verifyingOtp}
                />
              </div>
              <p className="text-[11px] text-brand-muted text-center mt-1.5">
                Paste or type the code from your Gmail email
              </p>
            </div>

            <button
              type="submit"
              disabled={verifyingOtp || !otpCode.trim()}
              className="w-full bg-brand-green text-white font-extrabold py-3.5 rounded-xl hover:bg-brand-green-dark transition flex justify-center items-center gap-2 text-xs shadow-sm cursor-pointer disabled:opacity-60"
            >
              {verifyingOtp ? (
                <span className="flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin" />
                  Verifying code & launching workspace...
                </span>
              ) : (
                <>
                  <KeyRound size={15} />
                  <span>Verify Code & Launch Workspace</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>

            <div className="pt-2 space-y-3">
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition flex justify-center items-center gap-2 text-xs cursor-pointer border border-slate-200"
              >
                <Mail size={14} />
                <span>Open Gmail Inbox</span>
              </a>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep('signup')}
                  className="text-slate-500 hover:text-slate-800 font-semibold"
                >
                  ← Edit Information
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0 || resending}
                  className="text-brand-green font-bold hover:underline disabled:text-slate-400 disabled:no-underline"
                >
                  {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
                </button>
              </div>
            </div>

            <div className="pt-3 text-center border-t border-slate-100">
              <Link to="/login" className="text-xs text-brand-muted hover:text-brand-green">
                Already confirmed? <span className="font-bold underline text-brand-green">Log in directly ➔</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
