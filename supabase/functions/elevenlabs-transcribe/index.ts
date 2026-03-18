import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { video_id } = await req.json();
    if (!video_id) {
      return new Response(JSON.stringify({ error: "video_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get video record
    const { data: video, error: videoError } = await serviceClient
      .from("videos")
      .select("*")
      .eq("id", video_id)
      .single();

    if (videoError || !video) {
      return new Response(JSON.stringify({ error: "Video not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!video.file_path) {
      return new Response(JSON.stringify({ error: "Video has no internal file", source_type: video.source_type }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download video from storage
    console.log("[STT] Downloading video from storage:", video.file_path);
    const { data: fileData, error: downloadError } = await serviceClient.storage
      .from("videos")
      .download(video.file_path);

    if (downloadError || !fileData) {
      console.error("[STT] Download error:", downloadError);
      return new Response(JSON.stringify({ error: "Failed to download video file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[STT] File downloaded, size:", fileData.size, "bytes. Sending to ElevenLabs...");

    // Send to ElevenLabs Scribe API
    const formData = new FormData();
    const fileName = video.file_path.split("/").pop() || "video.mp4";
    formData.append("file", new File([fileData], fileName, { type: fileData.type || "video/mp4" }));
    formData.append("model_id", "scribe_v2");
    formData.append("tag_audio_events", "true");
    formData.append("diarize", "true");
    formData.append("language_code", video.language === "pt" ? "por" : video.language === "en" ? "eng" : "por");

    const sttResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!sttResponse.ok) {
      const errText = await sttResponse.text();
      console.error("[STT] ElevenLabs error:", sttResponse.status, errText);
      return new Response(JSON.stringify({ error: `ElevenLabs STT failed: ${sttResponse.status}`, details: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transcription = await sttResponse.json();
    console.log("[STT] Transcription received. Text length:", transcription.text?.length, "Words:", transcription.words?.length);

    return new Response(JSON.stringify({
      ok: true,
      source: "elevenlabs_scribe_v2",
      text: transcription.text,
      words: transcription.words,
      audio_events: transcription.audio_events,
      language: transcription.language_code,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[STT] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
