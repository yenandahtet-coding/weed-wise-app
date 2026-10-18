import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Calendar, User, Pill, Box, ArrowLeft, Trash2, Printer, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { WEED_SPECIES, setCurrentDetection, type DetectionRecord } from "@/data/mock";
import { getDetectionRecord, deleteDetectionRecord } from "@/lib/firebaseService";
import { DensityBadge } from "./dashboard";

export const Route = createFileRoute("/history/$id")({
  head: () => ({
    meta: [
      { title: "Record Detail — AgriScan AI" },
      { name: "description", content: "Detection record detail." },
    ],
  }),
  component: () => <RequireAuth><Detail /></RequireAuth>,
});

function Detail() {
  const { id } = useParams({ from: "/history/$id" });
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const [rec, setRec] = useState<DetectionRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { 
    if (user && id) {
       getDetectionRecord(user.id, id).then(r => setRec(r || null));
    }
  }, [id, user]);

  const handleDelete = async () => {
    if (!user || !rec) return;
    if (!window.confirm("Are you sure you want to delete this scan record?")) return;

    try {
      setDeleting(true);
      await deleteDetectionRecord(user.id, rec.id);
      toast.success("Record deleted");
      navigate({ to: "/history" });
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete record");
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    if (!rec) return;
    const shareText = `WeedWise Scan: Detected ${rec.weedName} (${rec.confidence}% confidence) at ${rec.location.name}. Density: ${rec.density}.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `WeedWise - ${rec.weedName}`,
          text: shareText,
          url: window.location.href,
        });
      } catch (_) { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      toast.success("Summary and link copied to clipboard!");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!rec) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <p className="text-muted-foreground">Record not found.</p>
        <Button asChild className="mt-4"><Link to="/history">Back to History</Link></Button>
      </Card>
    );
  }

  const weed = WEED_SPECIES.find((w) => w.id === rec.weedId) || {
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
      usage: "Please consult local agricultural guidelines for treatment.",
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" className="w-fit">
          <Link to="/history"><ArrowLeft className="mr-2 h-4 w-4" />History</Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />Share
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />Print / PDF
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="overflow-hidden p-0">
          <div className="relative aspect-video">
            <img src={rec.image} alt={rec.weedName} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 p-5 text-white">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{rec.weedName}</h2>
                <DensityBadge d={rec.density} />
              </div>
              <div className="text-xs italic opacity-80">{weed.scientific}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
            <Stat label={t("confidence")} value={`${rec.confidence}%`} />
            <Stat label={t("detectedObjects")} value={rec.detectedCount.toString()} />
            <Stat label={t("coverage")} value={`${rec.coverage}%`} />
            <Stat label={t("fieldArea")} value={`${rec.fieldArea} ${rec.areaUnit}`} />
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-3 font-semibold">{t("density")}</h3>
            <Progress value={rec.density === "Low" ? 33 : rec.density === "Medium" ? 66 : 100} className="h-3" />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{t("low")}</span><span>{t("medium")}</span><span>{t("high")}</span>
            </div>
          </Card>

          <Card className="space-y-3 p-5">
            <h3 className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />Location</h3>
            <div className="text-sm">{rec.location.name}</div>
            <div className="text-xs text-muted-foreground">Lat {rec.location.lat.toFixed(4)}, Lng {rec.location.lng.toFixed(4)}</div>
            <div className="relative mt-2 aspect-[2/1] overflow-hidden rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-950">
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(0,150,80,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,150,80,0.2) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
                  <div className="relative grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow">
                    <MapPin className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="space-y-3 p-5">
            <h3 className="font-semibold flex items-center gap-2"><Pill className="h-4 w-4 text-primary" />{t("recommendedHerbicide")}</h3>
            <div>
              <div className="font-bold">{weed.herbicide.name}</div>
              <div className="text-xs text-muted-foreground">{weed.herbicide.activeIngredient}</div>
            </div>
            <div className="text-sm text-muted-foreground">{weed.herbicide.usage}</div>
          </Card>

          <Card className="space-y-2 p-5">
            <h3 className="font-semibold">Record Information</h3>
            <InfoLine icon={Calendar} label="Date & Time" value={`${rec.date} · ${rec.time}`} />
            <InfoLine icon={User} label="User" value={user?.name || "—"} />
          </Card>

          <Button
            className="w-full bg-gradient-primary shadow-elegant"
            asChild
            onClick={() => setCurrentDetection(rec)}
          >
            <Link to="/simulation"><Box className="mr-2 h-4 w-4" />{t("view3D")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-lg font-bold">{value}</div>
    </div>
  );
}
function InfoLine({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
