import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ScanLine, History, MapPin, Sparkles, Pill, Layers, TrendingUp, ArrowRight, ChevronRight } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { loadRecords, type DetectionRecord } from "@/data/mock";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AgriScan AI" },
      { name: "description", content: "Your AI weed detection dashboard." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  ),
});

function DashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [records, setRecords] = useState<DetectionRecord[]>([]);

  useEffect(() => {
    setRecords(loadRecords());
  }, []);

  const totalScans = records.length;
  const weedsDetected = records.reduce((s, r) => s + r.detectedCount, 0);
  const areasAnalyzed = records.reduce((s, r) => s + (r.areaUnit === "Acre" ? r.fieldArea : r.fieldArea * 2.47), 0);
  const recs = records.length;

  const stats = [
    { label: t("totalScans"), value: totalScans.toString(), icon: ScanLine, tint: "from-emerald-500 to-teal-500" },
    { label: t("weedsDetected"), value: weedsDetected.toString(), icon: Sparkles, tint: "from-lime-500 to-green-500" },
    { label: t("herbicideRecs"), value: recs.toString(), icon: Pill, tint: "from-amber-500 to-orange-500" },
    { label: t("areasAnalyzed"), value: `${areasAnalyzed.toFixed(1)} Ac`, icon: Layers, tint: "from-cyan-500 to-blue-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-elegant sm:p-10">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="space-y-3">
            <Badge className="bg-white/20 text-primary-foreground border-0 backdrop-blur">AI · v2.4</Badge>
            <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
              {t("welcomeBack")}, {user?.name} 👋
            </h1>
            <p className="max-w-xl text-sm opacity-90 sm:text-base">{t("dashSubtitle")}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" variant="secondary" className="shadow-soft">
                <Link to="/scan"><ScanLine className="mr-2 h-4 w-4" />{t("scanWeeds")}</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="border border-white/30 bg-white/10 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground">
                <Link to="/history"><History className="mr-2 h-4 w-4" />{t("viewHistory")}</Link>
              </Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="grid h-40 w-40 place-items-center rounded-3xl bg-white/10 backdrop-blur">
              <Sparkles className="h-20 w-20 opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="relative overflow-hidden border-0 bg-gradient-card p-5 shadow-soft transition-transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
                  <div className="mt-1 text-2xl font-bold">{s.value}</div>
                </div>
                <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${s.tint} text-white shadow-glow`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-success">
                <TrendingUp className="h-3 w-3" /> +12% this week
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent + Map */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("recentActivity")}</h2>
            <Link to="/history" className="flex items-center gap-1 text-sm text-primary hover:underline">
              {t("viewHistory")} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {records.slice(0, 4).map((r) => (
              <Link
                key={r.id}
                to="/history/$id"
                params={{ id: r.id }}
                className="group grid grid-cols-[64px_1fr_auto] items-center gap-4 rounded-xl border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-soft"
              >
                <img src={r.image} alt={r.weedName} className="h-16 w-16 rounded-lg object-cover" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{r.weedName}</span>
                    <DensityBadge d={r.density} />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{r.date} · {r.time}</span>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden items-center gap-1 sm:flex"><MapPin className="h-3 w-3" />{r.location.name}</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden p-0">
            <div className="border-b p-5">
              <h2 className="text-lg font-semibold">{t("locations")}</h2>
            </div>
            <div className="relative aspect-square bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-950">
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(0,150,80,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,150,80,0.2) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
              {records.slice(0, 5).map((r, i) => (
                <div
                  key={r.id}
                  className="absolute"
                  style={{ left: `${20 + i * 15}%`, top: `${30 + ((i * 13) % 40)}%` }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
                    <div className="relative grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow">
                      <MapPin className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-primary p-6 text-primary-foreground shadow-elegant">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative space-y-3">
              <div className="text-lg font-bold">{t("quickAction")}</div>
              <p className="text-sm opacity-90">Snap a photo and let AI do the rest.</p>
              <Button asChild size="lg" variant="secondary" className="shadow-soft">
                <Link to="/scan"><ScanLine className="mr-2 h-4 w-4" />{t("quickActionCta")}</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function DensityBadge({ d }: { d: "Low" | "Medium" | "High" }) {
  const map = {
    Low: "bg-success/15 text-success border-success/30",
    Medium: "bg-warning/15 text-warning border-warning/30",
    High: "bg-destructive/15 text-destructive border-destructive/30",
  } as const;
  return <Badge variant="outline" className={`${map[d]} font-medium`}>{d}</Badge>;
}
