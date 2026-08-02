import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Upload, ImagePlus, X, RefreshCw, Sparkles, Loader2, Info } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { WEED_SPECIES, setCurrentDetection, type DetectionRecord } from "@/data/mock";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan Weeds — AgriScan AI" },
      { name: "description", content: "Capture or upload a photo to detect weeds using AI." },
    ],
  }),
  component: () => <RequireAuth><ScanPage /></RequireAuth>,
});

function ScanPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [base64Img, setBase64Img] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(0);

  const handleFile = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    
    // Compress image to base64 for Firestore (bypassing Firebase Storage)
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 400 / img.width); // Resize to max 400px width
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setBase64Img(canvas.toDataURL("image/jpeg", 0.6));
      }
    };
    img.src = url;
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
  };

  const steps = [
    t("uploadingImage"),
    t("processingImage"),
    t("detectingWeeds"),
    t("analyzingDensity"),
    t("generatingRec"),
  ];

  const analyze = async () => {
    if (!preview || !file) return;
    setProcessing(true);
    
    // Fast initial steps
    for (let i = 0; i < 3; i++) {
      setStep(i);
      await new Promise((r) => setTimeout(r, 400));
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/detect", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze image.");
      }

      const data = await response.json();
      
      setStep(3);
      await new Promise((r) => setTimeout(r, 300));
      setStep(4);
      await new Promise((r) => setTimeout(r, 300));

      const weed = WEED_SPECIES[Math.floor(Math.random() * WEED_SPECIES.length)];
      const now = new Date();
      const rec: DetectionRecord = {
        id: `rec_${Date.now()}`,
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 5),
        location: { name: "Current location", lat: 16.8409 + Math.random() * 0.1, lng: 96.1735 + Math.random() * 0.1 },
        image: base64Img || preview,
        weedId: weed.id,
        weedName: weed.name,
        density: data.severity_level as "Low" | "Medium" | "High",
        confidence: data.confidence,
        detectedCount: data.detected_weeds,
        coverage: Math.min(100, data.detected_weeds * 2 + 10),
        fieldArea: 2,
        areaUnit: "Acre",
        boundingBoxes: data.boxes || [],
      };
      setCurrentDetection(rec);
      navigate({ to: "/detection-result" });
    } catch (error) {
      console.error(error);
      alert("Failed to connect to the AI model. Ensure the backend is running on port 8000.");
      setProcessing(false);
      setStep(0);
    }
  };

  if (processing) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center">
        <Card className="w-full space-y-6 p-8 text-center">
          <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-primary shadow-glow">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
            <Sparkles className="relative h-10 w-10 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{t("processing")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{steps[step]}...</p>
          </div>
          <Progress value={((step + 1) / steps.length) * 100} className="h-2" />
          <div className="space-y-2 text-left">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 text-sm">
                {i < step ? (
                  <div className="grid h-5 w-5 place-items-center rounded-full bg-success text-success-foreground">✓</div>
                ) : i === step ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted" />
                )}
                <span className={i <= step ? "font-medium" : "text-muted-foreground"}>{s}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-start gap-3 rounded-xl bg-accent/50 p-3 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>{t("scanTip")}</p>
        </div>

        {!preview ? (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/30"
              }`}
            >
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                <ImagePlus className="h-8 w-8" />
              </div>
              <p className="mt-4 font-medium">{t("dragDrop")}</p>
              <p className="mt-1 text-xs text-muted-foreground">JPG, PNG · Up to 10MB</p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button size="lg" variant="outline" onClick={() => camRef.current?.click()} className="h-14">
                <Camera className="mr-2 h-5 w-5" />{t("openCamera")}
              </Button>
              <Button size="lg" onClick={() => fileRef.current?.click()} className="h-14 bg-gradient-primary shadow-elegant">
                <Upload className="mr-2 h-5 w-5" />{t("uploadImage")}
              </Button>
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </>
        ) : (
          <>
            <div className="relative overflow-hidden rounded-2xl border">
              <img src={preview} alt="preview" className="max-h-[420px] w-full object-contain bg-muted" />
              <Button size="icon" variant="secondary" className="absolute right-2 top-2 rounded-full shadow-soft" onClick={clear}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 text-sm">
                <div className="truncate font-medium">{file?.name || "Captured image"}</div>
                <div className="text-xs text-muted-foreground">{file ? `${(file.size / 1024).toFixed(0)} KB` : ""}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => fileRef.current?.click()}>
                  <RefreshCw className="mr-2 h-4 w-4" />{t("retake")}
                </Button>
                <Button onClick={analyze} className="bg-gradient-primary shadow-elegant">
                  <Sparkles className="mr-2 h-4 w-4" />{t("analyze")}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
