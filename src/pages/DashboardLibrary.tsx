import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Scissors, Search, Play, Loader2, Upload, BarChart3, Clock } from "lucide-react";
import { useState } from "react";
import { useVideos, useClips } from "@/hooks/use-pipeline";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardLibrary = () => {
  const [tab, setTab] = useState<"videos" | "clips">("videos");
  const { data: videos, isLoading: videosLoading } = useVideos();
  const { data: clips, isLoading: clipsLoading } = useClips();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filteredVideos = videos?.filter((v) =>
    v.title.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const filteredClips = clips?.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const isLoading = tab === "videos" ? videosLoading : clipsLoading;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Biblioteca</h1>
          <p className="text-sm text-muted-foreground">Seus vídeos e clips</p>
        </div>
        <Button variant="default" size="sm" asChild>
          <a href="/dashboard/upload"><Upload size={14} className="mr-1.5" /> Upload</a>
        </Button>
      </div>

      <div className="flex gap-1 mb-5 p-0.5 bg-accent rounded-lg w-fit">
        <button
          onClick={() => setTab("videos")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === "videos" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Video size={12} className="inline mr-1" /> Vídeos ({videos?.length || 0})
        </button>
        <button
          onClick={() => setTab("clips")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === "clips" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Scissors size={12} className="inline mr-1" /> Clips ({clips?.length || 0})
        </button>
      </div>

      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-8 h-8 text-sm" />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 venus-card">
              <Skeleton className="w-16 h-10 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-2.5 w-24" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      ) : tab === "videos" ? (
        filteredVideos.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="venus-card p-12 text-center">
            <Video size={36} className="mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="font-bold text-lg mb-1">Nenhum vídeo</h3>
            <p className="text-sm text-muted-foreground mb-4">Faça upload do seu primeiro vídeo</p>
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard/upload">Enviar vídeo</a>
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-1.5">
            {filteredVideos.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between p-3 venus-card hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <Play size={14} className="text-muted-foreground/40" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{v.title}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      {v.category && <span>{v.category}</span>}
                      <span>{new Date(v.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  v.status === "ready" ? "bg-foreground text-background" :
                  v.status === "processing" ? "bg-accent text-muted-foreground animate-pulse-subtle" :
                  v.status === "error" ? "bg-destructive/20 text-destructive-foreground" :
                  "bg-accent text-muted-foreground"
                }`}>
                  {v.status === "ready" ? "Pronto" : v.status === "processing" ? "Processando" : v.status === "error" ? "Erro" : "Enviado"}
                </span>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        filteredClips.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="venus-card p-12 text-center">
            <Scissors size={36} className="mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="font-bold text-lg mb-1">Nenhum clip</h3>
            <p className="text-sm text-muted-foreground">Clips serão gerados após o processamento</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredClips.map((clip, i) => (
              <motion.div
                key={clip.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="venus-card overflow-hidden group"
              >
                <div className="aspect-video bg-accent flex items-center justify-center relative">
                  <Play size={24} className="text-muted-foreground/30 group-hover:text-foreground/50 transition-colors" />
                  {clip.duration_seconds && (
                    <span className="absolute bottom-2 right-2 text-[10px] bg-background/80 backdrop-blur px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Clock size={9} />
                      {Math.floor(clip.duration_seconds / 60)}:{Math.floor(clip.duration_seconds % 60).toString().padStart(2, "0")}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-bold truncate">{clip.title}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                    <BarChart3 size={10} />
                    Score: {clip.virality_score || 0}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}
    </DashboardLayout>
  );
};

export default DashboardLibrary;
