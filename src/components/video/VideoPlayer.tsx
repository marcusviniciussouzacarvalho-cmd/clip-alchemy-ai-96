import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { getPlaybackUrl } from "@/lib/video-utils";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  video: {
    id: string;
    source_type?: string | null;
    file_path?: string | null;
    source_url?: string | null;
    external_video_id?: string | null;
    thumbnail_url?: string | null;
    title: string;
  };
  className?: string;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  startTime?: number;
  endTime?: number;
}

export interface VideoPlayerRef {
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (time: number) => void;
  play: () => void;
  pause: () => void;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({
  video,
  className = "",
  onTimeUpdate,
  onDurationChange,
  startTime,
  endTime,
}, ref) => {
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [playerType, setPlayerType] = useState<"native" | "youtube">("native");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => videoRef.current?.currentTime || 0,
    getDuration: () => videoRef.current?.duration || 0,
    seekTo: (time: number) => {
      if (videoRef.current) videoRef.current.currentTime = time;
    },
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
  }));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getPlaybackUrl(video).then((result) => {
      if (cancelled) return;
      if (result.error || !result.url) {
        setError(result.error || "Não foi possível carregar o vídeo");
        setLoading(false);
        return;
      }
      setPlaybackUrl(result.url);
      setPlayerType(result.type);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [video.id, video.source_type, video.file_path, video.external_video_id]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);
    onTimeUpdate?.(t);
    // If endTime is set, stop at endTime
    if (endTime && t >= endTime) {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    onDurationChange?.(videoRef.current.duration);
    if (startTime) videoRef.current.currentTime = startTime;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      if (startTime && videoRef.current.currentTime < startTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * duration;
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className={`aspect-video bg-accent flex items-center justify-center rounded-xl ${className}`}>
        <Loader2 size={28} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`aspect-video bg-accent flex flex-col items-center justify-center rounded-xl gap-3 ${className}`}>
        <AlertCircle size={28} className="text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground text-center max-w-xs">{error}</p>
        {video.source_url && (
          <Button variant="outline" size="sm" asChild>
            <a href={video.source_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={12} className="mr-1.5" /> Abrir fonte original
            </a>
          </Button>
        )}
      </div>
    );
  }

  // YouTube embed
  if (playerType === "youtube" && playbackUrl) {
    return (
      <div className={`rounded-xl overflow-hidden ${className}`}>
        <div className="aspect-video">
          <iframe
            src={playbackUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={video.title}
          />
        </div>
      </div>
    );
  }

  // Native video player
  return (
    <div className={`rounded-xl overflow-hidden bg-black ${className}`}>
      <div className="relative group">
        <video
          ref={videoRef}
          src={playbackUrl || ""}
          className="w-full aspect-video object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setError("Erro ao carregar o vídeo. O arquivo pode estar corrompido ou inacessível.")}
          muted={muted}
          playsInline
          poster={video.thumbnail_url || undefined}
        />

        {/* Play overlay */}
        {!playing && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="w-14 h-14 rounded-full bg-foreground/90 flex items-center justify-center hover:scale-105 transition-transform">
              <Play size={20} className="text-background ml-0.5" />
            </div>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 py-2.5 bg-card border-t border-border flex items-center gap-3">
        <button onClick={togglePlay} className="text-foreground hover:opacity-80">
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <span className="text-[11px] text-muted-foreground tabular-nums w-20">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div
          className="flex-1 h-1.5 rounded-full bg-accent overflow-hidden cursor-pointer relative"
          onClick={handleSeek}
        >
          {/* Selection range */}
          {startTime !== undefined && endTime !== undefined && duration > 0 && (
            <div
              className="absolute h-full bg-foreground/20"
              style={{
                left: `${(startTime / duration) * 100}%`,
                width: `${((endTime - startTime) / duration) * 100}%`,
              }}
            />
          )}
          <div
            className="h-full rounded-full bg-foreground transition-all"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        <button onClick={() => setMuted(!muted)} className="text-muted-foreground hover:text-foreground">
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>

        <button
          onClick={() => videoRef.current?.requestFullscreen?.()}
          className="text-muted-foreground hover:text-foreground"
        >
          <Maximize size={14} />
        </button>
      </div>
    </div>
  );
});

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
