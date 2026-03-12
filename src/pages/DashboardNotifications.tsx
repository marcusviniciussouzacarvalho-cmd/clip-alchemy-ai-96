import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useUnreadCount } from "@/hooks/use-realtime";
import { Bell, CheckCheck, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeIcons: Record<string, string> = {
  processing: "⚙️", clip_ready: "🎬", error: "❌", system: "📢", billing: "💳", success: "✅",
};

const typeLabels: Record<string, string> = {
  processing: "Processamento", clip_ready: "Clips", error: "Erros", system: "Sistema", billing: "Cobrança", success: "Sucesso",
};

const DashboardNotifications = () => {
  const { data: notifications, isLoading } = useNotifications(50);
  const { data: unread = 0 } = useUnreadCount();
  const markRead = useMarkAsRead();
  const markAll = useMarkAllAsRead();
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter
    ? notifications?.filter((n: any) => n.type === filter)
    : notifications;

  const types = [...new Set(notifications?.map((n: any) => n.type) || [])];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Notificações</h1>
          <p className="text-sm text-muted-foreground">{unread} não lidas</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            <CheckCheck size={14} className="mr-1.5" /> Marcar todas como lidas
          </Button>
        )}
      </div>

      {types.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          <button
            onClick={() => setFilter(null)}
            className={`text-[11px] px-3 py-1 rounded-full transition-colors ${
              !filter ? "bg-foreground text-background font-semibold" : "bg-accent text-muted-foreground hover:text-foreground"
            }`}
          >
            Todas
          </button>
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`text-[11px] px-3 py-1 rounded-full transition-colors ${
                filter === type ? "bg-foreground text-background font-semibold" : "bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              {typeLabels[type] || type}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="venus-card p-4">
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <div className="venus-card p-12 text-center">
          <Bell size={32} className="mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="font-bold mb-1">Nenhuma notificação</h3>
          <p className="text-sm text-muted-foreground">Suas notificações aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n: any, i: number) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`venus-card p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                !n.is_read ? "border-foreground/20" : ""
              }`}
              onClick={() => { if (!n.is_read) markRead.mutate(n.id); }}
            >
              <span className="text-lg mt-0.5">{typeIcons[n.type] || "📢"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{n.title}</span>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-foreground shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              <span className="text-[10px] bg-accent px-2 py-0.5 rounded-full shrink-0">
                {typeLabels[n.type] || n.type}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardNotifications;
