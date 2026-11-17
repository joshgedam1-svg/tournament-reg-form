import { Database } from './database.types';

export interface TournamentSettingsRow {
  id: string;
  tournament_name: string;
  registration_fee: number;
  upi_id: string;
  upi_qr_path: string | null;
  maximum_player_capacity: number;
  registration_open: boolean;
  registration_instructions: string | null;
  registration_start_date?: string | null;
  registration_end_date?: string | null;
  banner_image_path?: string | null;
  banner_title?: string | null;
  banner_subtitle?: string | null;
  banner_enabled?: boolean;
  support_phone?: string | null;
  support_whatsapp?: string | null;
  support_email?: string | null;
  updated_by: string | null;
  updated_at: string;
}

export type TournamentSettingsInsert = Partial<TournamentSettingsRow>;
export type TournamentSettingsUpdate = Partial<TournamentSettingsRow>;

export interface PublicTournamentSettings {
  tournament_name: string;
  registration_fee: number;
  upi_id: string;
  upi_qr_path: string | null;
  maximum_player_capacity: number;
  registration_open: boolean;
  registration_instructions: string | null;
  registration_start_date?: string | null;
  registration_end_date?: string | null;
  banner_image_path?: string | null;
  banner_title?: string | null;
  banner_subtitle?: string | null;
  banner_enabled?: boolean;
  support_phone?: string | null;
  support_whatsapp?: string | null;
  support_email?: string | null;
}
