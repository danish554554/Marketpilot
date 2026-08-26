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
        businessName: savedBiz || 'My Business',
      });
      setIsAuthenticated(true);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
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
        const derivedBiz = localStorage.getItem('marketpilot_biz') || fullName || (email.split('@')[0] + ' E-Commerce');

        localStorage.setItem('marketpilot_email', email);
        localStorage.setItem('marketpilot_biz', derivedBiz);
        if (fullName) localStorage.setItem('marketpilot_full_name', fullName);

        setUser({ email, fullName, businessName: derivedBiz });
        setIsAuthenticated(true);
        return;
      }
    } catch (err) {
      console.warn('Backend login fallback:', err);
    }

    // Demo/offline fallback token
    const demoToken = 'demo-jwt-' + Date.now();
    localStorage.setItem('marketpilot_token', demoToken);
    const derivedBiz = localStorage.getItem('marketpilot_biz') || (email.includes('@') ? email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' E-Commerce' : 'My Store');
    localStorage.setItem('marketpilot_email', email);
    localStorage.setItem('marketpilot_biz', derivedBiz);
    setUser({ email, businessName: derivedBiz });
    setIsAuthenticated(true);
  }, []);

  const register = useCallback(async (email: string, password: string, businessName: string, fullName?: string) => {
    const nameToSend = fullName?.trim() || businessName?.trim() || email.split('@')[0];
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
        localStorage.setItem('marketpilot_biz', businessName || savedName);
        localStorage.setItem('marketpilot_full_name', savedName);

        setUser({ email, fullName: savedName, businessName: businessName || savedName });
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
    localStorage.setItem('marketpilot_biz', businessName || nameToSend);
    localStorage.setItem('marketpilot_full_name', nameToSend);
    setUser({ email, fullName: nameToSend, businessName: businessName || nameToSend });
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('marketpilot_token');
    localStorage.removeItem('marketpilot_refresh_token');
    localStorage.removeItem('marketpilot_email');
    localStorage.removeItem('marketpilot_biz');
    localStorage.removeItem('marketpilot_full_name');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
