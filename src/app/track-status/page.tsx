'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  User,
  Calendar,
  MapPin,
  CreditCard,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { formatDate } from '@/lib/utils/format';

function TrackStatusContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [query, setQuery] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/registrations/${encodeURIComponent(query.trim())}`);
      const json = await res.json();

      if (res.ok && json.data) {
        setPlayer(json.data);
      } else {
        setPlayer(null);
        setError('No player found with that Registration ID. Please check the spelling.');
      }
    } catch (err: any) {
      setError('Failed to search registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      handleSearch();
    }
  }, [initialId]);

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 space-y-6">
      {/* Search Box Card */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark tracking-tight">
            Track Player Registration Status
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            Enter your unique Registration ID (e.g., CAL-2026-000001) to view verification status and review remarks.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. CAL-2026-000001"
              className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-brand-border text-sm font-mono text-brand-dark bg-white focus-ring"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="h-11 px-6 rounded-lg bg-primary-green hover:bg-primary-dark text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Check Status</span>
          </button>
        </form>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Result Display */}
      {player && (
        <div className="bg-white border border-brand-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
          {/* Top Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-brand-border">
                {player.profile_photo_path ? (
                  <img
                    src={player.profile_photo_path}
                    alt={player.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-muted">
                    <User className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-brand-dark">{player.full_name}</h2>
                <span className="font-mono text-xs font-semibold text-primary-green">
                  {player.registration_id}
                </span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Payment Badge */}
              {player.payment?.payment_status === 'verified' ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Payment Verified
                </span>
              ) : player.payment?.payment_status === 'rejected' ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                  <XCircle className="w-3.5 h-3.5" /> Payment Rejected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <Clock className="w-3.5 h-3.5" /> Payment Under Verification
                </span>
              )}

              {/* Registration Status Badge */}
              {player.registration_status === 'approved' ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Registration Approved
                </span>
              ) : player.registration_status === 'rejected' ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                  <XCircle className="w-3.5 h-3.5" /> Registration Rejected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-brand-dark border border-gray-200">
                  <Clock className="w-3.5 h-3.5" /> Under Review
                </span>
              )}
            </div>
          </div>

          {/* Rejection Notice if any */}
          {(player.payment?.rejection_reason || player.rejection_reason) && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs sm:text-sm space-y-1">
              <h4 className="font-bold flex items-center gap-1.5 text-red-700">
                <AlertTriangle className="w-4 h-4" /> Administrator Feedback / Reason
              </h4>
              <p className="leading-relaxed">
                {player.payment?.rejection_reason || player.rejection_reason}
              </p>
            </div>
          )}

          {/* Profile Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-gray-50 border border-brand-border space-y-2">
              <h3 className="font-bold text-brand-dark text-xs uppercase tracking-wider text-primary-green">
                Cricket Profile
              </h3>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-brand-muted">Role</span>
                <span className="font-semibold text-brand-dark capitalize">
                  {player.playing_role?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-brand-muted">Batting Style</span>
                <span className="font-medium text-brand-dark capitalize">
                  {player.batting_style?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-brand-muted">Bowling Arm</span>
                <span className="font-medium text-brand-dark capitalize">
                  {player.bowling_arm?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-brand-muted">Experience</span>
                <span className="font-medium text-brand-dark capitalize">
                  {player.experience_level?.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-brand-border space-y-2">
              <h3 className="font-bold text-brand-dark text-xs uppercase tracking-wider text-primary-green">
                Payment Verification
              </h3>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-brand-muted">Registration Fee</span>
                <span className="font-semibold text-brand-dark">₹{player.payment?.amount ?? '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-brand-muted">UTR Reference</span>
                <span className="font-mono font-medium text-brand-dark">
                  {player.payment?.utr_number || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-brand-muted">Submission Date</span>
                <span className="font-medium text-brand-dark">{formatDate(player.created_at)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-brand-muted">Payment Method</span>
                <span className="font-medium text-brand-dark">UPI</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackStatusPage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Navbar />
      <main className="flex-1 px-4">
        <Suspense fallback={<div className="p-12 text-center text-sm text-brand-muted">Loading tracker...</div>}>
          <TrackStatusContent />
        </Suspense>
      </main>
      <MobileBottomNav />
    </div>
  );
}

