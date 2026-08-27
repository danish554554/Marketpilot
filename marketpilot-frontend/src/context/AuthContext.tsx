import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../api/client';

interface User {
  id?: string;
  email: string;
  fullName?: string;
  businessName: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, businessName: string, fullName?: string) => Promise<void>;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check persisted token on mount
  useEffect(() => {
    const token = localStorage.getItem('marketpilot_token');
    const savedEmail = localStorage.getItem('marketpilot_email');
    const savedBiz = localStorage.getItem('marketpilot_biz');
    const savedName = localStorage.getItem('marketpilot_full_name');
    if (token && savedEmail) {
      setUser({
        email: savedEmail,
        fullName: savedName || '',
        businessName: savedBiz || 'GlowSilk Beauty',
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
    const finalBiz = savedBiz || (fullName && !fullName.toLowerCase().includes('admin') ? fullName : 'GlowSilk Beauty');

    localStorage.setItem('marketpilot_email', email);
    localStorage.setItem('marketpilot_biz', finalBiz);
    if (fullName) localStorage.setItem('marketpilot_full_name', fullName);

    setUser({ email, fullName, businessName: finalBiz });
    setIsAuthenticated(true);
  }, []);

  const register = useCallback(async (email: string, password: string, businessName: string, fullName?: string) => {
    const cleanBiz = businessName.trim() || 'GlowSilk Beauty';
    const nameToSend = fullName?.trim() || cleanBiz;

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
    localStorage.setItem('marketpilot_email', email);
    localStorage.setItem('marketpilot_biz', cleanBiz);
    localStorage.setItem('marketpilot_full_name', savedName);

    // If session is returned (e.g. email confirmations disabled on Supabase), save token
    if (token) {
      localStorage.setItem('marketpilot_token', token);
      if (data.session?.refresh_token) {
        localStorage.setItem('marketpilot_refresh_token', data.session.refresh_token);
      }
    }
  }, []);

  // Explicit demo mode (only when user deliberately requests it)
  const enterDemoMode = useCallback(() => {
    const demoToken = 'demo-preview-' + Date.now();
    localStorage.setItem('marketpilot_token', demoToken);
    localStorage.setItem('marketpilot_email', 'demo@marketpilot.ai');
    localStorage.setItem('marketpilot_biz', 'GlowSilk Beauty (Demo)');
    setUser({ email: 'demo@marketpilot.ai', fullName: 'Demo User', businessName: 'GlowSilk Beauty (Demo)' });
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
    localStorage.removeItem('marketpilot_full_name');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, updateBusinessName, enterDemoMode, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
