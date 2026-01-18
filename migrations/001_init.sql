-- Users table
CREATE TABLE IF NOT EXISTS tuqui_morning_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone_whatsapp TEXT,
  timezone TEXT DEFAULT 'America/Argentina/Buenos_Aires',
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth tokens (encrypted)
CREATE TABLE IF NOT EXISTS tuqui_morning_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL REFERENCES tuqui_morning_users(email) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google',
  scopes TEXT[] NOT NULL,
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_email, provider)
);

-- Briefing schedules
CREATE TABLE IF NOT EXISTS tuqui_morning_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT UNIQUE REFERENCES tuqui_morning_users(email) ON DELETE CASCADE,
  time_local TIME NOT NULL DEFAULT '07:00',
  days_of_week INTEGER[] DEFAULT '{1,2,3,4,5}',
  enabled BOOLEAN DEFAULT true,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Runs
CREATE TABLE IF NOT EXISTS tuqui_morning_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES tuqui_morning_schedules(id) ON DELETE CASCADE,
  user_email TEXT REFERENCES tuqui_morning_users(email) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outputs
CREATE TABLE IF NOT EXISTS tuqui_morning_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES tuqui_morning_runs(id) ON DELETE CASCADE,
  user_email TEXT REFERENCES tuqui_morning_users(email) ON DELETE CASCADE,
  text_content TEXT,
  audio_url TEXT,
  delivery_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
