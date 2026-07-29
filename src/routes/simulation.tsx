import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Gauge, Box, Save } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { getCurrentDetection, saveRecord, WEED_SPECIES, type DetectionRecord } from "@/data/mock";
import { DensityBadge } from "./dashboard";

export const Route = createFileRoute("/simulation")({
  head: () => ({
    meta: [
      { title: "3D Simulation — AgriScan AI" },
      { name: "description", content: "3D visualization and spraying simulation." },
    ],
  }),
  component: () => <RequireAuth><SimPage /></RequireAuth>,
});

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number };

function SimPage() {
  const { t } = useI18n();
  const [rec, setRec] = useState<DetectionRecord | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [rotation, setRotation] = useState({ x: 30, y: 20 });
  const [zoom, setZoom] = useState(1);
  const draggingRef = useRef<{ x: number; y: number } | null>(null);
  const stateRef = useRef({ playing: true, speed: 1, progress: 0, rotation: { x: 30, y: 20 }, zoom: 1 });

  useEffect(() => { stateRef.current.playing = playing; }, [playing]);
  useEffect(() => { stateRef.current.speed = speed; }, [speed]);
  useEffect(() => { stateRef.current.rotation = rotation; }, [rotation]);
  useEffect(() => { stateRef.current.zoom = zoom; }, [zoom]);

  useEffect(() => {
    const r = getCurrentDetection();
    setRec(r);
    if (r) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = r.image;
      img.onload = () => { imgRef.current = img; };
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const particles: Particle[] = [];
    const weedSpots = Array.from({ length: 24 }, (_, i) => ({
      x: (Math.sin(i * 3.7) + 1) / 2,
      y: (Math.cos(i * 5.3) + 1) / 2,
      size: 4 + (i % 5),
    }));

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const project = (x: number, y: number, z: number, w: number, h: number) => {
      const rot = stateRef.current.rotation;
      const zoom = stateRef.current.zoom;
      const rx = (rot.x * Math.PI) / 180;
      const ry = (rot.y * Math.PI) / 180;
      // rotate around y then x
      const cx = x - 0.5, cy = y - 0.5;
      const x1 = cx * Math.cos(ry) - z * Math.sin(ry);
      const z1 = cx * Math.sin(ry) + z * Math.cos(ry);
      const y1 = cy * Math.cos(rx) - z1 * Math.sin(rx);
      const z2 = cy * Math.sin(rx) + z1 * Math.cos(rx);
      const scale = zoom * (1 / (1 + z2 * 0.6));
      return { px: w / 2 + x1 * w * 0.7 * scale, py: h / 2 + y1 * h * 0.7 * scale, scale };
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width, H = rect.height;

      // sky gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#dcefe0");
      bg.addColorStop(1, "#a3d4b0");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // draw field plane with image as texture
      const corners = [
        project(0, 0, 0, W, H),
        project(1, 0, 0, W, H),
        project(1, 1, 0, W, H),
        project(0, 1, 0, W, H),
      ];
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(corners[0].px, corners[0].py);
      corners.slice(1).forEach((c) => ctx.lineTo(c.px, c.py));
      ctx.closePath();
      ctx.fillStyle = "#3f7a4a";
      ctx.fill();

      if (imgRef.current) {
        // approximate texture map via clip + drawImage skewed bounding box
        ctx.clip();
        const minX = Math.min(...corners.map((c) => c.px));
        const maxX = Math.max(...corners.map((c) => c.px));
        const minY = Math.min(...corners.map((c) => c.py));
        const maxY = Math.max(...corners.map((c) => c.py));
        ctx.globalAlpha = 0.85;
        ctx.drawImage(imgRef.current, minX, minY, maxX - minX, maxY - minY);
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      // outline
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(corners[0].px, corners[0].py);
      corners.slice(1).forEach((c) => ctx.lineTo(c.px, c.py));
      ctx.closePath();
      ctx.stroke();

      // weed markers
      weedSpots.forEach((s) => {
        const p = project(s.x, s.y, 0.02, W, H);
        ctx.fillStyle = "rgba(220, 60, 60, 0.85)";
        ctx.beginPath();
        ctx.arc(p.px, p.py, s.size * p.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // spray progress bar sweeping left→right based on progress
      const prog = stateRef.current.progress;
      if (prog > 0) {
        // covered area overlay
        const clipX = prog;
        ctx.save();
        ctx.beginPath();
        const c0 = project(0, 0, 0, W, H);
        const c1 = project(clipX, 0, 0, W, H);
        const c2 = project(clipX, 1, 0, W, H);
        const c3 = project(0, 1, 0, W, H);
        ctx.moveTo(c0.px, c0.py);
        ctx.lineTo(c1.px, c1.py);
        ctx.lineTo(c2.px, c2.py);
        ctx.lineTo(c3.px, c3.py);
        ctx.closePath();
        ctx.fillStyle = "rgba(80, 200, 120, 0.35)";
        ctx.fill();
        ctx.restore();

        // sprayer position
        const sp = project(clipX, 0.5, 0.15, W, H);
        ctx.fillStyle = "#1e3a2b";
        ctx.beginPath();
        ctx.arc(sp.px, sp.py, 10, 0, Math.PI * 2);
        ctx.fill();

        // spawn particles
        if (stateRef.current.playing) {
          for (let i = 0; i < 4; i++) {
            particles.push({
              x: sp.px, y: sp.py,
              vx: (Math.random() - 0.5) * 3,
              vy: 1 + Math.random() * 2,
              life: 0, max: 40 + Math.random() * 20,
            });
          }
        }
      }

      // update & draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.life > p.max) { particles.splice(i, 1); continue; }
        const alpha = 1 - p.life / p.max;
        ctx.fillStyle = `rgba(120, 200, 255, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      if (stateRef.current.playing) {
        const next = Math.min(1, stateRef.current.progress + 0.002 * stateRef.current.speed);
        stateRef.current.progress = next;
        setProgress(next);
        if (next >= 1) stateRef.current.playing = false;
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  const restart = () => { stateRef.current.progress = 0; setProgress(0); setPlaying(true); };
  const togglePlay = () => setPlaying((p) => !p);

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - draggingRef.current.x;
    const dy = e.clientY - draggingRef.current.y;
    draggingRef.current = { x: e.clientX, y: e.clientY };
    setRotation((r) => ({ x: Math.max(5, Math.min(80, r.x + dy * 0.3)), y: r.y + dx * 0.3 }));
  };
  const onPointerUp = () => { draggingRef.current = null; };
  const onWheel = (e: React.WheelEvent) => {
    setZoom((z) => Math.max(0.5, Math.min(2, z - e.deltaY * 0.001)));
  };

  if (!rec) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <p className="text-muted-foreground">Complete a scan to view simulation.</p>
        <Button asChild className="mt-4 bg-gradient-primary"><Link to="/scan">Go to Scan</Link></Button>
      </Card>
    );
  }

  const weed = WEED_SPECIES.find((w) => w.id === rec.weedId)!;
  const acres = rec.areaUnit === "Acre" ? rec.fieldArea : rec.fieldArea * 2.47;
  const sprayArea = acres * (rec.coverage / 100);
  const herbicideV = sprayArea * weed.herbicide.ratePerAcre;
  const waterV = sprayArea * 200;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card className="overflow-hidden p-0">
        <div
          className="relative aspect-[16/10] cursor-grab select-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
        >
          <canvas ref={canvasRef} className="h-full w-full" />
          <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur">
            Drag to rotate · Scroll to zoom
          </div>
          <div className="pointer-events-none absolute right-4 top-4 rounded-lg bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur">
            {(progress * 100).toFixed(0)}% sprayed
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t p-4">
          <Button size="sm" onClick={togglePlay} className="bg-gradient-primary">
            {playing ? <><Pause className="mr-2 h-4 w-4" />{t("pause")}</> : <><Play className="mr-2 h-4 w-4" />{t("play")}</>}
          </Button>
          <Button size="sm" variant="outline" onClick={restart}>
            <RotateCcw className="mr-2 h-4 w-4" />{t("restart")}
          </Button>
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Gauge className="ml-2 h-4 w-4 text-muted-foreground" />
            {[0.5, 1, 2].map((s) => (
              <Button key={s} size="sm" variant={speed === s ? "default" : "ghost"} className="h-7 px-2 text-xs" onClick={() => setSpeed(s)}>
                {s}x
              </Button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { setRotation({ x: 30, y: 20 }); setZoom(1); }}>Reset View</Button>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{t("spraying")}</h3>
              <div className="text-xs text-muted-foreground">Visual representation only — not physically accurate.</div>
            </div>
          </div>
          <DensityBadge d={rec.density} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label={t("fieldArea")} value={`${rec.fieldArea} ${rec.areaUnit}`} />
          <Stat label={t("density")} value={rec.density} />
          <Stat label="Spray Area" value={`${sprayArea.toFixed(2)} Ac`} />
          <Stat label="Herbicide" value={`${herbicideV.toFixed(2)} L`} />
          <Stat label="Water" value={`${waterV.toFixed(0)} L`} />
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button asChild variant="outline"><Link to="/recommendation">Recommendation</Link></Button>
          <Button onClick={() => { saveRecord(rec); toast.success(t("savedSuccess")); }} className="bg-gradient-primary">
            <Save className="mr-2 h-4 w-4" />{t("saveRecord")}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-gradient-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-base font-bold">{value}</div>
    </div>
  );
}
