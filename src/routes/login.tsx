import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Leaf, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";
import { useI18n, type Lang } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — AgriScan AI" },
      { name: "description", content: "Sign in to your AgriScan AI account." },
    ],
  }),
  component: Login,
});

function Login() {
  const { login } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Signed in");
      // AuthGuard will automatically redirect to dashboard when user state updates
    } catch (error: any) {
      const msg = import("../lib/firebaseErrors").then(m => m.getFirebaseErrorMessage(error));
      msg.then(m => toast.error(m));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-hero lg:block">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 backdrop-blur">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">{t("appName")}</span>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">Detect weeds. Save your crops.</h2>
            <p className="max-w-md text-lg opacity-90">
              AI-powered vision that spots weeds in seconds and recommends the right herbicide with precise dosage.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-6">
              {[
                { k: "98%", v: "Accuracy" },
                { k: "50+", v: "Weed species" },
                { k: "3D", v: "Simulation" },
              ].map((s) => (
                <div key={s.v} className="rounded-xl bg-white/10 p-4 backdrop-blur">
                  <div className="text-2xl font-bold">{s.k}</div>
                  <div className="text-xs opacity-80">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs opacity-70">© AgriScan AI · Modern farming, powered by intelligence</div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-between">
            <div className="lg:hidden flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold">{t("appName")}</span>
            </div>
            <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
              <SelectTrigger className="ml-auto w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="my">မြန်မာ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{t("signIn")}</h1>
            <p className="text-sm text-muted-foreground">{t("tagline")}</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@farm.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw">{t("password")}</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="pw" type={showPw ? "text" : "password"} placeholder="••••••••" className="pl-9 pr-9" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                {t("rememberMe")}
              </label>
              <button type="button" className="text-sm text-primary hover:underline">{t("forgotPassword")}</button>
            </div>
            <Button type="submit" size="lg" className="w-full bg-gradient-primary shadow-elegant" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("login")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t("noAccount")}{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">{t("register")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
