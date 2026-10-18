import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { User, Bell, Palette, ShieldCheck, LogOut, Sun, Moon, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { useI18n, type Lang } from "@/lib/i18n";
import { updateUserProfile } from "@/lib/firebaseService";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";

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
  const { user, logout, updateUser } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
  const [notif, setNotif] = useState({ detection: true, rec: true, saved: false });
  const [name, setName] = useState(user?.name || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      if (user.notifications) setNotif(user.notifications);
    }
  }, [user]);

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        try {
          setUploadingAvatar(true);
          const canvas = document.createElement("canvas");
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const minSide = Math.min(img.width, img.height);
            const sx = (img.width - minSide) / 2;
            const sy = (img.height - minSide) / 2;
            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 256, 256);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

            await updateUserProfile(user.id, { avatarUrl: dataUrl });
            updateUser({ avatarUrl: dataUrl });
            toast.success("Profile photo updated");
          }
        } catch (err) {
          console.error("Avatar error:", err);
          toast.error("Failed to upload photo");
        } finally {
          setUploadingAvatar(false);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleNotifChange = async (key: "detection" | "rec" | "saved", val: boolean) => {
    const updated = { ...notif, [key]: val };
    setNotif(updated);
    if (user) {
      try {
        await updateUserProfile(user.id, { notifications: updated });
        updateUser({ notifications: updated });
        toast.success("Preferences saved");
      } catch (err) {
        console.error("Notif update error:", err);
      }
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      setSendingReset(true);
      await sendPasswordResetEmail(auth, user.email);
      toast.success(`Password reset link sent to ${user.email}`);
    } catch (err: any) {
      console.error("Password reset error:", err);
      toast.error(err?.message || "Failed to send reset email");
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Section icon={User} title={t("account")}>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
              <AvatarFallback className="bg-gradient-primary text-lg text-primary-foreground">
                {user?.name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground shadow hover:scale-105 transition-all"
              title="Upload profile photo"
            >
              {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <div className="font-semibold">{user?.name}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("fullName")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("email")}</Label>
            <Input defaultValue={user?.email} disabled />
          </div>
        </div>
        <Button 
          className="bg-gradient-primary" 
          onClick={async () => {
            if (!user) return;
            try {
              await updateUserProfile(user.id, { fullName: name, preferredLanguage: lang });
              updateUser({ name });
              toast.success("Profile updated");
            } catch (err) {
              console.error("Profile update error:", err);
              toast.error("Failed to update profile");
            }
          }}
        >
          Save Changes
        </Button>
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
        <Toggle label="Detection completed" v={notif.detection} onChange={(v) => handleNotifChange("detection", v)} />
        <Toggle label="Recommendation available" v={notif.rec} onChange={(v) => handleNotifChange("rec", v)} />
        <Toggle label="History saved" v={notif.saved} onChange={(v) => handleNotifChange("saved", v)} />
      </Section>

      <Section icon={Palette} title={t("appearance")}>
        <div className="grid grid-cols-2 gap-3">
          <ThemeCard active={!dark} icon={Sun} label={t("lightMode")} onClick={() => toggleDark(false)} />
          <ThemeCard active={dark} icon={Moon} label={t("darkMode")} onClick={() => toggleDark(true)} />
        </div>
      </Section>

      <Section icon={ShieldCheck} title={t("security")}>
        <Button variant="outline" onClick={handlePasswordReset} disabled={sendingReset}>
          {sendingReset ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t("changePassword")}
        </Button>
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
