import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Mail, Calendar, Video, CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get video counts and credits for each user
      const userIds = profiles.map((p) => p.user_id);
      const [videosRes, creditsRes, rolesRes] = await Promise.all([
        supabase.from("videos").select("user_id"),
        supabase.from("credits").select("user_id, balance"),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      const videoCounts: Record<string, number> = {};
      (videosRes.data || []).forEach((v) => {
        videoCounts[v.user_id] = (videoCounts[v.user_id] || 0) + 1;
      });

      const creditMap: Record<string, number> = {};
      (creditsRes.data || []).forEach((c) => {
        creditMap[c.user_id] = c.balance;
      });

      const roleMap: Record<string, string> = {};
      (rolesRes.data || []).forEach((r: any) => {
        if (r.role === "admin") roleMap[r.user_id] = "admin";
        else if (!roleMap[r.user_id]) roleMap[r.user_id] = r.role;
      });

      return profiles.map((p) => ({
        ...p,
        video_count: videoCounts[p.user_id] || 0,
        credits: creditMap[p.user_id] ?? 0,
        role: roleMap[p.user_id] || "user",
      }));
    },
  });
}

const AdminUsers = () => {
  const { data: users, isLoading } = useAdminUsers();
  const [search, setSearch] = useState("");

  const filtered = users?.filter((u) =>
    (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
    u.user_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <AdminLayout>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            <Users size={14} className="inline mr-1" />
            {users?.length || 0} usuários registrados
          </p>
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuário..."
              className="pl-9 h-8 text-xs"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : !filtered?.length ? (
          <div className="venus-card p-10 text-center">
            <Users size={32} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="venus-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-3 font-medium">Usuário</th>
                    <th className="text-left p-3 font-medium">Role</th>
                    <th className="text-center p-3 font-medium">Vídeos</th>
                    <th className="text-center p-3 font-medium">Créditos</th>
                    <th className="text-left p-3 font-medium">Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center overflow-hidden">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Users size={12} className="text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{u.display_name || "Sem nome"}</p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{u.user_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          u.role === "admin" ? "bg-foreground text-background" : "bg-accent text-muted-foreground"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-center tabular-nums">{u.video_count}</td>
                      <td className="p-3 text-center tabular-nums">{u.credits}</td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
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

export default AdminUsers;
