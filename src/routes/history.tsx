import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, MapPin, Filter, Inbox } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { WEED_SPECIES, type DetectionRecord } from "@/data/mock";
import { getUserHistory } from "@/lib/firebaseService";
import { useAuth } from "@/lib/auth";
import { DensityBadge } from "./dashboard";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — AgriScan AI" },
      { name: "description", content: "All your past weed detection records." },
    ],
  }),
  component: () => <RequireAuth><HistoryPage /></RequireAuth>,
});

function HistoryPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [records, setRecords] = useState<DetectionRecord[]>([]);
  const [q, setQ] = useState("");
  const [weed, setWeed] = useState("all");
  const [density, setDensity] = useState("all");
  const [sort, setSort] = useState<"new" | "old">("new");

  useEffect(() => {
    if (user) {
      getUserHistory(user.id).then(setRecords);
    }
  }, [user]);

  const filtered = useMemo(() => {
    let list = records.filter((r) => {
      if (q && !r.weedName.toLowerCase().includes(q.toLowerCase()) && !r.location.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (weed !== "all" && r.weedId !== weed) return false;
      if (density !== "all" && r.density !== density) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      const cmp = (a.date + a.time).localeCompare(b.date + b.time);
      return sort === "new" ? -cmp : cmp;
    });
    return list;
  }, [records, q, weed, density, sort]);

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={t("searchPlaceholder")} className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={weed} onValueChange={setWeed}>
            <SelectTrigger className="w-full lg:w-52"><Filter className="mr-2 h-3.5 w-3.5" /><SelectValue placeholder={t("filterWeed")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All weeds</SelectItem>
              {WEED_SPECIES.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={density} onValueChange={setDensity}>
            <SelectTrigger className="w-full lg:w-44"><SelectValue placeholder={t("filterDensity")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All densities</SelectItem>
              <SelectItem value="Low">{t("low")}</SelectItem>
              <SelectItem value="Medium">{t("medium")}</SelectItem>
              <SelectItem value="High">{t("high")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as any)}>
            <SelectTrigger className="w-full lg:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">{t("sortNewest")}</SelectItem>
              <SelectItem value="old">{t("sortOldest")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="grid place-items-center p-12 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium">{t("noRecords")}</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <Link
              key={r.id}
              to="/history/$id"
              params={{ id: r.id }}
              className="group overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant"
            >
              <div className="relative aspect-video overflow-hidden">
                <img src={r.image} alt={r.weedName} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute right-2 top-2"><DensityBadge d={r.density} /></div>
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-semibold">{r.weedName}</h3>
                  <span className="text-xs font-semibold text-primary">{r.confidence}%</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /><span className="truncate">{r.location.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">{r.date} · {r.time}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
