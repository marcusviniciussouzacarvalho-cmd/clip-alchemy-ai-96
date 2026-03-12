import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Upload, Scissors, FileText, Settings, LogOut, CreditCard, Users } from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Upload, label: "Upload", href: "/dashboard/upload" },
  { icon: Scissors, label: "Clips", href: "/dashboard/clips" },
  { icon: FileText, label: "Transcrições", href: "/dashboard/transcripts" },
  { icon: CreditCard, label: "Créditos", href: "/dashboard/credits" },
  { icon: Settings, label: "Configurações", href: "/dashboard/settings" },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-surface p-4">
        <Link to="/" className="font-display text-lg font-bold tracking-tight mb-8 px-2">
          VENUSCLIP
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-foreground text-background font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border pt-4 mt-4 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors">
            <LogOut size={18} />
            Sair
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Top bar mobile */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border">
          <Link to="/" className="font-display text-lg font-bold">VENUSCLIP</Link>
        </div>

        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
