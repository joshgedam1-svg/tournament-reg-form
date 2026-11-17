'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { Maximize2, X, Copy, Check, QrCode, ShieldCheck } from 'lucide-react';

interface QRCodeDisplayProps {
  upiId: string;
  amount: number;
  tournamentName?: string;
  customQrPath?: string | null;
  className?: string;
  allowZoom?: boolean;
}

export default function QRCodeDisplay({
  upiId,
  amount,
  tournamentName = 'Cricket Auction League',
  customQrPath,
  className,
  allowZoom = true
}: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [highResQrUrl, setHighResQrUrl] = useState<string>('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (customQrPath) {
      return;
    }

    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
      tournamentName
    )}&am=${amount}&cu=INR&tn=${encodeURIComponent('Player Registration Fee')}`;

    // Standard preview QR
    QRCode.toDataURL(upiUri, {
      width: 280,
      margin: 2,
      color: {
        dark: '#176B45',
        light: '#FFFFFF'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => {
        console.error('Failed to generate UPI QR code:', err);
      });

    // High resolution QR for fullscreen zoom modal
    QRCode.toDataURL(upiUri, {
      width: 600,
      margin: 2,
      color: {
        dark: '#0F482E',
        light: '#FFFFFF'
      }
    })
      .then(url => setHighResQrUrl(url))
      .catch(() => {});
  }, [upiId, amount, tournamentName, customQrPath]);

  const imageSrc = customQrPath || qrDataUrl;
  const zoomImageSrc = customQrPath || highResQrUrl || qrDataUrl;

  const copyUpiId = () => {
    if (typeof navigator !== 'undefined' && upiId) {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div
        onClick={() => {
          if (allowZoom && imageSrc) setIsZoomed(true);
        }}
        className={`${
          className || "relative w-36 h-36 bg-white border border-brand-border rounded-xl p-2 shadow-sm flex items-center justify-center shrink-0 overflow-hidden"
        } ${allowZoom ? 'cursor-pointer group hover:ring-2 hover:ring-primary-green/30 transition-all' : ''}`}
        title={allowZoom ? "Click to enlarge QR Code" : undefined}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={`UPI QR Code for ${upiId}`}
            className="w-full h-full object-contain rounded-lg transition-transform group-hover:scale-105 duration-150"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-[11px] text-brand-muted text-center p-2">
            Generating QR...
          </div>
        )}
        <div className="absolute inset-0 bg-primary-green/5 rounded-xl pointer-events-none" />

        {/* Hover / Touch zoom badge */}
        {allowZoom && imageSrc && (
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-semibold gap-1 rounded-xl">
            <Maximize2 className="w-5 h-5 drop-shadow-sm" />
            <span className="drop-shadow-sm text-[10px]">Tap to Zoom</span>
          </div>
        )}
      </div>

      {/* Lightbox / Zoom Modal */}
      {mounted && isZoomed && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 flex min-h-screen items-center justify-center animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsZoomed(false);
          }}
        >
          <div className="relative w-full max-w-md sm:max-w-xl bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-light-green text-primary-green flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {customQrPath ? 'Official Merchant Payment QR' : 'Official UPI Payment QR'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Scan & Pay ₹{amount} Registration Fee</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-res Large QR Image Container - Supports any size / aspect ratio up to large screen */}
            <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center">
              <div className="w-full max-h-[62vh] min-h-[260px] p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                <img
                  src={zoomImageSrc}
                  alt={`Enlarged UPI QR Code for ${upiId}`}
                  className="w-auto h-auto max-w-full max-h-[56vh] object-contain rounded-xl"
                />
              </div>
              <div className="flex items-center justify-between w-full mt-2.5 px-1">
                <p className="text-[11px] text-slate-500 font-medium">
                  {customQrPath
                    ? 'Merchant Bank Scanner • Official League Payment'
                    : 'Google Pay • PhonePe • Paytm • BHIM • Cred'}
                </p>
                <span className="text-[10px] font-bold text-primary-green bg-light-green px-2 py-0.5 rounded-full">
                  100% Verified
                </span>
              </div>
            </div>

            {/* UPI ID Row */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">UPI ID</span>
                <span className="font-mono font-bold text-xs text-slate-900 truncate block select-all">
                  {upiId}
                </span>
              </div>
              <button
                type="button"
                onClick={copyUpiId}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-primary-green shadow-2xs transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>

            {/* Hint Notice */}
            <div className="flex items-start gap-2 bg-amber-50/70 border border-amber-200/60 rounded-xl p-2.5 text-[11px] text-amber-800">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Payment hone ke baad receipt ka screenshot lein aur 12-digit UTR number note kar lein.
              </span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsZoomed(false)}
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
