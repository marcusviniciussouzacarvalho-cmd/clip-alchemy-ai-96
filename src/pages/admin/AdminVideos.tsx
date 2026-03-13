import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Video, ExternalLink, Eye, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getVideoStatusInfo, formatDuration } from "@/lib/video-utils";

function useAdminVideos() {
  return useQuery({
    queryKey: ["admin-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
}

const AdminVideos = () => {
  const { data: videos, isLoading, refetch } = useAdminVideos();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = videos?.filter((v) =>
    v.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleReprocess = async (videoId: string) => {
    try {
      const { error } = await supabase.functions.invoke("process-video", {
        body: { video_id: videoId },
      });
      if (error) throw error;
      toast.success("Reprocessamento iniciado");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao reprocessar");
    }
  };

  return (
    <DashboardLayout>
      <AdminLayout>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            <Video size={14} className="inline mr-1" />
            {videos?.length || 0} vídeos na plataforma
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-7 text-xs">
              <RefreshCw size={12} className="mr-1" /> Atualizar
            </Button>
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar vídeo..." className="pl-9 h-8 text-xs" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : !filtered?.length ? (
          <div className="venus-card p-10 text-center">
            <Video size={32} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum vídeo encontrado</p>
          </div>
        ) : (
          <div className="venus-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-3 font-medium">Título</th>
                    <th className="text-left p-3 font-medium">Origem</th>
                    <th className="text-center p-3 font-medium">Duração</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    <th className="text-center p-3 font-medium">Progresso</th>
                    <th className="text-left p-3 font-medium">Data</th>
                    <th className="text-right p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v, i) => {
                    const statusInfo = getVideoStatusInfo(v.status);
                    return (
                      <motion.tr
                        key={v.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors"
                      >
                        <td className="p-3">
                          <p className="font-medium truncate max-w-[250px]">{v.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[250px]">{v.user_id.slice(0, 8)}...</p>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            v.source_type === "youtube" ? "bg-destructive/10 text-destructive-foreground" : "bg-accent text-muted-foreground"
                          }`}>
                            {v.source_type === "youtube" ? "YouTube" : "Upload"}
                          </span>
                        </td>
                        <td className="p-3 text-center tabular-nums">{formatDuration(v.duration_seconds)}</td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="p-3 text-center tabular-nums">{v.progress || 0}%</td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(v.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Visualizar"
                              onClick={() => navigate(`/dashboard/videos/${v.id}`)}>
                              <Eye size={13} />
                            </Button>
                            {(v.status === "error" || v.status === "failed" || v.status === "uploaded") && (
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Reprocessar"
                                onClick={() => handleReprocess(v.id)}>
                                <RefreshCw size={13} />
                              </Button>
                            )}
                            {v.source_type === "youtube" && v.external_video_id && (
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Ver no YouTube" asChild>
                                <a href={`https://youtube.com/watch?v=${v.external_video_id}`} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink size={13} />
                                </a>
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AdminLayout>
    </DashboardLayout>
  );
};

export default AdminVideos;
