
-- Admin RLS policies: Allow admins to see ALL data across all tables

-- Videos: admin can see all
CREATE POLICY "Admins can view all videos" ON public.videos
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all videos" ON public.videos
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all videos" ON public.videos
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: admin can see all
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Credits: admin can see and update all
CREATE POLICY "Admins can view all credits" ON public.credits
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all credits" ON public.credits
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Processing jobs: admin can see and update all
CREATE POLICY "Admins can view all jobs" ON public.processing_jobs
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all jobs" ON public.processing_jobs
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Clips: admin can see all
CREATE POLICY "Admins can view all clips" ON public.clips
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Job logs: admin can see all
CREATE POLICY "Admins can view all job logs" ON public.job_logs
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Transcripts: admin can see all
CREATE POLICY "Admins can view all transcripts" ON public.transcripts
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Notifications: admin can see all
CREATE POLICY "Admins can view all notifications" ON public.notifications
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Credit transactions: admin can see all
CREATE POLICY "Admins can view all credit transactions" ON public.credit_transactions
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
