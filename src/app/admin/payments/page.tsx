'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  Loader2,
  RefreshCw,
  X,
  FileCheck2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { PaymentWithPlayer } from '@/types/payment';
import { formatCurrencyINR, formatDate } from '@/lib/utils/format';

export default function PaymentsAdminPage() {
  const [payments, setPayments] = useState<PaymentWithPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_verification' | 'verified' | 'rejected'>('pending_verification');

  // Preview screenshot modal
  const [previewScreenshot, setPreviewScreenshot] = useState<{ url: string; utr: string; player: string } | null>(null);

  // Rejection modal
  const [rejectingPayment, setRejectingPayment] = useState<PaymentWithPlayer | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const openPaymentScreenshot = async (payment: PaymentWithPlayer) => {
    if (!payment.screenshot_path) return;
    try {
      const response = await fetch('/api/admin/payments/receipt-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenshotPath: payment.screenshot_path })
      });
      const result = await response.json();
      if (!response.ok || !result.success || typeof result.url !== 'string') {
        throw new Error(result.error || 'Could not load payment receipt');
      }
      setPreviewScreenshot({
        url: result.url,
        utr: payment.utr_number,
        player: payment.player.full_name
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to load payment screenshot' });
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let url = '/api/admin/payments';
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (search.trim()) {
        params.append('search', search.trim());
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setPayments(json.data);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, search]);

  const handleVerify = async (payment: PaymentWithPlayer) => {
    if (!confirm(`Confirm verification of ₹${payment.amount} for ${payment.player.full_name} (UTR: ${payment.utr_number})?`)) {
      return;
    }

    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/payments/${payment.id}/verify`, {
        method: 'POST'
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setFeedback({
          type: 'success',
          message: `Payment verified for ${payment.player.full_name}. Tournament slot allocated!`
        });
        // Update in-place
        setPayments(prev =>
          prev.map(p =>
            p.id === payment.id
              ? { ...p, payment_status: 'verified', verified_at: new Date().toISOString() }
              : p
          )
        );
      } else {
        setFeedback({
          type: 'error',
          message: json.error || 'Payment verification failed.'
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error during verification' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPayment || !rejectReason.trim()) return;

    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/payments/${rejectingPayment.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() })
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setFeedback({
          type: 'success',
          message: `Payment for ${rejectingPayment.player.full_name} has been rejected.`
        });
        setPayments(prev =>
          prev.map(p =>
            p.id === rejectingPayment.id
              ? { ...p, payment_status: 'rejected', rejection_reason: rejectReason.trim() }
              : p
          )
        );
        setRejectingPayment(null);
        setRejectReason('');
      } else {
        setFeedback({
          type: 'error',
          message: json.error || 'Failed to reject payment'
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error rejecting payment' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark tracking-tight">
            UPI Payment Verification Queue
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-0.5">
            Audit 12-digit UTR numbers, inspect bank receipt screenshots, and verify tournament capacity.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-brand-border text-xs font-semibold text-brand-dark hover:bg-gray-50 transition-colors shadow-xs self-start"
        >
          <RefreshCw className="w-3.5 h-3.5 text-primary-green" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Alert banner for feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:bg-black/5 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="bg-white border border-brand-border rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl self-start">
            {[
              { id: 'pending_verification', label: 'Pending Verification' },
              { id: 'verified', label: 'Verified' },
              { id: 'rejected', label: 'Rejected' },
              { id: 'all', label: 'All Receipts' }
            ].map(tab => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    active ? 'bg-white text-primary-green shadow-xs' : 'text-brand-muted hover:text-brand-dark'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search UTR, player or reg ID..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-brand-border text-xs text-brand-dark bg-white focus-ring"
            />
          </div>
        </div>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="py-20 text-center space-y-2 bg-white rounded-xl border border-brand-border">
          <Loader2 className="w-7 h-7 animate-spin text-primary-green mx-auto" />
          <p className="text-xs text-brand-muted">Fetching payment verifications...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="py-16 text-center space-y-2 bg-white rounded-xl border border-brand-border p-6">
          <CheckCircle2 className="w-10 h-10 text-primary-green mx-auto mb-1" />
          <p className="text-sm font-semibold text-brand-dark">No payments matching this view</p>
          <p className="text-xs text-brand-muted">All pending entries have been processed or none match search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payments.map(payment => (
            <div
              key={payment.id}
              className="bg-white border border-brand-border rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header: Player Name & Reg ID */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={
                        payment.player.profile_photo_path ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                      }
                      alt={payment.player.full_name}
                      className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-brand-dark truncate">{payment.player.full_name}</h3>
                      <span className="font-mono text-xs font-semibold text-primary-green">
                        {payment.player.registration_id}
                      </span>
                    </div>
                  </div>

                  {payment.payment_status === 'verified' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200 flex-shrink-0">
                      Verified
                    </span>
                  ) : payment.payment_status === 'rejected' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 flex-shrink-0">
                      Rejected
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex-shrink-0">
                      Pending
                    </span>
                  )}
                </div>

                {/* Amount and UTR Bar */}
                <div className="p-3 bg-gray-50 border border-brand-border rounded-lg space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-brand-muted">Amount:</span>
                    <span className="font-bold text-sm text-primary-green">
                      {formatCurrencyINR(payment.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-brand-muted">UTR / Ref:</span>
                    <span className="font-mono font-bold text-brand-dark tracking-wide">
                      {payment.utr_number}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-brand-muted">Submitted:</span>
                    <span className="text-brand-dark">{formatDate(payment.created_at)}</span>
                  </div>
                </div>

                {/* Rejection Reason if applicable */}
                {payment.rejection_reason && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-100 text-red-800 text-xs">
                    <strong>Reason:</strong> {payment.rejection_reason}
                  </div>
                )}

                {/* Screenshot Preview Trigger */}
                <div>
                  <button
                    type="button"
                    onClick={() => openPaymentScreenshot(payment)}
                    className="w-full h-10 rounded-lg border border-brand-border bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-brand-dark flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-primary-green" />
                    <span>Inspect Payment Screenshot</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                {payment.payment_status === 'pending_verification' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleVerify(payment)}
                      disabled={actionLoading}
                      className="flex-1 h-9 rounded-lg bg-primary-green hover:bg-primary-dark text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectingPayment(payment)}
                      disabled={actionLoading}
                      className="px-3 h-9 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </>
                ) : (
                  <div className="w-full text-center text-[11px] text-brand-muted py-1">
                    {payment.payment_status === 'verified'
                      ? `Verified on ${formatDate(payment.verified_at || payment.updated_at)}`
                      : 'Payment rejected by committee'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================================== */}
      {/* SCREENSHOT PREVIEW MODAL */}
      {/* ============================================================================== */}
      {previewScreenshot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl border border-brand-border flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <div>
                <h4 className="font-bold text-sm text-brand-dark">Bank Payment Receipt</h4>
                <p className="text-xs text-brand-muted">
                  {previewScreenshot.player} • UTR: {previewScreenshot.utr}
                </p>
              </div>
              <button
                onClick={() => setPreviewScreenshot(null)}
                className="p-1 rounded-lg text-brand-muted hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex items-center justify-center bg-gray-50">
              <img
                src={previewScreenshot.url}
                alt="Payment Screenshot Receipt"
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm border border-gray-200"
              />
            </div>

            <div className="p-3 border-t border-gray-100 bg-white flex justify-end">
              <button
                onClick={() => setPreviewScreenshot(null)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-brand-dark text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* PAYMENT REJECTION MODAL */}
      {/* ============================================================================== */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRejectSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-brand-border space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-brand-dark">Reject Payment Verification</h3>
                <p className="text-xs text-brand-muted">
                  {rejectingPayment.player.full_name} (UTR: {rejectingPayment.utr_number})
                </p>
              </div>
            </div>

            {feedback?.type === 'error' && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{feedback.message}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. UTR not reflected in bank statement, incorrect amount transferred, blurred or unreadable screenshot"
                className="w-full p-3 rounded-lg border border-brand-border text-xs sm:text-sm text-brand-dark bg-white focus-ring"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingPayment(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 rounded-lg border border-brand-border text-brand-dark font-medium text-xs hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || !rejectReason.trim()}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-60"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>Reject Payment</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

