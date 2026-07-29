import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Leaf, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useI18n, type Lang } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — AgriScan AI" },
      { name: "description", content: "Create your AgriScan AI account." },
    ],
  }),
  component: Register,
});

function Register() {
  const { register } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error("Please fill in all fields");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Account created");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center bg-background p-6 sm:p-10 order-2 lg:order-1">
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
            <h1 className="text-3xl font-bold">{t("signUp")}</h1>
            <p className="text-sm text-muted-foreground">{t("tagline")}</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("fullName")}</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="name" className="pl-9" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pw">{t("password")}</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="pw" type={showPw ? "text" : "password"} className="pl-9 pr-9" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cf">{t("confirmPassword")}</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="cf" type={showPw ? "text" : "password"} className="pl-9" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("preferredLanguage")}</Label>
              <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="my">မြန်မာ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" size="lg" className="w-full bg-gradient-primary shadow-elegant" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("signUp")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {t("haveAccount")}{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">{t("login")}</Link>
          </p>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-hero lg:block order-1 lg:order-2">
        <div className="relative flex h-full flex-col justify-center p-12 text-primary-foreground">
          <h2 className="text-4xl font-bold leading-tight">Join thousands of smart farmers.</h2>
          <p className="mt-4 max-w-md text-lg opacity-90">
            Precision weed detection, herbicide recommendations, and dosage calculations — right in your pocket.
          </p>
        </div>
      </div>
    </div>
  );
}
