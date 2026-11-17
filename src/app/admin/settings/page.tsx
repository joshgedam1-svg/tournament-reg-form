'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  QrCode,
  CreditCard,
  Users,
  ShieldCheck,
  Power,
  Upload,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  Calendar,
  Clock,
  Eye,
  Trophy,
  Phone,
  MessageCircle,
  Mail,
  Maximize2
} from 'lucide-react';
import QRCodeDisplay from '@/components/registration/QRCodeDisplay';
import { TournamentSettingsRow } from '@/types/settings';

const BANNER_PRESETS = [
  {
    name: 'Stadium Floodlights (Night Match)',
    url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80'
  },
  {
    name: 'Cricket Pitch & Leather Ball',
    url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&auto=format&fit=crop&q=80'
  },
  {
    name: 'Championship Stadium Arena',
    url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80'
  }
];

export default function TournamentSettingsPage() {
  const [settings, setSettings] = useState<TournamentSettingsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Core Form states
  const [tournamentName, setTournamentName] = useState('');
  const [registrationFee, setRegistrationFee] = useState(500);
  const [upiId, setUpiId] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [instructions, setInstructions] = useState('');
  const [upiQrPath, setUpiQrPath] = useState<string | null>(null);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [qrFileName, setQrFileName] = useState<string | null>(null);

  // New: Registration Schedule (Start & End Date)
  const [startDate, setStartDate] = useState('2026-01-01T00:00');
  const [endDate, setEndDate] = useState('2027-12-31T23:59');

  // New: Tournament Banner Settings
  const [bannerPath, setBannerPath] = useState<string | null>(BANNER_PRESETS[0].url);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerFileName, setBannerFileName] = useState<string | null>(null);

  // New: Helpline & Player Support Contact
  const [supportPhone, setSupportPhone] = useState('+91 98765 43210');
  const [supportWhatsapp, setSupportWhatsapp] = useState('+91 98765 43210');
  const [supportEmail, setSupportEmail] = useState('support@cricketauctionleague.com');

  const fetchSettings = async () => {
    // 1. Immediately hydrate from localStorage if present
    let hasLocal = false;
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('cal_tournament_settings');
        if (local) {
          const parsed = JSON.parse(local);
          hasLocal = true;
          if (parsed.tournament_name) setTournamentName(parsed.tournament_name);
          if (parsed.registration_fee !== undefined) setRegistrationFee(parsed.registration_fee);
          if (parsed.upi_id) setUpiId(parsed.upi_id);
          if (parsed.maximum_player_capacity !== undefined) setCapacity(parsed.maximum_player_capacity);
          if (parsed.registration_open !== undefined) setRegistrationOpen(parsed.registration_open);
          if (parsed.registration_instructions) setInstructions(parsed.registration_instructions);
          if (parsed.upi_qr_path) setUpiQrPath(parsed.upi_qr_path);
          if (parsed.registration_start_date) setStartDate(parsed.registration_start_date.substring(0, 16));
          if (parsed.registration_end_date) setEndDate(parsed.registration_end_date.substring(0, 16));
          if (parsed.banner_image_path) setBannerPath(parsed.banner_image_path);
          if (parsed.banner_title) setBannerTitle(parsed.banner_title);
          if (parsed.banner_subtitle) setBannerSubtitle(parsed.banner_subtitle);
          if (parsed.banner_enabled !== undefined) setBannerEnabled(parsed.banner_enabled);
          if (parsed.support_phone) setSupportPhone(parsed.support_phone);
          if (parsed.support_whatsapp) setSupportWhatsapp(parsed.support_whatsapp);
          if (parsed.support_email) setSupportEmail(parsed.support_email);
        }
      } catch (e) {}
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const json = await res.json();
      if (json.success && json.data) {
        const d: TournamentSettingsRow = json.data;
        setSettings(d);

        // Only overwrite inputs from API if localStorage does not already have user's saved data
        if (!hasLocal) {
          if (d.tournament_name) setTournamentName(d.tournament_name);
          if (d.registration_fee !== undefined) setRegistrationFee(d.registration_fee);
          if (d.upi_id) setUpiId(d.upi_id);
          if (d.maximum_player_capacity !== undefined) setCapacity(d.maximum_player_capacity);
          if (d.registration_open !== undefined) setRegistrationOpen(d.registration_open);
          if (d.registration_instructions !== undefined) setInstructions(d.registration_instructions || '');
          if (d.upi_qr_path !== undefined) setUpiQrPath(d.upi_qr_path || null);

          // Schedule dates format to datetime-local compatible (YYYY-MM-DDTHH:mm)
          if (d.registration_start_date) {
            const s = d.registration_start_date.substring(0, 16);
            setStartDate(s);
          }
          if (d.registration_end_date) {
            const e = d.registration_end_date.substring(0, 16);
            setEndDate(e);
          }

          // Banner fields
          if (d.banner_image_path) setBannerPath(d.banner_image_path);
          if (d.banner_title) setBannerTitle(d.banner_title);
          if (d.banner_subtitle) setBannerSubtitle(d.banner_subtitle);
          if (d.banner_enabled !== undefined) setBannerEnabled(d.banner_enabled);

          // Support contacts
          if (d.support_phone) setSupportPhone(d.support_phone);
          if (d.support_whatsapp) setSupportWhatsapp(d.support_whatsapp);
          if (d.support_email) setSupportEmail(d.support_email);
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('QR image file size must be less than 5 MB');
      return;
    }

    setUploadingQr(true);
    try {
      const data = new FormData();
      data.append('file', file);

      const res = await fetch('/api/uploads/tournament-qr', {
        method: 'POST',
        body: data
      });

      const json = await res.json();
      if (res.ok && json.filePath) {
        setUpiQrPath(json.filePath);
        setQrFileName(json.fileName || file.name);
        setFeedback({
          type: 'success',
          message: 'Custom QR code uploaded successfully! Click "Save Tournament Settings" below to apply it live.'
        });
      } else {
        alert(json.error || 'Failed to upload QR code image');
      }
    } catch (err) {
      console.error('Failed to upload QR code:', err);
      alert('Failed to upload QR image. Please try again.');
    } finally {
      setUploadingQr(false);
    }
  };

  const removeCustomQr = () => {
    setUpiQrPath(null);
    setQrFileName(null);
    setFeedback({
      type: 'success',
      message: 'Reverted to auto-generated dynamic UPI QR code. Click "Save Tournament Settings" to confirm.'
    });
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Banner image file size must be less than 10 MB');
      return;
    }

    setUploadingBanner(true);
    try {
      const data = new FormData();
      data.append('file', file);

      const res = await fetch('/api/uploads/tournament-banner', {
        method: 'POST',
        body: data
      });

      const json = await res.json();
      if (res.ok && json.filePath) {
        setBannerPath(json.filePath);
        setBannerFileName(json.fileName || file.name);
        setFeedback({
          type: 'success',
          message: 'Tournament banner image uploaded successfully! Click "Save Tournament Settings" below to apply it live.'
        });
      } else {
        alert(json.error || 'Failed to upload banner image');
      }
    } catch (err) {
      console.error('Failed to upload banner:', err);
      alert('Failed to upload banner image. Please try again.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const removeCustomBanner = () => {
    setBannerPath(BANNER_PRESETS[0].url);
    setBannerFileName(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const payload = {
        tournament_name: tournamentName.trim(),
        registration_fee: Number(registrationFee),
        upi_id: upiId.trim(),
        maximum_player_capacity: Number(capacity),
        registration_open: registrationOpen,
        registration_instructions: instructions.trim(),
        upi_qr_path: upiQrPath,
        registration_start_date: startDate ? new Date(startDate).toISOString() : null,
        registration_end_date: endDate ? new Date(endDate).toISOString() : null,
        banner_image_path: bannerPath,
        banner_title: bannerTitle.trim() || tournamentName.trim(),
        banner_subtitle: bannerSubtitle.trim(),
        banner_enabled: bannerEnabled,
        support_phone: supportPhone.trim(),
        support_whatsapp: supportWhatsapp.trim(),
        support_email: supportEmail.trim()
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cal_tournament_settings', JSON.stringify(payload));
        } catch (e) {}
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({
          type: 'success',
          message: 'Tournament schedule, banner & settings updated successfully across live website!'
        });
      } else {
        setFeedback({ type: 'error', message: json.error || 'Failed to update settings' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error updating settings' });
    } finally {
      setSaving(false);
    }
  };

  // Schedule status evaluation
  const now = new Date();
  const startObj = startDate ? new Date(startDate) : null;
  const endObj = endDate ? new Date(endDate) : null;
  const isBeforeStart = startObj && now < startObj;
  const isAfterEnd = endObj && now > endObj;
  const isScheduleActive = (!isBeforeStart && !isAfterEnd);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary-green mx-auto" />
        <p className="text-sm text-brand-muted">Loading settings configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark tracking-tight">
          Tournament Settings & Portal Configuration
        </h1>
        <p className="text-xs sm:text-sm text-brand-muted mt-0.5">
          Configure tournament dates, custom public banner, UPI payment gateway, QR code, and registration status.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm flex items-center gap-2.5 transition-all ${
            feedback.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* ============================================================================== */}
        {/* 1. REGISTRATION MASTER SWITCH */}
        {/* ============================================================================== */}
        <div
          className={`p-5 rounded-2xl border transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
            registrationOpen
              ? 'bg-light-green/60 border-primary-green/30'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                registrationOpen ? 'bg-primary-green text-white' : 'bg-red-600 text-white'
              }`}
            >
              <Power className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-brand-dark">
                Registration Status:{' '}
                <span className={registrationOpen ? 'text-primary-green' : 'text-red-600'}>
                  {registrationOpen ? 'OPEN (Accepting Submissions)' : 'CLOSED (Paused)'}
                </span>
              </h3>
              <p className="text-xs text-brand-muted">
                {registrationOpen
                  ? 'Players can currently register and submit UPI receipts on the public portal.'
                  : 'Public registration form is locked. Visitors will see a registration closed notice.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRegistrationOpen(!registrationOpen)}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs shrink-0 ${
              registrationOpen
                ? 'bg-red-100 hover:bg-red-200 text-red-700'
                : 'bg-primary-green hover:bg-primary-dark text-white'
            }`}
          >
            {registrationOpen ? 'Close Registrations' : 'Re-open Registrations'}
          </button>
        </div>

        {/* ============================================================================== */}
        {/* 2. REGISTRATION TIMELINE & DATES (START & END DATE) */}
        {/* ============================================================================== */}
        <div className="bg-white border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-sm text-brand-dark uppercase tracking-wide flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-green" />
                <span>Registration Schedule & Deadlines</span>
              </h2>
              <p className="text-xs text-brand-muted mt-0.5">
                Set when player registrations open and when they automatically close.
              </p>
            </div>

            {/* Schedule Status Badge */}
            <div className="shrink-0">
              {isBeforeStart ? (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Upcoming (Not Started)
                </span>
              ) : isAfterEnd ? (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                  Deadline Passed (Expired)
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Active in Schedule
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Date & Time */}
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary-green" />
                <span>Registration Start Date & Time</span>
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-dark bg-white focus-ring"
              />
              <span className="text-[11px] text-brand-muted mt-1 block">
                Public users will see a countdown until this time.
              </span>
            </div>

            {/* End Date & Time */}
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-red-600" />
                <span>Registration End Date & Time (Deadline)</span>
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-dark bg-white focus-ring"
              />
              <span className="text-[11px] text-brand-muted mt-1 block">
                Registrations will automatically disable once this date/time arrives.
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================================== */}
        {/* 3. TOURNAMENT BANNER & BRANDING CONFIGURATION */}
        {/* ============================================================================== */}
        <div className="bg-white border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-sm text-brand-dark uppercase tracking-wide flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary-green" />
                <span>Tournament Hero Banner</span>
              </h2>
              <p className="text-xs text-brand-muted mt-0.5">
                Upload your custom league banner image or choose a high-resolution cricket theme.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bannerEnabled}
                onChange={e => setBannerEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-primary-green focus:ring-primary-green"
              />
              <span className="text-xs font-semibold text-brand-dark">Show Banner on Public Form</span>
            </label>
          </div>

          {/* Banner Live Preview Card */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-brand-dark uppercase tracking-wider block">
              Live Banner Preview
            </span>
            <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-200 min-h-[160px] sm:min-h-[200px] flex items-end p-5 sm:p-6 bg-slate-900">
              {bannerPath && (
                <img
                  src={bannerPath}
                  alt="Tournament Banner"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = BANNER_PRESETS[0].url;
                  }}
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
              )}
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

              {/* Banner Foreground Content */}
              <div className="relative z-10 w-full text-white space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-green text-white uppercase tracking-wider">
                    Official Tournament
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-xs text-white">
                    ₹{registrationFee} Fee
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-xs text-white">
                    Max {capacity} Players
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white drop-shadow-sm">
                  {bannerTitle || tournamentName || 'Cricket Auction League 2026'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 max-w-xl">
                  {bannerSubtitle || 'Grand Season Registration • Form Your Legacy on the Pitch'}
                </p>
              </div>
            </div>
          </div>

          {/* Banner Customization Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">
                Banner Headline / Title
              </label>
              <input
                type="text"
                value={bannerTitle}
                onChange={e => setBannerTitle(e.target.value)}
                placeholder="Cricket Auction League 2026"
                className="w-full h-11 px-3.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-dark bg-white focus-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">
                Banner Subtitle / Tagline
              </label>
              <input
                type="text"
                value={bannerSubtitle}
                onChange={e => setBannerSubtitle(e.target.value)}
                placeholder="Grand Season Registration • Form Your Legacy on the Pitch"
                className="w-full h-11 px-3.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-dark bg-white focus-ring"
              />
            </div>
          </div>

          {/* Banner Image Upload & Preset selector */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <label className="block text-xs font-bold text-brand-dark">
              Custom Banner Image (Upload your own or select a theme)
            </label>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              {/* File Uploader */}
              <label className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 hover:border-primary-green rounded-xl cursor-pointer bg-white hover:bg-light-green/20 transition-all text-center">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleBannerUpload}
                  disabled={uploadingBanner}
                />
                {uploadingBanner ? (
                  <div className="flex items-center gap-2 text-xs text-primary-green font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading custom banner...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-semibold text-brand-dark">
                    <Upload className="w-4 h-4 text-primary-green" />
                    <span>Upload Custom Banner Photo (PNG/JPG up to 10MB)</span>
                  </div>
                )}
              </label>

              {bannerPath && (
                <button
                  type="button"
                  onClick={removeCustomBanner}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors shrink-0"
                >
                  Reset to Default
                </button>
              )}
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block mb-1.5">
                Or choose from High-Resolution Cricket Themes:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {BANNER_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setBannerPath(preset.url);
                      setBannerFileName(null);
                    }}
                    className={`relative rounded-xl overflow-hidden border p-2 text-left transition-all flex items-center gap-2 ${
                      bannerPath === preset.url
                        ? 'border-primary-green ring-2 ring-primary-green/20 bg-light-green/20'
                        : 'border-brand-border hover:border-primary-green/50 bg-white'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = BANNER_PRESETS[0].url;
                      }}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                    <span className="text-xs font-medium text-brand-dark leading-tight line-clamp-2">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================================== */}
        {/* 4. CORE PARAMETERS (TOURNAMENT NAME & CAPACITY) */}
        {/* ============================================================================== */}
        <div className="bg-white border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-brand-dark uppercase tracking-wide pb-2 border-b border-gray-100">
            Tournament Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">
                Tournament Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={tournamentName}
                onChange={e => setTournamentName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-dark bg-white focus-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">
                Maximum Player Capacity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                required
                value={capacity}
                onChange={e => setCapacity(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-dark bg-white focus-ring"
              />
              <span className="text-[11px] text-brand-muted mt-0.5 block">
                Total allowed verified players before registrations lock.
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================================== */}
        {/* 5. UPI GATEWAY & PAYMENT CONFIG + CUSTOM QR UPLOADER */}
        {/* ============================================================================== */}
        <div className="bg-white border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-sm text-brand-dark uppercase tracking-wide">
                Official UPI Payment Rails & QR Code
              </h2>
              <p className="text-xs text-brand-muted mt-0.5">
                Set receiver UPI ID, registration fee, or upload your merchant bank QR scanner.
              </p>
            </div>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                upiQrPath
                  ? 'bg-light-green text-primary-green border border-primary-green/20'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {upiQrPath ? 'Custom QR Code Active' : 'Dynamic NPCI QR Active'}
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-start gap-6 p-5 rounded-2xl bg-gray-50/80 border border-brand-border">
            {/* Live QR Preview Box */}
            <div className="flex flex-col items-center gap-2 shrink-0 mx-auto md:mx-0">
              <div id="admin-qr-preview-box">
                <QRCodeDisplay
                  upiId={upiId || 'cricketauctionleague@okhdfcbank'}
                  amount={registrationFee || 500}
                  tournamentName={tournamentName || 'Cricket Auction League'}
                  customQrPath={upiQrPath}
                  className="relative w-44 h-44 bg-white border border-brand-border rounded-2xl p-3 shadow-xs flex items-center justify-center shrink-0 overflow-hidden"
                />
              </div>
              <span className="text-[11px] font-bold text-brand-dark uppercase tracking-wide">
                Live Public Preview
              </span>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('admin-qr-preview-box')?.querySelector('div');
                  if (el) (el as HTMLElement).click();
                }}
                className="text-[11px] text-primary-green hover:underline font-semibold flex items-center gap-1 mt-0.5"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Tap to Preview Large</span>
              </button>
            </div>

            {/* Inputs & Custom QR Upload Controls */}
            <div className="flex-1 w-full space-y-4">
              {/* UPI ID */}
              <div>
                <label className="block text-xs font-semibold text-brand-dark mb-1">
                  Official Receiver UPI ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  placeholder="cricketauctionleague@okhdfcbank"
                  className="w-full h-11 px-3.5 rounded-xl border border-brand-border text-xs sm:text-sm font-mono text-brand-dark bg-white focus-ring"
                />
                <span className="text-[11px] text-brand-muted mt-0.5 block">
                  The UPI ID shown to players and embedded inside payment copies.
                </span>
              </div>

              {/* Registration Fee */}
              <div>
                <label className="block text-xs font-semibold text-brand-dark mb-1">
                  Fixed Registration Fee (INR) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-brand-muted text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    required
                    value={registrationFee}
                    onChange={e => setRegistrationFee(Number(e.target.value))}
                    className="w-full h-11 pl-8 pr-3.5 rounded-xl border border-brand-border text-xs sm:text-sm font-bold text-brand-dark bg-white focus-ring"
                  />
                </div>
              </div>

              {/* Custom QR Code Upload Section */}
              <div className="pt-2 border-t border-gray-200/80">
                <label className="block text-xs font-bold text-brand-dark mb-1.5">
                  Custom Merchant QR Code Image (PhonePe / GPay / Paytm / Bank QR)
                </label>

                {upiQrPath ? (
                  <div className="p-3.5 bg-white border border-primary-green/30 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-light-green text-primary-green flex items-center justify-center shrink-0 border border-primary-green/20">
                        <ImageIcon className="w-5 h-5 text-primary-green" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-brand-dark truncate">
                            {qrFileName || 'Custom Merchant QR Active'}
                          </span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary-green shrink-0" />
                        </div>
                        <span className="text-[11px] text-primary-green font-semibold block">
                          Shown on public registration form
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('admin-qr-preview-box')?.querySelector('div');
                          if (el) (el as HTMLElement).click();
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand-border hover:bg-gray-50 text-xs font-semibold text-brand-dark transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-primary-green" />
                        <span>Preview Large</span>
                      </button>
                      <label className="px-3 py-1.5 rounded-lg border border-brand-border hover:bg-gray-50 text-xs font-semibold text-brand-dark cursor-pointer transition-colors">
                        <span>Replace</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleQrUpload}
                          disabled={uploadingQr}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={removeCustomQr}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove custom QR and revert to auto-generated QR"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 hover:border-primary-green rounded-xl cursor-pointer bg-white hover:bg-light-green/20 transition-all text-center">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleQrUpload}
                      disabled={uploadingQr}
                    />
                    {uploadingQr ? (
                      <div className="flex items-center gap-2 text-xs text-primary-green font-medium py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading merchant QR image...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-primary-green mb-1" />
                        <span className="text-xs font-bold text-brand-dark">
                          Click to upload your custom UPI QR code
                        </span>
                        <span className="text-[11px] text-brand-muted mt-0.5">
                          PhonePe, Google Pay, Paytm, or Bank QR (PNG, JPG, WebP max 5MB)
                        </span>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================================== */}
        {/* 6. REGISTRATION INSTRUCTIONS */}
        {/* ============================================================================== */}
        <div className="bg-white border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
          <h2 className="font-bold text-sm text-brand-dark uppercase tracking-wide pb-2 border-b border-gray-100">
            Player Registration Instructions
          </h2>
          <div>
            <textarea
              rows={3}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Instructions displayed on the player registration and payment section..."
              className="w-full p-3.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-dark bg-white focus-ring leading-relaxed"
            />
          </div>
        </div>

        {/* ============================================================================== */}
        {/* 7. OFFICIAL HELPDESK & PLAYER SUPPORT CONTACT */}
        {/* ============================================================================== */}
        <div className="bg-white border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="pb-2 border-b border-gray-100">
            <h2 className="font-bold text-sm text-brand-dark uppercase tracking-wide flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary-green" />
              <span>Helpline & Player Support Contact</span>
            </h2>
            <p className="text-xs text-brand-muted mt-0.5">
              Yeh details Top Navbar, Mobile Menu, Bottom Bar aur Payment Help Card par live show hongi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">
                Helpline Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={supportPhone}
                  onChange={e => setSupportPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full h-11 pl-9 pr-3.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-dark bg-white focus-ring"
                />
                <Phone className="w-4 h-4 text-brand-muted absolute left-3 top-3.5" />
              </div>
              <span className="text-[11px] text-brand-muted mt-0.5 block">
                Direct calling number for player inquiries.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">
                WhatsApp Support Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={supportWhatsapp}
                  onChange={e => setSupportWhatsapp(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full h-11 pl-9 pr-3.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-dark bg-white focus-ring"
                />
                <MessageCircle className="w-4 h-4 text-emerald-600 absolute left-3 top-3.5" />
              </div>
              <span className="text-[11px] text-brand-muted mt-0.5 block">
                1-tap WhatsApp chat number (instant support).
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-dark mb-1">
                Official Support Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={supportEmail}
                  onChange={e => setSupportEmail(e.target.value)}
                  placeholder="support@cricketauctionleague.com"
                  className="w-full h-11 pl-9 pr-3.5 rounded-xl border border-brand-border text-xs sm:text-sm text-brand-dark bg-white focus-ring"
                />
                <Mail className="w-4 h-4 text-brand-muted absolute left-3 top-3.5" />
              </div>
              <span className="text-[11px] text-brand-muted mt-0.5 block">
                Email address for queries and documentation.
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================================== */}
        {/* SUBMIT BUTTON */}
        {/* ============================================================================== */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-brand-muted">
            All updates immediately sync across public forms and admin dashboards.
          </span>
          <button
            type="submit"
            disabled={saving}
            className="px-6 h-11 rounded-xl bg-primary-green hover:bg-primary-dark text-white font-bold text-sm transition-all flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-60 active:scale-95"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Tournament Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
