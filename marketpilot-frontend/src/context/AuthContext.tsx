import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

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

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        // Backend returns access_token inside data.session.access_token
        const token = data.session?.access_token || data.access_token || 'demo-jwt';
        localStorage.setItem('marketpilot_token', token);
        if (data.session?.refresh_token) {
          localStorage.setItem('marketpilot_refresh_token', data.session.refresh_token);
        }

        const fullName = data.user?.full_name || '';
        // Never override an existing business name with a generic user full_name or email
        const finalBiz = savedBiz || (fullName && !fullName.toLowerCase().includes('admin') ? fullName : 'GlowSilk Beauty');

        localStorage.setItem('marketpilot_email', email);
        localStorage.setItem('marketpilot_biz', finalBiz);
        if (fullName) localStorage.setItem('marketpilot_full_name', fullName);

        setUser({ email, fullName, businessName: finalBiz });
        setIsAuthenticated(true);
        return;
      }
    } catch (err) {
      console.warn('Backend login fallback:', err);
    }

    // Demo/offline fallback token
    const demoToken = 'demo-jwt-' + Date.now();
    localStorage.setItem('marketpilot_token', demoToken);
    const finalBiz = savedBiz || 'GlowSilk Beauty';
    localStorage.setItem('marketpilot_email', email);
    localStorage.setItem('marketpilot_biz', finalBiz);
    setUser({ email, businessName: finalBiz });
    setIsAuthenticated(true);
  }, []);

  const register = useCallback(async (email: string, password: string, businessName: string, fullName?: string) => {
    const cleanBiz = businessName.trim() || 'GlowSilk Beauty';
    const nameToSend = fullName?.trim() || cleanBiz;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: nameToSend,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Backend returns access_token inside data.session.access_token
        const token = data.session?.access_token || data.access_token || 'demo-jwt';
        localStorage.setItem('marketpilot_token', token);
        if (data.session?.refresh_token) {
          localStorage.setItem('marketpilot_refresh_token', data.session.refresh_token);
        }

        const savedName = data.user?.full_name || nameToSend;
        localStorage.setItem('marketpilot_email', email);
        localStorage.setItem('marketpilot_biz', cleanBiz);
        localStorage.setItem('marketpilot_full_name', savedName);

        setUser({ email, fullName: savedName, businessName: cleanBiz });
        setIsAuthenticated(true);
        return;
      }
    } catch (err) {
      console.warn('Backend register fallback:', err);
    }

    // Fallback registration
    const demoToken = 'demo-jwt-' + Date.now();
    localStorage.setItem('marketpilot_token', demoToken);
    localStorage.setItem('marketpilot_email', email);
    localStorage.setItem('marketpilot_biz', cleanBiz);
    localStorage.setItem('marketpilot_full_name', nameToSend);
    setUser({ email, fullName: nameToSend, businessName: cleanBiz });
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('marketpilot_token');
    localStorage.removeItem('marketpilot_refresh_token');
    localStorage.removeItem('marketpilot_email');
    localStorage.removeItem('marketpilot_full_name');
    // We do NOT clear marketpilot_biz so the user's workspace brand remains intact on their machine
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, updateBusinessName, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
