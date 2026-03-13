import { Link, useLocation } from "react-router-dom";
import { Users, Video, BarChart3, Activity, Settings, ArrowLeft, AlertCircle } from "lucide-react";

const adminNav = [
  { icon: BarChart3, label: "Visão Geral", href: "/dashboard/admin" },
  { icon: Users, label: "Usuários", href: "/dashboard/admin/users" },
  { icon: Video, label: "Vídeos", href: "/dashboard/admin/videos" },
  { icon: Activity, label: "Jobs", href: "/dashboard/admin/jobs" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/admin/analytics" },
  { icon: AlertCircle, label: "Erros", href: "/dashboard/admin/errors" },
  { icon: Settings, label: "Configurações", href: "/dashboard/admin/settings" },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-xl font-extrabold">Painel Admin</h1>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {adminNav.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                active
                  ? "bg-foreground text-background"
                  : "bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon size={13} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
};

export default AdminLayout;
