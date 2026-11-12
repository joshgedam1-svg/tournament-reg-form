-- ==============================================================================
-- Cricket Auction League 2026 - Complete Database Setup Script
-- Project: dsyirenalclknmxqzfua
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Registration Sequence & ID Generator
CREATE SEQUENCE IF NOT EXISTS registration_id_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION generate_registration_id()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_val BIGINT;
  new_id TEXT;
BEGIN
  current_year := to_char(CURRENT_DATE, 'YYYY');
  next_val := nextval('registration_id_seq');
  new_id := 'CAL-' || current_year || '-' || LPAD(next_val::TEXT, 6, '0');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger Function for Updated Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 4. TABLE: tournament_settings (All columns included)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS tournament_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_name TEXT NOT NULL DEFAULT 'Cricket Auction League 2026',
  registration_fee INTEGER NOT NULL DEFAULT 500 CHECK (registration_fee >= 0),
  upi_id TEXT NOT NULL DEFAULT 'cricketauctionleague@okhdfcbank',
  upi_qr_path TEXT,
  maximum_player_capacity INTEGER NOT NULL DEFAULT 100 CHECK (maximum_player_capacity >= 0),
  registration_open BOOLEAN NOT NULL DEFAULT true,
  registration_instructions TEXT DEFAULT 'Scan QR or copy UPI ID. Pay ₹500 from your bank UPI app, copy the 12-digit UTR, and upload the payment screenshot.',
  registration_start_date TIMESTAMPTZ DEFAULT NOW(),
  registration_end_date TIMESTAMPTZ DEFAULT '2027-12-31 23:59:59+00',
  banner_image_path TEXT DEFAULT 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80',
  banner_title TEXT DEFAULT 'Cricket Auction League 2026',
  banner_subtitle TEXT DEFAULT 'Official Player Registrations Open • Grand Auction & Premier Championship',
  banner_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If table already existed from earlier, add missing columns safely
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournament_settings' AND column_name='registration_start_date') THEN
    ALTER TABLE tournament_settings ADD COLUMN registration_start_date TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournament_settings' AND column_name='registration_end_date') THEN
    ALTER TABLE tournament_settings ADD COLUMN registration_end_date TIMESTAMPTZ DEFAULT '2027-12-31 23:59:59+00';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournament_settings' AND column_name='banner_image_path') THEN
    ALTER TABLE tournament_settings ADD COLUMN banner_image_path TEXT DEFAULT 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournament_settings' AND column_name='banner_title') THEN
    ALTER TABLE tournament_settings ADD COLUMN banner_title TEXT DEFAULT 'Cricket Auction League 2026';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournament_settings' AND column_name='banner_subtitle') THEN
    ALTER TABLE tournament_settings ADD COLUMN banner_subtitle TEXT DEFAULT 'Official Player Registrations Open • Grand Auction & Premier Championship';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournament_settings' AND column_name='banner_enabled') THEN
    ALTER TABLE tournament_settings ADD COLUMN banner_enabled BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- Trigger for tournament_settings
DROP TRIGGER IF EXISTS set_tournament_settings_timestamp ON tournament_settings;
CREATE TRIGGER set_tournament_settings_timestamp
BEFORE UPDATE ON tournament_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default row if empty
INSERT INTO tournament_settings (
  tournament_name,
  registration_fee,
  upi_id,
  maximum_player_capacity,
  registration_open,
  banner_title,
  banner_subtitle,
  banner_enabled
)
SELECT
  'Cricket Auction League 2026',
  500,
  'cricketauctionleague@okhdfcbank',
  100,
  true,
  'Cricket Auction League 2026',
  'Official Player Registrations Open • Grand Auction & Premier Championship',
  true
WHERE NOT EXISTS (SELECT 1 FROM tournament_settings LIMIT 1);

-- ==============================================================================
-- 5. TABLE: players
-- ==============================================================================
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id TEXT UNIQUE NOT NULL DEFAULT generate_registration_id(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  profile_photo_path TEXT,
  playing_role TEXT NOT NULL CHECK (playing_role IN ('batsman', 'bowler', 'all_rounder', 'wicketkeeper')),
  batting_style TEXT NOT NULL CHECK (batting_style IN ('right_hand', 'left_hand')),
  bowling_arm TEXT NOT NULL CHECK (bowling_arm IN ('right_arm', 'left_arm', 'do_not_bowl')),
  bowling_type TEXT NOT NULL CHECK (bowling_type IN ('fast', 'medium', 'spin', 'not_applicable')),
  experience_level TEXT NOT NULL CHECK (experience_level IN ('beginner', '1_2_years', '3_5_years', '5_plus_years')),
  previous_team_name TEXT,
  previous_captain_name TEXT,
  previous_tournament BOOLEAN NOT NULL DEFAULT false,
  previous_tournament_name TEXT,
  additional_information TEXT,
  emergency_contact_name TEXT NOT NULL,
  emergency_relationship TEXT NOT NULL,
  emergency_mobile TEXT NOT NULL,
  registration_status TEXT NOT NULL DEFAULT 'under_review' CHECK (registration_status IN ('under_review', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_players_timestamp ON players;
CREATE TRIGGER set_players_timestamp
BEFORE UPDATE ON players
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_players_registration_id ON players(registration_id);
CREATE INDEX IF NOT EXISTS idx_players_mobile ON players(mobile);
CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);

-- ==============================================================================
-- 6. TABLE: payments
-- ==============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 500 CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_method TEXT NOT NULL DEFAULT 'UPI',
  utr_number TEXT NOT NULL UNIQUE,
  screenshot_path TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (payment_status IN ('pending_verification', 'verified', 'rejected')),
  rejection_reason TEXT,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_payments_timestamp ON payments;
CREATE TRIGGER set_payments_timestamp
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_payments_utr_number ON payments(utr_number);
CREATE INDEX IF NOT EXISTS idx_payments_player_id ON payments(player_id);

-- ==============================================================================
-- 7. TABLE: admin_profiles & admin_activity_logs
-- ==============================================================================
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE tournament_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Tournament Settings: Public read, all authorized access
DROP POLICY IF EXISTS "Public read for tournament settings" ON tournament_settings;
CREATE POLICY "Public read for tournament settings" ON tournament_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all for tournament settings" ON tournament_settings;
CREATE POLICY "Allow all for tournament settings" ON tournament_settings FOR ALL USING (true) WITH CHECK (true);

-- Players: Public can register (insert) & track (select), admin can manage
DROP POLICY IF EXISTS "Allow select players" ON players;
CREATE POLICY "Allow select players" ON players FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert players" ON players;
CREATE POLICY "Allow insert players" ON players FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update players" ON players;
CREATE POLICY "Allow update players" ON players FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete players" ON players;
CREATE POLICY "Allow delete players" ON players FOR DELETE USING (true);

-- Payments
DROP POLICY IF EXISTS "Allow select payments" ON payments;
CREATE POLICY "Allow select payments" ON payments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert payments" ON payments;
CREATE POLICY "Allow insert payments" ON payments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update payments" ON payments;
CREATE POLICY "Allow update payments" ON payments FOR UPDATE USING (true) WITH CHECK (true);

-- Logs & Profiles
DROP POLICY IF EXISTS "Allow all activity logs" ON admin_activity_logs;
CREATE POLICY "Allow all activity logs" ON admin_activity_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all admin profiles" ON admin_profiles;
CREATE POLICY "Allow all admin profiles" ON admin_profiles FOR ALL USING (true) WITH CHECK (true);
