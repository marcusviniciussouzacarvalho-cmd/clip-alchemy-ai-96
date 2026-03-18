# YouTube Ingestor Service

Downloads YouTube videos via **yt-dlp** and uploads to Supabase Storage.

## Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret, from project settings) |
| `PORT` | (optional) Server port, default `3001` |

## Deploy on Railway

1. Create a new project → **Deploy from GitHub repo** (or **Deploy from Dockerfile**)
2. Point to the `external-services/youtube-ingestor-service/` directory
3. Set the environment variables above
4. Railway will build the Dockerfile automatically
5. Copy the generated URL (e.g. `https://youtube-ingestor-xxx.up.railway.app`)

## Deploy on Render

1. Create a new **Web Service** → connect your repo
2. Set **Root Directory** to `external-services/youtube-ingestor-service`
3. Set **Environment** to **Docker**
4. Add the environment variables above
5. Copy the generated URL

## API

### `POST /ingest`

```json
{
  "source_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "video_id": "uuid-from-supabase",
  "user_id": "uuid-from-supabase",
  "project_id": "optional"
}
```

**Response:**
```json
{
  "success": true,
  "file_path": "user-id/imports/1234_videoId.mp4",
  "asset_url": "https://xxx.supabase.co/storage/v1/...",
  "title": "Video Title",
  "duration_seconds": 240,
  "mime_type": "video/mp4",
  "file_size": 52428800
}
```
