'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Menu,
  X,
  UserPlus,
  HelpCircle,
  Phone,
  Mail,
  MessageCircle
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // If in admin routes, AdminLayout handles its own header and sidebar
  const isAdminRoute = pathname.startsWith('/admin');
  if (isAdminRoute) {
    return null;
  }

  // Pure public links - Admin is strictly isolated and NEVER shown on public navbar
  const navLinks = [
    { label: 'Register Player', href: '/register', icon: UserPlus },
    { label: 'Track Status', href: '/track-status', icon: Search }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand - Clean & Never Wraps on mobile */}
        <Link href="/register" className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-light-green border border-primary-green/20 flex items-center justify-center p-1.5 shadow-2xs shrink-0">
            <img src="/logo.svg" alt="CAL Logo" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight whitespace-nowrap truncate">
                Cricket Auction League
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-light-green text-primary-green border border-primary-green/20 shrink-0">
                2026
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block leading-tight">
              Official Player Registration & Tournament Docket
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 shrink-0">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-light-green text-primary-green border border-primary-green/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setHelpModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-primary-green" />
            <span>Help & Support</span>
          </button>
        </nav>

        {/* Mobile Right Controls: Only Search/Status + Hamburger */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          <Link
            href="/track-status"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
          >
            <Search className="w-3 h-3 text-primary-green" />
            <span>Status</span>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/98 px-4 py-3 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-light-green text-primary-green border border-primary-green/20'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary-green" />
                  <span>{link.label}</span>
                </div>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-primary-green" />}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setHelpModalOpen(true);
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary-green" />
              <span>Help & Support</span>
            </div>
            <span className="text-[10px] text-primary-green font-bold bg-light-green px-2 py-0.5 rounded-full">Helpline</span>
          </button>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>CAL 2026 Official Tournament</span>
            <span className="text-emerald-700 font-semibold">100% Verified</span>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-light-green text-primary-green flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Tournament Committee Helpdesk</h3>
                  <p className="text-[11px] text-slate-400">Official Player Assistance & Support</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Kisi bhi registration, UPI payment ya tournament rules se sambandhit jaankari ke liye seedha committee se sampark karein:
            </p>

            <div className="space-y-2.5 pt-1">
              <a
                href="tel:+919876543210"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-primary-green flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400 font-medium">Helpline Call</span>
                    <span className="font-bold text-xs text-slate-800 group-hover:text-primary-green">+91 98765 43210</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-primary-green bg-light-green px-2.5 py-1 rounded-full">Call Now</span>
              </a>

              <a
                href="https://wa.me/919876543210?text=Hi%2C%20I%20need%20help%20with%20Cricket%20Auction%20League%20registration%20or%20payment"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 fill-white" />
                  </div>
                  <div>
                    <span className="block text-[11px] text-emerald-700 font-medium">WhatsApp Support</span>
                    <span className="font-bold text-xs text-emerald-950">Instant Chat Available</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-white bg-[#25D366] px-2.5 py-1 rounded-full">Chat</span>
              </a>

              <a
                href="mailto:support@cricketauctionleague.com"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400 font-medium">Email Support</span>
                    <span className="font-bold text-xs text-slate-800 group-hover:text-blue-600">support@cricketauctionleague.com</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-600 bg-slate-200/80 px-2.5 py-1 rounded-full">Email</span>
              </a>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
