import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Upload, Scissors, FileText, Settings, LogOut, CreditCard, BarChart3, FolderOpen, Palette, Video, Shield, Menu, X, ChevronRight, Link2, PenTool, TrendingUp, Anchor, Sparkles } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Upload, label: "Upload", href: "/dashboard/upload" },
  { icon: Link2, label: "Importar", href: "/dashboard/import" },
  { icon: FolderOpen, label: "Biblioteca", href: "/dashboard/library" },
  { icon: Scissors, label: "Clips", href: "/dashboard/clips" },
  { icon: Video, label: "Editor", href: "/dashboard/editor" },
  { icon: FileText, label: "Transcrições", href: "/dashboard/transcripts" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: CreditCard, label: "Créditos", href: "/dashboard/credits" },
  { icon: Palette, label: "Brand Kit", href: "/dashboard/brand-kit" },
  { icon: Settings, label: "Configurações", href: "/dashboard/settings" },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate("/");
  };

  // Breadcrumb
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const breadcrumbLabels: Record<string, string> = {
    dashboard: "Dashboard",
    upload: "Upload",
    import: "Importar",
    library: "Biblioteca",
    clips: "Clips",
    editor: "Editor",
    transcripts: "Transcrições",
    analytics: "Analytics",
    credits: "Créditos",
    "brand-kit": "Brand Kit",
    settings: "Configurações",
    admin: "Admin",
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] border-r border-border bg-sidebar fixed inset-y-0 left-0 z-30">
        <div className="p-5 pb-6">
          <Link to="/" className="font-display text-base font-extrabold tracking-tight text-foreground">
            VENUS<span className="text-muted-foreground">CLIP</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all ${
                  active
                    ? "bg-foreground text-background font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                }`}
              >
                <item.icon size={16} strokeWidth={active ? 2.5 : 1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border px-3 py-3 space-y-0.5">
          <Link
            to="/dashboard/admin"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all ${
              location.pathname === "/dashboard/admin"
                ? "bg-foreground text-background font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
            }`}
          >
            <Shield size={16} strokeWidth={1.5} />
            Admin
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all"
          >
            <LogOut size={16} strokeWidth={1.5} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-[220px] overflow-auto min-h-screen">
        {/* Top bar mobile */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-sidebar sticky top-0 z-20">
          <Link to="/" className="font-display text-base font-extrabold">
            VENUS<span className="text-muted-foreground">CLIP</span>
          </Link>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground p-1">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-b border-border bg-sidebar p-3 space-y-0.5">
            {navItems.map((item) => {
              const active = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    active ? "bg-foreground text-background font-semibold" : "text-muted-foreground"
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-muted-foreground"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="hidden md:flex items-center gap-1 px-8 pt-6 text-xs text-muted-foreground">
          {pathSegments.map((seg, i) => (
            <span key={seg} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={12} />}
              <span className={i === pathSegments.length - 1 ? "text-foreground font-medium" : ""}>
                {breadcrumbLabels[seg] || seg}
              </span>
            </span>
          ))}
        </div>

        <div className="p-5 md:px-8 md:py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
