import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from "@/hooks/use-realtime";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

const typeIcons: Record<string, string> = {
  processing: "⚙️",
  clip_ready: "🎬",
  error: "❌",
  system: "📢",
  billing: "💳",
  success: "✅",
};

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: unread = 0 } = useUnreadCount();
  const { data: notifications = [] } = useNotifications(8);
  const markRead = useMarkAsRead();
  const markAll = useMarkAllAsRead();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-accent transition-colors"
      >
        <Bell size={18} className="text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-foreground text-background text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-xs font-bold uppercase tracking-wider">Notificações</span>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    onClick={() => markAll.mutate()}
                    className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-accent transition-colors"
                  >
                    <CheckCheck size={10} /> Marcar todas
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell size={20} className="mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((n: any) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-border/50 hover:bg-accent/50 transition-colors cursor-pointer ${
                      !n.is_read ? "bg-accent/30" : ""
                    }`}
                    onClick={() => { if (!n.is_read) markRead.mutate(n.id); }}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-sm mt-0.5">{typeIcons[n.type] || "📢"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold truncate">{n.title}</span>
                          {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Link
              to="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="block text-center py-2.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground border-t border-border hover:bg-accent/50 transition-colors"
            >
              Ver todas as notificações
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
