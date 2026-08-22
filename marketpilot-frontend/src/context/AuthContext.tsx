import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface User {
  email: string;
  businessName: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, businessName: string) => Promise<void>;
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
    if (token && savedEmail) {
      setUser({ email: savedEmail, businessName: savedBiz || 'My Business' });
      setIsAuthenticated(true);
    }
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    // Attempt backend login; fall back to local demo
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: _password }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('marketpilot_token', data.access_token || 'demo-jwt');
      } else {
        // Offline / wrong creds — use demo token
        localStorage.setItem('marketpilot_token', 'demo-jwt-' + Date.now());
      }
    } catch {
      localStorage.setItem('marketpilot_token', 'demo-jwt-' + Date.now());
    }
    localStorage.setItem('marketpilot_email', email);
    localStorage.setItem('marketpilot_biz', 'GlowSilk Beauty');
    setUser({ email, businessName: 'GlowSilk Beauty' });
    setIsAuthenticated(true);
  }, []);

  const register = useCallback(async (email: string, _password: string, businessName: string) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: _password, business_name: businessName }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('marketpilot_token', data.access_token || 'demo-jwt');
      } else {
        localStorage.setItem('marketpilot_token', 'demo-jwt-' + Date.now());
      }
    } catch {
      localStorage.setItem('marketpilot_token', 'demo-jwt-' + Date.now());
    }
    localStorage.setItem('marketpilot_email', email);
    localStorage.setItem('marketpilot_biz', businessName);
    setUser({ email, businessName });
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('marketpilot_token');
    localStorage.removeItem('marketpilot_email');
    localStorage.removeItem('marketpilot_biz');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
