'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const [supportPhone, setSupportPhone] = useState('+91 98765 43210');
  const [supportWhatsapp, setSupportWhatsapp] = useState('+91 98765 43210');
  const [supportEmail, setSupportEmail] = useState('support@cricketauctionleague.com');

  useEffect(() => {
    setMounted(true);

    // 1. Instant hydration from cached localStorage if present
    try {
      const local = localStorage.getItem('cal_tournament_settings');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.support_phone) setSupportPhone(parsed.support_phone);
        if (parsed.support_whatsapp) setSupportWhatsapp(parsed.support_whatsapp);
        if (parsed.support_email) setSupportEmail(parsed.support_email);
      }
    } catch (e) {}

    // 2. Refresh from server API
    fetch('/api/public/settings', { cache: 'no-store' })
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          if (json.data.support_phone) setSupportPhone(json.data.support_phone);
          if (json.data.support_whatsapp) setSupportWhatsapp(json.data.support_whatsapp);
          if (json.data.support_email) setSupportEmail(json.data.support_email);

          try {
            localStorage.setItem('cal_tournament_settings', JSON.stringify(json.data));
          } catch (e) {}
        }
      })
      .catch(() => {});

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cal_tournament_settings' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.support_phone) setSupportPhone(parsed.support_phone);
          if (parsed.support_whatsapp) setSupportWhatsapp(parsed.support_whatsapp);
          if (parsed.support_email) setSupportEmail(parsed.support_email);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const cleanWhatsapp = (supportWhatsapp || supportPhone || '919876543210').replace(/[^0-9]/g, '');
  const cleanPhone = (supportPhone || '+919876543210').replace(/\s+/g, '');

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
    <>
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
    </header>

    {/* Help & Support Modal - Rendered via React Portal directly into document.body with z-[99999] so it can never be behind any banner or page content */}
    {mounted && helpModalOpen && typeof document !== 'undefined' && createPortal(
      <div
        className="fixed inset-0 z-[99999] bg-slate-950/75 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex min-h-screen items-center justify-center animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget) setHelpModalOpen(false);
        }}
      >
        <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-primary-green" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900">Tournament Committee Helpdesk</h3>
                <p className="text-[11px] text-slate-500">Official Player Assistance</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHelpModalOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Registration, UPI payment ya tournament rules se sambandhit kisi bhi sawaal ke liye committee se sampark karein:
          </p>

          <div className="space-y-2 pt-1">
            <a
              href={`tel:${cleanPhone}`}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Phone Helpline</span>
                  <span className="font-semibold text-xs text-slate-900">{supportPhone}</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">Call</span>
            </a>

            <a
              href={`https://wa.me/${cleanWhatsapp}?text=Hi%2C%20I%20need%20help%20with%20Cricket%20Auction%20League%20registration%20or%20payment`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-primary-green flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">WhatsApp Chat</span>
                  <span className="font-semibold text-xs text-slate-900">{supportWhatsapp}</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-primary-green bg-white border border-emerald-200 px-2.5 py-1 rounded-lg">Chat</span>
            </a>

            <a
              href={`mailto:${supportEmail}`}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Official Email</span>
                  <span className="font-semibold text-xs text-slate-900 break-all">{supportEmail}</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">Email</span>
            </a>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setHelpModalOpen(false)}
              className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
  </>
  );
}
