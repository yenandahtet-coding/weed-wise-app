import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pill, Box, Save, Target, Percent, Hash, BarChart3, FlaskConical, Globe, Printer, Share2 } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n";
import { getCurrentDetection, type DetectionRecord } from "@/data/mock";
import { saveDetectionRecord } from "@/lib/firebaseService";
import { useAuth } from "@/lib/auth";
import { DensityBadge } from "./dashboard";

export const Route = createFileRoute("/detection-result")({
  head: () => ({
    meta: [
      { title: "Detection Result — AgriScan AI" },
      { name: "description", content: "AI weed detection results and analysis." },
    ],
  }),
  component: () => <RequireAuth><ResultPage /></RequireAuth>,
});

function ResultPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rec, setRec] = useState<DetectionRecord | null>(null);

  useEffect(() => {
    setRec(getCurrentDetection());
  }, []);

  if (!rec) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <p className="text-muted-foreground">No active detection. Please scan first.</p>
        <Button asChild className="mt-4 bg-gradient-primary"><Link to="/scan">Go to Scan</Link></Button>
      </Card>
    );
  }

  // Use real boxes if available, otherwise fallback to empty
  const boxes = rec.boundingBoxes || [];

  const handleSave = async () => {
    if (!user || !rec) return;
    try {
      toast.loading("Saving record...", { id: "save_toast" });
      await saveDetectionRecord(user.id, rec);
      toast.success(t("savedSuccess"), { id: "save_toast" });
    } catch (error) {
      toast.error("Failed to save record", { id: "save_toast" });
    }
  };

  const handleShare = async () => {
    if (!rec) return;
    const shareText = `WeedWise Scan Result: Detected ${rec.weedName} (${rec.confidence}% confidence). Density: ${rec.density}.`;
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
      toast.success("Detection summary copied to clipboard!");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">AI Detection Analysis</h1>
          <p className="text-xs text-muted-foreground">Object identification and field density breakdown</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />Share
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />Print / PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden p-0">
          <div className="relative aspect-[4/3] bg-black">
            <img src={rec.image} alt={rec.weedName} className="h-full w-full object-cover" />
            {boxes.map((b, i) => (
              <div
                key={i}
                className="absolute rounded-lg border-2 border-primary shadow-glow"
                style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
              >
                <div className="absolute -top-6 left-0 whitespace-nowrap rounded-md bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {b.class_name || rec.weedName} · {b.confidence ?? rec.confidence}%
                </div>
              </div>
            ))}
          </div>
          <div className="border-t p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{rec.weedName}</h2>
                {rec.scientificName && (
                  <p className="text-sm italic font-medium text-emerald-600 dark:text-emerald-400">
                    {rec.scientificName}
                  </p>
                )}
                {rec.activeIngredient && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      <FlaskConical className="h-3 w-3" />
                      Active: {rec.activeIngredient}
                    </span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  {t("confidence")}: <span className="font-semibold text-foreground">{rec.confidence}%</span>
                </p>
              </div>
              <DensityBadge d={rec.density} />
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Target} label={t("weedType")} value={rec.weedName} />
            <StatCard icon={Globe} label="Scientific" value={rec.scientificName || "Identified"} />
            <StatCard icon={Percent} label={t("confidence")} value={`${rec.confidence}%`} />
            <StatCard icon={Hash} label={t("detectedObjects")} value={rec.detectedCount.toString()} />
          </div>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">{t("density")}</h3>
              <DensityBadge d={rec.density} />
            </div>
            <Progress value={rec.density === "Low" ? 33 : rec.density === "Medium" ? 66 : 100} className="h-3" />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{t("low")}</span>
              <span>{t("medium")}</span>
              <span>{t("high")}</span>
            </div>
          </Card>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button size="lg" className="bg-gradient-primary shadow-elegant" onClick={() => navigate({ to: "/recommendation" })}>
              <Pill className="mr-2 h-4 w-4" />{t("viewRecommendation")}
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate({ to: "/simulation" })}>
              <Box className="mr-2 h-4 w-4" />{t("view3D")}
            </Button>
            <Button size="lg" variant="secondary" className="sm:col-span-2" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />{t("saveRecord")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 truncate text-lg font-bold">{value}</div>
    </Card>
  );
}
