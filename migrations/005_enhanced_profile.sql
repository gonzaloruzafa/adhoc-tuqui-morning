-- ═══════════════════════════════════════════════════════════════
-- MIGRACIÓN: Profile Intelligence v3
-- ═══════════════════════════════════════════════════════════════

-- Nuevos campos de identidad
ALTER TABLE tuqui_morning_user_profiles 
ADD COLUMN IF NOT EXISTS is_founder BOOLEAN DEFAULT false;

ALTER TABLE tuqui_morning_user_profiles 
ADD COLUMN IF NOT EXISTS one_liner TEXT;

ALTER TABLE tuqui_morning_user_profiles 
ADD COLUMN IF NOT EXISTS communication_style TEXT;

ALTER TABLE tuqui_morning_user_profiles 
ADD COLUMN IF NOT EXISTS company_size_hint TEXT;

-- Nuevos campos de contexto
ALTER TABLE tuqui_morning_user_profiles 
ADD COLUMN IF NOT EXISTS active_projects TEXT[];

ALTER TABLE tuqui_morning_user_profiles 
ADD COLUMN IF NOT EXISTS stress_reasons TEXT[];

ALTER TABLE tuqui_morning_user_profiles 
ADD COLUMN IF NOT EXISTS team_size_hint INTEGER;

-- Métricas de análisis
ALTER TABLE tuqui_morning_user_profiles 
ADD COLUMN IF NOT EXISTS confidence_score INTEGER;

ALTER TABLE tuqui_morning_user_profiles 
ADD COLUMN IF NOT EXISTS emails_sent_analyzed INTEGER DEFAULT 0;

ALTER TABLE tuqui_morning_user_profiles 
ADD COLUMN IF NOT EXISTS emails_received_analyzed INTEGER DEFAULT 0;

ALTER TABLE tuqui_morning_user_profiles 
ADD COLUMN IF NOT EXISTS analysis_version INTEGER DEFAULT 1;

-- Índice para búsquedas por fundador
CREATE INDEX IF NOT EXISTS idx_profiles_founder 
ON tuqui_morning_user_profiles(is_founder) 
WHERE is_founder = true;
