-- ═══════════════════════════════════════════════════════════════
-- MIGRACIÓN: WhatsApp Loop Strategy
-- ═══════════════════════════════════════════════════════════════

-- Campos para gestionar la ventana de WhatsApp
ALTER TABLE tuqui_morning_users
ADD COLUMN IF NOT EXISTS whatsapp_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS whatsapp_last_interaction_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS whatsapp_window_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS whatsapp_consecutive_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS whatsapp_total_interactions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS whatsapp_last_error TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_fallback_count INTEGER DEFAULT 0;

-- Índice para buscar usuarios con ventana activa
CREATE INDEX IF NOT EXISTS idx_users_whatsapp_window 
ON tuqui_morning_users(whatsapp_window_expires_at) 
WHERE whatsapp_status = 'active';

-- Índice para buscar usuarios que necesitan fallback
CREATE INDEX IF NOT EXISTS idx_users_whatsapp_expired
ON tuqui_morning_users(whatsapp_status)
WHERE whatsapp_status = 'expired';

-- Tabla para trackear todos los mensajes de WhatsApp
CREATE TABLE IF NOT EXISTS tuqui_morning_whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT REFERENCES tuqui_morning_users(email) ON DELETE CASCADE,
    direction TEXT NOT NULL, -- 'inbound' (usuario→tuqui) o 'outbound' (tuqui→usuario)
    message_type TEXT NOT NULL, -- 'text', 'audio', 'button_reply', 'template'
    content TEXT, -- Texto del mensaje o URL del audio
    twilio_message_sid TEXT,
    twilio_status TEXT, -- 'queued', 'sent', 'delivered', 'read', 'failed'
    triggered_by TEXT, -- 'onboarding', 'daily_briefing', 'confirmation', 'fallback_recovery'
    run_id UUID REFERENCES tuqui_morning_runs(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    error_code TEXT,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user ON tuqui_morning_whatsapp_messages(user_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sid ON tuqui_morning_whatsapp_messages(twilio_message_sid);
