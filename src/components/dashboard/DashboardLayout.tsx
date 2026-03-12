import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Upload, Scissors, FileText, Settings, LogOut, CreditCard, BarChart3, FolderOpen, Palette, Video, Shield, Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Upload, label: "Upload", href: "/dashboard/upload" },
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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-sidebar p-4 fixed inset-y-0 left-0 z-30">
        <Link to="/" className="font-display text-lg font-extrabold tracking-tight mb-8 px-2 text-foreground">
          VENUSCLIP
        </Link>

        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-foreground text-background font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-4 mt-4 space-y-0.5">
          <Link to="/dashboard/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all">
            <Shield size={18} />
            Admin
          </Link>
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all">
            <LogOut size={18} />
            Sair
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-60 overflow-auto min-h-screen">
        {/* Top bar mobile */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-sidebar sticky top-0 z-20">
          <Link to="/" className="font-display text-lg font-extrabold">VENUSCLIP</Link>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-b border-border bg-sidebar p-4 space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    active ? "bg-foreground text-background font-semibold" : "text-muted-foreground"
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}

        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
