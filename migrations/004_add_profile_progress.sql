-- Add progress tracking for profile analysis
ALTER TABLE tuqui_morning_users 
ADD COLUMN IF NOT EXISTS profile_analysis_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_analysis_total INTEGER DEFAULT 0;
