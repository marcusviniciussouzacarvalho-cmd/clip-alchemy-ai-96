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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { clip_id, video_id, start_time, end_time, format } = await req.json();
    let videoData: any = null;
    let clipData: any = null;

    if (clip_id) {
      const { data } = await supabase.from("clips").select("*, videos(*)").eq("id", clip_id).eq("user_id", user.id).single();
      if (!data) {
        return new Response(JSON.stringify({ error: "Clip not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      clipData = data;
      videoData = data.videos;
    } else if (video_id) {
      const { data } = await supabase.from("videos").select("*").eq("id", video_id).eq("user_id", user.id).single();
      if (!data) {
        return new Response(JSON.stringify({ error: "Video not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      videoData = data;
    } else {
      return new Response(JSON.stringify({ error: "clip_id or video_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!videoData?.file_path) {
      return new Response(JSON.stringify({ error: "Este vídeo ainda não possui um arquivo interno exportável." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: signed } = await serviceClient.storage.from("videos").createSignedUrl(videoData.file_path, 60 * 60);
    if (!signed?.signedUrl) {
      return new Response(JSON.stringify({ error: "Could not generate source URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const exportStart = clipData?.start_time ?? start_time ?? 0;
    const exportEnd = clipData?.end_time ?? end_time ?? videoData?.duration_seconds ?? 30;
    const duration = Math.max(0.1, exportEnd - exportStart);
    const exportFormat = format || clipData?.format || "9:16";
    const fileNameBase = (clipData?.title || videoData?.title || "clip").replace(/[^a-zA-Z0-9_-]+/g, "_");

    return new Response(JSON.stringify({
      export: {
        source_type: "internal",
        playback_url: signed.signedUrl,
        download_url: signed.signedUrl,
        start_time: exportStart,
        end_time: exportEnd,
        duration,
        format: exportFormat,
        file_name: `${fileNameBase}.webm`,
        file_name_mp4_hint: `${fileNameBase}.mp4`,
        clip_title: clipData?.title || videoData?.title || "Clip",
        transcript: clipData?.transcript_text || null,
        metadata: {
          clip_id: clipData?.id || null,
          video_id: videoData.id,
          virality_score: clipData?.virality_score || null,
          source_path: videoData.file_path,
        },
        instructions: "O frontend deve renderizar o segmento localmente a partir da playback_url e baixar o blob exportado.",
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
