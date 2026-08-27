import React from 'react';
import { Link } from 'react-router-dom';

export function PublicFooter() {
  return (
    <footer className="bg-brand-navy text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="text-brand-green-light text-xl font-black">◇</span>
              <span className="font-display font-extrabold text-2xl text-white">
                MarketPilot <span className="text-brand-green-light">AI</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              The intelligent operating system for modern marketing teams. Plan, execute, and analyze campaigns with AI.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 text-white">Product</h3>
            <ul className="space-y-3">
              <li><Link to="/features" className="text-gray-400 hover:text-white transition-colors text-sm">Features</Link></li>
              <li><Link to="/pricing" className="text-gray-400 hover:text-white transition-colors text-sm">Pricing</Link></li>
              <li><Link to="/how-it-works" className="text-gray-400 hover:text-white transition-colors text-sm">How It Works</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">Contact Sales</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 text-white">Company</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors text-sm">About Us</Link></li>
              <li><Link to="/blog" className="text-gray-400 hover:text-white transition-colors text-sm">Blog & Playbooks</Link></li>
              <li><Link to="/careers" className="text-gray-400 hover:text-white transition-colors text-sm">Careers</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 text-white">Legal & Trust</h3>
            <ul className="space-y-3">
              <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p className="text-center md:text-left">
            &copy; 2026 MarketPilot AI. All rights reserved. Powered by Google Gemini 3.6 Flash.
          </p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Link to="/privacy" className="hover:text-gray-300">Privacy</Link>
            <Link to="/terms" className="hover:text-gray-300">Terms</Link>
            <Link to="/contact" className="hover:text-gray-300">Enterprise</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
