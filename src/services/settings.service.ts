import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getAdminClient } from '@/lib/supabase/admin';
import { mockStore } from '@/lib/mockStore';
import { TournamentSettingsRow, PublicTournamentSettings } from '@/types/settings';

export const settingsService = {
  async getPublicSettings(): Promise<PublicTournamentSettings> {
    const mock = mockStore.getSettings();

    if (isSupabaseConfigured()) {
      try {
        const supabase = getAdminClient();
        const { data, error } = await supabase
          .from('tournament_settings')
          .select('*')
          .limit(1)
          .single();

        if (error || !data) {
          console.warn('Error fetching Supabase settings, using store:', error?.message);
        } else {
          return {
            tournament_name: data.tournament_name || mock.tournament_name,
            registration_fee: data.registration_fee ?? mock.registration_fee,
            upi_id: data.upi_id || mock.upi_id,
            upi_qr_path: data.upi_qr_path ?? mock.upi_qr_path,
            maximum_player_capacity: data.maximum_player_capacity ?? mock.maximum_player_capacity,
            registration_open: data.registration_open ?? mock.registration_open,
            registration_instructions: data.registration_instructions ?? mock.registration_instructions,
            registration_start_date: (data as any).registration_start_date ?? mock.registration_start_date,
            registration_end_date: (data as any).registration_end_date ?? mock.registration_end_date,
            banner_image_path: (data as any).banner_image_path ?? mock.banner_image_path,
            banner_title: (data as any).banner_title ?? mock.banner_title,
            banner_subtitle: (data as any).banner_subtitle ?? mock.banner_subtitle,
            banner_enabled: (data as any).banner_enabled ?? mock.banner_enabled,
            support_phone: (data as any).support_phone ?? mock.support_phone,
            support_whatsapp: (data as any).support_whatsapp ?? mock.support_whatsapp,
            support_email: (data as any).support_email ?? mock.support_email
          };
        }
      } catch (err) {
        console.error('Failed to query Supabase settings:', err);
      }
    }

    return {
      tournament_name: mock.tournament_name,
      registration_fee: mock.registration_fee,
      upi_id: mock.upi_id,
      upi_qr_path: mock.upi_qr_path,
      maximum_player_capacity: mock.maximum_player_capacity,
      registration_open: mock.registration_open,
      registration_instructions: mock.registration_instructions,
      registration_start_date: mock.registration_start_date,
      registration_end_date: mock.registration_end_date,
      banner_image_path: mock.banner_image_path,
      banner_title: mock.banner_title,
      banner_subtitle: mock.banner_subtitle,
      banner_enabled: mock.banner_enabled,
      support_phone: mock.support_phone,
      support_whatsapp: mock.support_whatsapp,
      support_email: mock.support_email
    };
  },

  async getAllSettings(): Promise<TournamentSettingsRow> {
    const mock = mockStore.getSettings();

    if (isSupabaseConfigured()) {
      try {
        const supabase = getAdminClient();
        const { data, error } = await supabase
          .from('tournament_settings')
          .select('*')
          .limit(1)
          .single();

        if (!error && data) {
          return {
            ...mock,
            ...data,
            registration_start_date: (data as any).registration_start_date ?? mock.registration_start_date,
            registration_end_date: (data as any).registration_end_date ?? mock.registration_end_date,
            banner_image_path: (data as any).banner_image_path ?? mock.banner_image_path,
            banner_title: (data as any).banner_title ?? mock.banner_title,
            banner_subtitle: (data as any).banner_subtitle ?? mock.banner_subtitle,
            banner_enabled: (data as any).banner_enabled ?? mock.banner_enabled,
            support_phone: (data as any).support_phone ?? mock.support_phone,
            support_whatsapp: (data as any).support_whatsapp ?? mock.support_whatsapp,
            support_email: (data as any).support_email ?? mock.support_email
          } as TournamentSettingsRow;
        }
      } catch (err) {
        console.error('Failed to query Supabase settings:', err);
      }
    }

    return mockStore.getSettings();
  },

  async updateSettings(updates: Partial<TournamentSettingsRow>, adminId?: string): Promise<TournamentSettingsRow> {
    // Always update mockStore so local state and fallbacks are instantly synced
    const updatedMock = mockStore.updateSettings(updates);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getAdminClient();
        const { data: current } = await supabase.from('tournament_settings').select('id').limit(1).maybeSingle();

        if (current && (current as any).id) {
          const currentId = (current as any).id;

          // Attempt update with all fields
          const { data, error } = await supabase
            .from('tournament_settings')
            .update({
              ...updates,
              updated_by: adminId || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentId)
            .select()
            .single();

          if (!error && data) {
            // Also log activity safely (if table exists)
            try {
              await supabase.from('admin_activity_logs').insert({
                admin_id: adminId || null,
                action: 'settings_updated',
                entity_type: 'tournament_settings',
                entity_id: currentId,
                new_values: updates
              });
            } catch (logErr) {
              // Ignore logging failure if table does not exist
            }

            return {
              ...updatedMock,
              ...data
            } as TournamentSettingsRow;
          }

          // If there was an error (e.g. some columns not in Supabase yet), fallback to core columns
          if (error) {
            console.warn('Full update failed, attempting core columns update:', error.message);
            const coreFields: any = {};
            const allowed = [
              'tournament_name',
              'registration_fee',
              'upi_id',
              'upi_qr_path',
              'maximum_player_capacity',
              'registration_open',
              'registration_instructions'
            ];
            for (const key of allowed) {
              if (key in updates) {
                coreFields[key] = (updates as any)[key];
              }
            }

            await supabase
              .from('tournament_settings')
              .update({
                ...coreFields,
                updated_by: adminId || null,
                updated_at: new Date().toISOString()
              })
              .eq('id', currentId);
          }
        } else {
          // If no row exists yet in Supabase table, insert first settings row
          try {
            await supabase.from('tournament_settings').insert({
              ...updates,
              updated_by: adminId || null,
              updated_at: new Date().toISOString()
            });
          } catch (insertErr: any) {
            console.warn('Initial settings insert fallback:', insertErr.message);
          }
        }
      } catch (err) {
        console.error('Failed to update Supabase settings:', err);
      }
    }

    return updatedMock;
  }
};
