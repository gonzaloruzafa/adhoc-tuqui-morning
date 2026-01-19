-- ============================================
-- MIGRATION: 002_user_profiles
-- Add user profiles table and evolution columns
-- ============================================

CREATE TABLE IF NOT EXISTS tuqui_morning_user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT UNIQUE REFERENCES tuqui_morning_users(email) ON DELETE CASCADE,
  
  -- Perfil profesional inferido
  inferred_role TEXT,
  inferred_company TEXT,
  inferred_industry TEXT,
  inferred_seniority TEXT,
  inferred_tone TEXT DEFAULT 'casual',
  
  -- Contexto y temas
  recurring_topics TEXT[],
  current_focus TEXT,
  stress_level TEXT,
  
  -- Contactos VIP
  vip_contacts JSONB DEFAULT '[]',
  vip_domains TEXT[],
  
  -- Personalización
  personality_hints TEXT,
  preferred_greeting TEXT,
  
  -- Metadata
  emails_analyzed INTEGER DEFAULT 0,
  last_analysis_at TIMESTAMPTZ,
  analysis_version INTEGER DEFAULT 1,
  manual_overrides JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user ON tuqui_morning_user_profiles(user_email);

-- Add profile status to users table
ALTER TABLE tuqui_morning_users 
ADD COLUMN IF NOT EXISTS profile_analysis_status TEXT DEFAULT 'pending';

ALTER TABLE tuqui_morning_users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Add profile snapshot to runs table
ALTER TABLE tuqui_morning_runs 
ADD COLUMN IF NOT EXISTS profile_snapshot JSONB;

-- Add metrics to runs table
ALTER TABLE tuqui_morning_runs 
ADD COLUMN IF NOT EXISTS gmail_emails_fetched INTEGER,
ADD COLUMN IF NOT EXISTS calendar_events_fetched INTEGER,
ADD COLUMN IF NOT EXISTS llm_tokens_used INTEGER,
ADD COLUMN IF NOT EXISTS tts_duration_seconds NUMERIC;

-- Add fields to outputs table
ALTER TABLE tuqui_morning_outputs
ADD COLUMN IF NOT EXISTS audio_duration_seconds NUMERIC,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_error TEXT,
ADD COLUMN IF NOT EXISTS twilio_message_sid TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
