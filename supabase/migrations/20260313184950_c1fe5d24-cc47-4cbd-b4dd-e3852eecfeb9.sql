ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'upload',
ADD COLUMN IF NOT EXISTS source_url text,
ADD COLUMN IF NOT EXISTS external_video_id text,
ADD COLUMN IF NOT EXISTS thumbnail_url text,
ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_step text,
ADD COLUMN IF NOT EXISTS error_message text;