const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;

// ─── Aspect ratio → FFmpeg filter ───
function getVideoFilter(format) {
  switch (format) {
    case "9:16":  return "crop=ih*9/16:ih,scale=1080:1920";
    case "1:1":   return "crop=min(iw\\,ih):min(iw\\,ih),scale=1080:1080";
    case "4:5":   return "crop=ih*4/5:ih,scale=864:1080";
    case "4:3":   return "crop=ih*4/3:ih,scale=1440:1080";
    case "16:9":  return "scale=1920:1080";
    default:      return null; // no crop, keep original
  }
}

// ─── Health ───
app.get("/", (_req, res) => res.json({ service: "video-render", status: "ok" }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ─── POST /render ───
app.post("/render", async (req, res) => {
  const {
    source_url,
    project_id,
    video_id,
    clip_id,
    start_time = 0,
    end_time = 30,
    format = "16:9",
    output_ext = "mp4",
  } = req.body;

  if (!source_url) {
    return res.status(400).json({ error: "Missing required field: source_url" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "render-"));
  const outputFile = path.join(tmpDir, `clip_${Date.now()}.${output_ext}`);
  const duration = Math.max(0.1, end_time - start_time);

  console.log(`[RENDER] source=${source_url.slice(0, 80)}... start=${start_time} end=${end_time} format=${format}`);

  try {
    // Build FFmpeg args
    const args = [
      "-y",
      "-ss", String(start_time),
      "-t", String(duration),
      "-i", source_url,
    ];

    const vf = getVideoFilter(format);
    if (vf) {
      args.push("-vf", vf);
    }

    args.push(
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "23",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      "-max_muxing_queue_size", "1024",
      outputFile
    );

    // Run FFmpeg
    await new Promise((resolve, reject) => {
      execFile("ffmpeg", args, { timeout: 300000 }, (err, stdout, stderr) => {
        if (err) {
          console.error("[RENDER] FFmpeg stderr:", stderr?.slice(-500));
          return reject(new Error(`FFmpeg failed: ${err.message}`));
        }
        resolve(stdout);
      });
    });

    if (!fs.existsSync(outputFile)) {
      throw new Error("FFmpeg produced no output file");
    }

    const fileBuffer = fs.readFileSync(outputFile);
    const fileSize = fileBuffer.byteLength;
    const mimeType = output_ext === "webm" ? "video/webm" : "video/mp4";

    console.log(`[RENDER] Output: ${fileSize} bytes, ${mimeType}`);

    // Upload to Supabase Storage (clips bucket)
    const clipFileName = `${clip_id || video_id || crypto.randomUUID()}`;
    const storagePath = `rendered/${Date.now()}_${clipFileName}.${output_ext}`;

    const { error: uploadError } = await supabase.storage
      .from("clips")
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    console.log(`[RENDER] Uploaded to clips/${storagePath}`);

    // Get public URL (clips bucket is public)
    const { data: publicUrl } = supabase.storage
      .from("clips")
      .getPublicUrl(storagePath);

    // Cleanup
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}

    return res.json({
      success: true,
      file_path: storagePath,
      download_url: publicUrl?.publicUrl || null,
      mime_type: mimeType,
      duration_seconds: duration,
      file_size: fileSize,
    });

  } catch (err) {
    console.error(`[RENDER] Error:`, err.message);
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}

    return res.status(500).json({
      error: err.message,
      stage: "render",
    });
  }
});

app.listen(PORT, () => {
  console.log(`[video-render-service] Running on port ${PORT}`);
});
