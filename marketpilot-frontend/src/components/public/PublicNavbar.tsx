import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export function PublicNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-soft py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-brand-green text-xl font-black">◇</span>
            <span className={`font-display font-extrabold text-2xl ${isScrolled ? 'text-brand-ink' : 'text-white'}`}>
              MarketPilot <span className="text-brand-green">AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/features" className={`${isScrolled ? 'text-brand-ink' : 'text-white/90'} hover:text-brand-green font-medium transition-colors`}>Features</Link>
            <Link to="/pricing" className={`${isScrolled ? 'text-brand-ink' : 'text-white/90'} hover:text-brand-green font-medium transition-colors`}>Pricing</Link>
            <Link to="/how-it-works" className={`${isScrolled ? 'text-brand-ink' : 'text-white/90'} hover:text-brand-green font-medium transition-colors`}>How It Works</Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/login" className={`${isScrolled ? 'text-brand-ink' : 'text-white'} hover:text-brand-green font-bold transition-colors`}>
              Log in
            </Link>
            <Link
              to="/signup"
              className="bg-brand-green hover:bg-brand-green-dark text-white rounded-xl px-5 py-2.5 font-bold transition-colors shadow-sm"
            >
              Get Started Free
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`${isScrolled ? 'text-brand-ink' : 'text-white'} p-2`}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-brand-line absolute w-full shadow-lg">
          <div className="px-4 pt-2 pb-6 space-y-4 flex flex-col">
            <Link to="/features" className="text-brand-ink font-medium block py-2" onClick={() => setMobileMenuOpen(false)}>Features</Link>
            <Link to="/pricing" className="text-brand-ink font-medium block py-2" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link to="/how-it-works" className="text-brand-ink font-medium block py-2" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
            <hr className="border-brand-line my-2" />
            <Link to="/login" className="text-brand-ink font-bold block py-2" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
            <Link
              to="/signup"
              className="bg-brand-green text-white rounded-xl px-5 py-2.5 font-bold text-center block mt-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
