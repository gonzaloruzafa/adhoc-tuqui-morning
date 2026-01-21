-- Add WhatsApp 24h window tracking fields to tuqui_morning_users table
ALTER TABLE tuqui_morning_users
ADD COLUMN IF NOT EXISTS whatsapp_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS whatsapp_window_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS whatsapp_last_interaction_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS whatsapp_last_error TEXT;

-- Create index for faster queries on whatsapp_status
CREATE INDEX IF NOT EXISTS idx_tuqui_morning_users_whatsapp_status
ON tuqui_morning_users(whatsapp_status);

-- Create index for phone_whatsapp lookups (used by webhook)
CREATE INDEX IF NOT EXISTS idx_tuqui_morning_users_phone_whatsapp
ON tuqui_morning_users(phone_whatsapp) WHERE phone_whatsapp IS NOT NULL;
