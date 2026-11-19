'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  UserCheck,
  UserX,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  Plus,
  Trash2,
  Edit,
  ShieldAlert,
  UserPlus,
  CheckSquare,
  Square,
  Users,
  CreditCard,
  Bell,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { PlayerWithPayment } from '@/types/player';
import { formatDate } from '@/lib/utils/format';
import {
  registerServiceWorker,
  requestNotificationPermission,
  sendLocalPushNotification
} from '@/lib/notifications';

interface CreatePlayerFormState {
  full_name: string;
  email: string;
  mobile: string;
  date_of_birth: string;
  city: string;
  address: string;
  playing_role: 'batsman' | 'bowler' | 'all_rounder' | 'wicketkeeper';
  batting_style: 'right_hand' | 'left_hand';
  bowling_arm: 'right_arm' | 'left_arm' | 'do_not_bowl';
  bowling_type: 'fast' | 'medium' | 'spin' | 'not_applicable';
  payment_status: 'verified' | 'pending_verification';
  amount: number;
  utr_number: string;
}

interface EditPlayerFormState {
  full_name: string;
  email: string;
  mobile: string;
  city: string;
  address: string;
  playing_role: 'batsman' | 'bowler' | 'all_rounder' | 'wicketkeeper';
  batting_style: 'right_hand' | 'left_hand';
  bowling_arm: 'right_arm' | 'left_arm' | 'do_not_bowl';
  bowling_type: 'fast' | 'medium' | 'spin' | 'not_applicable';
  registration_status: 'under_review' | 'approved' | 'rejected';
}

export default function PlayersAdminPage() {
  const [allPlayers, setAllPlayers] = useState<PlayerWithPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithPayment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [newSubmissionsFeedOpen, setNewSubmissionsFeedOpen] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>('default');

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerWithPayment | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<PlayerWithPayment | null>(null);
  const [isDeleteSelectedModalOpen, setIsDeleteSelectedModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState('');

  // Rejection Dialog State
  const [rejectingPlayer, setRejectingPlayer] = useState<PlayerWithPayment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Receipt Inspection Modal
  const [inspectingPayment, setInspectingPayment] = useState<{
    player: PlayerWithPayment;
    screenshotUrl: string;
    utr: string;
    amount: number;
  } | null>(null);

  const [entryFee, setEntryFee] = useState<number>(200);

  // Form States
  const [addForm, setAddForm] = useState<CreatePlayerFormState>({
    full_name: '',
    email: '',
    mobile: '',
    date_of_birth: '2000-01-01',
    city: '',
    address: '',
    playing_role: 'batsman',
    batting_style: 'right_hand',
    bowling_arm: 'right_arm',
    bowling_type: 'medium',
    payment_status: 'verified',
    amount: 200,
    utr_number: ''
  });

  const [editForm, setEditForm] = useState<EditPlayerFormState>({
    full_name: '',
    email: '',
    mobile: '',
    city: '',
    address: '',
    playing_role: 'batsman',
    batting_style: 'right_hand',
    bowling_arm: 'right_arm',
    bowling_type: 'medium',
    registration_status: 'approved'
  });

  // Track known IDs for detecting live new registrations
  const knownPlayerIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const openPaymentReceipt = async (player: PlayerWithPayment) => {
    const screenshotPath = player.payment?.screenshot_path;
    if (!screenshotPath) return;

    try {
      const response = await fetch('/api/admin/payments/receipt-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenshotPath })
      });
      const result = await response.json();
      if (!response.ok || !result.success || typeof result.url !== 'string') {
        throw new Error(result.error || 'Could not open this receipt.');
      }

      setInspectingPayment({
        player,
        screenshotUrl: result.url,
        utr: player.payment?.utr_number || 'N/A',
        amount: player.payment?.amount || entryFee
      });
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not open this receipt.', 'error');
    }
  };

  // Master fetch: loads all players without filter so counts & stats are always 100% accurate
  const fetchAllPlayers = async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/players', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const incoming: PlayerWithPayment[] = json.data;

        // Detect new registrations if not initial load
        if (!isInitialLoadRef.current && isBackground) {
          const newPlayers = incoming.filter(p => !knownPlayerIdsRef.current.has(p.id));
          if (newPlayers.length > 0) {
            const latest = newPlayers[0];
            showToast(
              `🔔 New Player Registered: ${latest.full_name} submitted ₹${latest.payment?.amount || entryFee} payment (UTR: ${latest.payment?.utr_number || 'N/A'})!`,
              'info'
            );
            sendLocalPushNotification(
              `🔔 Payment Received - ₹${latest.payment?.amount || entryFee}`,
              `${latest.full_name} (${latest.registration_id}) ne payment submit kiya. UTR: ${latest.payment?.utr_number || 'N/A'}. Tap to verify.`,
              '/admin/players'
            );
          }
        }

        // Update known IDs
        knownPlayerIdsRef.current = new Set(incoming.map(p => p.id));
        isInitialLoadRef.current = false;
        setAllPlayers(incoming);
      }
    } catch (err) {
      console.error('Failed to load players:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllPlayers(false);
    registerServiceWorker();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    }

    // Load dynamic entry fee from settings
    fetch('/api/public/settings')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data?.registration_fee) {
          const fee = Number(json.data.registration_fee);
          setEntryFee(fee);
          setAddForm(prev => ({ ...prev, amount: fee }));
        }
      })
      .catch(() => {});

    // Auto-polling every 15 seconds to detect live new registrations
    const interval = setInterval(() => {
      fetchAllPlayers(true);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Compute total verified collection dynamically based on actual player payments
  const totalVerifiedRevenue = useMemo(() => {
    return allPlayers
      .filter(p => p.payment?.payment_status === 'verified')
      .reduce((sum, p) => sum + (Number(p.payment?.amount) || entryFee), 0);
  }, [allPlayers, entryFee]);

  // Compute live executive metrics
  const stats = useMemo(() => {
    const total = allPlayers.length;
    const verified = allPlayers.filter(p => p.payment?.payment_status === 'verified').length;
    const pending = allPlayers.filter(
      p => p.payment?.payment_status === 'pending_verification'
    ).length;
    const rejected = allPlayers.filter(p => p.payment?.payment_status === 'rejected').length;
    const batsmen = allPlayers.filter(p => p.playing_role === 'batsman').length;
    const bowlers = allPlayers.filter(p => p.playing_role === 'bowler').length;
    const allRounders = allPlayers.filter(p => p.playing_role === 'all_rounder').length;
    const wicketkeepers = allPlayers.filter(p => p.playing_role === 'wicketkeeper').length;
    const capacityMax = 100;
    const fillPercent = Math.min(100, Math.round((verified / capacityMax) * 100));

    return {
      total,
      verified,
      pending,
      rejected,
      batsmen,
      bowlers,
      allRounders,
      wicketkeepers,
      capacityMax,
      fillPercent
    };
  }, [allPlayers]);

  // List of players pending payment verification
  const pendingPaymentPlayers = useMemo(() => {
    return allPlayers.filter(
      p => p.payment?.payment_status === 'pending_verification'
    );
  }, [allPlayers]);

  // Filtered displayed list
  const displayedPlayers = useMemo(() => {
    return allPlayers.filter(p => {
      // 1. Role or payment status filter
      if (activeFilter === 'verified' && p.payment?.payment_status !== 'verified') return false;
      if (
        activeFilter === 'pending' &&
        p.payment?.payment_status !== 'pending_verification'
      )
        return false;
      if (activeFilter === 'rejected' && p.payment?.payment_status !== 'rejected') return false;
      if (['batsman', 'bowler', 'all_rounder', 'wicketkeeper'].includes(activeFilter) && p.playing_role !== activeFilter)
        return false;

      // 2. Search query filter
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = p.full_name.toLowerCase().includes(q);
        const matchReg = p.registration_id.toLowerCase().includes(q);
        const matchMobile = p.mobile.toLowerCase().includes(q);
        const matchCity = p.city.toLowerCase().includes(q);
        const matchUtr = p.payment?.utr_number?.toLowerCase().includes(q) || false;
        if (!matchName && !matchReg && !matchMobile && !matchCity && !matchUtr) return false;
      }

      return true;
    });
  }, [allPlayers, activeFilter, search]);

  // Selection helpers
  const isAllSelected =
    displayedPlayers.length > 0 && displayedPlayers.every(p => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedPlayers.map(p => p.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // ==============================================================================
  // ACTIONS: Create Player
  // ==============================================================================
  const handleAddPlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch('/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`Player ${addForm.full_name} registered successfully!`);
        setIsAddModalOpen(false);
        setAddForm({
          full_name: '',
          email: '',
          mobile: '',
          date_of_birth: '2000-01-01',
          city: '',
          address: '',
          playing_role: 'batsman',
          batting_style: 'right_hand',
          bowling_arm: 'right_arm',
          bowling_type: 'medium',
          payment_status: 'verified',
          amount: entryFee,
          utr_number: ''
        });
        fetchAllPlayers(false);
      } else {
        alert(json.error || 'Failed to add player');
      }
    } catch (err) {
      alert('Error creating player');
    } finally {
      setActionLoading(false);
    }
  };

  // ==============================================================================
  // ACTIONS: Update Player
  // ==============================================================================
  const openEditModal = (player: PlayerWithPayment) => {
    setEditingPlayer(player);
    setEditForm({
      full_name: player.full_name,
      email: player.email,
      mobile: player.mobile,
      city: player.city,
      address: player.address,
      playing_role: player.playing_role,
      batting_style: player.batting_style,
      bowling_arm: player.bowling_arm,
      bowling_type: player.bowling_type,
      registration_status: player.registration_status as 'under_review' | 'approved' | 'rejected'
    });
  };

  const handleEditPlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/players/${editingPlayer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`Profile for ${editForm.full_name} updated successfully!`);
        setAllPlayers(prev =>
          prev.map(p => (p.id === editingPlayer.id ? ({ ...p, ...editForm } as PlayerWithPayment) : p))
        );
        if (selectedPlayer?.id === editingPlayer.id) {
          setSelectedPlayer(prev => (prev ? ({ ...prev, ...editForm } as PlayerWithPayment) : null));
        }
        setEditingPlayer(null);
      } else {
        alert(json.error || 'Failed to update player');
      }
    } catch (err) {
      alert('Error updating player');
    } finally {
      setActionLoading(false);
    }
  };

  // ==============================================================================
  // ACTIONS: Delete Single Player
  // ==============================================================================
  const handleDeleteSingle = async () => {
    if (!deletingPlayer) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/players/${deletingPlayer.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`Player ${deletingPlayer.full_name} deleted.`);
        setAllPlayers(prev => prev.filter(p => p.id !== deletingPlayer.id));
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(deletingPlayer.id);
          return next;
        });
        if (selectedPlayer?.id === deletingPlayer.id) {
          setSelectedPlayer(null);
        }
        setDeletingPlayer(null);
      } else {
        alert(json.error || 'Failed to delete player');
      }
    } catch (err) {
      alert('Error deleting player');
    } finally {
      setActionLoading(false);
    }
  };

  // ==============================================================================
  // ACTIONS: Bulk Delete Selected Players
  // ==============================================================================
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setActionLoading(true);

    try {
      const idsToDelete = Array.from(selectedIds);
      const res = await fetch('/api/admin/players', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsToDelete })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`Deleted ${idsToDelete.length} players successfully.`);
        setAllPlayers(prev => prev.filter(p => !selectedIds.has(p.id)));
        setSelectedIds(new Set());
        setIsDeleteSelectedModalOpen(false);
      } else {
        alert(json.error || 'Failed to delete selected players');
      }
    } catch (err) {
      alert('Error deleting selected players');
    } finally {
      setActionLoading(false);
    }
  };

  // ==============================================================================
  // ACTIONS: Delete All Players
  // ==============================================================================
  const handleDeleteAll = async () => {
    if (deleteAllConfirmText !== 'DELETE ALL') {
      alert('Please type DELETE ALL exactly to confirm.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/players', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast('All player records have been permanently cleared.');
        setAllPlayers([]);
        setSelectedIds(new Set());
        setSelectedPlayer(null);
        setIsDeleteAllModalOpen(false);
        setDeleteAllConfirmText('');
      } else {
        alert(json.error || 'Failed to delete all players');
      }
    } catch (err) {
      alert('Error deleting all players');
    } finally {
      setActionLoading(false);
    }
  };

  // ==============================================================================
  // ACTIONS: Verify Payment & Approve Player (1-Click)
  // ==============================================================================
  const handleVerifyPaymentAndApprove = async (player: PlayerWithPayment) => {
    setActionLoading(true);
    try {
      // 1. Verify Payment
      if (player.payment?.id) {
        await fetch(`/api/admin/payments/${player.payment.id}/verify`, { method: 'POST' });
      }

      // 2. Approve Registration
      await fetch(`/api/admin/registrations/${player.id}/approve`, { method: 'POST' });

      showToast(`✓ Payment verified & ${player.full_name} approved for tournament!`);
      if (inspectingPayment?.player.id === player.id) {
        setInspectingPayment(null);
      }
      fetchAllPlayers(false);
    } catch (err) {
      alert('Failed to verify payment and approve registration');
    } finally {
      setActionLoading(false);
    }
  };

  // Status Approvals
  const handleApprove = async (playerId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/registrations/${playerId}/approve`, {
        method: 'POST'
      });
      const json = await res.json();
      if (json.success) {
        setAllPlayers(prev =>
          prev.map(p => {
            if (p.id === playerId) {
              const updatedPayment = p.payment ? { ...p.payment, payment_status: 'verified' as const } : p.payment;
              return { ...p, registration_status: 'approved', rejection_reason: null, payment: updatedPayment };
            }
            return p;
          })
        );
        if (selectedPlayer?.id === playerId) {
          setSelectedPlayer(prev => (prev ? { ...prev, registration_status: 'approved', rejection_reason: null } : null));
        }
        showToast('Player approved & payment verified successfully!');
        fetchAllPlayers(false);
      } else {
        alert(json.error || 'Failed to approve registration');
      }
    } catch (err) {
      alert('Error approving registration');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPlayer || !rejectionReason.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/registrations/${rejectingPlayer.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason.trim() })
      });
      const json = await res.json();
      if (json.success) {
        setAllPlayers(prev =>
          prev.map(p => {
            if (p.id === rejectingPlayer.id) {
              const updatedPayment = p.payment ? { ...p.payment, payment_status: 'rejected' as const, rejection_reason: rejectionReason.trim() } : p.payment;
              return { ...p, registration_status: 'rejected', rejection_reason: rejectionReason.trim(), payment: updatedPayment };
            }
            return p;
          })
        );
        if (selectedPlayer?.id === rejectingPlayer.id) {
          setSelectedPlayer(prev =>
            prev ? { ...prev, registration_status: 'rejected', rejection_reason: rejectionReason.trim() } : null
          );
        }
        setRejectingPlayer(null);
        setRejectionReason('');
        showToast('Player registration rejected.');
        fetchAllPlayers(false);
      } else {
        alert(json.error || 'Failed to reject registration');
      }
    } catch (err) {
      alert('Error rejecting registration');
    } finally {
      setActionLoading(false);
    }
  };

  const exportPlayersCSV = async () => {
    let playersToExport: PlayerWithPayment[];
    try {
      const response = await fetch('/api/admin/players', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success || !Array.isArray(result.data)) {
        throw new Error(result.error || 'Could not fetch the latest player list.');
      }
      playersToExport = result.data;
      setAllPlayers(playersToExport);
    } catch (error) {
      console.error('Player CSV export failed:', error);
      showToast('Could not fetch the latest players. No CSV was downloaded.', 'error');
      return;
    }

    const headers = [
      'Registration ID',
      'Name',
      'Mobile',
      'Date of Birth',
      'Address',
      'Playing Role',
      'Registration Status'
    ];
    const rows = playersToExport.map(p => [
      p.registration_id,
      p.full_name,
      p.mobile,
      p.date_of_birth,
      p.address,
      p.playing_role.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()),
      p.registration_status.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
    ]);

    // Export only the seven fields requested. Excel's separator hint keeps
    // comma-delimited CSV columns split correctly on locale-specific installs.
    const encodeCell = (value: unknown) => {
      const text = value === null || value === undefined ? '' : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };
    const csvContent =
      '\uFEFF' +
      'sep=,\r\n' +
      [headers, ...rows].map(row => row.map(encodeCell).join(',')).join('\r\n');
    const file = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.setAttribute('href', objectUrl);
    link.setAttribute('download', `CAL_Players_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className={`px-4 py-2.5 rounded-lg shadow-md border text-xs font-semibold flex items-center gap-2 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toastMessage.type === 'info'
                ? 'bg-blue-900 text-white border-blue-700'
                : 'bg-red-900 text-white border-red-700'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'info' && <Bell className="w-4 h-4 text-blue-300 shrink-0" />}
            {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
            <span>{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* 1. PROFESSIONAL HEADER WITH TOTAL PLAYERS PILL & SLEEK ACTION BAR */}
      {/* ============================================================================== */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Player Roster & Management
              </h1>
              {/* Proper Total Players Badge */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                <Users className="w-3 h-3 text-emerald-600" />
                <span>{stats.total} Players Total</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive player directory, live payment receipt verification, and roster CRUD controls.
            </p>
          </div>

          {/* Compact Action Buttons - Perfectly aligned without wrapping awkwardly */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Mobile Drop-Down Push Notification Button */}
            {notificationStatus !== 'granted' ? (
              <button
                onClick={async () => {
                  const perm = await requestNotificationPermission();
                  setNotificationStatus(perm);
                  if (perm === 'granted') {
                    showToast('✓ Mobile push notifications enabled! Sending welcome test alert...', 'success');
                    sendLocalPushNotification(
                      '🔔 Cricket Auction League Alerts Active',
                      'Aapke mobile par ab sabhi new player registrations aur UPI payments ke alerts drop honge.',
                      '/admin/players'
                    );
                  } else {
                    alert('Please allow notification permission in your mobile browser to receive alerts.');
                  }
                }}
                className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-2xs active:scale-95"
                title="Turn on mobile drop-down notifications"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Alerts</span>
              </button>
            ) : (
              <button
                onClick={async () => {
                  const sent = await sendLocalPushNotification(
                    `🔔 Payment Received - ₹${entryFee}`,
                    `Player ne UPI payment submit ki. UTR: 403928174632. Tap to review.`,
                    '/admin/players'
                  );
                  if (sent) {
                    showToast('🔔 Test alert sent! Check the top of your mobile screen.', 'success');
                  } else {
                    showToast('Please check browser notification permissions.', 'error');
                  }
                }}
                className="inline-flex items-center gap-1.5 h-8.5 px-2.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-all shadow-2xs active:scale-95"
                title="Send test drop-down notification to your device"
              >
                <Bell className="w-3.5 h-3.5 text-emerald-600" />
                <span>Test Alert</span>
              </button>
            )}

            {/* Add Player */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg bg-primary-green hover:bg-primary-dark text-white text-xs font-semibold transition-all shadow-2xs active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Player</span>
            </button>

            {/* Delete All (Emergency) */}
            {allPlayers.length > 0 && (
              <button
                onClick={() => setIsDeleteAllModalOpen(true)}
                className="inline-flex items-center gap-1.5 h-8.5 px-2.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-all shadow-2xs active:scale-95"
                title="Emergency wipeout with typed confirmation"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Delete All</span>
              </button>
            )}

            {/* Export CSV */}
            <button
              onClick={exportPlayersCSV}
              className="inline-flex items-center gap-1.5 h-8.5 px-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 transition-colors shadow-2xs"
              title="Download all registered players as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            {/* Refresh */}
            <button
              onClick={() => fetchAllPlayers(false)}
              disabled={refreshing}
              className="h-8.5 w-8.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center transition-colors shadow-2xs disabled:opacity-50"
              title="Refresh player roster"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${refreshing ? 'animate-spin text-primary-green' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* 2. EXECUTIVE KPI STATS CARDS (Displaying Total Players, Paid, Pending, Capacity) */}
      {/* ============================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Players Card */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Players
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900">{stats.total}</span>
              <span className="text-[11px] text-slate-500 font-medium">Registered</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {stats.batsmen} Bat • {stats.bowlers} Bowl • {stats.allRounders} AR • {stats.wicketkeepers} WK
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-primary-green" />
          </div>
        </div>

        {/* Paid & Verified Card */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Paid & Verified
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-emerald-700">{stats.verified}</span>
              <span className="text-[11px] text-emerald-600 font-medium">₹{totalVerifiedRevenue.toLocaleString('en-IN')}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Confirmed tournament docket
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Pending Review Card (With Pulse Indicator) */}
        <div
          onClick={() => setActiveFilter('pending')}
          className={`border rounded-xl p-3 sm:p-3.5 shadow-xs flex items-center justify-between transition-all cursor-pointer hover:shadow-sm ${
            stats.pending > 0
              ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-200'
              : 'bg-white border-slate-200/80'
          }`}
          title="Click to view pending payments"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Pending Review
              </span>
              {stats.pending > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-xl font-bold ${stats.pending > 0 ? 'text-amber-800' : 'text-slate-900'}`}>
                {stats.pending}
              </span>
              <span className="text-[11px] text-amber-700 font-medium">Need UTR check</span>
            </div>
            <span className="text-[10px] text-amber-600/80 block mt-0.5 font-medium">
              {stats.pending > 0 ? 'Action required below' : 'All clear'}
            </span>
          </div>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              stats.pending > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
            }`}
          >
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Tournament Capacity Card */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <span>Quota Capacity</span>
            <span className="text-slate-900 font-bold">{stats.fillPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-1">
            <div
              className="bg-primary-green h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.fillPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>{stats.verified} / {stats.capacityMax} Verified</span>
            <span className="text-emerald-700 font-semibold">{stats.capacityMax - stats.verified} left</span>
          </div>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* 3. DEDICATED SECTION: NEW REGISTRATIONS & PAYMENT SUBMISSIONS (ACTION REQUIRED) */}
      {/* ============================================================================== */}
      {pendingPaymentPlayers.length > 0 ? (
        <div className="bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-orange-50/30 border border-amber-300/80 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
              </span>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-1.5">
                  <span>New Registrations with Pending Payment Verification</span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                    {pendingPaymentPlayers.length} Awaiting
                  </span>
                </h2>
                <p className="text-[11px] text-amber-800/80">
                  These players completed their registration and uploaded payment receipts. Review and approve with 1 click:
                </p>
              </div>
            </div>

            <button
              onClick={() => setNewSubmissionsFeedOpen(!newSubmissionsFeedOpen)}
              className="text-xs font-semibold text-amber-900 hover:text-amber-950 underline px-2 py-1"
            >
              {newSubmissionsFeedOpen ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {newSubmissionsFeedOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {pendingPaymentPlayers.map(p => (
                <div
                  key={p.id}
                  className="bg-white border border-amber-200/90 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-amber-400 transition-colors"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <img
                      src={
                        p.profile_photo_path ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                      }
                      alt={p.full_name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 truncate">{p.full_name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                          {p.playing_role.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-700 mt-0.5">
                        <span className="font-bold">{p.registration_id}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-semibold text-slate-800">₹{p.payment?.amount || entryFee}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono text-slate-600">UTR: {p.payment?.utr_number || 'No UTR'}</span>
                        <span className="text-slate-300">•</span>
                        <span>{p.city}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this pending registration */}
                  <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* View Receipt Screenshot */}
                    {p.payment?.screenshot_path && (
                      <button
                        onClick={() => openPaymentReceipt(p)}
                        className="h-7.5 px-2 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1"
                        title="Inspect UPI payment screenshot"
                      >
                        <Receipt className="w-3 h-3 text-slate-500" />
                        <span>Receipt</span>
                      </button>
                    )}

                    {/* 1-Click Verify & Approve */}
                    <button
                      onClick={() => handleVerifyPaymentAndApprove(p)}
                      disabled={actionLoading}
                      className="h-7.5 px-2.5 rounded-md bg-primary-green hover:bg-primary-dark text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                      title={`Verify ₹${p.payment?.amount || entryFee} payment and approve player immediately`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verify & Approve</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Reassuring zero-pending status banner */
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">
              All payment submissions are verified. New athlete registrations will appear here automatically.
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 shrink-0 font-medium">Live Auto-Sync Active</span>
        </div>
      )}

      {/* Floating / Sticky Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-16 z-30 p-3 bg-slate-900 text-white rounded-xl shadow-lg flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200 border border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-primary-green text-white font-bold text-xs flex items-center justify-center font-mono">
              {selectedIds.size}
            </span>
            <span className="text-xs font-semibold">
              {selectedIds.size} player{selectedIds.size > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={deselectAll}
              className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              Deselect All
            </button>
            <button
              onClick={() => setIsDeleteSelectedModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* 4. SEARCH & FILTER TOOLBAR (NO UGLY SCROLLBAR + COUNT BADGES ON PILLS) */}
      {/* ============================================================================== */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by player name, registration ID, mobile, city, or UTR number..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus-ring"
          />
        </div>

        {/* Filter Pills with Count Badges (Hidden native scrollbar with .no-scrollbar) */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { id: 'all', label: 'All Players', count: stats.total },
              { id: 'verified', label: 'Verified', count: stats.verified },
              { id: 'pending', label: 'Pending Review', count: stats.pending, alert: stats.pending > 0 },
              { id: 'rejected', label: 'Rejected', count: stats.rejected },
              { id: 'batsman', label: 'Batsmen', count: stats.batsmen },
              { id: 'bowler', label: 'Bowlers', count: stats.bowlers },
              { id: 'all_rounder', label: 'All-Rounders', count: stats.allRounders },
              { id: 'wicketkeeper', label: 'Wicketkeepers', count: stats.wicketkeepers }
            ].map(f => {
              const active = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 ${
                    active
                      ? 'bg-primary-green text-white shadow-2xs font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      active
                        ? 'bg-white/20 text-white'
                        : f.alert
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Select All Toggle */}
          {displayedPlayers.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="text-xs font-semibold text-primary-green hover:underline whitespace-nowrap shrink-0 ml-2"
            >
              {isAllSelected ? 'Deselect All' : `Select All (${displayedPlayers.length})`}
            </button>
          )}
        </div>
      </div>

      {/* ============================================================================== */}
      {/* 5. PLAYERS LIST (CLEAN HIGH-DENSITY ENTERPRISE TABLE & MOBILE CARDS) */}
      {/* ============================================================================== */}
      {loading ? (
        <div className="py-16 text-center space-y-2 bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin text-primary-green mx-auto" />
          <p className="text-xs text-slate-500">Loading tournament roster...</p>
        </div>
      ) : displayedPlayers.length === 0 ? (
        <div className="py-12 text-center space-y-2.5 bg-white rounded-xl border border-slate-200 p-6">
          <UserX className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-800">No players match the criteria</p>
          <p className="text-[11px] text-slate-500">Try adjusting your filters, search terms, or add a new player.</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-green text-white text-xs font-semibold shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Player</span>
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Responsive Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3">
            {displayedPlayers.map(player => {
              const isSelected = selectedIds.has(player.id);
              const isPending =
                player.payment?.payment_status === 'pending_verification';
              const isVerified = player.payment?.payment_status === 'verified';

              return (
                <div
                  key={player.id}
                  className={`bg-white border rounded-xl p-3.5 shadow-2xs space-y-2.5 transition-all ${
                    isSelected
                      ? 'border-primary-green ring-1 ring-primary-green/30 bg-light-green/10'
                      : isPending
                      ? 'border-amber-300'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(player.id)}
                        className="w-4 h-4 accent-primary-green rounded cursor-pointer shrink-0"
                      />
                      <img
                        src={
                          player.profile_photo_path ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                        }
                        alt={player.full_name}
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs text-slate-900 truncate">{player.full_name}</h3>
                        <span className="font-mono text-[11px] font-bold text-primary-green block">
                          {player.registration_id}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block">{player.email}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 shrink-0">
                      {player.playing_role.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-2 px-2.5 bg-slate-50/70 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Contact:</span>
                      <span className="font-medium text-slate-800 text-[11px] block">{player.city}</span>
                      <span className="font-mono text-slate-500 text-[10px]">{player.mobile}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Cricket Craft:</span>
                      <span className="font-semibold text-slate-800 text-[11px] block">
                        {player.batting_style === 'right_hand' ? 'RH Bat' : 'LH Bat'}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {player.bowling_arm === 'do_not_bowl' ? 'No bowl' : player.bowling_type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200/60">
                      <span className="text-slate-400 text-[10px] block">Payment:</span>
                      {isVerified ? (
                        <span className="font-semibold text-emerald-700 text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ₹{player.payment?.amount || entryFee} Paid
                        </span>
                      ) : isPending ? (
                        <span className="font-semibold text-amber-700 text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                        </span>
                      ) : (
                        <span className="font-semibold text-red-600 text-[11px] flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </div>
                    <div className="pt-1.5 border-t border-slate-200/60">
                      <span className="text-slate-400 text-[10px] block">Status:</span>
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold capitalize ${
                          player.registration_status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : player.registration_status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {player.registration_status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <button
                      onClick={() => setSelectedPlayer(player)}
                      className="flex-1 h-7.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Eye className="w-3 h-3 text-slate-400" />
                      <span>View</span>
                    </button>

                    <button
                      onClick={() => openEditModal(player)}
                      className="px-2 h-7.5 rounded-md border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-xs font-semibold text-blue-700 flex items-center gap-1"
                      title="Edit player record"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    {isPending && (
                      <button
                        onClick={() => handleVerifyPaymentAndApprove(player)}
                        disabled={actionLoading}
                        className="px-2.5 h-7.5 rounded-md bg-primary-green hover:bg-primary-dark text-white text-xs font-semibold flex items-center gap-1"
                        title="Verify payment and approve"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verify</span>
                      </button>
                    )}

                    <button
                      onClick={() => setDeletingPlayer(player)}
                      className="p-1.5 h-7.5 rounded-md bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center"
                      title="Delete player"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop High-Density Table */}
          <div className="hidden lg:block bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto w-full no-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="w-3.5 h-3.5 accent-primary-green rounded cursor-pointer"
                        title="Select/Deselect All"
                      />
                    </th>
                    <th className="py-2.5 px-3 text-left whitespace-nowrap min-w-[170px]">Player Profile</th>
                    <th className="py-2.5 px-3 text-left whitespace-nowrap min-w-[130px]">Registration ID</th>
                    <th className="py-2.5 px-3 text-left whitespace-nowrap min-w-[95px]">Role</th>
                    <th className="py-2.5 px-3 text-left whitespace-nowrap min-w-[130px]">Mobile & City</th>
                    <th className="py-2.5 px-3 text-left whitespace-nowrap min-w-[140px]">Batting / Bowling</th>
                    <th className="py-2.5 px-3 text-left whitespace-nowrap min-w-[130px]">Payment Status</th>
                    <th className="py-2.5 px-3 text-left whitespace-nowrap min-w-[95px]">Reg Status</th>
                    <th className="py-2.5 px-3.5 text-right whitespace-nowrap min-w-[190px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedPlayers.map(player => {
                    const isSelected = selectedIds.has(player.id);
                    const isPending =
                      player.payment?.payment_status === 'pending_verification';
                    const isVerified = player.payment?.payment_status === 'verified';

                    return (
                      <tr
                        key={player.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-light-green/20'
                            : isPending
                            ? 'bg-amber-50/30 hover:bg-amber-50/60'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-2.5 px-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(player.id)}
                            className="w-3.5 h-3.5 accent-primary-green rounded cursor-pointer"
                          />
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={
                                player.profile_photo_path ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                              }
                              alt={player.full_name}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <span className="font-semibold text-xs text-slate-900 block whitespace-nowrap">
                                {player.full_name}
                              </span>
                              <span className="text-[11px] text-slate-400 block whitespace-nowrap">
                                {player.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 font-mono font-semibold text-primary-green whitespace-nowrap text-[11px]">
                          {player.registration_id}
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                            {player.playing_role.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="text-slate-800 font-medium block whitespace-nowrap text-xs">{player.mobile}</span>
                          <span className="text-[11px] text-slate-400 block">{player.city}</span>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-medium text-slate-800 text-xs">
                            {player.batting_style === 'right_hand' ? 'Right Hand Bat' : 'Left Hand Bat'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {player.bowling_arm === 'do_not_bowl'
                              ? 'Do not bowl'
                              : `${player.bowling_arm === 'right_arm' ? 'Right' : 'Left'} • ${player.bowling_type.replace('_', ' ')}`}
                          </div>
                        </td>

                        {/* Payment Status Column */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isVerified ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ₹{player.payment?.amount || entryFee} Verified
                              </span>
                              <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                                UTR: {player.payment?.utr_number || 'N/A'}
                              </span>
                            </div>
                          ) : isPending ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                              </span>
                              <span className="block text-[10px] font-mono text-amber-700 font-semibold mt-0.5">
                                UTR: {player.payment?.utr_number || 'Awaiting'}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                              <XCircle className="w-3 h-3 text-red-600" /> Rejected
                            </span>
                          )}
                        </td>

                        {/* Registration Status Column */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                              player.registration_status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : player.registration_status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {player.registration_status.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td className="py-2.5 px-3.5 text-right space-x-1 whitespace-nowrap min-w-[190px]">
                          <button
                            onClick={() => setSelectedPlayer(player)}
                            className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs"
                            title="View full player profile"
                          >
                            View
                          </button>

                          <button
                            onClick={() => openEditModal(player)}
                            className="px-2 py-1 rounded border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-700 font-semibold text-xs transition-colors"
                            title="Edit player record"
                          >
                            Edit
                          </button>

                          {isPending && (
                            <button
                              onClick={() => handleVerifyPaymentAndApprove(player)}
                              disabled={actionLoading}
                              className="px-2 py-1 rounded bg-primary-green hover:bg-primary-dark text-white font-semibold text-xs transition-colors shadow-2xs"
                              title="Verify payment & approve player in 1 click"
                            >
                              Verify
                            </button>
                          )}

                          {player.registration_status !== 'approved' && !isPending && (
                            <button
                              onClick={() => handleApprove(player.id)}
                              disabled={actionLoading}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors shadow-2xs"
                              title="Approve player"
                            >
                              Approve
                            </button>
                          )}

                          <button
                            onClick={() => setDeletingPlayer(player)}
                            className="p-1 rounded text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors inline-flex items-center align-middle"
                            title="Delete player"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ============================================================================== */}
      {/* MODAL 1: ADD NEW PLAYER (CREATE) */}
      {/* ============================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-5 space-y-3.5 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-light-green text-primary-green flex items-center justify-center">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Add New Player Registration</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPlayerSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.full_name}
                    onChange={e => setAddForm({ ...addForm, full_name: e.target.value })}
                    placeholder="e.g. Virat Kohli"
                    className="w-full h-8.5 px-3 rounded-lg border border-slate-200 text-xs text-slate-900 focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="virat@example.com"
                    className="w-full h-8.5 px-3 rounded-lg border border-slate-200 text-xs text-slate-900 focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={addForm.mobile}
                    onChange={e => setAddForm({ ...addForm, mobile: e.target.value })}
                    placeholder="9876543210"
                    className="w-full h-8.5 px-3 rounded-lg border border-slate-200 text-xs text-slate-900 focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.city}
                    onChange={e => setAddForm({ ...addForm, city: e.target.value })}
                    placeholder="e.g. Delhi"
                    className="w-full h-8.5 px-3 rounded-lg border border-slate-200 text-xs text-slate-900 focus-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={addForm.address}
                  onChange={e => setAddForm({ ...addForm, address: e.target.value })}
                  placeholder="Street / Area"
                  className="w-full h-8.5 px-3 rounded-lg border border-slate-200 text-xs text-slate-900 focus-ring"
                />
              </div>

              {/* Cricket Capabilities */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-0.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addForm.playing_role}
                    onChange={e =>
                      setAddForm({
                        ...addForm,
                        playing_role: e.target.value as CreatePlayerFormState['playing_role']
                      })
                    }
                    className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white"
                  >
                    <option value="batsman">Batsman</option>
                    <option value="bowler">Bowler</option>
                    <option value="all_rounder">All-Rounder</option>
                    <option value="wicketkeeper">Wicketkeeper</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                    Batting
                  </label>
                  <select
                    value={addForm.batting_style}
                    onChange={e =>
                      setAddForm({
                        ...addForm,
                        batting_style: e.target.value as CreatePlayerFormState['batting_style']
                      })
                    }
                    className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white"
                  >
                    <option value="right_hand">Right Hand</option>
                    <option value="left_hand">Left Hand</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                    Bowling Arm
                  </label>
                  <select
                    value={addForm.bowling_arm}
                    onChange={e =>
                      setAddForm({
                        ...addForm,
                        bowling_arm: e.target.value as CreatePlayerFormState['bowling_arm']
                      })
                    }
                    className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white"
                  >
                    <option value="right_arm">Right Arm</option>
                    <option value="left_arm">Left Arm</option>
                    <option value="do_not_bowl">Do Not Bowl</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                    Bowling Type
                  </label>
                  <select
                    value={addForm.bowling_type}
                    onChange={e =>
                      setAddForm({
                        ...addForm,
                        bowling_type: e.target.value as CreatePlayerFormState['bowling_type']
                      })
                    }
                    className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white"
                  >
                    <option value="fast">Fast</option>
                    <option value="medium">Medium</option>
                    <option value="spin">Spin</option>
                    <option value="not_applicable">None</option>
                  </select>
                </div>
              </div>

              {/* Payment Status & UTR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={addForm.payment_status}
                    onChange={e =>
                      setAddForm({
                        ...addForm,
                        payment_status: e.target.value as CreatePlayerFormState['payment_status']
                      })
                    }
                    className="w-full h-8.5 px-3 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white"
                  >
                    <option value="verified">Verified (₹{entryFee} Paid)</option>
                    <option value="pending_verification">Pending Verification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    UTR Reference (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={addForm.utr_number}
                    onChange={e => setAddForm({ ...addForm, utr_number: e.target.value })}
                    placeholder="12-digit UTR"
                    className="w-full h-8.5 px-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-900 focus-ring"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-primary-green hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-xs"
                >
                  {actionLoading ? 'Creating...' : 'Register Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL 2: EDIT PLAYER PROFILE (UPDATE) */}
      {/* ============================================================================== */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-5 space-y-3.5 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Edit Player Record</h3>
                <span className="font-mono text-[11px] font-bold text-primary-green">
                  {editingPlayer.registration_id}
                </span>
              </div>
              <button
                onClick={() => setEditingPlayer(null)}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditPlayerSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.full_name}
                    onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full h-8.5 px-3 rounded-lg border border-slate-200 text-xs text-slate-900 focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full h-8.5 px-3 rounded-lg border border-slate-200 text-xs text-slate-900 focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.mobile}
                    onChange={e => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full h-8.5 px-3 rounded-lg border border-slate-200 text-xs text-slate-900 focus-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.city}
                    onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full h-8.5 px-3 rounded-lg border border-slate-200 text-xs text-slate-900 focus-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full h-8.5 px-3 rounded-lg border border-slate-200 text-xs text-slate-900 focus-ring"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                    Playing Role
                  </label>
                  <select
                    value={editForm.playing_role}
                    onChange={e =>
                      setEditForm({
                        ...editForm,
                        playing_role: e.target.value as EditPlayerFormState['playing_role']
                      })
                    }
                    className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white"
                  >
                    <option value="batsman">Batsman</option>
                    <option value="bowler">Bowler</option>
                    <option value="all_rounder">All-Rounder</option>
                    <option value="wicketkeeper">Wicketkeeper</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                    Batting
                  </label>
                  <select
                    value={editForm.batting_style}
                    onChange={e =>
                      setEditForm({
                        ...editForm,
                        batting_style: e.target.value as EditPlayerFormState['batting_style']
                      })
                    }
                    className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white"
                  >
                    <option value="right_hand">Right Hand</option>
                    <option value="left_hand">Left Hand</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                    Bowling Arm
                  </label>
                  <select
                    value={editForm.bowling_arm}
                    onChange={e =>
                      setEditForm({
                        ...editForm,
                        bowling_arm: e.target.value as EditPlayerFormState['bowling_arm']
                      })
                    }
                    className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white"
                  >
                    <option value="right_arm">Right Arm</option>
                    <option value="left_arm">Left Arm</option>
                    <option value="do_not_bowl">Do Not Bowl</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                    Reg Status
                  </label>
                  <select
                    value={editForm.registration_status}
                    onChange={e =>
                      setEditForm({
                        ...editForm,
                        registration_status: e.target.value as EditPlayerFormState['registration_status']
                      })
                    }
                    className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white"
                  >
                    <option value="approved">Approved</option>
                    <option value="under_review">Under Review</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg bg-primary-green hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-xs"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL 3: DELETE CONFIRMATION (SINGLE PLAYER) */}
      {/* ============================================================================== */}
      {deletingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-3.5 shadow-xl border border-red-200 animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-slate-900">Delete Player Registration?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete <strong>{deletingPlayer.full_name}</strong> ({deletingPlayer.registration_id})? This will permanently remove their profile and payment records.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={() => setDeletingPlayer(null)}
                className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSingle}
                disabled={actionLoading}
                className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs"
              >
                {actionLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL 4: DELETE SELECTED CONFIRMATION (BULK) */}
      {/* ============================================================================== */}
      {isDeleteSelectedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-3.5 shadow-xl border border-red-200 animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-slate-900">
                Delete {selectedIds.size} Selected Players?
              </h3>
              <p className="text-xs text-slate-500">
                You are about to permanently delete <strong>{selectedIds.size}</strong> players and their associated payment records.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={() => setIsDeleteSelectedModalOpen(false)}
                className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={actionLoading}
                className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs"
              >
                {actionLoading ? 'Deleting...' : `Delete ${selectedIds.size} Players`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL 5: DELETE ALL PLAYERS CONFIRMATION */}
      {/* ============================================================================== */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-3.5 shadow-xl border border-red-300 animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-red-900">Emergency: Delete All Players</h3>
              <p className="text-xs text-slate-500">
                This will delete <strong>ALL {allPlayers.length} player registrations</strong> and clear the entire tournament docket.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-800 uppercase">
                Type <span className="text-red-600">DELETE ALL</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteAllConfirmText}
                onChange={e => setDeleteAllConfirmText(e.target.value)}
                placeholder="DELETE ALL"
                className="w-full h-8.5 px-3 rounded-lg border border-red-300 font-mono text-xs text-red-900 bg-red-50/50 focus-ring"
              />
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteAllModalOpen(false);
                  setDeleteAllConfirmText('');
                }}
                className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={actionLoading || deleteAllConfirmText !== 'DELETE ALL'}
                className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold shadow-xs"
              >
                {actionLoading ? 'Deleting...' : 'Confirm Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL 6: REJECTION REASON DIALOG */}
      {/* ============================================================================== */}
      {rejectingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-3.5 shadow-xl border border-amber-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">Reject Registration</h3>
              </div>
              <button
                onClick={() => setRejectingPlayer(null)}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-3">
              <p className="text-xs text-slate-500">
                Provide justification for rejecting <strong>{rejectingPlayer.full_name}</strong> ({rejectingPlayer.registration_id}).
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="e.g. Invalid UTR reference or blurry payment screenshot..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus-ring"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingPlayer(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL 7: VIEW PLAYER FULL DOSSIER */}
      {/* ============================================================================== */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-5 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedPlayer.profile_photo_path ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                  }
                  alt={selectedPlayer.full_name}
                  className="w-11 h-11 rounded-lg object-cover border border-slate-200"
                />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{selectedPlayer.full_name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-bold text-primary-green">
                      {selectedPlayer.registration_id}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] font-semibold capitalize text-slate-500">
                      {selectedPlayer.playing_role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const target = selectedPlayer;
                    setSelectedPlayer(null);
                    openEditModal(target);
                  }}
                  className="p-1.5 rounded-md text-blue-700 hover:bg-blue-50"
                  title="Edit player"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3.5 text-xs">
              {/* Contact */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-primary-green">
                  Contact & Residence
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Phone</span>
                    <span className="font-semibold text-slate-800 font-mono">{selectedPlayer.mobile}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Email</span>
                    <span className="font-semibold text-slate-800 truncate block">{selectedPlayer.email}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">City</span>
                    <span className="font-semibold text-slate-800">{selectedPlayer.city}</span>
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Residential Address</span>
                  <p className="font-medium text-slate-700 mt-0.5 leading-relaxed">{selectedPlayer.address}</p>
                </div>
              </div>

              {/* Cricket Technical Profile */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-primary-green">
                  Cricket Capabilities
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Batting</span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {selectedPlayer.batting_style.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Bowling Arm</span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {selectedPlayer.bowling_arm.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Bowling Type</span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {selectedPlayer.bowling_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-primary-green">
                  Emergency Contact
                </h4>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900">{selectedPlayer.emergency_contact_name}</span>
                    <span className="text-[11px] text-slate-400 ml-1.5">({selectedPlayer.emergency_relationship})</span>
                  </div>
                  <span className="font-mono text-xs text-slate-700">{selectedPlayer.emergency_mobile}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-primary-green">
                  Payment Verification Record
                </h4>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-semibold text-slate-800 block">
                      UTR: {selectedPlayer.payment?.utr_number || 'N/A'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Amount: ₹{selectedPlayer.payment?.amount || entryFee} • UPI
                    </span>
                  </div>
                  {selectedPlayer.payment?.screenshot_path && (
                    <button
                      type="button"
                      onClick={() => openPaymentReceipt(selectedPlayer)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700"
                    >
                      <Receipt className="w-3 h-3 text-slate-500" />
                      <span>View Receipt</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
              <button
                onClick={() => {
                  const p = selectedPlayer;
                  setSelectedPlayer(null);
                  setDeletingPlayer(p);
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:bg-red-50 px-2 py-1 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Player</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlayer(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                {selectedPlayer.registration_status !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedPlayer.id)}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 rounded-lg bg-primary-green hover:bg-primary-dark text-white text-xs font-bold shadow-xs"
                  >
                    Approve Registration
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL 8: RECEIPT SCREENSHOT INSPECTION MODAL */}
      {/* ============================================================================== */}
      {inspectingPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-4 space-y-3 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  UPI Payment Receipt Preview
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  {inspectingPayment.player.full_name} ({inspectingPayment.player.registration_id})
                </span>
              </div>
              <button
                onClick={() => setInspectingPayment(null)}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Image */}
            <div className="relative w-full max-h-[55vh] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center p-2">
              <img
                src={inspectingPayment.screenshotUrl}
                alt="Payment Receipt"
                className="max-h-[50vh] w-auto object-contain rounded shadow-sm"
              />
            </div>

            {/* Details Bar */}
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide block">UTR Reference Number</span>
                <span className="font-mono font-bold text-slate-900">{inspectingPayment.utr}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Amount</span>
                <span className="font-bold text-emerald-700 text-sm">₹{inspectingPayment.amount}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInspectingPayment(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleVerifyPaymentAndApprove(inspectingPayment.player)}
                disabled={actionLoading}
                className="px-4 py-1.5 rounded-lg bg-primary-green hover:bg-primary-dark text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verify Payment & Approve</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
