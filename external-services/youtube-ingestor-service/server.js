const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// ─── Health ───
app.get("/", (_req, res) => res.json({ service: "youtube-ingestor", status: "ok" }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ─── POST /ingest ───
app.post("/ingest", async (req, res) => {
  const { source_url, project_id, video_id, user_id } = req.body;

  if (!source_url || !video_id || !user_id) {
    return res.status(400).json({ error: "Missing required fields: source_url, video_id, user_id" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "yt-ingest-"));
  const outputTemplate = path.join(tmpDir, "%(id)s.%(ext)s");

  console.log(`[INGEST] Starting download: ${source_url} (video_id=${video_id})`);

  try {
    // Step 1: Get video metadata with yt-dlp
    const meta = await new Promise((resolve, reject) => {
      execFile("yt-dlp", [
        "--no-download",
        "--print-json",
        "--no-warnings",
        source_url,
      ], { timeout: 30000 }, (err, stdout, stderr) => {
        if (err) return reject(new Error(`yt-dlp metadata failed: ${stderr || err.message}`));
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          reject(new Error(`Failed to parse yt-dlp JSON: ${e.message}`));
        }
      });
    });

    const title = meta.title || "Untitled";
    const durationSeconds = meta.duration || null;
    console.log(`[INGEST] Metadata: title="${title}", duration=${durationSeconds}s`);

    // Step 2: Download the video (best mp4 with audio, max 1080p)
    await new Promise((resolve, reject) => {
      execFile("yt-dlp", [
        "-f", "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best",
        "--merge-output-format", "mp4",
        "--no-playlist",
        "--no-warnings",
        "-o", outputTemplate,
        source_url,
      ], { timeout: 600000 }, (err, stdout, stderr) => {
        if (err) return reject(new Error(`yt-dlp download failed: ${stderr || err.message}`));
        console.log(`[INGEST] Download complete`);
        resolve(stdout);
      });
    });

    // Step 3: Find the downloaded file
    const files = fs.readdirSync(tmpDir);
    const videoFile = files.find(f => f.endsWith(".mp4") || f.endsWith(".webm") || f.endsWith(".mkv"));
    if (!videoFile) {
      throw new Error("No video file found after download");
    }

    const localPath = path.join(tmpDir, videoFile);
    const fileBuffer = fs.readFileSync(localPath);
    const fileSize = fileBuffer.byteLength;
    const ext = path.extname(videoFile).slice(1);
    const mimeType = ext === "webm" ? "video/webm" : ext === "mkv" ? "video/x-matroska" : "video/mp4";

    console.log(`[INGEST] File: ${videoFile}, size=${fileSize}, mime=${mimeType}`);

    // Step 4: Upload to Supabase Storage
    const storagePath = `${user_id}/imports/${Date.now()}_${video_id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    console.log(`[INGEST] Uploaded to storage: ${storagePath}`);

    // Step 5: Generate a signed URL (valid 1 hour)
    const { data: signed } = await supabase.storage
      .from("videos")
      .createSignedUrl(storagePath, 3600);

    // Step 6: Cleanup temp files
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (_) {}

    // Step 7: Return result
    return res.json({
      success: true,
      file_path: storagePath,
      asset_url: signed?.signedUrl || null,
      title,
      duration_seconds: durationSeconds,
      mime_type: mimeType,
      file_size: fileSize,
    });

  } catch (err) {
    console.error(`[INGEST] Error:`, err.message);

    // Cleanup on error
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}

    return res.status(500).json({
      error: err.message,
      stage: "ingest",
    });
  }
});

app.listen(PORT, () => {
  console.log(`[youtube-ingestor-service] Running on port ${PORT}`);
});
