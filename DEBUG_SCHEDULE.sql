-- DEBUG: Ver configuración de schedule para debugging
-- Ejecutar en Supabase SQL Editor reemplazando 'tu@email.com'

-- 1. Usuario y estado de WhatsApp
SELECT
    email,
    timezone,
    whatsapp_status,
    whatsapp_window_expires_at,
    CASE
        WHEN whatsapp_window_expires_at IS NULL THEN 'NO_WINDOW'
        WHEN whatsapp_window_expires_at > NOW() THEN 'OPEN'
        ELSE 'CLOSED'
    END as window_status,
    whatsapp_last_interaction_at,
    phone_whatsapp
FROM tuqui_morning_users
WHERE email = 'tu@email.com';

-- 2. Schedule configurado
SELECT
    id,
    user_email,
    enabled,
    time_local,
    days_of_week,
    timezone,
    next_run_at,
    CASE
        WHEN next_run_at <= NOW() THEN 'READY_TO_RUN'
        ELSE 'FUTURE'
    END as run_status,
    created_at,
    updated_at
FROM tuqui_morning_schedules
WHERE user_email = 'tu@email.com';

-- 3. Últimos 5 runs
SELECT
    id,
    status,
    scheduled_for,
    created_at,
    started_at,
    finished_at,
    error_message
FROM tuqui_morning_runs
WHERE user_email = 'tu@email.com'
ORDER BY created_at DESC
LIMIT 5;

-- 4. Todos los schedules enabled (para ver si hay alguno)
SELECT
    user_email,
    enabled,
    time_local,
    next_run_at,
    CASE
        WHEN next_run_at <= NOW() THEN 'READY_TO_RUN'
        ELSE 'FUTURE'
    END as run_status
FROM tuqui_morning_schedules
WHERE enabled = true;

-- 5. Server time (para comparar timezones)
SELECT NOW() as server_time;
