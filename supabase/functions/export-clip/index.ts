import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { clip_id, video_id, start_time, end_time, format } = await req.json();

    if (!clip_id && !video_id) {
      return new Response(JSON.stringify({ error: "clip_id or video_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let videoData: any = null;
    let clipData: any = null;

    // If clip_id provided, get clip and its video
    if (clip_id) {
      const { data: clip, error: clipErr } = await supabase
        .from("clips")
        .select("*, videos(*)")
        .eq("id", clip_id)
        .eq("user_id", user.id)
        .single();

      if (clipErr || !clip) {
        return new Response(JSON.stringify({ error: "Clip not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      clipData = clip;
      videoData = clip.videos;
    } else {
      // Direct video export with custom times
      const { data: video, error: videoErr } = await supabase
        .from("videos")
        .select("*")
        .eq("id", video_id)
        .eq("user_id", user.id)
        .single();

      if (videoErr || !video) {
        return new Response(JSON.stringify({ error: "Video not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      videoData = video;
    }

    const sourceType = videoData?.source_type || "upload";
    const exportStart = clipData?.start_time ?? start_time ?? 0;
    const exportEnd = clipData?.end_time ?? end_time ?? (videoData?.duration_seconds || 60);
    const exportFormat = format || clipData?.format || "9:16";

    // For uploaded videos, generate a signed URL for the source file
    if (sourceType === "upload" && videoData?.file_path) {
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: signedUrl, error: signErr } = await serviceClient.storage
        .from("videos")
        .createSignedUrl(videoData.file_path, 3600);

      if (signErr || !signedUrl?.signedUrl) {
        return new Response(JSON.stringify({ error: "Could not generate download URL" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update clip status to "exporting"
      if (clip_id) {
        await supabase.from("clips").update({ status: "exported" }).eq("id", clip_id);
      }

      return new Response(JSON.stringify({
        export: {
          download_url: signedUrl.signedUrl,
          source_type: "upload",
          start_time: exportStart,
          end_time: exportEnd,
          duration: exportEnd - exportStart,
          format: exportFormat,
          file_name: `clip_${(clipData?.title || "export").replace(/[^a-zA-Z0-9]/g, "_")}.mp4`,
          // Client-side trimming info
          trim: {
            start: exportStart,
            end: exportEnd,
          },
          instructions: "Use the download_url to load the video. The client should use MediaSource API or the #t= fragment to play/download the specific segment.",
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For YouTube videos
    if (sourceType === "youtube") {
      const ytId = videoData?.external_video_id;
      
      return new Response(JSON.stringify({
        export: {
          source_type: "youtube",
          youtube_id: ytId,
          youtube_url: `https://www.youtube.com/watch?v=${ytId}`,
          start_time: exportStart,
          end_time: exportEnd,
          duration: exportEnd - exportStart,
          format: exportFormat,
          clip_title: clipData?.title || videoData?.title || "Clip",
          transcript: clipData?.transcript_text || null,
          // Export metadata for the user
          metadata: {
            title: clipData?.title || videoData?.title,
            virality_score: clipData?.virality_score || null,
            transcript_excerpt: clipData?.transcript_text || null,
          },
          instructions: "YouTube videos cannot be directly downloaded. Use the clip metadata to recreate the content or use a third-party tool to process the YouTube segment.",
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported source type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
