import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Pill, FlaskConical, Sprout, Target, Spray, ShieldAlert, Calculator, Droplets, Box } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { getCurrentDetection, WEED_SPECIES, type DetectionRecord } from "@/data/mock";
import { DensityBadge } from "./dashboard";

export const Route = createFileRoute("/recommendation")({
  head: () => ({
    meta: [
      { title: "Herbicide Recommendation — AgriScan AI" },
      { name: "description", content: "Recommended herbicide and dosage calculator." },
    ],
  }),
  component: () => <RequireAuth><RecommendationPage /></RequireAuth>,
});

function RecommendationPage() {
  const { t } = useI18n();
  const [rec, setRec] = useState<DetectionRecord | null>(null);
  const [area, setArea] = useState(2);
  const [unit, setUnit] = useState<"Acre" | "Hectare" | "Sqm">("Acre");
  const [water, setWater] = useState(200);
  const [rate, setRate] = useState(0.6);
  const [result, setResult] = useState<{ water: number; herbicide: number; ratio: number } | null>(null);

  useEffect(() => {
    const r = getCurrentDetection();
    setRec(r);
    if (r) {
      const weed = WEED_SPECIES.find((w) => w.id === r.weedId);
      if (weed) setRate(weed.herbicide.ratePerAcre);
    }
  }, []);

  const weed = useMemo(() => rec ? WEED_SPECIES.find((w) => w.id === rec.weedId) : undefined, [rec]);

  const areaInAcres = (a: number) => (unit === "Acre" ? a : unit === "Hectare" ? a * 2.47 : a / 4046.86);

  const calc = () => {
    const acres = areaInAcres(area);
    const waterTotal = water * acres;
    const herbicide = rate * acres; // liters
    const ratio = waterTotal > 0 ? (herbicide * 1000) / waterTotal : 0; // ml per L
    setResult({ water: waterTotal, herbicide, ratio });
  };

  if (!rec || !weed) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <p className="text-muted-foreground">Complete a scan to see recommendations.</p>
        <Button asChild className="mt-4 bg-gradient-primary"><Link to="/scan">Go to Scan</Link></Button>
      </Card>
    );
  }

  const h = weed.herbicide;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="overflow-hidden p-0">
          <div className="relative aspect-video">
            <img src={rec.image} alt={rec.weedName} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <div className="text-xs opacity-80">{t("detectedWeed")}</div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{rec.weedName}</h2>
                <DensityBadge d={rec.density} />
              </div>
              <div className="text-xs italic opacity-80">{weed.scientific}</div>
            </div>
          </div>
          <div className="space-y-3 p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                <Pill className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{t("recommendedHerbicide")}</div>
                <div className="text-lg font-bold">{h.name}</div>
              </div>
            </div>
            <InfoRow icon={FlaskConical} label={t("activeIngredient")} value={h.activeIngredient} />
            <InfoRow icon={Sprout} label={t("suitableCrop")} value={h.suitableCrop} />
            <InfoRow icon={Target} label={t("targetWeed")} value={h.targetWeed} />
            <InfoRow icon={Spray} label={t("applicationMethod")} value={h.applicationMethod} />
            <InfoRow icon={Pill} label={t("usage")} value={h.usage} />
            <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div>
                <div className="font-semibold">{t("safety")}</div>
                <div className="text-muted-foreground">{h.safety}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
              <Calculator className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold">{t("dosageCalc")}</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <div className="space-y-2">
                <Label>{t("fieldArea")}</Label>
                <Input type="number" min={0} value={area} onChange={(e) => setArea(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={unit} onValueChange={(v) => setUnit(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Acre">Acre</SelectItem>
                    <SelectItem value="Hectare">Hectare</SelectItem>
                    <SelectItem value="Sqm">Sq. Meter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("waterVolume")} (L / Acre)</Label>
              <Input type="number" min={0} value={water} onChange={(e) => setWater(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>{t("herbicideRate")} (L / Acre)</Label>
              <Input type="number" step="0.01" min={0} value={rate} onChange={(e) => setRate(parseFloat(e.target.value) || 0)} />
            </div>

            <Button size="lg" className="w-full bg-gradient-primary shadow-elegant" onClick={calc}>
              <Calculator className="mr-2 h-4 w-4" />{t("calculate")}
            </Button>

            {result && (
              <div className="animate-in fade-in space-y-3 rounded-2xl border bg-gradient-card p-4">
                <ResultRow icon={Droplets} label={t("waterRequired")} value={`${result.water.toFixed(1)} L`} />
                <ResultRow icon={FlaskConical} label={t("herbicideRequired")} value={`${result.herbicide.toFixed(2)} L`} />
                <ResultRow icon={Calculator} label={t("mixingRatio")} value={`${result.ratio.toFixed(1)} ml / L`} />
              </div>
            )}
            <p className="text-xs text-muted-foreground">{t("dosageDisclaimer")}</p>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <Button asChild variant="outline"><Link to="/detection-result">Back to Detection</Link></Button>
        <Button asChild className="bg-gradient-primary shadow-elegant">
          <Link to="/simulation"><Box className="mr-2 h-4 w-4" />{t("view3D")}</Link>
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}
function ResultRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="text-lg font-bold text-primary">{value}</div>
    </div>
  );
}
