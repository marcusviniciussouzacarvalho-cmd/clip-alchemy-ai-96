CREATE TABLE public.editor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  state JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(video_id, user_id)
);

ALTER TABLE public.editor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own editor sessions"
  ON public.editor_sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_editor_sessions_updated_at
  BEFORE UPDATE ON public.editor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();