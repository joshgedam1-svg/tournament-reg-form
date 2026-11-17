import { PlayerWithPayment, PlayingRole, RegistrationStatus } from '@/types/player';
import { PaymentWithPlayer, PaymentStatus } from '@/types/payment';
import { PublicTournamentSettings, TournamentSettingsRow } from '@/types/settings';

// Global singleton in-memory store for demo/development when live Supabase is not yet connected
interface MockDatabaseState {
  settings: TournamentSettingsRow;
  players: PlayerWithPayment[];
  payments: PaymentWithPlayer[];
  activityLogs: Array<{
    id: string;
    admin_id: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    old_values: any;
    new_values: any;
    created_at: string;
  }>;
  nextSeq: number;
}

const initialSettings: TournamentSettingsRow = {
  id: '00000000-0000-0000-0000-000000000001',
  tournament_name: 'Cricket Auction League 2026',
  registration_fee: 500,
  upi_id: 'cricketauctionleague@okhdfcbank',
  upi_qr_path: null,
  maximum_player_capacity: 100,
  registration_open: true,
  registration_instructions:
    'Scan QR or copy UPI ID. Pay ₹500 from your UPI app (Google Pay, PhonePe, Paytm). Copy the 12-digit UTR and upload the payment screenshot.',
  registration_start_date: '2026-01-01T00:00',
  registration_end_date: '2027-12-31T23:59',
  banner_image_path: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80',
  banner_title: 'Cricket Auction League 2026',
  banner_subtitle: 'Grand Season Registration • Form Your Legacy on the Pitch',
  banner_enabled: true,
  support_phone: '+91 98765 43210',
  support_whatsapp: '+91 98765 43210',
  support_email: 'support@cricketauctionleague.com',
  updated_by: null,
  updated_at: new Date().toISOString()
};

const initialPlayers: PlayerWithPayment[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    registration_id: 'CAL-2026-000001',
    full_name: 'Rohit Sharma',
    email: 'rohit.sharma@example.com',
    mobile: '+91 98765 43210',
    date_of_birth: '1998-04-30',
    city: 'Mumbai',
    address: 'A-402, Sea Green Heights, Shivaji Park Lane, Dadar West, Mumbai 400028',
    profile_photo_path: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    playing_role: 'batsman',
    batting_style: 'right_hand',
    bowling_arm: 'right_arm',
    bowling_type: 'spin',
    experience_level: '5_plus_years',
    previous_team_name: 'Shivaji Park Strikers',
    previous_captain_name: 'Pravin Tambe',
    previous_tournament: true,
    previous_tournament_name: 'Mumbai Premier League 2024',
    additional_information: 'Top run scorer in local T20 cup with 342 runs in 7 innings at 148.5 strike rate.',
    emergency_contact_name: 'Suresh Sharma',
    emergency_relationship: 'Father',
    emergency_mobile: '+91 98765 11223',
    registration_status: 'approved',
    rejection_reason: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    payment: {
      id: 'p1111111-1111-1111-1111-111111111111',
      amount: 500,
      currency: 'INR',
      payment_method: 'UPI',
      utr_number: '403928174629',
      screenshot_path: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      payment_status: 'verified',
      rejection_reason: null,
      verified_at: new Date(Date.now() - 86400000).toISOString()
    }
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    registration_id: 'CAL-2026-000002',
    full_name: 'Jasprit Bumrah',
    email: 'jasprit.b@example.com',
    mobile: '+91 98111 22334',
    date_of_birth: '1999-12-06',
    city: 'Ahmedabad',
    address: 'B-12, Heritage Enclave, Drive-In Road, Ahmedabad 380054',
    profile_photo_path: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    playing_role: 'bowler',
    batting_style: 'right_hand',
    bowling_arm: 'right_arm',
    bowling_type: 'fast',
    experience_level: '5_plus_years',
    previous_team_name: 'Gujarat Lions Club',
    previous_captain_name: 'Parthiv Patel',
    previous_tournament: true,
    previous_tournament_name: 'Gujarat T20 Trophy',
    additional_information: 'Right-arm express pacer with yorker accuracy and economy under 6.5 in death overs.',
    emergency_contact_name: 'Daljit Kaur',
    emergency_relationship: 'Mother',
    emergency_mobile: '+91 98111 99887',
    registration_status: 'under_review',
    rejection_reason: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    payment: {
      id: 'p2222222-2222-2222-2222-222222222222',
      amount: 500,
      currency: 'INR',
      payment_method: 'UPI',
      utr_number: '403928174630',
      screenshot_path: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      payment_status: 'pending_verification',
      rejection_reason: null,
      verified_at: null
    }
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    registration_id: 'CAL-2026-000003',
    full_name: 'Ravindra Jadeja',
    email: 'ravindra.j@example.com',
    mobile: '+91 98222 33445',
    date_of_birth: '1997-08-15',
    city: 'Rajkot',
    address: 'Rajkot Cricket Academy Campus, Kalawad Road, Rajkot 360005',
    profile_photo_path: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    playing_role: 'all_rounder',
    batting_style: 'left_hand',
    bowling_arm: 'left_arm',
    bowling_type: 'spin',
    experience_level: '5_plus_years',
    previous_team_name: 'Saurashtra Stars',
    previous_captain_name: 'Jaydev Unadkat',
    previous_tournament: true,
    previous_tournament_name: 'Saurashtra Premier Cup',
    additional_information: 'Left-arm orthodox spinner and hard-hitting middle order batsman, elite fielding stats.',
    emergency_contact_name: 'Anirudh Jadeja',
    emergency_relationship: 'Father',
    emergency_mobile: '+91 98222 88776',
    registration_status: 'approved',
    rejection_reason: null,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    payment: {
      id: 'p3333333-3333-3333-3333-333333333333',
      amount: 500,
      currency: 'INR',
      payment_method: 'UPI',
      utr_number: '403928174631',
      screenshot_path: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      payment_status: 'verified',
      rejection_reason: null,
      verified_at: new Date(Date.now() - 3600000 * 4).toISOString()
    }
  },
  {
    id: 'd4444444-4444-4444-4444-444444444444',
    registration_id: 'CAL-2026-000004',
    full_name: 'Rishabh Pant',
    email: 'rishabh.p@example.com',
    mobile: '+91 98333 44556',
    date_of_birth: '2001-10-04',
    city: 'Delhi',
    address: 'House 14, Roorkee Road, Civil Lines, Delhi 110054',
    profile_photo_path: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    playing_role: 'wicketkeeper',
    batting_style: 'left_hand',
    bowling_arm: 'do_not_bowl',
    bowling_type: 'not_applicable',
    experience_level: '3_5_years',
    previous_team_name: 'Delhi Challengers',
    previous_captain_name: 'Ishant Sharma',
    previous_tournament: true,
    previous_tournament_name: 'Delhi Club Championship',
    additional_information: 'Aggressive left-handed wicketkeeper batsman, 28 dismissals and 410 runs last season.',
    emergency_contact_name: 'Saroj Pant',
    emergency_relationship: 'Mother',
    emergency_mobile: '+91 98333 77665',
    registration_status: 'under_review',
    rejection_reason: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    payment: {
      id: 'p4444444-4444-4444-4444-444444444444',
      amount: 500,
      currency: 'INR',
      payment_method: 'UPI',
      utr_number: '403928174632',
      screenshot_path: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      payment_status: 'pending_verification',
      rejection_reason: null,
      verified_at: null
    }
  }
];

// Rebuild initial payments with player info
const initialPaymentsList: PaymentWithPlayer[] = initialPlayers.map(p => ({
  id: p.payment!.id,
  player_id: p.id,
  amount: p.payment!.amount,
  currency: p.payment!.currency,
  payment_method: p.payment!.payment_method,
  utr_number: p.payment!.utr_number,
  screenshot_path: p.payment!.screenshot_path,
  payment_status: p.payment!.payment_status,
  rejection_reason: p.payment!.rejection_reason,
  verified_by: null,
  verified_at: p.payment!.verified_at,
  created_at: p.created_at,
  updated_at: p.updated_at,
  player: {
    id: p.id,
    registration_id: p.registration_id,
    full_name: p.full_name,
    email: p.email,
    mobile: p.mobile,
    playing_role: p.playing_role,
    city: p.city,
    profile_photo_path: p.profile_photo_path
  }
}));

// Use globalThis so state persists across hot reload in dev
const globalMock = globalThis as unknown as { __MOCK_DB__: MockDatabaseState };

if (!globalMock.__MOCK_DB__) {
  globalMock.__MOCK_DB__ = {
    settings: { ...initialSettings },
    players: [...initialPlayers],
    payments: [...initialPaymentsList],
    activityLogs: [
      {
        id: 'log-1',
        admin_id: 'admin-super',
        action: 'payment_verified',
        entity_type: 'payment',
        entity_id: 'p1111111-1111-1111-1111-111111111111',
        old_values: { payment_status: 'pending_verification' },
        new_values: { payment_status: 'verified' },
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'log-2',
        admin_id: 'admin-super',
        action: 'payment_verified',
        entity_type: 'payment',
        entity_id: 'p3333333-3333-3333-3333-333333333333',
        old_values: { payment_status: 'pending_verification' },
        new_values: { payment_status: 'verified' },
        created_at: new Date(Date.now() - 3600000 * 4).toISOString()
      }
    ],
    nextSeq: 5
  };
}

export const mockStore = {
  getSettings(): TournamentSettingsRow {
    return { ...globalMock.__MOCK_DB__.settings };
  },

  updateSettings(data: Partial<TournamentSettingsRow>): TournamentSettingsRow {
    globalMock.__MOCK_DB__.settings = {
      ...globalMock.__MOCK_DB__.settings,
      ...data,
      updated_at: new Date().toISOString()
    };
    return { ...globalMock.__MOCK_DB__.settings };
  },

  getPlayers(filter?: { status?: string; role?: string; search?: string }): PlayerWithPayment[] {
    let list = [...globalMock.__MOCK_DB__.players];

    if (filter?.status) {
      if (filter.status === 'verified') {
        list = list.filter(p => p.payment?.payment_status === 'verified');
      } else if (filter.status === 'pending') {
        list = list.filter(p => p.payment?.payment_status === 'pending_verification');
      } else if (filter.status === 'rejected') {
        list = list.filter(p => p.payment?.payment_status === 'rejected' || p.registration_status === 'rejected');
      } else {
        list = list.filter(p => p.registration_status === filter.status);
      }
    }

    if (filter?.role) {
      list = list.filter(p => p.playing_role === filter.role);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        p =>
          p.full_name.toLowerCase().includes(q) ||
          p.registration_id.toLowerCase().includes(q) ||
          p.mobile.includes(q) ||
          p.city.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getPlayerById(idOrRegId: string): PlayerWithPayment | undefined {
    return globalMock.__MOCK_DB__.players.find(
      p => p.id === idOrRegId || p.registration_id.toLowerCase() === idOrRegId.toLowerCase()
    );
  },

  getPayments(filter?: { status?: string; search?: string }): PaymentWithPlayer[] {
    let list = [...globalMock.__MOCK_DB__.payments];

    if (filter?.status) {
      list = list.filter(p => p.payment_status === filter.status);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        p =>
          p.player.full_name.toLowerCase().includes(q) ||
          p.player.registration_id.toLowerCase().includes(q) ||
          p.utr_number.includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  createRegistration(formData: any): { player: PlayerWithPayment; payment: PaymentWithPlayer } {
    const seq = globalMock.__MOCK_DB__.nextSeq++;
    const year = new Date().getFullYear();
    const regId = `CAL-${year}-${String(seq).padStart(6, '0')}`;
    const playerId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Check duplicate mobile, email or UTR
    const cleanMobile = formData.mobile.replace(/\D/g, '').slice(-10);
    const duplicateMobile = globalMock.__MOCK_DB__.players.find(
      p => p.mobile.replace(/\D/g, '').slice(-10) === cleanMobile
    );
    if (duplicateMobile) {
      throw new Error(`Mobile number '${formData.mobile}' is already registered under Registration ID: ${duplicateMobile.registration_id}. Duplicate entries are not allowed.`);
    }

    const cleanEmail = (formData.email || '').trim().toLowerCase();
    const duplicateEmail = globalMock.__MOCK_DB__.players.find(
      p => p.email.trim().toLowerCase() === cleanEmail
    );
    if (duplicateEmail) {
      throw new Error(`Email address '${formData.email}' is already registered under Registration ID: ${duplicateEmail.registration_id}. Duplicate entries are not allowed.`);
    }

    const cleanUtr = (formData.utr_number || '').trim().toUpperCase();
    const duplicateUtr = globalMock.__MOCK_DB__.payments.find(
      p => p.utr_number.trim().toUpperCase() === cleanUtr
    );
    if (duplicateUtr) {
      throw new Error(`Payment UTR / Transaction Reference '${formData.utr_number}' has already been submitted. Duplicate payments are not allowed.`);
    }

    const newPaymentRecord = {
      id: paymentId,
      amount: formData.amount || globalMock.__MOCK_DB__.settings.registration_fee || 500,
      currency: 'INR',
      payment_method: 'UPI',
      utr_number: formData.utr_number,
      screenshot_path: formData.screenshot_path,
      payment_status: 'pending_verification' as PaymentStatus,
      rejection_reason: null,
      verified_at: null
    };

    const newPlayer: PlayerWithPayment = {
      id: playerId,
      registration_id: regId,
      full_name: formData.full_name,
      email: formData.email,
      mobile: formData.mobile,
      date_of_birth: formData.date_of_birth,
      city: formData.city,
      address: formData.address,
      profile_photo_path: formData.profile_photo_path || null,
      playing_role: formData.playing_role,
      batting_style: formData.batting_style,
      bowling_arm: formData.bowling_arm,
      bowling_type: formData.bowling_type,
      experience_level: formData.experience_level || 'beginner',
      previous_team_name: formData.previous_team_name || null,
      previous_captain_name: formData.previous_captain_name || null,
      previous_tournament: Boolean(formData.previous_tournament),
      previous_tournament_name: formData.previous_tournament_name || null,
      additional_information: formData.additional_information || null,
      emergency_contact_name: formData.emergency_contact_name,
      emergency_relationship: formData.emergency_relationship,
      emergency_mobile: formData.emergency_mobile,
      registration_status: 'under_review' as RegistrationStatus,
      rejection_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      payment: newPaymentRecord
    };

    const newPayment: PaymentWithPlayer = {
      ...newPaymentRecord,
      player_id: playerId,
      verified_by: null,
      created_at: newPlayer.created_at,
      updated_at: newPlayer.updated_at,
      player: {
        id: playerId,
        registration_id: regId,
        full_name: newPlayer.full_name,
        email: newPlayer.email,
        mobile: newPlayer.mobile,
        playing_role: newPlayer.playing_role,
        city: newPlayer.city,
        profile_photo_path: newPlayer.profile_photo_path
      }
    };

    globalMock.__MOCK_DB__.players.unshift(newPlayer);
    globalMock.__MOCK_DB__.payments.unshift(newPayment);

    return { player: newPlayer, payment: newPayment };
  },

  verifyPayment(paymentId: string, adminId: string = 'admin'): PaymentWithPlayer {
    const verifiedCount = globalMock.__MOCK_DB__.payments.filter(p => p.payment_status === 'verified').length;
    const maxCapacity = globalMock.__MOCK_DB__.settings.maximum_player_capacity;

    if (verifiedCount >= maxCapacity) {
      throw new Error(`Tournament capacity of ${maxCapacity} players has been reached.`);
    }

    const paymentIndex = globalMock.__MOCK_DB__.payments.findIndex(p => p.id === paymentId);
    if (paymentIndex === -1) {
      throw new Error('Payment record not found.');
    }

    const currentPayment = globalMock.__MOCK_DB__.payments[paymentIndex];
    if (currentPayment.payment_status !== 'pending_verification') {
      throw new Error(`Payment is already marked as ${currentPayment.payment_status}`);
    }

    const updatedPayment: PaymentWithPlayer = {
      ...currentPayment,
      payment_status: 'verified',
      verified_by: adminId,
      verified_at: new Date().toISOString(),
      rejection_reason: null,
      updated_at: new Date().toISOString()
    };

    globalMock.__MOCK_DB__.payments[paymentIndex] = updatedPayment;

    // Update player's embedded payment
    const playerIndex = globalMock.__MOCK_DB__.players.findIndex(p => p.id === currentPayment.player_id);
    if (playerIndex !== -1) {
      globalMock.__MOCK_DB__.players[playerIndex].payment = {
        id: updatedPayment.id,
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        payment_method: updatedPayment.payment_method,
        utr_number: updatedPayment.utr_number,
        screenshot_path: updatedPayment.screenshot_path,
        payment_status: 'verified',
        rejection_reason: null,
        verified_at: updatedPayment.verified_at
      };
    }

    globalMock.__MOCK_DB__.activityLogs.unshift({
      id: `log-${Date.now()}`,
      admin_id: adminId,
      action: 'payment_verified',
      entity_type: 'payment',
      entity_id: paymentId,
      old_values: { payment_status: 'pending_verification' },
      new_values: { payment_status: 'verified', verified_at: updatedPayment.verified_at },
      created_at: new Date().toISOString()
    });

    return updatedPayment;
  },

  rejectPayment(paymentId: string, reason: string, adminId: string = 'admin'): PaymentWithPlayer {
    const paymentIndex = globalMock.__MOCK_DB__.payments.findIndex(p => p.id === paymentId);
    if (paymentIndex === -1) {
      throw new Error('Payment record not found.');
    }

    const currentPayment = globalMock.__MOCK_DB__.payments[paymentIndex];
    const updatedPayment: PaymentWithPlayer = {
      ...currentPayment,
      payment_status: 'rejected',
      rejection_reason: reason,
      verified_by: adminId,
      updated_at: new Date().toISOString()
    };

    globalMock.__MOCK_DB__.payments[paymentIndex] = updatedPayment;

    // Also update in player record
    const playerIndex = globalMock.__MOCK_DB__.players.findIndex(p => p.id === currentPayment.player_id);
    if (playerIndex !== -1) {
      globalMock.__MOCK_DB__.players[playerIndex].payment = {
        id: updatedPayment.id,
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        payment_method: updatedPayment.payment_method,
        utr_number: updatedPayment.utr_number,
        screenshot_path: updatedPayment.screenshot_path,
        payment_status: 'rejected',
        rejection_reason: reason,
        verified_at: null
      };
    }

    globalMock.__MOCK_DB__.activityLogs.unshift({
      id: `log-${Date.now()}`,
      admin_id: adminId,
      action: 'payment_rejected',
      entity_type: 'payment',
      entity_id: paymentId,
      old_values: { payment_status: currentPayment.payment_status },
      new_values: { payment_status: 'rejected', rejection_reason: reason },
      created_at: new Date().toISOString()
    });

    return updatedPayment;
  },

  approveRegistration(playerId: string, adminId: string = 'admin'): PlayerWithPayment {
    const index = globalMock.__MOCK_DB__.players.findIndex(p => p.id === playerId);
    if (index === -1) throw new Error('Player not found');

    const oldStatus = globalMock.__MOCK_DB__.players[index].registration_status;
    globalMock.__MOCK_DB__.players[index].registration_status = 'approved';
    globalMock.__MOCK_DB__.players[index].rejection_reason = null;
    globalMock.__MOCK_DB__.players[index].updated_at = new Date().toISOString();

    globalMock.__MOCK_DB__.activityLogs.unshift({
      id: `log-${Date.now()}`,
      admin_id: adminId,
      action: 'registration_approved',
      entity_type: 'player',
      entity_id: playerId,
      old_values: { registration_status: oldStatus },
      new_values: { registration_status: 'approved' },
      created_at: new Date().toISOString()
    });

    return globalMock.__MOCK_DB__.players[index];
  },

  deletePlayer(playerId: string, adminId: string = 'admin'): boolean {
    const pIndex = globalMock.__MOCK_DB__.players.findIndex(p => p.id === playerId);
    if (pIndex === -1) return false;

    const removed = globalMock.__MOCK_DB__.players.splice(pIndex, 1)[0];
    globalMock.__MOCK_DB__.payments = globalMock.__MOCK_DB__.payments.filter(pay => pay.player_id !== playerId);

    globalMock.__MOCK_DB__.activityLogs.unshift({
      id: `log-${Date.now()}`,
      admin_id: adminId,
      action: 'player_deleted',
      entity_type: 'player',
      entity_id: playerId,
      old_values: { full_name: removed.full_name, registration_id: removed.registration_id },
      new_values: null,
      created_at: new Date().toISOString()
    });

    return true;
  },

  deletePlayers(playerIds: string[], adminId: string = 'admin'): number {
    const idSet = new Set(playerIds);
    const beforeCount = globalMock.__MOCK_DB__.players.length;

    globalMock.__MOCK_DB__.players = globalMock.__MOCK_DB__.players.filter(p => !idSet.has(p.id));
    globalMock.__MOCK_DB__.payments = globalMock.__MOCK_DB__.payments.filter(pay => !idSet.has(pay.player_id));

    const deletedCount = beforeCount - globalMock.__MOCK_DB__.players.length;

    globalMock.__MOCK_DB__.activityLogs.unshift({
      id: `log-${Date.now()}`,
      admin_id: adminId,
      action: 'bulk_players_deleted',
      entity_type: 'player',
      entity_id: null,
      old_values: { count: deletedCount, ids: playerIds },
      new_values: null,
      created_at: new Date().toISOString()
    });

    return deletedCount;
  },

  deleteAllPlayers(adminId: string = 'admin'): number {
    const count = globalMock.__MOCK_DB__.players.length;
    globalMock.__MOCK_DB__.players = [];
    globalMock.__MOCK_DB__.payments = [];

    globalMock.__MOCK_DB__.activityLogs.unshift({
      id: `log-${Date.now()}`,
      admin_id: adminId,
      action: 'all_players_deleted',
      entity_type: 'player',
      entity_id: null,
      old_values: { count },
      new_values: null,
      created_at: new Date().toISOString()
    });

    return count;
  },

  createAdminPlayer(playerData: any, adminId: string = 'admin'): PlayerWithPayment {
    const seq = globalMock.__MOCK_DB__.nextSeq++;
    const regId = `CAL-${new Date().getFullYear()}-${String(seq).padStart(6, '0')}`;
    const playerId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newPaymentRecord = {
      id: paymentId,
      amount: playerData.amount || globalMock.__MOCK_DB__.settings.registration_fee || 500,
      currency: 'INR',
      payment_method: 'UPI',
      utr_number: playerData.utr_number || `MANUAL-${Date.now()}`.substring(0, 12),
      screenshot_path: playerData.screenshot_path || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      payment_status: (playerData.payment_status || 'verified') as PaymentStatus,
      rejection_reason: null,
      verified_at: playerData.payment_status === 'verified' ? new Date().toISOString() : null
    };

    const newPlayer: PlayerWithPayment = {
      id: playerId,
      registration_id: regId,
      full_name: playerData.full_name,
      email: playerData.email,
      mobile: playerData.mobile,
      date_of_birth: playerData.date_of_birth || '2000-01-01',
      city: playerData.city || 'Mumbai',
      address: playerData.address || 'Address provided by Admin',
      profile_photo_path: playerData.profile_photo_path || null,
      playing_role: playerData.playing_role || 'batsman',
      batting_style: playerData.batting_style || 'right_hand',
      bowling_arm: playerData.bowling_arm || 'right_arm',
      bowling_type: playerData.bowling_type || 'medium',
      experience_level: playerData.experience_level || 'beginner',
      previous_team_name: playerData.previous_team_name || null,
      previous_captain_name: playerData.previous_captain_name || null,
      previous_tournament: Boolean(playerData.previous_tournament),
      previous_tournament_name: playerData.previous_tournament_name || null,
      additional_information: playerData.additional_information || null,
      emergency_contact_name: playerData.emergency_contact_name || 'Contact Info',
      emergency_relationship: playerData.emergency_relationship || 'Family',
      emergency_mobile: playerData.emergency_mobile || playerData.mobile,
      registration_status: (playerData.registration_status || (playerData.payment_status === 'verified' ? 'approved' : 'under_review')) as RegistrationStatus,
      rejection_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      payment: newPaymentRecord
    };

    const newPayment: PaymentWithPlayer = {
      ...newPaymentRecord,
      player_id: playerId,
      verified_by: adminId,
      created_at: newPlayer.created_at,
      updated_at: newPlayer.updated_at,
      player: {
        id: playerId,
        registration_id: regId,
        full_name: newPlayer.full_name,
        email: newPlayer.email,
        mobile: newPlayer.mobile,
        playing_role: newPlayer.playing_role,
        city: newPlayer.city,
        profile_photo_path: newPlayer.profile_photo_path
      }
    };

    globalMock.__MOCK_DB__.players.unshift(newPlayer);
    globalMock.__MOCK_DB__.payments.unshift(newPayment);

    globalMock.__MOCK_DB__.activityLogs.unshift({
      id: `log-${Date.now()}`,
      admin_id: adminId,
      action: 'admin_player_created',
      entity_type: 'player',
      entity_id: playerId,
      old_values: null,
      new_values: { full_name: newPlayer.full_name, registration_id: regId },
      created_at: new Date().toISOString()
    });

    return newPlayer;
  },

  rejectRegistration(playerId: string, reason: string, adminId: string = 'admin'): PlayerWithPayment {
    const index = globalMock.__MOCK_DB__.players.findIndex(p => p.id === playerId);
    if (index === -1) throw new Error('Player not found');

    const oldStatus = globalMock.__MOCK_DB__.players[index].registration_status;
    globalMock.__MOCK_DB__.players[index].registration_status = 'rejected';
    globalMock.__MOCK_DB__.players[index].rejection_reason = reason;
    globalMock.__MOCK_DB__.players[index].updated_at = new Date().toISOString();

    globalMock.__MOCK_DB__.activityLogs.unshift({
      id: `log-${Date.now()}`,
      admin_id: adminId,
      action: 'registration_rejected',
      entity_type: 'player',
      entity_id: playerId,
      old_values: { registration_status: oldStatus },
      new_values: { registration_status: 'rejected', rejection_reason: reason },
      created_at: new Date().toISOString()
    });

    return globalMock.__MOCK_DB__.players[index];
  },

  getStatistics() {
    const players = globalMock.__MOCK_DB__.players;
    const payments = globalMock.__MOCK_DB__.payments;
    const settings = globalMock.__MOCK_DB__.settings;

    const totalRegistrations = players.length;
    const verifiedPayments = payments.filter(p => p.payment_status === 'verified');
    const verifiedPlayersCount = verifiedPayments.length;
    const pendingPaymentsCount = payments.filter(p => p.payment_status === 'pending_verification').length;
    const rejectedPaymentsCount = payments.filter(p => p.payment_status === 'rejected').length;

    const remainingSlots = Math.max(0, settings.maximum_player_capacity - verifiedPlayersCount);
    const capacityProgress = settings.maximum_player_capacity > 0
      ? Math.min(100, Math.round((verifiedPlayersCount / settings.maximum_player_capacity) * 100))
      : 0;

    const totalCollection = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);

    // Role-wise breakdown of verified players
    const roleStats: Record<PlayingRole, number> = {
      batsman: 0,
      bowler: 0,
      all_rounder: 0,
      wicketkeeper: 0
    };

    players.forEach(p => {
      if (p.payment?.payment_status === 'verified') {
        if (roleStats[p.playing_role] !== undefined) {
          roleStats[p.playing_role]++;
        }
      }
    });

    return {
      totalRegistrations,
      verifiedPlayersCount,
      pendingPaymentsCount,
      rejectedPaymentsCount,
      maximumCapacity: settings.maximum_player_capacity,
      remainingSlots,
      capacityProgress,
      totalCollection,
      roleStats,
      registrationOpen: settings.registration_open,
      recentLogs: globalMock.__MOCK_DB__.activityLogs.slice(0, 10)
    };
  }
};

