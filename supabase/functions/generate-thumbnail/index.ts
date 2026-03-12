import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("authorization");
    const { title, transcript, style = "bold", customText, textColor = "#FFFFFF" } = await req.json();

    if (!title) throw new Error("Title is required");

    const stylePrompts: Record<string, string> = {
      minimalista: "Clean minimalist YouTube thumbnail with lots of negative space, subtle colors, elegant thin typography, soft shadows, professional and refined look",
      bold: "Bold dramatic YouTube thumbnail with high contrast, intense colors, thick impactful text, dynamic composition, eye-catching and energetic",
      moderno: "Modern sleek YouTube thumbnail with gradient overlays, geometric shapes, contemporary design, neon accents, trendy and fresh aesthetic",
      criador: "Creator-style YouTube thumbnail with expressive face closeup, bright background, large bold text overlay, personal branding feel, authentic and engaging",
    };

    const styleDesc = stylePrompts[style] || stylePrompts.bold;
    const displayText = customText || title.split(" ").slice(0, 4).join(" ").toUpperCase();

    const prompt = `Create a professional YouTube video thumbnail. ${styleDesc}. The thumbnail should have: a dramatic cinematic background related to the topic "${title}", space for text overlay saying "${displayText}" in ${textColor} color, high contrast and vibrant colors, 16:9 aspect ratio, photorealistic quality. Topic context: ${transcript ? transcript.substring(0, 200) : title}. Make it look like a top YouTuber's thumbnail. On a clean background.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image generated");
    }

    // Optionally upload to storage if auth is provided
    let storagePath: string | null = null;
    if (authHeader) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Decode base64 to bytes
        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
        const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

        const fileName = `thumbnail_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
        const { error: uploadError } = await supabase.storage
          .from("thumbnails")
          .upload(fileName, binaryData, { contentType: "image/png", upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("thumbnails").getPublicUrl(fileName);
          storagePath = urlData.publicUrl;
        }
      } catch (e) {
        console.error("Storage upload failed:", e);
      }
    }

    return new Response(JSON.stringify({
      image_base64: imageUrl,
      storage_url: storagePath,
      style,
      text: displayText,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-thumbnail error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
