'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  Printer,
  ArrowRight,
  UserPlus,
  Search
} from 'lucide-react';
import { formatCurrencyINR } from '@/lib/utils/format';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const regId = searchParams.get('id') || 'CAL-2026-000001';
  const [copied, setCopied] = useState(false);
  const [playerData, setPlayerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fire festive celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#176B45', '#237A57', '#EAF5EE', '#16A34A']
      });
    } catch {
      // ignore
    }

    // Fetch details
    fetch(`/api/registrations/${encodeURIComponent(regId)}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setPlayerData(json.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [regId]);

  const copyId = () => {
    navigator.clipboard.writeText(regId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const printSlip = () => {
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 space-y-6">
      {/* Success Card */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header Icon & Title */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-light-green text-primary-green flex items-center justify-center flex-shrink-0 shadow-sm border border-primary-green/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-light-green text-primary-green border border-primary-green/20 mb-1">
              Submission Received
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark tracking-tight">
              Registration Submitted Successfully!
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted mt-1">
              Your official player docket has been created and placed in the tournament review queue.
            </p>
          </div>
        </div>

        {/* Primary Docket Details Box */}
        <div className="bg-gray-50 border border-brand-border rounded-xl p-4 sm:p-5 space-y-3.5">
          {/* Registration ID Banner */}
          <div className="flex items-center justify-between bg-white border border-brand-border p-3.5 rounded-lg shadow-xs">
            <div>
              <span className="text-xs text-brand-muted block font-medium">Your Registration ID</span>
              <span className="text-base sm:text-xl font-mono font-bold text-primary-green tracking-wide">
                {regId}
              </span>
            </div>
            <button
              onClick={copyId}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-light-green text-primary-green border border-primary-green/30 hover:bg-primary-green hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy ID
                </>
              )}
            </button>
          </div>

          {/* Details Table */}
          <div className="space-y-2.5 text-xs sm:text-sm pt-1">
            <div className="flex justify-between items-center py-1 border-b border-gray-200">
              <span className="text-brand-muted">Player Name</span>
              <span className="font-semibold text-brand-dark">{playerData?.full_name || 'Registered Player'}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-gray-200">
              <span className="text-brand-muted">Playing Role</span>
              <span className="font-semibold text-brand-dark capitalize">
                {playerData?.playing_role?.replace('_', ' ') || 'Player'}
              </span>
            </div>

            <div className="flex justify-between items-center gap-3 rounded-lg border border-primary-green/20 bg-light-green/50 px-3 py-2.5">
              <div className="min-w-0">
                <span className="text-brand-muted block">Registration Fee</span>
                <span className="text-[11px] text-brand-muted">UPI payment · awaiting verification</span>
              </div>
              <span className="shrink-0 inline-flex items-center rounded-full bg-white px-3 py-1.5 font-bold text-primary-green shadow-xs">
                {loading ? 'Loading…' : formatCurrencyINR(Number(playerData?.payment?.amount ?? playerData?.registration_fee ?? 0))}
              </span>
            </div>

            {playerData?.payment?.utr_number && (
              <div className="flex justify-between items-center py-1 border-b border-gray-200">
                <span className="text-brand-muted">UTR Reference</span>
                <span className="font-mono font-medium text-brand-dark">{playerData.payment.utr_number}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-1 border-b border-gray-200">
              <span className="text-brand-muted">Payment Verification Status</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                <Clock className="w-3 h-3" /> Pending Verification
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-brand-muted">Registration Status</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-brand-dark">
                Under Review
              </span>
            </div>
          </div>
        </div>

        {/* Verification Note */}
        <div className="p-3.5 rounded-xl bg-light-green/60 border border-primary-green/20 text-primary-green flex items-start gap-2.5 text-xs sm:text-sm">
          <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary-green" />
          <p className="leading-relaxed">
            <strong>Next Steps:</strong> The tournament administrative committee is reviewing your UTR reference and payment screenshot. Verification typically completes within <strong>2–4 hours</strong>. Save your Registration ID to check status anytime.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={printSlip}
            className="flex-1 h-11 rounded-lg border border-brand-border bg-white hover:bg-gray-50 text-brand-dark font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4 text-brand-muted" />
            <span>Print Confirmation Slip</span>
          </button>

          <Link
            href={`/track-status?id=${encodeURIComponent(regId)}`}
            className="flex-1 h-11 rounded-lg bg-primary-green hover:bg-primary-dark text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Search className="w-4 h-4" />
            <span>Track My Status</span>
          </Link>
        </div>

        <div className="text-center pt-2">
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 text-xs text-brand-muted hover:text-primary-green transition-colors font-medium"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register another player</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegistrationSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Navbar />
      <main className="flex-1 px-4">
        <Suspense fallback={<div className="p-12 text-center text-sm text-brand-muted">Loading confirmation...</div>}>
          <SuccessContent />
        </Suspense>
      </main>
      <MobileBottomNav />
    </div>
  );
}

