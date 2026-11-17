'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  CreditCard,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Award,
  ShieldCheck,
  Target,
  Sparkles,
  Layers,
  FileCheck2,
  Activity,
  Flame
} from 'lucide-react';
import {
  BatIcon,
  BallIcon,
  AllRounderIcon,
  KeeperIcon
} from '@/components/registration/CricketIcons';
import { formatCurrencyINR } from '@/lib/utils/format';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-green mx-auto" />
        <p className="text-sm font-medium text-brand-muted">Aggregating live tournament telemetry...</p>
      </div>
    );
  }

  const roleStats = stats?.roleStats || { batsman: 0, bowler: 0, all_rounder: 0, wicketkeeper: 0 };
  const verifiedCount = stats?.verifiedPlayersCount || 0;
  const maxCap = stats?.maximumCapacity || 100;
  const progressPct = stats?.capacityProgress || 0;
  const pendingCount = stats?.pendingPaymentsCount || 0;
  const remainingSlots = stats?.remainingSlots ?? (maxCap - verifiedCount);

  return (
    <div className="space-y-6 sm:space-y-7 pb-8">
      {/* ============================================================================== */}
      {/* 1. TOP COMMAND HEADER */}
      {/* ============================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-light-green text-primary-green border border-primary-green/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-green"></span>
              </span>
              Live Telemetry Active
            </span>
            <span className="text-[11px] font-mono text-brand-muted">
              Auto-syncs every 10s
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
            Tournament Control Center
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted">
            Audited financial collections, player slot consumption, and real-time review queues.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-brand-border text-xs font-semibold text-brand-dark transition-all shadow-xs active:scale-95"
            title="Refresh statistics now"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary-green ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <Link
            href="/admin/payments"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-green hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-xs hover:shadow-md active:scale-95"
          >
            <CreditCard className="w-4 h-4" />
            <span>Verify Payments</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-brand-dark text-[10px] font-black leading-none">
                {pendingCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Over-capacity alert if full */}
      {remainingSlots === 0 && verifiedCount >= maxCap && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <h4 className="font-bold text-amber-900">Tournament Quota Reached!</h4>
            <p className="mt-0.5 leading-relaxed text-amber-800">
              The tournament is at 100% capacity with all {maxCap} slots verified. Further payment approvals should be handled cautiously or capacity can be increased in settings.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* 2. SIX HIGH-PRECISION KPI METRIC CARDS */}
      {/* ============================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Card 1: Total Registrations */}
        <div className="group bg-white border border-brand-border hover:border-gray-300 rounded-2xl p-4 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between text-brand-muted mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-brand-muted">
              Total Registrations
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-slate-200/80 flex items-center justify-center text-slate-700 transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
              {stats?.totalRegistrations || 0}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">Profiles</span>
          </div>
          <p className="text-[11px] text-brand-muted mt-1 truncate">
            Submitted applications across all roles
          </p>
        </div>

        {/* Card 2: Verified Players */}
        <div className="group bg-white border border-brand-border hover:border-primary-green/40 rounded-2xl p-4 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between text-brand-muted mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-primary-green">
              Verified Athletes
            </span>
            <div className="w-9 h-9 rounded-xl bg-light-green text-primary-green flex items-center justify-center border border-primary-green/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-primary-green tracking-tight">
              {verifiedCount}
            </span>
            <span className="text-[11px] font-bold text-primary-green/80 font-mono">
              ({progressPct}%)
            </span>
          </div>
          <p className="text-[11px] text-brand-muted mt-1 truncate">
            Confirmed official fee ledger records
          </p>
        </div>

        {/* Card 3: Pending Review */}
        <div className="group bg-white border border-brand-border hover:border-amber-400/60 rounded-2xl p-4 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between text-brand-muted mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-700">
              Pending Verification
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
              {pendingCount}
            </span>
            <span className="text-[11px] font-semibold text-amber-700">Awaiting</span>
          </div>
          <p className="text-[11px] text-brand-muted mt-1 truncate">
            Receipts needing bank cross-check
          </p>
        </div>

        {/* Card 4: Verified Financial Collection */}
        <div className="group bg-white border border-brand-border hover:border-primary-green/40 rounded-2xl p-4 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between text-brand-muted mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700">
              Total Collection
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800 tracking-tight">
              {formatCurrencyINR(stats?.totalCollection || 0)}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 font-mono">INR</span>
          </div>
          <p className="text-[11px] text-brand-muted mt-1 truncate">
            100% verified non-refundable entry fees
          </p>
        </div>

        {/* Card 5: Remaining Slots */}
        <div className="group bg-white border border-brand-border hover:border-blue-300 rounded-2xl p-4 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between text-brand-muted mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-700">
              Slots Remaining
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
              {remainingSlots}
            </span>
            <span className="text-[11px] font-normal text-brand-muted font-mono">/ {maxCap}</span>
          </div>
          <p className="text-[11px] text-brand-muted mt-1 truncate">
            Available registration vacancies
          </p>
        </div>

        {/* Card 6: Rejected Records */}
        <div className="group bg-white border border-brand-border hover:border-red-300 rounded-2xl p-4 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between text-brand-muted mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-red-700">
              Rejected Receipts
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200/60">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-red-600 tracking-tight">
              {stats?.rejectedPaymentsCount || 0}
            </span>
            <span className="text-[11px] font-semibold text-red-600">Disqualified</span>
          </div>
          <p className="text-[11px] text-brand-muted mt-1 truncate">
            Duplicate UTRs or failed audits
          </p>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* 3. TOURNAMENT REGISTRATION CAPACITY COMMAND BAR */}
      {/* ============================================================================== */}
      <div className="bg-white border border-brand-border rounded-2xl p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-brand-dark">
                Tournament Registration Capacity
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-light-green text-primary-green border border-primary-green/20">
                Official Roster Pool
              </span>
            </div>
            <p className="text-xs text-brand-muted mt-0.5">
              Live capacity consumption strictly tied to verified UPI payments.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <div className="px-3.5 py-1.5 rounded-xl bg-light-green border border-primary-green/30 text-primary-green font-bold text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>{verifiedCount} Verified</span>
              <span className="text-primary-green/60">/</span>
              <span className="text-brand-dark font-semibold">{maxCap} Target</span>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-gray-100 text-brand-dark font-extrabold text-xs font-mono">
              {progressPct}% Filled
            </span>
          </div>
        </div>

        {/* Dynamic Multi-Color Progress Gauge */}
        <div className="space-y-1.5">
          <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden p-0.5 ring-1 ring-gray-200/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-green via-emerald-600 to-teal-500 transition-all duration-700 ease-out shadow-xs"
              style={{ width: `${Math.min(100, progressPct)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono text-brand-muted px-1">
            <span>0% (Kickoff)</span>
            <span>25%</span>
            <span>50% (Midway)</span>
            <span>75%</span>
            <span className="font-bold text-brand-dark">100% (Cap: {maxCap})</span>
          </div>
        </div>

        {/* 3 Redesigned Stat Pill Cards (Eliminates the plain gray boxes!) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Box 1 */}
          <div className="p-4 rounded-xl bg-gray-50/80 border border-brand-border flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-slate-700 shrink-0 shadow-xs">
              <Target className="w-5 h-5 text-brand-muted" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted block">
                League Target
              </span>
              <div className="text-lg font-extrabold text-brand-dark leading-tight mt-0.5">
                {maxCap} Players
              </div>
              <span className="text-[10px] text-brand-muted">Maximum capacity setting</span>
            </div>
          </div>

          {/* Box 2 */}
          <div className="p-4 rounded-xl bg-light-green/60 border border-primary-green/30 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-primary-green/20 flex items-center justify-center text-primary-green shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-primary-green" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary-green block">
                Confirmed Squad
              </span>
              <div className="text-lg font-extrabold text-primary-green leading-tight mt-0.5">
                {verifiedCount} Athletes
              </div>
              <span className="text-[10px] text-primary-green font-medium">
                {formatCurrencyINR(stats?.totalCollection || 0)} deposited
              </span>
            </div>
          </div>

          {/* Box 3 */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/60 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                Available Slots
              </span>
              <div className="text-lg font-extrabold text-brand-dark leading-tight mt-0.5">
                {remainingSlots} Remaining
              </div>
              <span className="text-[10px] text-blue-600 font-medium">
                {remainingSlots > 0 ? 'Public registration open' : 'Roster complete'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* 4. ROLE BREAKDOWN & ACTION QUEUES */}
      {/* ============================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Role Breakdown - Professional Cricket Cards */}
        <div className="bg-white border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-brand-dark">Role-Wise Verified Squad</h3>
              <p className="text-xs text-brand-muted">Distribution of paid & confirmed players</p>
            </div>
            <Link
              href="/admin/players"
              className="text-xs font-bold text-primary-green hover:text-primary-dark inline-flex items-center gap-1 transition-colors"
            >
              <span>View Roster</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {[
              {
                role: 'batsman',
                label: 'Batsmen',
                count: roleStats.batsman,
                icon: BatIcon,
                color: 'bg-primary-green',
                border: 'border-primary-green/20',
                badgeBg: 'bg-light-green text-primary-green',
                desc: 'Specialist Top/Middle order'
              },
              {
                role: 'bowler',
                label: 'Bowlers',
                count: roleStats.bowler,
                icon: BallIcon,
                color: 'bg-indigo-600',
                border: 'border-indigo-100',
                badgeBg: 'bg-indigo-50 text-indigo-700',
                desc: 'Pace & spin strike weapons'
              },
              {
                role: 'all_rounder',
                label: 'All-Rounders',
                count: roleStats.all_rounder,
                icon: AllRounderIcon,
                color: 'bg-teal-600',
                border: 'border-teal-100',
                badgeBg: 'bg-teal-50 text-teal-700',
                desc: 'Dual bat & bowl balance'
              },
              {
                role: 'wicketkeeper',
                label: 'Wicketkeepers',
                count: roleStats.wicketkeeper,
                icon: KeeperIcon,
                color: 'bg-amber-600',
                border: 'border-amber-100',
                badgeBg: 'bg-amber-50 text-amber-700',
                desc: 'Glovework & bat finishers'
              }
            ].map(item => {
              const Icon = item.icon;
              const pct = verifiedCount > 0 ? Math.round((item.count / verifiedCount) * 100) : 0;
              return (
                <div
                  key={item.role}
                  className="p-3.5 rounded-xl border border-brand-border bg-gray-50/50 hover:bg-white hover:border-gray-300 transition-all space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white border border-gray-200 text-brand-dark shadow-2xs">
                        <Icon className="w-4 h-4 text-primary-green" />
                      </div>
                      <span className="font-bold text-xs text-brand-dark">{item.label}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${item.badgeBg}`}>
                      {item.count} ({pct}%)
                    </span>
                  </div>

                  {/* Role Mini Progress Bar */}
                  <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`${item.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-brand-muted truncate">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Review & Action Cards */}
        <div className="bg-white border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-brand-dark">Pending Review Actions</h3>
                <p className="text-xs text-brand-muted">Immediate operational tasks requiring audit</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                pendingCount > 0
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-green-100 text-green-800 border border-green-200'
              }`}>
                {pendingCount > 0 ? `${pendingCount} Urgent Items` : 'All Clear'}
              </span>
            </div>

            <div className="space-y-3 pt-3">
              {/* Payment Verification Queue */}
              <div className="p-4 rounded-xl bg-gray-50/70 border border-brand-border hover:bg-white hover:border-gray-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 text-amber-700" />
                    </div>
                    <h4 className="font-bold text-sm text-brand-dark">Payment Verification Queue</h4>
                  </div>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    Verify 12-digit UTR numbers and inspect uploaded UPI receipt screenshots.
                  </p>
                </div>
                <Link
                  href="/admin/payments"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-green hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-center"
                >
                  <span>Verify Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Player Management Roster */}
              <div className="p-4 rounded-xl bg-gray-50/70 border border-brand-border hover:bg-white hover:border-gray-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-light-green text-primary-green flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-primary-green" />
                    </div>
                    <h4 className="font-bold text-sm text-brand-dark">Player Roster & Eligibility</h4>
                  </div>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    Examine player capabilities, filter by role/status, and review player dossiers.
                  </p>
                </div>
                <Link
                  href="/admin/players"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-brand-border bg-white hover:bg-gray-100 text-brand-dark text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-center"
                >
                  <span>Manage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-brand-muted">
            <span className="font-medium">Strict Verification Standard</span>
            <span className="font-mono text-primary-green font-semibold">100% Anti-Fraud Ledger</span>
          </div>
        </div>
      </div>
    </div>
  );
}
