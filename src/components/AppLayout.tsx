import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
  LayoutDashboard,
  ScanLine,
  Sparkles,
  Pill,
  History,
  Settings,
  LogOut,
  Leaf,
  Bell,
  Globe,
} from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppLayout({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = [
    { to: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { to: "/scan", label: t("scan"), icon: ScanLine },
    { to: "/detection-result", label: t("results"), icon: Sparkles },
    { to: "/recommendation", label: t("recommendations"), icon: Pill },
    { to: "/history", label: t("history"), icon: History },
    { to: "/settings", label: t("settings"), icon: Settings },
  ];

  const currentTitle = nav.find((n) => pathname.startsWith(n.to))?.label || t("dashboard");

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-sidebar-foreground">{t("appName")}</div>
            <div className="truncate text-[10px] text-muted-foreground">AI AgriTech</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-lg sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          <h1 className="flex-1 truncate text-base font-semibold sm:text-lg">{currentTitle}</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="language">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLang("en" as Lang)} className={lang === "en" ? "font-semibold" : ""}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLang("my" as Lang)} className={lang === "my" ? "font-semibold" : ""}>
                မြန်မာ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" aria-label="notifications" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-gradient-primary text-xs text-primary-foreground">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[120px] truncate text-sm sm:inline">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="truncate">{user?.name}</div>
                <div className="truncate text-xs font-normal text-muted-foreground">{user?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                <Settings className="mr-2 h-4 w-4" /> {t("settings")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 pb-24 sm:p-6 lg:pb-6">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur lg:hidden">
          <div className="grid grid-cols-5">
            {nav.slice(0, 5).map((item) => {
              const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="truncate px-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
