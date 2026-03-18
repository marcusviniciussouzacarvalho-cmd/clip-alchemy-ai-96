# Video Render Service

Cuts and renders video clips with **FFmpeg** and uploads to Supabase Storage.

## Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret, from project settings) |
| `PORT` | (optional) Server port, default `3002` |

## Deploy on Railway

1. Create a new project → **Deploy from GitHub repo** (or **Deploy from Dockerfile**)
2. Point to the `external-services/video-render-service/` directory
3. Set the environment variables above
4. Railway will build the Dockerfile automatically
5. Copy the generated URL (e.g. `https://video-render-xxx.up.railway.app`)

## Deploy on Render

1. Create a new **Web Service** → connect your repo
2. Set **Root Directory** to `external-services/video-render-service`
3. Set **Environment** to **Docker**
4. Add the environment variables above
5. Copy the generated URL

## API

### `POST /render`

```json
{
  "source_url": "https://xxx.supabase.co/storage/v1/object/sign/videos/...",
  "video_id": "uuid",
  "clip_id": "uuid",
  "start_time": 10.5,
  "end_time": 25.0,
  "format": "9:16",
  "output_ext": "mp4"
}
```

**Response:**
```json
{
  "success": true,
  "file_path": "rendered/1234_clipId.mp4",
  "download_url": "https://xxx.supabase.co/storage/v1/object/public/clips/...",
  "mime_type": "video/mp4",
  "duration_seconds": 14.5,
  "file_size": 5242880
}
```

### Supported formats
- `16:9` — landscape (default)
- `9:16` — vertical/reels/shorts
- `1:1` — square
- `4:5` — Instagram portrait
- `4:3` — classic TV
