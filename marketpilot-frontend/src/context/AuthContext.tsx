import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../api/client';

interface User {
  id?: string;
  email: string;
  fullName?: string;
  businessName: string;
  targetCountry: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  targetCountry: string;
  setTargetCountry: (country: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, businessName: string, fullName?: string, targetCountry?: string) => Promise<{ requires_verification: boolean; verification_code?: string; message?: string }>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  updateBusinessName: (newBusinessName: string) => void;
  enterDemoMode: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [targetCountry, setTargetCountryState] = useState<string>(
    () => localStorage.getItem('marketpilot_target_country') || 'Pakistan'
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const setTargetCountry = useCallback((country: string) => {
    if (!country || !country.trim()) return;
    const clean = country.trim();
    localStorage.setItem('marketpilot_target_country', clean);
    setTargetCountryState(clean);
    setUser((prev) => (prev ? { ...prev, targetCountry: clean } : null));
  }, []);

  // Check persisted token on mount or handle Supabase email magic-link callback
  useEffect(() => {
    // 1. Detect and handle Supabase email verification / magic-link redirect in URL hash
    try {
      const hash = window.location.hash;
      if (hash && (hash.includes('access_token=') || hash.includes('type=signup') || hash.includes('type=magiclink'))) {
        const hashClean = hash.startsWith('#') ? hash.substring(1) : hash;
        const params = new URLSearchParams(hashClean);
        const hashAccessToken = params.get('access_token');
        const hashRefreshToken = params.get('refresh_token');

        if (hashAccessToken) {
          localStorage.setItem('marketpilot_token', hashAccessToken);
          if (hashRefreshToken) {
            localStorage.setItem('marketpilot_refresh_token', hashRefreshToken);
          }

          // Clean up the hash fragment from address bar cleanly
          window.history.replaceState(null, '', window.location.pathname);

          // Decode JWT payload to retrieve user metadata
          try {
            const parts = hashAccessToken.split('.');
            if (parts.length >= 2) {
              const payloadJson = JSON.parse(atob(parts[1]));
              const userEmail = payloadJson.email || '';
              const userId = payloadJson.sub || '';
              const meta = payloadJson.user_metadata || {};
              const biz = meta.business_name || 'GlowSilk Beauty';
              const fullName = meta.full_name || '';
              const country = meta.target_country || 'Pakistan';

              if (userEmail) localStorage.setItem('marketpilot_email', userEmail);
              if (userId) localStorage.setItem('marketpilot_user_id', userId);
              localStorage.setItem('marketpilot_biz', biz);
              localStorage.setItem('marketpilot_target_country', country);
              if (fullName) localStorage.setItem('marketpilot_full_name', fullName);

              setUser({
                id: userId || undefined,
                email: userEmail,
                fullName,
                businessName: biz,
                targetCountry: country,
              });
              setIsAuthenticated(true);
              return;
            }
          } catch (jwtErr) {
            console.error('Error decoding Supabase token payload:', jwtErr);
          }
        }
      }
    } catch (hashErr) {
      console.error('Error processing Supabase callback hash:', hashErr);
    }

    // 2. Check standard persisted localStorage session
    const token = localStorage.getItem('marketpilot_token');
    const savedEmail = localStorage.getItem('marketpilot_email');
    const savedId = localStorage.getItem('marketpilot_user_id');
    const savedBiz = localStorage.getItem('marketpilot_biz');
    const savedName = localStorage.getItem('marketpilot_full_name');
    const savedCountry = localStorage.getItem('marketpilot_target_country') || 'Pakistan';
    if (token && savedEmail) {
      setUser({
        id: savedId || undefined,
        email: savedEmail,
        fullName: savedName || '',
        businessName: savedBiz || 'GlowSilk Beauty',
        targetCountry: savedCountry,
      });
      setIsAuthenticated(true);
    }
  }, []);

  const updateBusinessName = useCallback((newBusinessName: string) => {
    if (!newBusinessName || !newBusinessName.trim()) return;
    const cleanName = newBusinessName.trim();
    localStorage.setItem('marketpilot_biz', cleanName);
    setUser((prev) => (prev ? { ...prev, businessName: cleanName } : null));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const savedBiz = localStorage.getItem('marketpilot_biz');

    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch (err) {
      console.error('Login connection error:', err);
      throw new Error("We couldn't connect to MarketPilot. Please check your connection and try again.");
    }

    if (!res.ok) {
      let errMsg = 'Invalid email or password. Please check your credentials.';
      try {
        const errJson = await res.json();
        if (errJson.detail) errMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      } catch {}
      throw new Error(errMsg);
    }

    const data = await res.json();
    const token = data.session?.access_token || data.access_token;
    if (!token) {
      throw new Error("We couldn't connect to MarketPilot. Please try again.");
    }

    localStorage.setItem('marketpilot_token', token);
    if (data.session?.refresh_token) {
      localStorage.setItem('marketpilot_refresh_token', data.session.refresh_token);
    }

    const fullName = data.user?.full_name || '';
    const userId = data.user?.id || '';
    const finalBiz = savedBiz || (fullName && !fullName.toLowerCase().includes('admin') ? fullName : 'GlowSilk Beauty');
    const country = data.user?.target_country || localStorage.getItem('marketpilot_target_country') || 'Pakistan';

    localStorage.setItem('marketpilot_email', email);
    if (userId) localStorage.setItem('marketpilot_user_id', userId);
    localStorage.setItem('marketpilot_biz', finalBiz);
    localStorage.setItem('marketpilot_target_country', country);
    if (fullName) localStorage.setItem('marketpilot_full_name', fullName);

    setUser({ id: userId || undefined, email, fullName, businessName: finalBiz, targetCountry: country });
    setIsAuthenticated(true);
  }, []);

  const register = useCallback(async (email: string, password: string, businessName: string, fullName?: string, targetCountry?: string) => {
    const cleanBiz = businessName.trim() || 'GlowSilk Beauty';
    const nameToSend = fullName?.trim() || cleanBiz;
    const countryToSend = targetCountry?.trim() || 'Pakistan';

    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: nameToSend,
          business_name: cleanBiz,
          target_country: countryToSend,
        }),
      });
    } catch (err) {
      console.error('Registration connection error:', err);
      throw new Error("We couldn't connect to MarketPilot. Please check your connection and try again.");
    }

    if (!res.ok) {
      let errMsg = 'Failed to create account. Please check your details and try again.';
      try {
        const errJson = await res.json();
        if (errJson.detail) errMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      } catch {}
      throw new Error(errMsg);
    }

    const data = await res.json();
    const token = data.session?.access_token || data.access_token;
    const savedName = data.user?.full_name || nameToSend;
    const savedCountry = data.user?.target_country || countryToSend;
    const userId = data.user?.id || '';
    localStorage.setItem('marketpilot_email', email);
    if (userId) localStorage.setItem('marketpilot_user_id', userId);
    localStorage.setItem('marketpilot_biz', cleanBiz);
    localStorage.setItem('marketpilot_full_name', savedName);
    localStorage.setItem('marketpilot_target_country', savedCountry);

    const requiresVerification = data.requires_verification !== false;

    // Only set authenticated session if verification is explicitly not required
    if (token && !requiresVerification) {
      localStorage.setItem('marketpilot_token', token);
      if (data.session?.refresh_token) {
        localStorage.setItem('marketpilot_refresh_token', data.session.refresh_token);
      }
      setUser({
        id: userId || undefined,
        email,
        fullName: savedName,
        businessName: cleanBiz,
        targetCountry: savedCountry,
      });
      setIsAuthenticated(true);
    }

    return {
      requires_verification: requiresVerification,
      verification_code: data.verification_code,
      message: data.message,
    };
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });
    } catch (err) {
      console.error('OTP verification connection error:', err);
      throw new Error("We couldn't connect to MarketPilot. Please check your connection and try again.");
    }

    if (!res.ok) {
      let errMsg = 'Invalid or expired verification code. Please check your email or click Resend.';
      try {
        const errJson = await res.json();
        if (errJson.detail) errMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      } catch {}
      throw new Error(errMsg);
    }

    const data = await res.json();
    const authToken = data.session?.access_token || data.access_token;
    if (authToken) {
      localStorage.setItem('marketpilot_token', authToken);
      if (data.session?.refresh_token) {
        localStorage.setItem('marketpilot_refresh_token', data.session.refresh_token);
      }
    }

    const savedBiz = localStorage.getItem('marketpilot_biz') || data.user?.business_name || 'GlowSilk Beauty';
    const fullName = data.user?.full_name || '';
    const userId = data.user?.id || '';
    const country = data.user?.target_country || localStorage.getItem('marketpilot_target_country') || 'Pakistan';

    localStorage.setItem('marketpilot_email', email);
    if (userId) localStorage.setItem('marketpilot_user_id', userId);
    localStorage.setItem('marketpilot_biz', savedBiz);
    localStorage.setItem('marketpilot_target_country', country);
    if (fullName) localStorage.setItem('marketpilot_full_name', fullName);

    setUser({ id: userId || undefined, email, fullName, businessName: savedBiz, targetCountry: country });
    setIsAuthenticated(true);
  }, []);

  // Explicit demo mode (only when user deliberately requests it)
  const enterDemoMode = useCallback(() => {
    const demoToken = 'demo-preview-' + Date.now();
    localStorage.setItem('marketpilot_token', demoToken);
    localStorage.setItem('marketpilot_email', 'demo@marketpilot.ai');
    localStorage.setItem('marketpilot_biz', 'GlowSilk Beauty (Demo)');
    localStorage.setItem('marketpilot_target_country', 'Pakistan');
    setUser({
      email: 'demo@marketpilot.ai',
      fullName: 'Demo User',
      businessName: 'GlowSilk Beauty (Demo)',
      targetCountry: 'Pakistan',
    });
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem('marketpilot_token');
    const refreshToken = localStorage.getItem('marketpilot_refresh_token');

    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            access_token: token,
            refresh_token: refreshToken || token,
          }),
        });
      } catch (err) {
        console.warn('Backend session revocation notification failed:', err);
      }
    }

    localStorage.removeItem('marketpilot_token');
    localStorage.removeItem('marketpilot_refresh_token');
    localStorage.removeItem('marketpilot_email');
    localStorage.removeItem('marketpilot_user_id');
    localStorage.removeItem('marketpilot_full_name');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        targetCountry,
        setTargetCountry,
        login,
        register,
        verifyOtp,
        updateBusinessName,
        enterDemoMode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
