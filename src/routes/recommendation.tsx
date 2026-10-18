import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { 
  Pill, FlaskConical, Sprout, Target, SprayCan as Spray, ShieldAlert, 
  Calculator, Droplets, Box, CloudSun, Wind, AlertTriangle, CheckCircle2, 
  DollarSign, Printer, Share2, Loader2 
} from "lucide-react";
import { toast } from "sonner";
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
  const [unitCost, setUnitCost] = useState<number>(0);
  const [result, setResult] = useState<{ water: number; herbicide: number; ratio: number; cost?: number } | null>(null);

  // Weather & Spray advisory state
  const [weather, setWeather] = useState<{
    temp: number;
    windSpeed: number;
    humidity: number;
    precipitation: number;
    isSafeToSpray: boolean;
    warning?: string;
  } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    const r = getCurrentDetection();
    setRec(r);
    if (r) {
      const weed = WEED_SPECIES.find((w) => w.id === r.weedId);
      if (weed) setRate(weed.herbicide.ratePerAcre);

      // Fetch live weather using scan GPS coords
      const lat = r.location?.lat && r.location.lat !== 0 ? r.location.lat : 16.8;
      const lng = r.location?.lng && r.location.lng !== 0 ? r.location.lng : 96.1;

      setWeatherLoading(true);
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m`
      )
        .then((res) => res.json())
        .then((data) => {
          const cur = data?.current;
          if (cur) {
            const temp = cur.temperature_2m;
            const windSpeed = cur.wind_speed_10m;
            const humidity = cur.relative_humidity_2m;
            const precipitation = cur.precipitation;

            let isSafe = true;
            let warning = "";
            if (windSpeed > 18) {
              isSafe = false;
              warning = "High wind speed (>18 km/h). Severe drift risk — do not spray.";
            } else if (precipitation > 0.1) {
              isSafe = false;
              warning = "Rain detected. Chemical may wash off before absorption.";
            } else if (temp > 35) {
              isSafe = false;
              warning = "High temperature (>35°C). Fast evaporation may reduce efficacy.";
            } else if (temp < 10) {
              isSafe = false;
              warning = "Low temperature (<10°C). Weeds absorb chemical slowly.";
            }

            setWeather({
              temp,
              windSpeed,
              humidity,
              precipitation,
              isSafeToSpray: isSafe,
              warning: warning || "Optimal spraying conditions detected.",
            });
          }
        })
        .catch((err) => console.error("Weather fetch failed:", err))
        .finally(() => setWeatherLoading(false));
    }
  }, []);

  const weed = useMemo(() => {
    if (!rec) return undefined;
    const found = WEED_SPECIES.find((w) => w.id === rec.weedId);
    if (found) return found;
    
    // Check if we have real gemini data
    if (rec.geminiData) {
      return {
        id: rec.weedId,
        name: rec.geminiData.name || rec.weedName,
        scientific: rec.geminiData.scientific || rec.scientificName || `Species: ${rec.weedName}`,
        description: rec.geminiData.description || "Detected by AI.",
        images: [],
        growthStage: "Unknown" as const,
        threatLevel: "Medium" as const,
        herbicide: rec.geminiData.herbicide || {
          name: "General Herbicide",
          activeIngredient: rec.activeIngredient || "Broad-spectrum",
          ratePerAcre: 1.0,
          suitableCrop: "General",
          targetWeed: rec.weedName,
          applicationMethod: "Foliar spray",
          usage: "Please consult local agricultural guidelines.",
          safety: "Wear protective gear."
        }
      };
    }

    // Ultimate fallback if geminiData is missing (should not happen now)
    return {
      id: rec.weedId,
      name: rec.weedName,
      scientific: `Species: ${rec.weedName}`,
      description: "Detected by AI.",
      images: [],
      growthStage: "Unknown" as const,
      threatLevel: "Medium" as const,
      herbicide: {
        name: "General Herbicide",
        activeIngredient: "Broad-spectrum",
        ratePerAcre: 1.0,
        suitableCrop: "General",
        targetWeed: rec.weedName,
        applicationMethod: "Foliar spray",
        usage: "Please consult local agricultural guidelines for proper dosage and treatment.",
        safety: "Wear protective gear. Do not inhale or spray near eyes."
      }
    };
  }, [rec]);

  const areaInAcres = (a: number) => (unit === "Acre" ? a : unit === "Hectare" ? a * 2.47 : a / 4046.86);

  const calc = () => {
    const acres = areaInAcres(area);
    const waterTotal = water * acres;
    const herbicide = rate * acres; // liters
    const ratio = waterTotal > 0 ? (herbicide * 1000) / waterTotal : 0; // ml per L
    const cost = unitCost > 0 ? herbicide * unitCost : undefined;
    setResult({ water: waterTotal, herbicide, ratio, cost });
  };

  const handleShare = async () => {
    if (!rec || !weed) return;
    const shareText = `WeedWise Herbicide Recommendation:\nWeed: ${rec.weedName} (${weed.scientific})\nHerbicide: ${weed.herbicide.name} (Active: ${weed.herbicide.activeIngredient})\nApplication Rate: ${rate} L/Acre`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `WeedWise - ${rec.weedName}`,
          text: shareText,
          url: window.location.href,
        });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      toast.success("Recommendation summary copied to clipboard!");
    }
  };

  const handlePrint = () => {
    window.print();
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Herbicide & Treatment Recommendation</h1>
          <p className="text-xs text-muted-foreground">Tailored treatment plan and dosage calculator for detected weeds</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />Share
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />Print / PDF Report
          </Button>
        </div>
      </div>

      {/* Live Weather & Spraying Advisory */}
      {weatherLoading ? (
        <Card className="flex items-center gap-2 p-4 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Analyzing local weather conditions for spraying...</span>
        </Card>
      ) : weather ? (
        <Card className={`p-4 border transition-all ${
          weather.isSafeToSpray 
            ? "border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20" 
            : "border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20"
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {weather.isSafeToSpray ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              )}
              <div>
                <span className="font-semibold text-sm">
                  {weather.isSafeToSpray ? "Good Spraying Conditions" : "Caution / Spraying Not Recommended"}
                </span>
                <p className="text-xs text-muted-foreground">{weather.warning}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 font-medium"><CloudSun className="h-4 w-4 text-primary" />{weather.temp}°C</span>
              <span className="flex items-center gap-1 font-medium"><Wind className="h-4 w-4 text-primary" />Wind: {weather.windSpeed} km/h</span>
              <span className="flex items-center gap-1 font-medium"><Droplets className="h-4 w-4 text-primary" />Humidity: {weather.humidity}%</span>
            </div>
          </div>
        </Card>
      ) : null}

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
                {h.activeIngredient && (
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Standard Active Ingredient: {h.activeIngredient}
                  </div>
                )}
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

            <div className="space-y-2">
              <Label>Estimated Herbicide Price per Liter (Optional)</Label>
              <div className="relative">
                <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  type="number" 
                  min={0} 
                  placeholder="e.g. 15000 (MMK) or 15 ($)" 
                  className="pl-9"
                  value={unitCost || ""} 
                  onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)} 
                />
              </div>
            </div>

            <Button size="lg" className="w-full bg-gradient-primary shadow-elegant" onClick={calc}>
              <Calculator className="mr-2 h-4 w-4" />{t("calculate")}
            </Button>

            {result && (
              <div className="animate-in fade-in space-y-3 rounded-2xl border bg-gradient-card p-4">
                <ResultRow icon={Droplets} label={t("waterRequired")} value={`${result.water.toFixed(1)} L`} />
                <ResultRow icon={FlaskConical} label={t("herbicideRequired")} value={`${result.herbicide.toFixed(2)} L`} />
                <ResultRow icon={Calculator} label={t("mixingRatio")} value={`${result.ratio.toFixed(1)} ml / L`} />
                {result.cost !== undefined && (
                  <ResultRow icon={DollarSign} label="Estimated Herbicide Cost" value={`${result.cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
                )}
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
