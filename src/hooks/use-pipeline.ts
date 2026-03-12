import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useVideos() {
  return useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useVideo(videoId: string | undefined) {
  return useQuery({
    queryKey: ["video", videoId],
    enabled: !!videoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("id", videoId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUploadVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      title,
      description,
      language,
      category,
      tags,
    }: {
      file: File;
      title: string;
      description?: string;
      language?: string;
      category?: string;
      tags?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      // Create video record
      const { data: video, error: videoError } = await supabase
        .from("videos")
        .insert({
          user_id: user.id,
          title,
          description,
          language: language || "pt",
          category,
          tags,
          file_path: filePath,
          file_size: file.size,
          status: "uploaded",
        })
        .select()
        .single();

      if (videoError) throw videoError;
      return video;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

export function useProcessVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videoId,
      options,
    }: {
      videoId: string;
      options?: {
        generate_clips?: boolean;
        generate_transcript?: boolean;
        generate_captions?: boolean;
        detect_moments?: boolean;
      };
    }) => {
      const { data, error } = await supabase.functions.invoke("process-video", {
        method: "POST",
        body: { video_id: videoId, options },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useJobs(videoId?: string) {
  return useQuery({
    queryKey: ["jobs", videoId],
    // No polling needed - using Supabase Realtime instead
    queryFn: async () => {
      const params = new URLSearchParams();
      if (videoId) params.set("video_id", videoId);

      const { data, error } = await supabase.functions.invoke("process-video", {
        method: "GET",
        body: undefined,
        headers: {},
      });

      // Fallback: query directly
      let query = supabase
        .from("processing_jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (videoId) query = query.eq("video_id", videoId);

      const { data: jobs, error: jobsError } = await query.limit(20);
      if (jobsError) throw jobsError;
      return jobs;
    },
  });
}

export function useJob(jobId: string | undefined) {
  return useQuery({
    queryKey: ["job", jobId],
    enabled: !!jobId,
    // No polling needed - using Supabase Realtime instead
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processing_jobs")
        .select("*, job_logs(*)")
        .eq("id", jobId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useReprocessJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke("process-video", {
        method: "PATCH",
        body: { job_id: jobId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useClips(videoId?: string) {
  return useQuery({
    queryKey: ["clips", videoId],
    queryFn: async () => {
      let query = supabase
        .from("clips")
        .select("*")
        .order("virality_score", { ascending: false });

      if (videoId) query = query.eq("video_id", videoId);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clipId, isFavorite }: { clipId: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from("clips")
        .update({ is_favorite: isFavorite })
        .eq("id", clipId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clips"] });
    },
  });
}

export function useDeleteClip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clipId: string) => {
      const { error } = await supabase.from("clips").delete().eq("id", clipId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clips"] });
    },
  });
}

export function useTranscript(videoId: string | undefined) {
  return useQuery({
    queryKey: ["transcript", videoId],
    enabled: !!videoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transcripts")
        .select("*, transcript_segments(*)")
        .eq("video_id", videoId!)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });
}

export function useCredits() {
  return useQuery({
    queryKey: ["credits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("credits").select("*").single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreditTransactions() {
  return useQuery({
    queryKey: ["credit-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
}

export function useAuth() {
  return useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [videos, clips, credits, jobs] = await Promise.all([
        supabase.from("videos").select("id", { count: "exact", head: true }),
        supabase.from("clips").select("id", { count: "exact", head: true }),
        supabase.from("credits").select("*").single(),
        supabase.from("processing_jobs").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

      return {
        videoCount: videos.count || 0,
        clipCount: clips.count || 0,
        credits: credits.data?.balance || 0,
        totalUsed: credits.data?.total_used || 0,
        recentJobs: jobs.data || [],
      };
    },
  });
}
