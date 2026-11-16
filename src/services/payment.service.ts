import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getAdminClient } from '@/lib/supabase/admin';
import { mockStore } from '@/lib/mockStore';
import { PaymentWithPlayer } from '@/types/payment';

export const paymentService = {
  async getPayments(filter?: { status?: string; search?: string }): Promise<PaymentWithPlayer[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getAdminClient();
        let query = supabase.from('payments').select('*, players(*)').order('created_at', { ascending: false });

        if (filter?.status) {
          query = query.eq('payment_status', filter.status);
        }

        const { data, error } = await query;
        if (!error && data) {
          let list: PaymentWithPlayer[] = data.map((item: any) => ({
            ...item,
            player: {
              id: item.players.id,
              registration_id: item.players.registration_id,
              full_name: item.players.full_name,
              email: item.players.email,
              mobile: item.players.mobile,
              playing_role: item.players.playing_role,
              city: item.players.city,
              profile_photo_path: item.players.profile_photo_path
            }
          }));

          if (filter?.search) {
            const q = filter.search.toLowerCase();
            list = list.filter(
              p =>
                p.player.full_name.toLowerCase().includes(q) ||
                p.player.registration_id.toLowerCase().includes(q) ||
                p.utr_number.includes(q)
            );
          }

          return list;
        }
      } catch (err) {
        console.error('Supabase getPayments error:', err);
      }
    }

    return mockStore.getPayments(filter);
  },

  async verifyPayment(paymentId: string, adminId: string = 'admin'): Promise<PaymentWithPlayer> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getAdminClient();

        // 1. Call PostgreSQL atomic RPC function
        const { error } = await supabase.rpc('verify_payment_transaction', {
          p_payment_id: paymentId,
          p_admin_id: adminId !== 'admin' ? adminId : '00000000-0000-0000-0000-000000000000'
        } as any);

        if (error) {
          throw new Error(error.message);
        }

        // Fetch updated payment with player
        const { data: updated, error: fetchErr } = await supabase
          .from('payments')
          .select('*, players(*)')
          .eq('id', paymentId)
          .single();

        if (!fetchErr && updated) {
          const u = updated as any;
          return {
            ...u,
            player: {
              id: u.players.id,
              registration_id: u.players.registration_id,
              full_name: u.players.full_name,
              email: u.players.email,
              mobile: u.players.mobile,
              playing_role: u.players.playing_role,
              city: u.players.city,
              profile_photo_path: u.players.profile_photo_path
            }
          } as PaymentWithPlayer;
        }
      } catch (err: any) {
        console.warn('Supabase verifyPayment fallback to in-memory store:', err.message);
      }
    }

    return mockStore.verifyPayment(paymentId, adminId);
  },

  async rejectPayment(paymentId: string, reason: string, adminId: string = 'admin'): Promise<PaymentWithPlayer> {
    if (!reason || !reason.trim()) {
      throw new Error('A rejection reason is required to reject a payment');
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getAdminClient();

        const { data, error } = await supabase
          .from('payments')
          .update({
            payment_status: 'rejected',
            rejection_reason: reason.trim(),
            verified_by: adminId !== 'admin' ? adminId : null,
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', paymentId)
          .select('*, players(*)')
          .single();

        if (error) {
          throw new Error(error.message);
        }

        if (data) {
          try {
            await supabase.from('admin_activity_logs').insert({
              admin_id: adminId !== 'admin' ? adminId : null,
              action: 'payment_rejected',
              entity_type: 'payment',
              entity_id: paymentId,
              new_values: { payment_status: 'rejected', rejection_reason: reason.trim() }
            } as any);
          } catch (_) {}

          const d = data as any;
          return {
            ...d,
            player: {
              id: d.players.id,
              registration_id: d.players.registration_id,
              full_name: d.players.full_name,
              email: d.players.email,
              mobile: d.players.mobile,
              playing_role: d.players.playing_role,
              city: d.players.city,
              profile_photo_path: d.players.profile_photo_path
            }
          } as PaymentWithPlayer;
        }
      } catch (err: any) {
        console.warn('Supabase rejectPayment fallback to in-memory store:', err.message);
      }
    }

    return mockStore.rejectPayment(paymentId, reason.trim(), adminId);
  }
};
