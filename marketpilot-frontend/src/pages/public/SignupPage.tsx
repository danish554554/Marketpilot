import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/endpoints';
import { AlertCircle, CheckCircle2, ArrowLeft, Mail, KeyRound, Sparkles, Send, RefreshCw } from 'lucide-react';

export function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Step 1 State
  const [step, setStep] = useState<'signup' | 'verify' | 'verified'>('signup');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 2 Verification State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(45);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (step === 'verify' && resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, resendCountdown]);

  // Handle Step 1: Sign up
  const handleSignupSubmit = async (e: React.FormEvent) => {
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
      // Advance to verification code step
      setStep('verify');
      setResendCountdown(45);
    } catch (err: any) {
      setError(err.message || "We couldn't connect to MarketPilot. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      const newDigits = [...otpDigits];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Step 2: Verify OTP
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otpDigits.join('').trim();
    if (token.length < 4) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.verifyOtp(email, token);
      setStep('verified');
      setTimeout(() => {
        navigate('/login', { state: { email, message: 'Email verified successfully! Please log in.' } });
      }, 1500);
    } catch (err: any) {
      // In development or when using Supabase auto-confirm, allow user to continue to login
      setError(err.response?.data?.detail || 'Invalid or expired code. Please check your email or resend code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    if (resendCountdown > 0 || resending) return;
    setResending(true);
    setError('');

    try {
      await register(email, password, businessName);
      setResendCountdown(45);
    } catch (err: any) {
      setError('Could not resend code. Please check backend connection.');
    } finally {
      setResending(false);
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

          {step === 'signup' && (
            <>
              <h1 className="text-2xl font-display font-bold text-brand-ink mb-1">Create your account</h1>
              <p className="text-xs text-brand-muted">Step 1 of 2: Register your business workspace</p>
            </>
          )}

          {step === 'verify' && (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-brand-green grid place-items-center mb-3">
                <Mail size={24} />
              </div>
              <h1 className="text-2xl font-display font-bold text-brand-ink mb-1">Verify your email</h1>
              <p className="text-xs text-brand-muted text-center max-w-xs">
                We've sent a 6-digit confirmation code to <strong className="text-brand-ink">{email}</strong>
              </p>
            </>
          )}

          {step === 'verified' && (
            <>
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-brand-green grid place-items-center mb-3">
                <CheckCircle2 size={32} />
              </div>
              <h1 className="text-2xl font-display font-bold text-brand-ink mb-1">Email Verified!</h1>
              <p className="text-xs text-brand-muted text-center">
                Redirecting you to the login screen...
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
            <div>
              <strong className="font-bold block mb-0.5">Notice</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Step 1: Initial Registration Form */}
        {step === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-brand-ink mb-1">Business / Brand Name *</label>
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
                placeholder="sarah@glowsilk.com"
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
              className="w-full bg-brand-green text-white font-extrabold py-3.5 rounded-xl hover:bg-brand-green-dark transition flex justify-center items-center gap-2 mt-6 text-xs shadow-sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin" /> Sending verification code...
                </span>
              ) : (
                <>
                  <span>Create Account & Send Code</span>
                  <Send size={13} />
                </>
              )}
            </button>

            <div className="mt-6 text-center text-xs text-brand-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-green font-bold hover:underline">
                Log in
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: 6-Digit Email Verification Form */}
        {step === 'verify' && (
          <form onSubmit={handleVerifySubmit} className="space-y-6">
            <div className="flex justify-center gap-2 sm:gap-2.5 my-4">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center font-display font-extrabold text-xl border-2 border-brand-line rounded-xl focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 focus:outline-none bg-slate-50 focus:bg-white transition-all text-brand-ink"
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-green text-white font-extrabold py-3.5 rounded-xl hover:bg-brand-green-dark transition flex justify-center items-center gap-2 text-xs shadow-sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin" /> Verifying code...
                </span>
              ) : (
                <>
                  <span>Verify Email & Log In</span>
                  <KeyRound size={14} />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep('signup')}
                className="text-slate-500 hover:text-slate-900 font-bold flex items-center gap-1"
              >
                <ArrowLeft size={12} />
                <span>Change Email</span>
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCountdown > 0 || resending}
                className="text-brand-green font-bold hover:underline disabled:text-slate-400 disabled:no-underline"
              >
                {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Verified Success State */}
        {step === 'verified' && (
          <div className="py-6 text-center space-y-3">
            <p className="text-xs text-slate-600">
              Your email address has been verified. You can now log into your marketing workspace.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-brand-green text-white text-xs font-extrabold rounded-xl shadow-sm hover:bg-emerald-700 transition-all"
              >
                <span>Proceed to Login</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
