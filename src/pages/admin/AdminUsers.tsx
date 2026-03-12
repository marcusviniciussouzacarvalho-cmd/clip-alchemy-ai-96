import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Search, Users, Trash2, Ban, CreditCard, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useState, useCallback } from "react";
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

type ModalAction = null | "delete" | "block" | "credits" | "reset_password";

const AdminUsers = () => {
  const { data: users, isLoading } = useAdminUsers();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [newBalance, setNewBalance] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = users?.filter((u) =>
    (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
    u.user_id.toLowerCase().includes(search.toLowerCase())
  );

  const openAction = (user: any, action: ModalAction) => {
    setSelectedUser(user);
    setModalAction(action);
    if (action === "credits") setNewBalance(String(user.credits));
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalAction(null);
    setNewBalance("");
  };

  const executeAction = useCallback(async () => {
    if (!selectedUser || !modalAction) return;
    setActionLoading(true);
    try {
      const body: any = { action: modalAction, target_user_id: selectedUser.user_id };
      if (modalAction === "credits") body.balance = newBalance;

      const { data, error } = await supabase.functions.invoke("admin-actions", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(data?.message || "Ação executada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      closeModal();
    } catch (err: any) {
      toast.error(err.message || "Erro ao executar ação");
    } finally {
      setActionLoading(false);
    }
  }, [selectedUser, modalAction, newBalance, queryClient]);

  const modalConfig: Record<string, { title: string; desc: string; destructive?: boolean }> = {
    delete: { title: "Deletar usuário", desc: "Todos os dados deste usuário serão removidos permanentemente. Esta ação não pode ser desfeita.", destructive: true },
    block: { title: "Bloquear usuário", desc: "O usuário será impedido de fazer login na plataforma." },
    credits: { title: "Alterar créditos", desc: "Defina o novo saldo de créditos para este usuário." },
    reset_password: { title: "Resetar senha", desc: "Um link de redefinição de senha será gerado para o email do usuário." },
  };

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
                    <th className="text-right p-3 font-medium">Ações</th>
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
                          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center overflow-hidden shrink-0">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Users size={12} className="text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{u.display_name || "Sem nome"}</p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{u.user_id}</p>
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
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="sm" className="h-7 w-7 p-0"
                            title="Alterar créditos"
                            onClick={() => openAction(u, "credits")}
                          >
                            <CreditCard size={13} />
                          </Button>
                          <Button
                            variant="ghost" size="sm" className="h-7 w-7 p-0"
                            title="Resetar senha"
                            onClick={() => openAction(u, "reset_password")}
                          >
                            <KeyRound size={13} />
                          </Button>
                          {u.role !== "admin" && (
                            <>
                              <Button
                                variant="ghost" size="sm" className="h-7 w-7 p-0"
                                title="Bloquear"
                                onClick={() => openAction(u, "block")}
                              >
                                <Ban size={13} />
                              </Button>
                              <Button
                                variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                title="Deletar"
                                onClick={() => openAction(u, "delete")}
                              >
                                <Trash2 size={13} />
                              </Button>
                            </>
                          )}
                          {u.role === "admin" && (
                            <span className="ml-1">
                              <ShieldCheck size={13} className="text-muted-foreground" />
                            </span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Modal */}
        <Dialog open={!!modalAction} onOpenChange={(open) => !open && closeModal()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{modalAction && modalConfig[modalAction]?.title}</DialogTitle>
              <DialogDescription>
                {modalAction && modalConfig[modalAction]?.desc}
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="py-2">
                <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-accent">
                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                    <Users size={14} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{selectedUser.display_name || "Sem nome"}</p>
                    <p className="text-[10px] text-muted-foreground">{selectedUser.user_id}</p>
                  </div>
                </div>

                {modalAction === "credits" && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Novo saldo</label>
                    <Input
                      type="number"
                      value={newBalance}
                      onChange={(e) => setNewBalance(e.target.value)}
                      className="mt-1 h-8 text-sm"
                      min={0}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Saldo atual: {selectedUser.credits} créditos</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={closeModal} disabled={actionLoading}>
                Cancelar
              </Button>
              <Button
                size="sm"
                variant={modalAction && modalConfig[modalAction]?.destructive ? "destructive" : "default"}
                onClick={executeAction}
                disabled={actionLoading}
              >
                {actionLoading && <Loader2 size={12} className="animate-spin mr-1.5" />}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </DashboardLayout>
  );
};

export default AdminUsers;
