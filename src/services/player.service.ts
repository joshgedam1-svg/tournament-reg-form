import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getAdminClient } from '@/lib/supabase/admin';
import { mockStore } from '@/lib/mockStore';
import { PlayerWithPayment } from '@/types/player';

const toValidUuid = (val?: string | null): string | null =>
  val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val) ? val : null;

export const playerService = {
  async getPlayers(filter?: { status?: string; role?: string; search?: string }): Promise<PlayerWithPayment[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getAdminClient();
        let query = supabase.from('players').select('*, payments(*)').order('created_at', { ascending: false });

        if (filter?.role) {
          query = query.eq('playing_role', filter.role);
        }

        if (filter?.status) {
          if (filter.status === 'verified' || filter.status === 'pending') {
            // will filter via payment status
          } else {
            query = query.eq('registration_status', filter.status);
          }
        }

        if (filter?.search) {
          query = query.or(`full_name.ilike.%${filter.search}%,registration_id.ilike.%${filter.search}%,city.ilike.%${filter.search}%`);
        }

        const { data, error } = await query;
        if (!error && data) {
          let mapped: PlayerWithPayment[] = data.map((p: any) => ({
            ...p,
            payment: p.payments?.[0] || null
          }));

          if (filter?.status === 'verified') {
            mapped = mapped.filter(p => p.payment?.payment_status === 'verified');
          } else if (filter?.status === 'pending') {
            mapped = mapped.filter(p => p.payment?.payment_status === 'pending_verification');
          } else if (filter?.status === 'rejected') {
            mapped = mapped.filter(p => p.payment?.payment_status === 'rejected' || p.registration_status === 'rejected');
          }

          return mapped;
        }
      } catch (err) {
        console.error('Supabase getPlayers error:', err);
      }
    }

    return mockStore.getPlayers(filter);
  },

  async getPlayerById(id: string): Promise<PlayerWithPayment | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getAdminClient();
        const { data, error } = await supabase
          .from('players')
          .select('*, payments(*)')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          const p = data as any;
          return {
            ...p,
            payment: p.payments?.[0] || null
          } as PlayerWithPayment;
        }
      } catch (err) {
        console.error('Supabase getPlayerById error:', err);
      }
    }

    return mockStore.getPlayerById(id) || null;
  },

  async approveRegistration(id: string, adminId: string = 'admin'): Promise<PlayerWithPayment> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getAdminClient();
        const { data, error } = await supabase
          .from('players')
          .update({
            registration_status: 'approved',
            rejection_reason: null,
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', id)
          .select('*, payments(*)')
          .single();

        if (!error && data) {
          const validAdminUuid = toValidUuid(adminId);
          // Synchronize payment status to 'verified'
          await supabase
            .from('payments')
            .update({
              payment_status: 'verified',
              verified_by: validAdminUuid,
              verified_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as any)
            .eq('player_id', id);

          await supabase.from('admin_activity_logs').insert({
            admin_id: validAdminUuid,
            action: 'registration_approved',
            entity_type: 'player',
            entity_id: id,
            new_values: { registration_status: 'approved', payment_status: 'verified' }
          } as any);

          const p = data as any;
          const payment = p.payments?.[0] ? { ...p.payments[0], payment_status: 'verified' } : null;
          return {
            ...p,
            registration_status: 'approved',
            payment
          } as PlayerWithPayment;
        }
      } catch (err) {
        console.error('Supabase approveRegistration error:', err);
      }
    }

    return mockStore.approveRegistration(id, adminId);
  },

  async rejectRegistration(id: string, reason: string, adminId: string = 'admin'): Promise<PlayerWithPayment> {
    if (!reason || !reason.trim()) {
      throw new Error('A rejection reason is required');
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getAdminClient();
        const { data, error } = await supabase
          .from('players')
          .update({
            registration_status: 'rejected',
            rejection_reason: reason.trim(),
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', id)
          .select('*, payments(*)')
          .single();

        if (!error && data) {
          // Synchronize payment status to 'rejected'
          await supabase
            .from('payments')
            .update({
              payment_status: 'rejected',
              rejection_reason: reason.trim(),
              verified_by: adminId !== 'admin' ? adminId : null,
              updated_at: new Date().toISOString()
            } as any)
            .eq('player_id', id);

          await supabase.from('admin_activity_logs').insert({
            admin_id: adminId !== 'admin' ? adminId : null,
            action: 'registration_rejected',
            entity_type: 'player',
            entity_id: id,
            new_values: { registration_status: 'rejected', rejection_reason: reason.trim() }
          } as any);

          const p = data as any;
          const payment = p.payments?.[0] ? { ...p.payments[0], payment_status: 'rejected', rejection_reason: reason.trim() } : null;
          return {
            ...p,
            registration_status: 'rejected',
            payment
          } as PlayerWithPayment;
        }
      } catch (err) {
        console.error('Supabase rejectRegistration error:', err);
      }
    }

    return mockStore.rejectRegistration(id, reason.trim(), adminId);
  },

  async updatePlayer(id: string, updates: Partial<PlayerWithPayment>, adminId: string = 'admin'): Promise<PlayerWithPayment> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getAdminClient();
        const { data, error } = await supabase
          .from('players')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', id)
          .select('*, payments(*)')
          .single();

        if (!error && data) {
          const validAdminUuid = toValidUuid(adminId);
          const p = data as any;
          let payment = p.payments?.[0] || null;

          // Keep payment_status synchronized when registration_status is changed via Edit
          if (updates.registration_status === 'approved') {
            await supabase
              .from('payments')
              .update({
                payment_status: 'verified',
                verified_by: validAdminUuid,
                verified_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } as any)
              .eq('player_id', id);
            if (payment) payment = { ...payment, payment_status: 'verified' };
          } else if (updates.registration_status === 'rejected') {
            await supabase
              .from('payments')
              .update({
                payment_status: 'rejected',
                updated_at: new Date().toISOString()
              } as any)
              .eq('player_id', id);
            if (payment) payment = { ...payment, payment_status: 'rejected' };
          } else if (updates.registration_status === 'under_review') {
            await supabase
              .from('payments')
              .update({
                payment_status: 'pending_verification',
                updated_at: new Date().toISOString()
              } as any)
              .eq('player_id', id);
            if (payment) payment = { ...payment, payment_status: 'pending_verification' };
          }

          await supabase.from('admin_activity_logs').insert({
            admin_id: validAdminUuid,
            action: 'player_details_updated',
            entity_type: 'player',
            entity_id: id,
            new_values: updates
          } as any);

          return {
            ...p,
            payment
          } as PlayerWithPayment;
        }
      } catch (err) {
        console.error('Supabase updatePlayer error:', err);
      }
    }

    const player = mockStore.getPlayerById(id);
    if (!player) throw new Error('Player not found');
    Object.assign(player, updates, { updated_at: new Date().toISOString() });
    return player;
  },

  async createPlayer(playerData: any, adminId: string = 'admin'): Promise<PlayerWithPayment> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getAdminClient();
        const { data: player, error: playerError } = await supabase
          .from('players')
          .insert({
            full_name: playerData.full_name,
            email: playerData.email,
            mobile: playerData.mobile,
            date_of_birth: playerData.date_of_birth || '2000-01-01',
            city: playerData.city || 'Mumbai',
            address: playerData.address || 'Address registered by Admin',
            profile_photo_path: playerData.profile_photo_path || null,
            playing_role: playerData.playing_role || 'batsman',
            batting_style: playerData.batting_style || 'right_hand',
            bowling_arm: playerData.bowling_arm || 'right_arm',
            bowling_type: playerData.bowling_type || 'medium',
            experience_level: playerData.experience_level || 'beginner',
            emergency_contact_name: playerData.emergency_contact_name || 'Emergency Contact',
            emergency_relationship: playerData.emergency_relationship || 'Family',
            emergency_mobile: playerData.emergency_mobile || playerData.mobile,
            registration_status: playerData.registration_status || 'approved'
          } as any)
          .select()
          .single();

        if (!playerError && player) {
          const p = player as any;
          await supabase.from('payments').insert({
            player_id: p.id,
            amount: playerData.amount || 200,
            currency: 'INR',
            payment_method: 'UPI',
            utr_number: playerData.utr_number || `MANUAL-${Date.now()}`.substring(0, 12),
            screenshot_path: playerData.screenshot_path || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
            payment_status: playerData.payment_status || 'verified',
            verified_by: adminId !== 'admin' ? adminId : null,
            verified_at: new Date().toISOString()
          } as any);

          return (await this.getPlayerById(p.id)) as PlayerWithPayment;
        }
      } catch (err) {
        console.error('Supabase createPlayer error:', err);
      }
    }

    return mockStore.createAdminPlayer(playerData, adminId);
  },

  async deletePlayer(id: string, adminId: string = 'admin'): Promise<boolean> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isSupabaseConfigured() && isUuid) {
      try {
        const supabase = getAdminClient();
        await supabase.from('payments').delete().eq('player_id', id);
        const { error } = await supabase.from('players').delete().eq('id', id);
        if (!error) {
          try {
            await supabase.from('admin_activity_logs').insert({
              admin_id: adminId !== 'admin' ? adminId : null,
              action: 'player_deleted',
              entity_type: 'player',
              entity_id: id
            } as any);
          } catch (_) { }
        }
      } catch (err) {
        console.error('Supabase deletePlayer error:', err);
      }
    }

    mockStore.deletePlayer(id, adminId);
    return true;
  },

  async deletePlayers(ids: string[], adminId: string = 'admin'): Promise<number> {
    const validUuids = ids.filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
    if (isSupabaseConfigured() && validUuids.length > 0) {
      try {
        const supabase = getAdminClient();
        await supabase.from('payments').delete().in('player_id', validUuids);
        const { error } = await supabase.from('players').delete().in('id', validUuids);
        if (!error) {
          try {
            await supabase.from('admin_activity_logs').insert({
              admin_id: adminId !== 'admin' ? adminId : null,
              action: 'bulk_players_deleted',
              entity_type: 'player',
              entity_id: null,
              old_values: { count: validUuids.length, ids: validUuids }
            } as any);
          } catch (_) { }
        }
      } catch (err) {
        console.error('Supabase deletePlayers error:', err);
      }
    }

    mockStore.deletePlayers(ids, adminId);
    return ids.length;
  },

  async deleteAllPlayers(adminId: string = 'admin'): Promise<number> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getAdminClient();
        await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        try {
          await supabase.from('admin_activity_logs').insert({
            admin_id: adminId !== 'admin' ? adminId : null,
            action: 'all_players_deleted',
            entity_type: 'player',
            entity_id: null
          } as any);
        } catch (_) { }
      } catch (err) {
        console.error('Supabase deleteAllPlayers error:', err);
      }
    }

    mockStore.deleteAllPlayers(adminId);
    return 1;
  }
};
