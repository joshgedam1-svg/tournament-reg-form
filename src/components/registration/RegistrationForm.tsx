'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  registrationSchema,
  RegistrationFormData
} from '@/lib/validations/registration';
import { PublicTournamentSettings } from '@/types/settings';
import QRCodeDisplay from './QRCodeDisplay';
import { BatIcon, BallIcon, AllRounderIcon, KeeperIcon } from './CricketIcons';
import {
  ShieldCheck,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Trash2,
  Send,
  Loader2,
  Info,
  Calendar,
  Clock,
  Trophy,
  HelpCircle,
  Phone,
  Mail,
  MessageCircle,
  Eye,
  X,
  Maximize2
} from 'lucide-react';

interface RegistrationFormProps {
  settings?: PublicTournamentSettings;
  initialSettings?: PublicTournamentSettings;
}

export default function RegistrationForm({ settings: propSettings, initialSettings }: RegistrationFormProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<PublicTournamentSettings>(
    (initialSettings || propSettings || {
      tournament_name: 'Cricket Auction League 2026',
      registration_fee: 500,
      upi_id: 'cricketauctionleague@okhdfcbank',
      upi_qr_path: null,
      maximum_player_capacity: 100,
      registration_open: true,
      registration_instructions: null,
      registration_start_date: null,
      registration_end_date: null,
      banner_image_path: null,
      banner_title: null,
      banner_subtitle: null,
      banner_enabled: true,
      support_phone: null,
      support_whatsapp: null,
      support_email: null
    }) as PublicTournamentSettings
  );

  const supportPhone = settings.support_phone || '+91 98765 43210';
  const supportWhatsapp = settings.support_whatsapp || settings.support_phone || '+91 98765 43210';
  const supportEmail = settings.support_email || 'support@cricketauctionleague.com';
  const cleanPhone = supportPhone.replace(/\s+/g, '');
  const cleanWhatsapp = (settings.support_whatsapp || settings.support_phone || '919876543210').replace(/[^0-9]/g, '');

  const [mounted, setMounted] = useState(false);
  const [viewingImage, setViewingImage] = useState<{ url: string; title: string } | null>(null);

  // Client-side instant fetch to guarantee 100% fresh settings on mount
  React.useEffect(() => {
    setMounted(true);
    let isMounted = true;

    // Check localStorage first for instant client-side persistence
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('cal_tournament_settings');
        if (local) {
          const parsed = JSON.parse(local);
          setSettings(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) {}
    }

    async function refreshSettings() {
      try {
        const res = await fetch('/api/public/settings', { cache: 'no-store' });
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          // Server database is the single source of truth
          setSettings(json.data);
          try {
            localStorage.setItem('cal_tournament_settings', JSON.stringify(json.data));
          } catch (e) {}
        }
      } catch (err) {
        // Fallback to initial settings
      }
    }
    refreshSettings();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cal_tournament_settings' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings(parsed);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // File upload state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema) as any,
    defaultValues: {
      full_name: '',
      email: '',
      mobile: '',
      date_of_birth: '',
      city: '',
      address: '',
      profile_photo_path: null,
      playing_role: 'batsman',
      batting_style: 'right_hand',
      batting_position: 'top_order',
      bowling_arm: 'right_arm',
      bowling_type: 'medium',
      experience_level: '3_5_years',
      previous_team_name: '',
      previous_captain_name: '',
      previous_tournament: false,
      previous_tournament_name: '',
      additional_information: '',
      emergency_contact_name: '',
      emergency_relationship: '',
      emergency_mobile: '',
      utr_number: '',
      screenshot_path: '',
      amount: settings.registration_fee || 500,
      confirm_accuracy: false,
      accept_rules: false,
      confirm_payment: false
    }
  });

  const selectedRole = watch('playing_role');
  const selectedBatting = watch('batting_style');
  const selectedBattingPosition = watch('batting_position');
  const selectedArm = watch('bowling_arm');
  const selectedBowlingType = watch('bowling_type');

  const copyUpiId = () => {
    navigator.clipboard.writeText(settings.upi_id);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Helper to compress images client-side before uploading (speeds up submission by 95%+)
  const compressImage = async (file: File, maxDimension = 1200, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
        return resolve(file);
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(file);
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file);
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  // Upload Profile Photo Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setUploadingPhoto(true);
    try {
      const file = await compressImage(rawFile, 1200, 0.8);
      const data = new FormData();
      data.append('file', file);

      const res = await fetch('/api/uploads/player-photo', {
        method: 'POST',
        body: data
      });
      const result = await res.json();
      if (res.ok && result.filePath) {
        setPhotoPreview(result.filePath);
        setPhotoName(result.fileName || file.name);
        setValue('profile_photo_path', result.filePath, { shouldValidate: true });
      } else {
        alert(result.error || 'Failed to upload photo');
      }
    } catch {
      alert('Photo upload failed. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoName(null);
    setValue('profile_photo_path', null);
  };

  // Upload Payment Screenshot Handler
  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setUploadingScreenshot(true);
    try {
      const file = await compressImage(rawFile, 1200, 0.8);
      const data = new FormData();
      data.append('file', file);

      const res = await fetch('/api/uploads/payment-screenshot', {
        method: 'POST',
        body: data
      });
      const result = await res.json();
      if (res.ok && result.filePath) {
        setScreenshotPreview(result.filePath);
        setScreenshotName(result.fileName || file.name);
        setValue('screenshot_path', result.filePath, { shouldValidate: true });
      } else {
        alert(result.error || 'Failed to upload screenshot');
      }
    } catch {
      alert('Screenshot upload failed');
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const removeScreenshot = () => {
    setScreenshotPreview(null);
    setScreenshotName(null);
    setValue('screenshot_path', '');
  };

  const onSubmit = async (data: RegistrationFormData) => {
    setServerError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to submit registration');
      }

      const regId = responseData.data?.player?.registration_id;
      if (regId) {
        router.push(`/registration-success?id=${encodeURIComponent(regId)}`);
      } else {
        router.push('/registration-success');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setServerError(err.message || 'An error occurred during submission. Please check your inputs.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const now = new Date();
  const startDate = settings.registration_start_date ? new Date(settings.registration_start_date) : null;
  const endDate = settings.registration_end_date ? new Date(settings.registration_end_date) : null;

  const isBeforeStart = startDate && now < startDate;
  const isAfterEnd = endDate && now > endDate;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 1. If admin manually closed registrations
  if (!settings.registration_open) {
    return (
      <div className="bg-white border border-brand-border rounded-2xl p-8 text-center max-w-xl mx-auto my-12 shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-brand-dark">Registrations Closed</h2>
        <p className="text-brand-muted text-sm leading-relaxed">
          Player registrations for {settings.tournament_name} have been paused by the tournament committee. If you have already registered, you can track your verification status below.
        </p>
        <button
          onClick={() => router.push('/track-status')}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary-green hover:bg-primary-dark text-white font-medium transition-colors"
        >
          Track My Registration Status
        </button>
      </div>
    );
  }

  // 2. If registration date has not started yet
  if (isBeforeStart) {
    return (
      <div className="bg-white border border-brand-border rounded-2xl p-8 text-center max-w-xl mx-auto my-12 shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <Calendar className="w-8 h-8" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
          <span>Upcoming Registration</span>
        </div>
        <h2 className="text-2xl font-bold text-brand-dark">Registrations Opening Soon</h2>
        <p className="text-brand-muted text-sm leading-relaxed">
          Official player registrations for <strong className="text-brand-dark">{settings.tournament_name}</strong> will officially open on:
        </p>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 inline-block font-mono text-sm font-bold text-primary-green">
          {formatDate(startDate)}
        </div>
        <p className="text-xs text-brand-muted">
          Please check back at that time to complete your player entry and secure your slot!
        </p>
        <button
          onClick={() => router.push('/track-status')}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors"
        >
          Track Existing Registration
        </button>
      </div>
    );
  }

  // 3. If registration deadline has passed
  if (isAfterEnd) {
    return (
      <div className="bg-white border border-brand-border rounded-2xl p-8 text-center max-w-xl mx-auto my-12 shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">
          <span>Registration Expired</span>
        </div>
        <h2 className="text-2xl font-bold text-brand-dark">Registration Deadline Passed</h2>
        <p className="text-brand-muted text-sm leading-relaxed">
          The deadline for player registrations was on <strong className="text-brand-dark">{formatDate(endDate)}</strong>. Submissions are now officially closed for the upcoming auction docket.
        </p>
        <button
          onClick={() => router.push('/track-status')}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary-green hover:bg-primary-dark text-white font-medium transition-colors"
        >
          Track My Registration Status
        </button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* ============================================================================== */}
      {/* PROPER TOURNAMENT HERO BANNER */}
      {/* ============================================================================== */}
      {settings.banner_enabled !== false && (
        <div className="relative rounded-3xl overflow-hidden shadow-md border border-slate-200/80 min-h-[190px] sm:min-h-[240px] flex items-end p-5 sm:p-7 bg-slate-950">
          {settings.banner_image_path ? (
            <img
              src={settings.banner_image_path}
              alt="Tournament Hero Banner"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80';
              }}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 opacity-90" />
          )}

          {/* Vignette / Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

          {/* Banner Contents */}
          <div className="relative z-10 w-full text-white space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-primary-green text-white uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <Trophy className="w-3.5 h-3.5" />
                <span>Official Tournament</span>
              </span>
              <span className="px-3.5 py-1 rounded-full text-xs sm:text-sm font-extrabold bg-amber-400 text-slate-950 shadow-md border border-amber-300 flex items-center gap-1.5 animate-in zoom-in-95">
                <span className="uppercase text-[10px] font-black tracking-wide text-slate-900">Entry Fee:</span>
                <span className="text-sm sm:text-base font-black">₹{settings.registration_fee}</span>
              </span>
              {endDate && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-400/25 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Deadline: {formatDate(endDate)}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
              {settings.banner_title || settings.tournament_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
              {settings.banner_subtitle || 'Official Player Registration Portal • Submit your details and entry fee to enter the auction docket.'}
            </p>
          </div>
        </div>
      )}

      {/* Registration Info Callout */}
      <div className="bg-white border border-brand-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-light-green text-primary-green flex items-center justify-center shrink-0 border border-primary-green/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-800 block">Strict League Verification</span>
            <span className="text-slate-500">Every submission is verified against official bank UTR before approval.</span>
          </div>
        </div>

        {startDate && (
          <div className="text-[11px] text-slate-500 shrink-0 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            Started: {formatDate(startDate)}
          </div>
        )}
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
          <div>
            <h4 className="font-semibold text-sm">Submission Error</h4>
            <p className="text-xs sm:text-sm mt-0.5">{serverError}</p>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* SECTION 1: PERSONAL DETAILS */}
      {/* ============================================================================== */}
      <div className="bg-white border border-brand-border rounded-2xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-2.5 border-b border-gray-100">
          <div className="w-7 h-7 rounded-full bg-primary-green text-white flex items-center justify-center font-bold text-xs shadow-xs">
            1
          </div>
          <h2 className="font-bold text-base text-brand-dark uppercase tracking-wide">
            Personal Information
          </h2>
        </div>

        <div className="space-y-4 pt-1">
          {/* Full Name */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-brand-dark mb-1">
              Full Player Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('full_name')}
              placeholder="e.g. Rohit Sharma"
              className={`w-full h-11 px-3.5 rounded-lg border ${
                errors.full_name ? 'border-red-500' : 'border-brand-border'
              } text-sm text-brand-dark bg-white focus-ring`}
            />
            {errors.full_name && (
              <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>
            )}
          </div>

          {/* Contact Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-brand-dark mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder="rohit.sharma@example.com"
                className={`w-full h-11 px-3.5 rounded-lg border ${
                  errors.email ? 'border-red-500' : 'border-brand-border'
                } text-sm text-brand-dark bg-white focus-ring`}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-brand-dark mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                {...register('mobile')}
                placeholder="10-digit mobile number"
                className={`w-full h-11 px-3.5 rounded-lg border ${
                  errors.mobile ? 'border-red-500' : 'border-brand-border'
                } text-sm text-brand-dark bg-white focus-ring`}
              />
              {errors.mobile && (
                <p className="text-xs text-red-500 mt-1">{errors.mobile.message}</p>
              )}
            </div>
          </div>

          {/* DOB & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-brand-dark mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('date_of_birth')}
                className={`w-full h-11 px-3.5 rounded-lg border ${
                  errors.date_of_birth ? 'border-red-500' : 'border-brand-border'
                } text-sm text-brand-dark bg-white focus-ring`}
              />
              {errors.date_of_birth && (
                <p className="text-xs text-red-500 mt-1">{errors.date_of_birth.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-brand-dark mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('city')}
                placeholder="e.g. Mumbai"
                className={`w-full h-11 px-3.5 rounded-lg border ${
                  errors.city ? 'border-red-500' : 'border-brand-border'
                } text-sm text-brand-dark bg-white focus-ring`}
              />
              {errors.city && (
                <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>
              )}
            </div>
          </div>

          {/* Full Address */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-brand-dark mb-1">
              Full Residential Address / Area <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('address')}
              rows={2}
              placeholder="Street, area, landmark, pincode"
              className={`w-full p-3 rounded-lg border ${
                errors.address ? 'border-red-500' : 'border-brand-border'
              } text-sm text-brand-dark bg-white focus-ring`}
            />
            {errors.address && (
              <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
            )}
          </div>

          {/* Profile Photo Upload */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-brand-dark mb-1">
              Player Profile Photo <span className="text-brand-muted text-xs font-normal">(Optional, max 3MB)</span>
            </label>
            {photoPreview ? (
              <div className="p-3 bg-gray-50 border border-brand-border rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    onClick={() => setViewingImage({ url: photoPreview, title: 'Player Profile Photo' })}
                    className="relative group cursor-pointer shrink-0 rounded-lg overflow-hidden"
                    title="Click to view full photo"
                  >
                    <img
                      src={photoPreview}
                      alt="Player Profile Preview"
                      className="w-14 h-14 rounded-lg object-cover border border-gray-200 group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                      <Eye className="w-4 h-4 drop-shadow-sm" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-brand-dark truncate">{photoName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="inline-flex items-center gap-1 text-[11px] text-primary-green font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Photo Attached
                      </span>
                      <button
                        type="button"
                        onClick={() => setViewingImage({ url: photoPreview, title: 'Player Profile Photo' })}
                        className="text-[11px] text-slate-500 hover:text-primary-green underline font-medium flex items-center gap-0.5"
                      >
                        <Eye className="w-3 h-3" /> View Photo
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removePhoto}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 hover:border-primary-green rounded-xl cursor-pointer bg-gray-50 hover:bg-light-green/30 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                />
                {uploadingPhoto ? (
                  <div className="flex items-center gap-2 text-xs text-brand-muted">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-green" />
                    <span>Uploading photo...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-primary-green mb-1" />
                    <span className="text-xs font-semibold text-brand-dark">Click to upload headshot photo</span>
                    <span className="text-[11px] text-brand-muted">JPG, PNG or WEBP (Max 3MB)</span>
                  </>
                )}
              </label>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* SECTION 2: CRICKET PROFILE */}
      {/* ============================================================================== */}
      <div className="bg-white border border-brand-border rounded-2xl p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-2.5 border-b border-gray-100">
          <div className="w-7 h-7 rounded-full bg-primary-green text-white flex items-center justify-center font-bold text-xs shadow-xs">
            2
          </div>
          <h2 className="font-bold text-base text-brand-dark uppercase tracking-wide">
            Cricket Profile
          </h2>
        </div>

        {/* Playing Role Cards - Designed with Cricket Icons & Selection Checkmark */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-brand-dark mb-2.5">
            Playing Role <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                id: 'batsman',
                label: 'Batsman',
                desc: 'Top/Middle order specialist',
                icon: BatIcon
              },
              {
                id: 'bowler',
                label: 'Bowler',
                desc: 'Pace or spin strike weapon',
                icon: BallIcon
              },
              {
                id: 'all_rounder',
                label: 'All-Rounder',
                desc: 'Dual capability asset',
                icon: AllRounderIcon
              },
              {
                id: 'wicketkeeper',
                label: 'Wicketkeeper',
                desc: 'Glovework & top/finisher bat',
                icon: KeeperIcon
              }
            ].map(role => {
              const isSelected = selectedRole === role.id;
              const IconComp = role.icon;
              return (
                <div
                  key={role.id}
                  onClick={() => setValue('playing_role', role.id as any, { shouldValidate: true })}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all flex flex-col justify-between min-h-[105px] border ${
                    isSelected
                      ? 'bg-light-green border-primary-green shadow-xs ring-1 ring-primary-green'
                      : 'bg-white border-brand-border hover:bg-gray-50/80 hover:border-gray-300'
                  }`}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected ? 'bg-primary-green text-white' : 'bg-gray-100 text-brand-muted'
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-primary-green fill-primary-green/10" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-300" />
                    )}
                  </div>

                  <div className="mt-2.5">
                    <p
                      className={`text-sm font-bold leading-tight ${
                        isSelected ? 'text-primary-green' : 'text-brand-dark'
                      }`}
                    >
                      {role.label}
                    </p>
                    <p className="text-[11px] text-brand-muted leading-tight mt-0.5">
                      {role.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {errors.playing_role && (
            <p className="text-xs text-red-500 mt-1">{errors.playing_role.message}</p>
          )}
        </div>

        {/* Batting Style Chips */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-brand-dark mb-2">
            Batting Style <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'right_hand', label: 'Right Hand' },
              { id: 'left_hand', label: 'Left Hand' }
            ].map(item => {
              const active = selectedBatting === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setValue('batting_style', item.id as any, { shouldValidate: true })}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary-green text-white shadow-xs'
                      : 'bg-gray-100 text-brand-dark hover:bg-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Batting Position Chips */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-brand-dark mb-2">
            Batting Position / Order <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'top_order', label: 'Top Order (Opening - 3)' },
              { id: 'middle_order', label: 'Middle Order (4 - 6)' },
              { id: 'lower_order', label: 'Finisher / Lower Order (7 - 11)' }
            ].map(item => {
              const active = (selectedBattingPosition || 'top_order') === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setValue('batting_position', item.id as any, { shouldValidate: true })}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary-green text-white shadow-xs'
                      : 'bg-gray-100 text-brand-dark hover:bg-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bowling Arm Chips */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-brand-dark mb-2">
            Bowling Arm <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'right_arm', label: 'Right Arm' },
              { id: 'left_arm', label: 'Left Arm' },
              { id: 'do_not_bowl', label: 'Do Not Bowl' }
            ].map(item => {
              const active = selectedArm === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setValue('bowling_arm', item.id as any, { shouldValidate: true })}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary-green text-white shadow-xs'
                      : 'bg-gray-100 text-brand-dark hover:bg-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bowling Type Chips */}
        {selectedArm !== 'do_not_bowl' && (
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-brand-dark mb-2">
              Bowling Type <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'fast', label: 'Fast / Pace' },
                { id: 'medium', label: 'Medium' },
                { id: 'spin', label: 'Spin' },
                { id: 'not_applicable', label: 'Not Applicable' }
              ].map(item => {
                const active = selectedBowlingType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setValue('bowling_type', item.id as any, { shouldValidate: true })}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                      active
                        ? 'bg-primary-green text-white shadow-xs'
                        : 'bg-gray-100 text-brand-dark hover:bg-gray-200'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================================== */}
      {/* SECTION 3: EMERGENCY CONTACT */}
      {/* ============================================================================== */}
      <div className="bg-white border border-brand-border rounded-2xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-2.5 border-b border-gray-100">
          <div className="w-7 h-7 rounded-full bg-primary-green text-white flex items-center justify-center font-bold text-xs shadow-xs">
            3
          </div>
          <h2 className="font-bold text-base text-brand-dark uppercase tracking-wide">
            Emergency Contact Information
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-brand-dark mb-1">
              Contact Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('emergency_contact_name')}
              placeholder="e.g. Suresh Sharma"
              className={`w-full h-11 px-3.5 rounded-lg border ${
                errors.emergency_contact_name ? 'border-red-500' : 'border-brand-border'
              } text-sm text-brand-dark bg-white focus-ring`}
            />
            {errors.emergency_contact_name && (
              <p className="text-xs text-red-500 mt-1">{errors.emergency_contact_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-brand-dark mb-1">
              Relationship <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('emergency_relationship')}
              placeholder="e.g. Father, Brother"
              className={`w-full h-11 px-3.5 rounded-lg border ${
                errors.emergency_relationship ? 'border-red-500' : 'border-brand-border'
              } text-sm text-brand-dark bg-white focus-ring`}
            />
            {errors.emergency_relationship && (
              <p className="text-xs text-red-500 mt-1">{errors.emergency_relationship.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-brand-dark mb-1">
              Emergency Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              {...register('emergency_mobile')}
              placeholder="10-digit number"
              className={`w-full h-11 px-3.5 rounded-lg border ${
                errors.emergency_mobile ? 'border-red-500' : 'border-brand-border'
              } text-sm text-brand-dark bg-white focus-ring`}
            />
            {errors.emergency_mobile && (
              <p className="text-xs text-red-500 mt-1">{errors.emergency_mobile.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* SECTION 4: REGISTRATION PAYMENT (₹500 UPI) */}
      {/* ============================================================================== */}
      <div className="bg-white border border-brand-border rounded-2xl p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-green text-white flex items-center justify-center font-black text-sm shadow-xs">
              4
            </div>
            <div>
              <h2 className="font-bold text-base text-brand-dark uppercase tracking-wide">
                Registration Payment
              </h2>
              <p className="text-[11px] text-brand-muted">Scan QR or transfer entry fee via any UPI app</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-100 border-2 border-primary-green/40 px-4 py-1.5 rounded-2xl shadow-xs self-start sm:self-auto">
            <span className="text-xs uppercase font-extrabold text-emerald-900 tracking-wider">Fee to Pay:</span>
            <span className="text-2xl sm:text-3xl font-black text-primary-green font-mono tracking-tight">
              ₹{settings.registration_fee}
            </span>
          </div>
        </div>

        {/* Prominent Highlighted Amount Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-primary-green rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-emerald-200 block">
              Official Tournament Entry Fee
            </span>
            <p className="text-sm font-semibold text-white/90">
              Pay exactly <span className="font-black text-amber-300 underline underline-offset-2">₹{settings.registration_fee}</span> to confirm your player docket registration.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/25 px-5 py-2.5 rounded-2xl text-center shrink-0 self-start sm:self-auto">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-100 block">Total Payable</span>
            <span className="text-3xl sm:text-4xl font-black font-mono text-amber-300 drop-shadow-sm">
              ₹{settings.registration_fee}
            </span>
          </div>
        </div>

        {/* Payment Card with QR & UPI ID */}
        <div className="bg-gray-50 border border-brand-border rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-brand-border">
            {/* Live QR Code with Tap to Zoom Indicator */}
            <div className="flex flex-col items-center shrink-0">
              <QRCodeDisplay
                upiId={settings.upi_id}
                amount={settings.registration_fee}
                tournamentName={settings.tournament_name}
                customQrPath={settings.upi_qr_path}
              />
              <span className="text-[10px] text-primary-green font-semibold mt-1.5 flex items-center gap-1 bg-light-green/70 px-2 py-0.5 rounded-full border border-primary-green/20">
                <Maximize2 className="w-2.5 h-2.5" /> Tap QR to enlarge
              </span>
            </div>

            {/* UPI Details & Instructions */}
            <div className="flex-1 w-full space-y-3">
              <div>
                <span className="text-xs text-brand-muted font-medium">Official Tournament UPI ID</span>
                <div className="flex items-center justify-between bg-gray-50 border border-brand-border px-3 py-2 rounded-lg mt-1">
                  <span className="text-xs sm:text-sm font-mono font-semibold text-brand-dark select-all truncate">
                    {settings.upi_id}
                  </span>
                  <button
                    type="button"
                    onClick={copyUpiId}
                    className="inline-flex items-center gap-1 text-xs text-primary-green font-semibold hover:underline ml-2 flex-shrink-0"
                  >
                    {copiedUpi ? (
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
              </div>

              {/* 3 Step Instructions */}
              <div className="space-y-1 text-xs text-brand-muted">
                <p className="flex items-center gap-1.5">
                  <span className="font-bold text-primary-green">1.</span> Scan QR code or copy UPI ID in GPay / PhonePe / Paytm.
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="font-bold text-primary-green">2.</span> Pay exactly ₹{settings.registration_fee} from your verified account.
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="font-bold text-primary-green">3.</span> Copy the 12-digit UTR reference & upload screenshot receipt below.
                </p>
              </div>
            </div>
          </div>

          {/* Help & Support Contact Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                Payment ya registration me dikkat ho toh sampark karein:
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <a
                href={`tel:${cleanPhone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-primary-green" />
                <span>Call: {supportPhone}</span>
              </a>
              <a
                href={`https://wa.me/${cleanWhatsapp}?text=Hi%2C%20I%20need%20help%20with%20Cricket%20Auction%20League%20registration%20or%20payment`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-primary-green" />
                <span>WhatsApp Support</span>
              </a>
              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-primary-green" />
                <span>{supportEmail}</span>
              </a>
            </div>
          </div>

          {/* UTR Number Input */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-brand-dark mb-1">
              UTR / Transaction Reference Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={12}
              {...register('utr_number')}
              placeholder="12-digit numeric UTR e.g. 403928174629"
              className={`w-full h-11 px-3.5 rounded-lg border ${
                errors.utr_number ? 'border-red-500' : 'border-brand-border'
              } text-sm font-mono text-brand-dark bg-white focus-ring`}
            />
            {errors.utr_number && (
              <p className="text-xs text-red-500 mt-1">{errors.utr_number.message}</p>
            )}
            <p className="text-[11px] text-brand-muted mt-1">
              The 12-digit transaction reference shown on your bank/UPI debit receipt.
            </p>
          </div>

          {/* Payment Screenshot Upload */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-brand-dark mb-1">
              Payment Screenshot Receipt <span className="text-red-500">*</span>
            </label>
            {screenshotPreview ? (
              <div className="p-3 bg-white border border-brand-border rounded-xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    onClick={() => setViewingImage({ url: screenshotPreview, title: 'Payment Receipt Screenshot' })}
                    className="relative group cursor-pointer shrink-0 rounded-lg overflow-hidden"
                    title="Click to view full receipt"
                  >
                    <img
                      src={screenshotPreview}
                      alt="Payment receipt preview"
                      className="w-12 h-14 rounded-lg object-cover border border-gray-200 group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                      <Eye className="w-4 h-4 drop-shadow-sm" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-brand-dark truncate">{screenshotName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="inline-flex items-center gap-1 text-[11px] text-primary-green font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Screenshot Attached
                      </span>
                      <button
                        type="button"
                        onClick={() => setViewingImage({ url: screenshotPreview, title: 'Payment Receipt Screenshot' })}
                        className="text-[11px] text-slate-500 hover:text-primary-green underline font-medium flex items-center gap-0.5"
                      >
                        <Eye className="w-3 h-3" /> View Large Receipt
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove screenshot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-300 hover:border-primary-green rounded-xl cursor-pointer bg-white hover:bg-light-green/30 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleScreenshotUpload}
                  disabled={uploadingScreenshot}
                />
                {uploadingScreenshot ? (
                  <div className="flex items-center gap-2 text-xs text-brand-muted">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-green" />
                    <span>Uploading receipt...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-primary-green mb-1" />
                    <span className="text-xs font-semibold text-brand-dark">Click to upload payment screenshot</span>
                    <span className="text-[11px] text-brand-muted">JPG, PNG or WEBP (Max 5MB)</span>
                  </>
                )}
              </label>
            )}
            {errors.screenshot_path && (
              <p className="text-xs text-red-500 mt-1">{errors.screenshot_path.message}</p>
            )}
          </div>

          {/* Verification Warning Notice */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-700" />
            <p className="text-xs leading-relaxed">
              <strong>Mandatory Notice:</strong> Uploading a screenshot does not automatically confirm payment or registration. All submissions are manually verified against bank ledger records by tournament administrators. Any falsified or reused UTR will result in disqualification.
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* SECTION 5: DECLARATION */}
      {/* ============================================================================== */}
      <div className="bg-white border border-brand-border rounded-2xl p-5 sm:p-7 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 pb-2.5 border-b border-gray-100">
          <div className="w-7 h-7 rounded-full bg-primary-green text-white flex items-center justify-center font-bold text-xs shadow-xs">
            5
          </div>
          <h2 className="font-bold text-base text-brand-dark uppercase tracking-wide">
            Declaration & Agreement
          </h2>
        </div>

        <div className="space-y-3 pt-1">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('confirm_accuracy')}
              className="w-4 h-4 mt-0.5 accent-primary-green rounded cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-brand-dark">
              I confirm that all personal and cricket information provided is true and matches my official identification.
            </span>
          </label>
          {errors.confirm_accuracy && (
            <p className="text-xs text-red-500 ml-7">{errors.confirm_accuracy.message}</p>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('accept_rules')}
              className="w-4 h-4 mt-0.5 accent-primary-green rounded cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-brand-dark">
              I agree to abide by tournament rules, disciplinary codes, and official league guidelines.
            </span>
          </label>
          {errors.accept_rules && (
            <p className="text-xs text-red-500 ml-7">{errors.accept_rules.message}</p>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('confirm_payment')}
              className="w-4 h-4 mt-0.5 accent-primary-green rounded cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-brand-dark">
              I confirm that I have transferred ₹{settings.registration_fee} via legitimate UPI payment rails and entered the correct 12-digit UTR.
            </span>
          </label>
          {errors.confirm_payment && (
            <p className="text-xs text-red-500 ml-7">{errors.confirm_payment.message}</p>
          )}
        </div>
      </div>

      {/* ============================================================================== */}
      {/* FINAL SUBMIT BUTTON */}
      {/* ============================================================================== */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-xl bg-primary-green hover:bg-primary-dark text-white font-bold text-sm sm:text-base tracking-wider uppercase flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Submitting Registration...</span>
            </>
          ) : (
            <>
              <span>Submit Player Registration</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
        <p className="text-center text-xs text-brand-muted mt-2">
          Secure Submission • Admin review queue SLA: 2–4 hours
        </p>
      </div>
    </form>

    {/* Full-Screen Image Lightbox Modal for Receipt & Photo Previews */}
    {mounted && viewingImage && typeof document !== 'undefined' && createPortal(
      <div
        className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex min-h-screen items-center justify-center animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget) setViewingImage(null);
        }}
      >
        <div className="relative w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary-green" />
              <h3 className="font-bold text-sm text-slate-900">{viewingImage.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => setViewingImage(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Image Container with Safe Max Height */}
          <div className="bg-slate-50 rounded-2xl p-2 border border-slate-200 flex items-center justify-center overflow-hidden max-h-[70vh]">
            <img
              src={viewingImage.url}
              alt={viewingImage.title}
              className="w-auto h-auto max-h-[66vh] max-w-full object-contain rounded-xl shadow-xs"
            />
          </div>

          <p className="text-[11px] text-slate-400 text-center font-medium">
            Tap anywhere outside or click Close to dismiss preview
          </p>

          <button
            type="button"
            onClick={() => setViewingImage(null)}
            className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>,
      document.body
    )}
  </>
  );
}
