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

        // Whitelist only valid columns that exist in the PostgreSQL table
        const validColumns = [
          'tournament_name',
          'registration_fee',
          'upi_id',
          'upi_qr_path',
          'maximum_player_capacity',
          'registration_open',
          'registration_instructions',
          'registration_start_date',
          'registration_end_date',
          'banner_image_path',
          'banner_title',
          'banner_subtitle',
          'banner_enabled',
          'support_phone',
          'support_whatsapp',
          'support_email'
        ];

        const dbPayload: any = {
          updated_at: new Date().toISOString()
        };

        for (const col of validColumns) {
          if (col in updates) {
            let value = (updates as any)[col];
            if (col === 'registration_start_date' || col === 'registration_end_date') {
              if (value) {
                const parsedDate = new Date(value);
                if (isNaN(parsedDate.getTime())) {
                  throw new Error(`Invalid date format for ${col}`);
                }
                value = parsedDate.toISOString();
              } else {
                value = null;
              }
            }
            dbPayload[col] = value;
          }
        }

        const validAdminUuid =
          adminId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adminId)
            ? adminId
            : null;

        if (current && (current as any).id) {
          const currentId = (current as any).id;

          const { data, error } = await supabase
            .from('tournament_settings')
            .update(dbPayload)
            .eq('id', currentId)
            .select()
            .single();

          if (error || !data) {
            console.error('Supabase update failed:', error?.message);
            throw new Error(error?.message || 'Database failed to save tournament settings');
          }

          // Also log activity safely (if table exists)
          try {
            await supabase.from('admin_activity_logs').insert({
              admin_id: validAdminUuid,
              action: 'settings_updated',
              entity_type: 'tournament_settings',
              entity_id: currentId,
              new_values: dbPayload
            });
          } catch (logErr) {
            // Ignore logging failure if table does not exist
          }

          return {
            ...updatedMock,
            ...data
          } as TournamentSettingsRow;
        } else {
          // If no row exists yet in Supabase table, insert first settings row
          const { data, error } = await supabase
            .from('tournament_settings')
            .insert(dbPayload)
            .select()
            .single();

          if (error || !data) {
            console.error('Initial settings insert failed:', error?.message);
            throw new Error(error?.message || 'Database failed to create tournament settings');
          }

          return {
            ...updatedMock,
            ...data
          } as TournamentSettingsRow;
        }
      } catch (err: any) {
        console.error('Failed to update Supabase settings:', err);
        throw new Error(err?.message || 'Failed to persist tournament settings to database');
      }
    }

    return updatedMock;
  }
};
