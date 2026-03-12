
-- Create job status enum
CREATE TYPE public.job_status AS ENUM (
  'queued',
  'processing',
  'transcribing',
  'analyzing',
  'generating_clips',
  'rendering',
  'completed',
  'failed'
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  language TEXT DEFAULT 'pt',
  category TEXT,
  tags TEXT[],
  file_path TEXT,
  file_size BIGINT,
  duration_seconds NUMERIC,
  status TEXT DEFAULT 'uploaded',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own videos" ON public.videos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own videos" ON public.videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own videos" ON public.videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own videos" ON public.videos FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Processing Jobs table
CREATE TABLE public.processing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.job_status NOT NULL DEFAULT 'queued',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_step TEXT,
  error_message TEXT,
  options JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs" ON public.processing_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own jobs" ON public.processing_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own jobs" ON public.processing_jobs FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.processing_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Job Logs table
CREATE TABLE public.job_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.processing_jobs(id) ON DELETE CASCADE,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for own jobs" ON public.job_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.processing_jobs WHERE id = job_logs.job_id AND user_id = auth.uid()));
CREATE POLICY "System can insert logs" ON public.job_logs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.processing_jobs WHERE id = job_logs.job_id AND user_id = auth.uid()));

-- Transcripts table
CREATE TABLE public.transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_text TEXT,
  language TEXT DEFAULT 'pt',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transcripts" ON public.transcripts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transcripts" ON public.transcripts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transcripts" ON public.transcripts FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_transcripts_updated_at BEFORE UPDATE ON public.transcripts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Transcript Segments table
CREATE TABLE public.transcript_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transcript_id UUID NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  start_time NUMERIC NOT NULL,
  end_time NUMERIC NOT NULL,
  confidence NUMERIC,
  speaker TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transcript_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own segments" ON public.transcript_segments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.transcripts WHERE id = transcript_segments.transcript_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own segments" ON public.transcript_segments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.transcripts WHERE id = transcript_segments.transcript_id AND user_id = auth.uid()));

-- Clips table
CREATE TABLE public.clips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time NUMERIC NOT NULL,
  end_time NUMERIC NOT NULL,
  duration_seconds NUMERIC GENERATED ALWAYS AS (end_time - start_time) STORED,
  virality_score INTEGER DEFAULT 0 CHECK (virality_score >= 0 AND virality_score <= 100),
  virality_details JSONB DEFAULT '{}',
  transcript_text TEXT,
  file_path TEXT,
  thumbnail_path TEXT,
  format TEXT DEFAULT '9:16',
  status TEXT DEFAULT 'generated',
  is_favorite BOOLEAN DEFAULT false,
  template_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clips" ON public.clips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clips" ON public.clips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clips" ON public.clips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clips" ON public.clips FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_clips_updated_at BEFORE UPDATE ON public.clips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Captions table
CREATE TABLE public.captions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clip_id UUID NOT NULL REFERENCES public.clips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  start_time NUMERIC NOT NULL,
  end_time NUMERIC NOT NULL,
  style JSONB DEFAULT '{"font": "Inter", "color": "#FFFFFF", "background": "rgba(0,0,0,0.7)", "position": "bottom"}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.captions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own captions" ON public.captions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own captions" ON public.captions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own captions" ON public.captions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own captions" ON public.captions FOR DELETE USING (auth.uid() = user_id);

-- Credits table
CREATE TABLE public.credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 100,
  total_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON public.credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credits" ON public.credits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own credits" ON public.credits FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_credits_updated_at BEFORE UPDATE ON public.credits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Credit transactions table
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  job_id UUID REFERENCES public.processing_jobs(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by owner" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile and credits on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name) VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  INSERT INTO public.credits (user_id, balance) VALUES (NEW.id, 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for videos
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('clips', 'clips', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);

-- Storage policies
CREATE POLICY "Users can upload own videos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own videos" ON storage.objects FOR SELECT
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own videos" ON storage.objects FOR DELETE
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Clips are publicly accessible" ON storage.objects FOR SELECT
  USING (bucket_id = 'clips');
CREATE POLICY "Users can upload own clips" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'clips' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Thumbnails are publicly accessible" ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails');
CREATE POLICY "Users can upload thumbnails" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Indexes
CREATE INDEX idx_videos_user_id ON public.videos(user_id);
CREATE INDEX idx_processing_jobs_video_id ON public.processing_jobs(video_id);
CREATE INDEX idx_processing_jobs_user_id ON public.processing_jobs(user_id);
CREATE INDEX idx_processing_jobs_status ON public.processing_jobs(status);
CREATE INDEX idx_clips_video_id ON public.clips(video_id);
CREATE INDEX idx_clips_user_id ON public.clips(user_id);
CREATE INDEX idx_transcripts_video_id ON public.transcripts(video_id);
CREATE INDEX idx_job_logs_job_id ON public.job_logs(job_id);
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
