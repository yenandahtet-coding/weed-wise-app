import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState, useEffect, useCallback } from "react";
import { Camera, Upload, ImagePlus, X, RefreshCw, Sparkles, Loader2, Info, StopCircle } from "lucide-react";
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
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [base64Img, setBase64Img] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(0);

  // Real GPS coordinates from the browser
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; name: string }>(
    { lat: 0, lng: 0, name: "Current location" }
  );

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let name = "Current location";
        try {
          // Free reverse-geocode with OpenStreetMap Nominatim (no API key)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const json = await res.json();
          name = json.address?.city ||
                 json.address?.town ||
                 json.address?.village ||
                 json.address?.county ||
                 "Current location";
        } catch (_) { /* keep default */ }
        setGpsCoords({ lat, lng, name });
      },
      () => { /* permission denied — keep defaults */ },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Live Mode states
  const [isLiveMode, setIsLiveMode] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<any>(null);
  const [liveBase64, setLiveBase64] = useState<string | null>(null);
  const [liveDetectionData, setLiveDetectionData] = useState<any>(null);

  const handleFile = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
    
    // Compress image to base64 for Firestore (bypassing Firebase Storage)
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 800 / img.width); // Resize to max 800px width for better AI detection
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setBase64Img(canvas.toDataURL("image/jpeg", 0.9)); // Increase quality to 90%
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

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsLiveMode(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const drawLiveBoxes = useCallback((boxes: any[], videoWidth: number, videoHeight: number) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Make overlay canvas match the rendered video element size
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    boxes.forEach(b => {
      // boxes are in percentages
      const x = (b.x / 100) * canvas.width;
      const y = (b.y / 100) * canvas.height;
      const w = (b.w / 100) * canvas.width;
      const h = (b.h / 100) * canvas.height;

      ctx.strokeStyle = "#10b981"; // primary green
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = "#10b981";
      ctx.font = "14px sans-serif";
      const text = `${b.class_name} · ${b.confidence}%`;
      // Draw background for text
      const textWidth = ctx.measureText(text).width;
      ctx.fillRect(x, y - 20, textWidth + 10, 20);
      
      ctx.fillStyle = "white";
      ctx.fillText(text, x + 5, y - 5);
    });
  }, []);

  const startCamera = async () => {
    setIsLiveMode(true);
    try {
      let stream;
      try {
        // Try to get rear camera first (useful for mobile)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
      } catch (err) {
        // Fallback to any available camera (useful for desktop webcams)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Start polling
      intervalRef.current = setInterval(async () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        if (video.videoWidth === 0) return;

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // compress image to send (Higher resolution for better detection)
        const scale = Math.min(1, 800 / canvas.width);
        const sendCanvas = document.createElement("canvas");
        sendCanvas.width = canvas.width * scale;
        sendCanvas.height = canvas.height * scale;
        const sendCtx = sendCanvas.getContext("2d");
        if (!sendCtx) return;
        sendCtx.drawImage(canvas, 0, 0, sendCanvas.width, sendCanvas.height);
        
        const b64 = sendCanvas.toDataURL("image/jpeg", 0.9);
        setLiveBase64(b64);
        
        // convert base64 to File
        const res = await fetch(b64);
        const blob = await res.blob();
        const formData = new FormData();
        formData.append("file", blob, "live.jpg");

        try {
          const apiRes = await fetch(`/api/detect?lang=${lang}`, { method: "POST", body: formData });
          if (apiRes.ok) {
            const data = await apiRes.json();
            setLiveDetectionData(data);
            drawLiveBoxes(data.boxes || [], video.videoWidth, video.videoHeight);
          }
        } catch (e) {
          console.error("Live detection error", e);
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      alert("Failed to open camera. Please check permissions.");
      setIsLiveMode(false);
    }
  };

  const captureLiveAndAnalyze = async () => {
    if (!liveBase64 || !liveDetectionData) {
      alert("Waiting for AI detection to complete at least once...");
      return;
    }
    stopCamera();
    setProcessing(true);
    
    // Simulate steps since we already have data
    for (let i = 0; i < 5; i++) {
      setStep(i);
      await new Promise((r) => setTimeout(r, 200));
    }
    
    const boxes = liveDetectionData.boxes || [];
    const detectedName = boxes.length > 0 ? boxes[0].class_name : "Unknown Weed";
    const now = new Date();
    const data = liveDetectionData;
    const rec: DetectionRecord = {
      id: `rec_${Date.now()}`,
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      location: { name: gpsCoords.name, lat: gpsCoords.lat, lng: gpsCoords.lng },
      image: liveBase64,
      weedId: detectedName.toLowerCase().replace(/\s+/g, '-'),
      weedName: detectedName,
      scientificName: data.scientific_name || data.gemini_data?.scientific || "",
      activeIngredient: data.active_ingredient || data.gemini_data?.herbicide?.activeIngredient || "",
      density: data.severity_level as "Low" | "Medium" | "High",
      confidence: data.confidence,
      detectedCount: data.detected_weeds,
      coverage: Math.min(100, data.detected_weeds * 2 + 10),
      fieldArea: 2,
      areaUnit: "Acre",
      boundingBoxes: data.boxes || [],
      geminiData: data.gemini_data,
    };
    setCurrentDetection(rec);
    navigate({ to: "/detection-result" });
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

    // Ensure base64 is ready (fallback if it didn't finish in handleFile)
    let finalBase64 = base64Img;
    if (!finalBase64) {
      finalBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const scale = Math.min(1, 800 / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext("2d");
            if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.9));
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }) as string;
      setBase64Img(finalBase64);
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/detect?lang=${lang}`, {
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

      const boxes = data.boxes || [];
      const detectedName = boxes.length > 0 ? boxes[0].class_name : "Unknown Weed";
      const now = new Date();
      const rec: DetectionRecord = {
        id: `rec_${Date.now()}`,
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 5),
        location: { name: gpsCoords.name, lat: gpsCoords.lat, lng: gpsCoords.lng },
        image: finalBase64,
        weedId: detectedName.toLowerCase().replace(/\s+/g, '-'),
        weedName: detectedName,
        scientificName: data.scientific_name || data.gemini_data?.scientific || "",
        activeIngredient: data.active_ingredient || data.gemini_data?.herbicide?.activeIngredient || "",
        density: data.severity_level as "Low" | "Medium" | "High",
        confidence: data.confidence,
        detectedCount: data.detected_weeds,
        coverage: Math.min(100, data.detected_weeds * 2 + 10),
        fieldArea: 2,
        areaUnit: "Acre",
        boundingBoxes: data.boxes || [],
        geminiData: data.gemini_data,
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

        {isLiveMode ? (
          <div className="space-y-4">
            <div className="relative flex justify-center overflow-hidden rounded-2xl bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="max-h-[60vh] w-full object-contain"
              />
              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute left-0 top-0 h-full w-full object-contain"
              />
              <Button size="icon" variant="secondary" className="absolute right-2 top-2 rounded-full shadow-soft" onClick={stopCamera}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-center gap-3">
              <Button size="lg" variant="outline" onClick={stopCamera}>
                <StopCircle className="mr-2 h-5 w-5" />Cancel
              </Button>
              <Button size="lg" onClick={captureLiveAndAnalyze} className="bg-gradient-primary shadow-elegant">
                <Camera className="mr-2 h-5 w-5" />Capture & Analyze
              </Button>
            </div>
          </div>
        ) : !preview ? (
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
              <Button size="lg" variant="outline" onClick={startCamera} className="h-14">
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
            <div className="flex justify-center">
              <div className="relative overflow-hidden rounded-2xl border shadow-sm">
                <img src={preview} alt="preview" className="max-h-[420px] max-w-full object-contain" />
                <Button size="icon" variant="secondary" className="absolute right-2 top-2 rounded-full shadow-soft" onClick={clear}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
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
