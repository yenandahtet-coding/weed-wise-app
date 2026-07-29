import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User, Bell, Palette, ShieldCheck, LogOut, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { useI18n, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AgriScan AI" },
      { name: "description", content: "Manage your account and preferences." },
    ],
  }),
  component: () => <RequireAuth><SettingsPage /></RequireAuth>,
});

function SettingsPage() {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
  const [notif, setNotif] = useState({ detection: true, rec: true, saved: false });

  useEffect(() => {
    const saved = localStorage.getItem("theme") === "dark";
    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  const toggleDark = (v: boolean) => {
    setDark(v);
    document.documentElement.classList.toggle("dark", v);
    localStorage.setItem("theme", v ? "dark" : "light");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Section icon={User} title={t("account")}>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-gradient-primary text-lg text-primary-foreground">
              {user?.name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{user?.name}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("fullName")}</Label>
            <Input defaultValue={user?.name} />
          </div>
          <div className="space-y-2">
            <Label>{t("email")}</Label>
            <Input defaultValue={user?.email} />
          </div>
        </div>
        <Button className="bg-gradient-primary" onClick={() => toast.success("Profile updated")}>Save Changes</Button>
      </Section>

      <Section icon={Palette} title={t("language")}>
        <Select value={lang} onValueChange={(v) => { setLang(v as Lang); toast.success("Language updated"); }}>
          <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="my">မြန်မာ</SelectItem>
          </SelectContent>
        </Select>
      </Section>

      <Section icon={Bell} title={t("notifications")}>
        <Toggle label="Detection completed" v={notif.detection} onChange={(v) => setNotif((n) => ({ ...n, detection: v }))} />
        <Toggle label="Recommendation available" v={notif.rec} onChange={(v) => setNotif((n) => ({ ...n, rec: v }))} />
        <Toggle label="History saved" v={notif.saved} onChange={(v) => setNotif((n) => ({ ...n, saved: v }))} />
      </Section>

      <Section icon={Palette} title={t("appearance")}>
        <div className="grid grid-cols-2 gap-3">
          <ThemeCard active={!dark} icon={Sun} label={t("lightMode")} onClick={() => toggleDark(false)} />
          <ThemeCard active={dark} icon={Moon} label={t("darkMode")} onClick={() => toggleDark(true)} />
        </div>
      </Section>

      <Section icon={ShieldCheck} title={t("security")}>
        <Button variant="outline" onClick={() => toast.info("Password reset link sent (mock)")}>{t("changePassword")}</Button>
        <Button variant="destructive" onClick={() => { logout(); navigate({ to: "/login" }); }}>
          <LogOut className="mr-2 h-4 w-4" />{t("logout")}
        </Button>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {children}
    </Card>
  );
}
function Toggle({ label, v, onChange }: { label: string; v: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm">{label}</span>
      <Switch checked={v} onCheckedChange={onChange} />
    </div>
  );
}
function ThemeCard({ active, icon: Icon, label, onClick }: { active: boolean; icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
        active ? "border-primary bg-primary/10 shadow-soft" : "border-border hover:border-primary/50"
      }`}
    >
      <Icon className="h-6 w-6" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
