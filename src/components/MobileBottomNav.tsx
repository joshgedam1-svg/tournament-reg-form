'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserPlus, Search, MessageCircle } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on admin routes (AdminLayout has its own responsive sidebar/drawer)
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1.5 px-4 flex justify-around items-center shadow-lg safe-bottom">
      <Link
        href="/register"
        className={`flex flex-col items-center gap-0.5 py-1 px-5 rounded-xl text-[10px] font-semibold transition-colors ${
          pathname === '/register'
            ? 'text-primary-green'
            : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <div className={`p-1 rounded-md ${pathname === '/register' ? 'bg-light-green text-primary-green' : ''}`}>
          <UserPlus className="w-4 h-4" />
        </div>
        <span>Register</span>
      </Link>

      <Link
        href="/track-status"
        className={`flex flex-col items-center gap-0.5 py-1 px-5 rounded-xl text-[10px] font-semibold transition-colors ${
          pathname === '/track-status'
            ? 'text-primary-green'
            : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <div className={`p-1 rounded-md ${pathname === '/track-status' ? 'bg-light-green text-primary-green' : ''}`}>
          <Search className="w-4 h-4" />
        </div>
        <span>Track Status</span>
      </Link>

      <a
        href="https://wa.me/919876543210?text=Hi%2C%20I%20need%20help%20with%20Cricket%20Auction%20League%20registration%20or%20payment"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-0.5 py-1 px-5 rounded-xl text-[10px] font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <div className="p-1 rounded-md text-emerald-600">
          <MessageCircle className="w-4 h-4" />
        </div>
        <span>Support</span>
      </a>
    </nav>
  );
}
