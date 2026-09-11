import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../api/client';
import {
  isSessionExpired,
  saveAuthSession,
  clearAuthSession,
  recordUserActivity,
  SESSION_KEYS,
} from '../utils/session';

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
    () => localStorage.getItem(SESSION_KEYS.TARGET_COUNTRY) || 'Pakistan'
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const setTargetCountry = useCallback((country: string) => {
    if (!country || !country.trim()) return;
    const clean = country.trim();
    localStorage.setItem(SESSION_KEYS.TARGET_COUNTRY, clean);
    setTargetCountryState(clean);
    setUser((prev) => (prev ? { ...prev, targetCountry: clean } : null));
  }, []);

  const handleCleanLogout = useCallback((redirectReason?: string) => {
    clearAuthSession(true);
    setUser(null);
    setIsAuthenticated(false);
    if (typeof window !== 'undefined' && redirectReason) {
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/signup') && currentPath !== '/') {
        window.location.href = `/login?reason=${redirectReason}`;
      }
    }
  }, []);

  // 1. Check persisted token on mount or handle Supabase email magic-link callback
  useEffect(() => {
    // Detect and handle Supabase email verification / magic-link redirect in URL hash
    try {
      const hash = window.location.hash;
      if (hash && (hash.includes('access_token=') || hash.includes('type=signup') || hash.includes('type=magiclink'))) {
        const hashClean = hash.startsWith('#') ? hash.substring(1) : hash;
        const params = new URLSearchParams(hashClean);
        const hashAccessToken = params.get('access_token');
        const hashRefreshToken = params.get('refresh_token');

        if (hashAccessToken) {
          saveAuthSession(hashAccessToken, hashRefreshToken || undefined);

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

              if (userEmail) localStorage.setItem(SESSION_KEYS.EMAIL, userEmail);
              if (userId) localStorage.setItem(SESSION_KEYS.USER_ID, userId);
              localStorage.setItem(SESSION_KEYS.BIZ, biz);
              localStorage.setItem(SESSION_KEYS.TARGET_COUNTRY, country);
              if (fullName) localStorage.setItem(SESSION_KEYS.FULL_NAME, fullName);

              setUser({
                id: userId || undefined,
                email: userEmail,
                fullName,
                businessName: biz,
                targetCountry: country,
              });
              setIsAuthenticated(true);
              recordUserActivity();
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

    // Check standard persisted localStorage session
    // FIRST: Check if the session has expired due to time or inactivity
    if (isSessionExpired()) {
      clearAuthSession(false);
      setUser(null);
      setIsAuthenticated(false);
      return;
    }

    const token = localStorage.getItem(SESSION_KEYS.TOKEN);
    const savedEmail = localStorage.getItem(SESSION_KEYS.EMAIL);
    const savedId = localStorage.getItem(SESSION_KEYS.USER_ID);
    const savedBiz = localStorage.getItem(SESSION_KEYS.BIZ);
    const savedName = localStorage.getItem(SESSION_KEYS.FULL_NAME);
    const savedCountry = localStorage.getItem(SESSION_KEYS.TARGET_COUNTRY) || 'Pakistan';

    if (token && savedEmail) {
      setUser({
        id: savedId || undefined,
        email: savedEmail,
        fullName: savedName || '',
        businessName: savedBiz || 'GlowSilk Beauty',
        targetCountry: savedCountry,
      });
      setIsAuthenticated(true);
      recordUserActivity();
    }
  }, []);

  // 2. Active Session Management: Inactivity Detection, Window Focus, Periodic Expiration Check & Cross-Tab Sync
  useEffect(() => {
    // Check expiration when user focuses tab or switches back after days
    const checkExpiration = () => {
      if (isSessionExpired()) {
        const token = localStorage.getItem(SESSION_KEYS.TOKEN);
        if (token) {
          handleCleanLogout('expired');
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        recordUserActivity();
      }
    };

    window.addEventListener('focus', checkExpiration);
    document.addEventListener('visibilitychange', checkExpiration);

    // Periodic check every 30 seconds
    const interval = setInterval(checkExpiration, 30000);

    // User activity listeners (throttled in recordUserActivity)
    const onUserInteraction = () => recordUserActivity();
    window.addEventListener('mousedown', onUserInteraction, { passive: true });
    window.addEventListener('keydown', onUserInteraction, { passive: true });
    window.addEventListener('touchstart', onUserInteraction, { passive: true });
    window.addEventListener('scroll', onUserInteraction, { passive: true });

    // Multi-tab synchronization via storage event
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_KEYS.TOKEN && !e.newValue) {
        setUser(null);
        setIsAuthenticated(false);
      }
      if (e.key === SESSION_KEYS.LOGOUT_BROADCAST) {
        setUser(null);
        setIsAuthenticated(false);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Custom logout event listener
    const handleCustomLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener('marketpilot:logout', handleCustomLogout);

    return () => {
      window.removeEventListener('focus', checkExpiration);
      document.removeEventListener('visibilitychange', checkExpiration);
      clearInterval(interval);
      window.removeEventListener('mousedown', onUserInteraction);
      window.removeEventListener('keydown', onUserInteraction);
      window.removeEventListener('touchstart', onUserInteraction);
      window.removeEventListener('scroll', onUserInteraction);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('marketpilot:logout', handleCustomLogout);
    };
  }, [handleCleanLogout]);

  const updateBusinessName = useCallback((newBusinessName: string) => {
    if (!newBusinessName || !newBusinessName.trim()) return;
    const cleanName = newBusinessName.trim();
    localStorage.setItem(SESSION_KEYS.BIZ, cleanName);
    setUser((prev) => (prev ? { ...prev, businessName: cleanName } : null));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const savedBiz = localStorage.getItem(SESSION_KEYS.BIZ);

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

    saveAuthSession(token, data.session?.refresh_token);

    const fullName = data.user?.full_name || '';
    const userId = data.user?.id || '';
    const finalBiz = savedBiz || (fullName && !fullName.toLowerCase().includes('admin') ? fullName : 'GlowSilk Beauty');
    const country = data.user?.target_country || localStorage.getItem(SESSION_KEYS.TARGET_COUNTRY) || 'Pakistan';

    localStorage.setItem(SESSION_KEYS.EMAIL, email);
    if (userId) localStorage.setItem(SESSION_KEYS.USER_ID, userId);
    localStorage.setItem(SESSION_KEYS.BIZ, finalBiz);
    localStorage.setItem(SESSION_KEYS.TARGET_COUNTRY, country);
    if (fullName) localStorage.setItem(SESSION_KEYS.FULL_NAME, fullName);

    setUser({ id: userId || undefined, email, fullName, businessName: finalBiz, targetCountry: country });
    setIsAuthenticated(true);
    recordUserActivity();
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
    localStorage.setItem(SESSION_KEYS.EMAIL, email);
    if (userId) localStorage.setItem(SESSION_KEYS.USER_ID, userId);
    localStorage.setItem(SESSION_KEYS.BIZ, cleanBiz);
    localStorage.setItem(SESSION_KEYS.FULL_NAME, savedName);
    localStorage.setItem(SESSION_KEYS.TARGET_COUNTRY, savedCountry);

    const requiresVerification = data.requires_verification !== false;

    // Only set authenticated session if verification is explicitly not required
    if (token && !requiresVerification) {
      saveAuthSession(token, data.session?.refresh_token);
      setUser({
        id: userId || undefined,
        email,
        fullName: savedName,
        businessName: cleanBiz,
        targetCountry: savedCountry,
      });
      setIsAuthenticated(true);
      recordUserActivity();
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
      saveAuthSession(authToken, data.session?.refresh_token);
    }

    const savedBiz = localStorage.getItem(SESSION_KEYS.BIZ) || data.user?.business_name || 'GlowSilk Beauty';
    const fullName = data.user?.full_name || '';
    const userId = data.user?.id || '';
    const country = data.user?.target_country || localStorage.getItem(SESSION_KEYS.TARGET_COUNTRY) || 'Pakistan';

    localStorage.setItem(SESSION_KEYS.EMAIL, email);
    if (userId) localStorage.setItem(SESSION_KEYS.USER_ID, userId);
    localStorage.setItem(SESSION_KEYS.BIZ, savedBiz);
    localStorage.setItem(SESSION_KEYS.TARGET_COUNTRY, country);
    if (fullName) localStorage.setItem(SESSION_KEYS.FULL_NAME, fullName);

    setUser({ id: userId || undefined, email, fullName, businessName: savedBiz, targetCountry: country });
    setIsAuthenticated(true);
    recordUserActivity();
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem(SESSION_KEYS.TOKEN);
    const refreshToken = localStorage.getItem(SESSION_KEYS.REFRESH_TOKEN);

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

    handleCleanLogout();
  }, [handleCleanLogout]);

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
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
