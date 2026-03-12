import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Video, Clock, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

function useAdminVideos() {
  return useQuery({
    queryKey: ["admin-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

const statusLabel: Record<string, string> = {
  uploaded: "Enviado",
  processing: "Processando",
  completed: "Concluído",
  failed: "Erro",
};

const AdminVideos = () => {
  const { data: videos, isLoading } = useAdminVideos();
  const [search, setSearch] = useState("");

  const filtered = videos?.filter((v) =>
    v.title.toLowerCase().includes(search.toLowerCase())
  );

  const formatDuration = (s: number | null) => {
    if (!s) return "—";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <DashboardLayout>
      <AdminLayout>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            <Video size={14} className="inline mr-1" />
            {videos?.length || 0} vídeos na plataforma
          </p>
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar vídeo..." className="pl-9 h-8 text-xs" />
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
                    <th className="text-left p-3 font-medium">Categoria</th>
                    <th className="text-center p-3 font-medium">Duração</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v, i) => (
                    <motion.tr
                      key={v.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors"
                    >
                      <td className="p-3">
                        <p className="font-medium truncate max-w-[250px]">{v.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[250px]">{v.description || "—"}</p>
                      </td>
                      <td className="p-3 text-muted-foreground">{v.category || "—"}</td>
                      <td className="p-3 text-center tabular-nums">{formatDuration(v.duration_seconds)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          v.status === "completed" ? "bg-foreground text-background" :
                          v.status === "failed" ? "bg-destructive/20 text-destructive-foreground" :
                          "bg-accent text-muted-foreground"
                        }`}>
                          {statusLabel[v.status || "uploaded"] || v.status}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(v.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </td>
                    </motion.tr>
                  ))}
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
