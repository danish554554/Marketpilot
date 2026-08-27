import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { SignupPage } from './pages/public/SignupPage';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { PricingPage } from './pages/public/PricingPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { ContactSalesPage } from './pages/public/ContactSalesPage';
import { AboutPage } from './pages/public/AboutPage';
import { BlogPage } from './pages/public/BlogPage';
import { CareersPage } from './pages/public/CareersPage';
import { PrivacyPolicyPage } from './pages/public/PrivacyPolicyPage';
import { TermsPage } from './pages/public/TermsPage';
import { App as Dashboard } from './App';

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CurrencyProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/contact" element={<ContactSalesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Protected Dashboard Route */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
