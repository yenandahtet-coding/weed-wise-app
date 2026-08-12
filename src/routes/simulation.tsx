// import { createFileRoute, Link } from "@tanstack/react-router";
// import { useEffect, useRef, useState } from "react";
// import { Play, Pause, RotateCcw, Gauge, Box, Save } from "lucide-react";
// import { toast } from "sonner";
// import { RequireAuth } from "@/components/RequireAuth";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { useI18n } from "@/lib/i18n";
// import { getCurrentDetection, saveRecord, WEED_SPECIES, type DetectionRecord } from "@/data/mock";
// import { DensityBadge } from "./dashboard";
//
// export const Route = createFileRoute("/simulation")({
//   head: () => ({
//     meta: [
//       { title: "3D Simulation — AgriScan AI" },
//       { name: "description", content: "3D visualization and spraying simulation." },
//     ],
//   }),
//   component: () => <RequireAuth><SimPage /></RequireAuth>,
// });
//
// type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number };
//
// function SimPage() {
//   const { t } = useI18n();
//   const [rec, setRec] = useState<DetectionRecord | null>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const imgRef = useRef<HTMLImageElement | null>(null);
//   const [playing, setPlaying] = useState(true);
//   const [speed, setSpeed] = useState(1);
//   const [progress, setProgress] = useState(0);
//   const [rotation, setRotation] = useState({ x: 30, y: 20 });
//   const [zoom, setZoom] = useState(1);
//   const draggingRef = useRef<{ x: number; y: number } | null>(null);
//   const stateRef = useRef({ playing: true, speed: 1, progress: 0, rotation: { x: 30, y: 20 }, zoom: 1 });
//
//   useEffect(() => { stateRef.current.playing = playing; }, [playing]);
//   useEffect(() => { stateRef.current.speed = speed; }, [speed]);
//   useEffect(() => { stateRef.current.rotation = rotation; }, [rotation]);
//   useEffect(() => { stateRef.current.zoom = zoom; }, [zoom]);
//
//   useEffect(() => {
//     const r = getCurrentDetection();
//     setRec(r);
//     if (r) {
//       const img = new Image();
//       img.crossOrigin = "anonymous";
//       img.src = r.image;
//       img.onload = () => { imgRef.current = img; };
//     }
//   }, []);
//
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const ctx = canvas.getContext("2d")!;
//     let raf = 0;
//     const particles: Particle[] = [];
//     const weedSpots = Array.from({ length: 24 }, (_, i) => ({
//       x: (Math.sin(i * 3.7) + 1) / 2,
//       y: (Math.cos(i * 5.3) + 1) / 2,
//       size: 4 + (i % 5),
//     }));
//
//     const resize = () => {
//       const dpr = window.devicePixelRatio || 1;
//       const rect = canvas.getBoundingClientRect();
//       canvas.width = rect.width * dpr;
//       canvas.height = rect.height * dpr;
//       ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
//     };
//     resize();
//     window.addEventListener("resize", resize);
//
//     const project = (x: number, y: number, z: number, w: number, h: number) => {
//       const rot = stateRef.current.rotation;
//       const zoom = stateRef.current.zoom;
//       const rx = (rot.x * Math.PI) / 180;
//       const ry = (rot.y * Math.PI) / 180;
//       // rotate around y then x
//       const cx = x - 0.5, cy = y - 0.5;
//       const x1 = cx * Math.cos(ry) - z * Math.sin(ry);
//       const z1 = cx * Math.sin(ry) + z * Math.cos(ry);
//       const y1 = cy * Math.cos(rx) - z1 * Math.sin(rx);
//       const z2 = cy * Math.sin(rx) + z1 * Math.cos(rx);
//       const scale = zoom * (1 / (1 + z2 * 0.6));
//       return { px: w / 2 + x1 * w * 0.7 * scale, py: h / 2 + y1 * h * 0.7 * scale, scale };
//     };
//
//     const draw = () => {
//       const rect = canvas.getBoundingClientRect();
//       const W = rect.width, H = rect.height;
//
//       // sky gradient
//       const bg = ctx.createLinearGradient(0, 0, 0, H);
//       bg.addColorStop(0, "#dcefe0");
//       bg.addColorStop(1, "#a3d4b0");
//       ctx.fillStyle = bg;
//       ctx.fillRect(0, 0, W, H);
//
//       // draw field plane with image as texture
//       const corners = [
//         project(0, 0, 0, W, H),
//         project(1, 0, 0, W, H),
//         project(1, 1, 0, W, H),
//         project(0, 1, 0, W, H),
//       ];
//       ctx.save();
//       ctx.beginPath();
//       ctx.moveTo(corners[0].px, corners[0].py);
//       corners.slice(1).forEach((c) => ctx.lineTo(c.px, c.py));
//       ctx.closePath();
//       ctx.fillStyle = "#3f7a4a";
//       ctx.fill();
//
//       if (imgRef.current) {
//         // approximate texture map via clip + drawImage skewed bounding box
//         ctx.clip();
//         const minX = Math.min(...corners.map((c) => c.px));
//         const maxX = Math.max(...corners.map((c) => c.px));
//         const minY = Math.min(...corners.map((c) => c.py));
//         const maxY = Math.max(...corners.map((c) => c.py));
//         ctx.globalAlpha = 0.85;
//         ctx.drawImage(imgRef.current, minX, minY, maxX - minX, maxY - minY);
//         ctx.globalAlpha = 1;
//       }
//       ctx.restore();
//
//       // outline
//       ctx.strokeStyle = "rgba(0,0,0,0.3)";
//       ctx.lineWidth = 2;
//       ctx.beginPath();
//       ctx.moveTo(corners[0].px, corners[0].py);
//       corners.slice(1).forEach((c) => ctx.lineTo(c.px, c.py));
//       ctx.closePath();
//       ctx.stroke();
//
//       // weed markers
//       weedSpots.forEach((s) => {
//         const p = project(s.x, s.y, 0.02, W, H);
//         ctx.fillStyle = "rgba(220, 60, 60, 0.85)";
//         ctx.beginPath();
//         ctx.arc(p.px, p.py, s.size * p.scale, 0, Math.PI * 2);
//         ctx.fill();
//         ctx.strokeStyle = "white";
//         ctx.lineWidth = 1.5;
//         ctx.stroke();
//       });
//
//       // spray progress bar sweeping left→right based on progress
//       const prog = stateRef.current.progress;
//       if (prog > 0) {
//         // covered area overlay
//         const clipX = prog;
//         ctx.save();
//         ctx.beginPath();
//         const c0 = project(0, 0, 0, W, H);
//         const c1 = project(clipX, 0, 0, W, H);
//         const c2 = project(clipX, 1, 0, W, H);
//         const c3 = project(0, 1, 0, W, H);
//         ctx.moveTo(c0.px, c0.py);
//         ctx.lineTo(c1.px, c1.py);
//         ctx.lineTo(c2.px, c2.py);
//         ctx.lineTo(c3.px, c3.py);
//         ctx.closePath();
//         ctx.fillStyle = "rgba(80, 200, 120, 0.35)";
//         ctx.fill();
//         ctx.restore();
//
//         // sprayer position
//         const sp = project(clipX, 0.5, 0.15, W, H);
//         ctx.fillStyle = "#1e3a2b";
//         ctx.beginPath();
//         ctx.arc(sp.px, sp.py, 10, 0, Math.PI * 2);
//         ctx.fill();
//
//         // spawn particles
//         if (stateRef.current.playing) {
//           for (let i = 0; i < 4; i++) {
//             particles.push({
//               x: sp.px, y: sp.py,
//               vx: (Math.random() - 0.5) * 3,
//               vy: 1 + Math.random() * 2,
//               life: 0, max: 40 + Math.random() * 20,
//             });
//           }
//         }
//       }
//
//       // update & draw particles
//       for (let i = particles.length - 1; i >= 0; i--) {
//         const p = particles[i];
//         p.x += p.vx;
//         p.y += p.vy;
//         p.life++;
//         if (p.life > p.max) { particles.splice(i, 1); continue; }
//         const alpha = 1 - p.life / p.max;
//         ctx.fillStyle = `rgba(120, 200, 255, ${alpha * 0.7})`;
//         ctx.beginPath();
//         ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
//         ctx.fill();
//       }
//
//       if (stateRef.current.playing) {
//         const next = Math.min(1, stateRef.current.progress + 0.002 * stateRef.current.speed);
//         stateRef.current.progress = next;
//         setProgress(next);
//         if (next >= 1) stateRef.current.playing = false;
//       }
//
//       raf = requestAnimationFrame(draw);
//     };
//     raf = requestAnimationFrame(draw);
//     return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
//   }, []);
//
//   const restart = () => { stateRef.current.progress = 0; setProgress(0); setPlaying(true); };
//   const togglePlay = () => setPlaying((p) => !p);
//
//   const onPointerDown = (e: React.PointerEvent) => {
//     draggingRef.current = { x: e.clientX, y: e.clientY };
//     (e.target as HTMLElement).setPointerCapture(e.pointerId);
//   };
//   const onPointerMove = (e: React.PointerEvent) => {
//     if (!draggingRef.current) return;
//     const dx = e.clientX - draggingRef.current.x;
//     const dy = e.clientY - draggingRef.current.y;
//     draggingRef.current = { x: e.clientX, y: e.clientY };
//     setRotation((r) => ({ x: Math.max(5, Math.min(80, r.x + dy * 0.3)), y: r.y + dx * 0.3 }));
//   };
//   const onPointerUp = () => { draggingRef.current = null; };
//   const onWheel = (e: React.WheelEvent) => {
//     setZoom((z) => Math.max(0.5, Math.min(2, z - e.deltaY * 0.001)));
//   };
//
//   if (!rec) {
//     return (
//       <Card className="mx-auto max-w-md p-8 text-center">
//         <p className="text-muted-foreground">Complete a scan to view simulation.</p>
//         <Button asChild className="mt-4 bg-gradient-primary"><Link to="/scan">Go to Scan</Link></Button>
//       </Card>
//     );
//   }
//
//   const weed = WEED_SPECIES.find((w) => w.id === rec.weedId)!;
//   const acres = rec.areaUnit === "Acre" ? rec.fieldArea : rec.fieldArea * 2.47;
//   const sprayArea = acres * (rec.coverage / 100);
//   const herbicideV = sprayArea * weed.herbicide.ratePerAcre;
//   const waterV = sprayArea * 200;
//
//   return (
//     <div className="mx-auto max-w-6xl space-y-6">
//       <Card className="overflow-hidden p-0">
//         <div
//           className="relative aspect-[16/10] cursor-grab select-none active:cursor-grabbing"
//           onPointerDown={onPointerDown}
//           onPointerMove={onPointerMove}
//           onPointerUp={onPointerUp}
//           onPointerLeave={onPointerUp}
//           onWheel={onWheel}
//         >
//           <canvas ref={canvasRef} className="h-full w-full" />
//           <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur">
//             Drag to rotate · Scroll to zoom
//           </div>
//           <div className="pointer-events-none absolute right-4 top-4 rounded-lg bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur">
//             {(progress * 100).toFixed(0)}% sprayed
//           </div>
//         </div>
//
//         <div className="flex flex-wrap items-center gap-3 border-t p-4">
//           <Button size="sm" onClick={togglePlay} className="bg-gradient-primary">
//             {playing ? <><Pause className="mr-2 h-4 w-4" />{t("pause")}</> : <><Play className="mr-2 h-4 w-4" />{t("play")}</>}
//           </Button>
//           <Button size="sm" variant="outline" onClick={restart}>
//             <RotateCcw className="mr-2 h-4 w-4" />{t("restart")}
//           </Button>
//           <div className="flex items-center gap-1 rounded-lg border p-1">
//             <Gauge className="ml-2 h-4 w-4 text-muted-foreground" />
//             {[0.5, 1, 2].map((s) => (
//               <Button key={s} size="sm" variant={speed === s ? "default" : "ghost"} className="h-7 px-2 text-xs" onClick={() => setSpeed(s)}>
//                 {s}x
//               </Button>
//             ))}
//           </div>
//           <div className="ml-auto flex items-center gap-2">
//             <Button size="sm" variant="outline" onClick={() => { setRotation({ x: 30, y: 20 }); setZoom(1); }}>Reset View</Button>
//           </div>
//         </div>
//       </Card>
//
//       <Card className="p-5">
//         <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
//           <div className="flex items-center gap-3">
//             <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
//               <Box className="h-5 w-5" />
//             </div>
//             <div>
//               <h3 className="text-lg font-bold">{t("spraying")}</h3>
//               <div className="text-xs text-muted-foreground">Visual representation only — not physically accurate.</div>
//             </div>
//           </div>
//           <DensityBadge d={rec.density} />
//         </div>
//         <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
//           <Stat label={t("fieldArea")} value={`${rec.fieldArea} ${rec.areaUnit}`} />
//           <Stat label={t("density")} value={rec.density} />
//           <Stat label="Spray Area" value={`${sprayArea.toFixed(2)} Ac`} />
//           <Stat label="Herbicide" value={`${herbicideV.toFixed(2)} L`} />
//           <Stat label="Water" value={`${waterV.toFixed(0)} L`} />
//         </div>
//         <div className="mt-4 flex flex-wrap justify-end gap-2">
//           <Button asChild variant="outline"><Link to="/recommendation">Recommendation</Link></Button>
//           <Button onClick={() => { saveRecord(rec); toast.success(t("savedSuccess")); }} className="bg-gradient-primary">
//             <Save className="mr-2 h-4 w-4" />{t("saveRecord")}
//           </Button>
//         </div>
//       </Card>
//     </div>
//   );
// }
//
// function Stat({ label, value }: { label: string; value: string }) {
//   return (
//     <div className="rounded-xl border bg-gradient-card p-3">
//       <div className="text-xs text-muted-foreground">{label}</div>
//       <div className="mt-0.5 truncate text-base font-bold">{value}</div>
//     </div>
//   );
// }
import { createFileRoute, Link } from "@tanstack/react-router";
<<<<<<< HEAD
import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sky, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Play, Pause, RotateCcw, Box, Save } from "lucide-react";
=======
import { useEffect, useRef, useState, Suspense } from "react";
import { Play, Pause, RotateCcw, Gauge, Box, Save, Loader2 } from "lucide-react";
>>>>>>> 4dc4195644780bbcef66d6f5c26132c54c00326f
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { getCurrentDetection, WEED_SPECIES, type DetectionRecord } from "@/data/mock";
import { saveDetectionRecord } from "@/lib/firebaseService";
import { useAuth } from "@/lib/auth";
import { DensityBadge } from "./dashboard";

// 3D Imports
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export const Route = createFileRoute("/simulation")({
  head: () => ({
    meta: [
      { title: "3D Simulation — AgriScan AI" },
      { name: "description", content: "3D visualization and spraying simulation." },
    ],
  }),
  component: () => <RequireAuth><SimPage /></RequireAuth>,
});

<<<<<<< HEAD
const Weeds = ({ boxes, fallbackCount }: { boxes?: DetectionRecord["boundingBoxes"], fallbackCount: number }) => {
  const positions = useMemo(() => {
    if (boxes && boxes.length > 0) {
      // Map exact bounding box positions to the 20x20 3D ground plane
      return boxes.map((b) => {
        const centerX = b.x + b.w / 2;
        const centerY = b.y + b.h / 2;
        // Image X (0-100) to 3D X (-10 to 10)
        const x = (centerX / 100) * 20 - 10;
        // Image Y (0-100) to 3D Z (-10 to 10)
        const z = (centerY / 100) * 20 - 10;
        return new THREE.Vector3(x, 0.2, z);
      });
    }
    
    // Fallback if no boxes available
    const pos = [];
    for (let i = 0; i < fallbackCount; i++) {
      const x = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 10;
      pos.push(new THREE.Vector3(x, 0.2, z));
    }
    return pos;
  }, [boxes, fallbackCount]);

  return (
    <>
      {positions.map((pos, idx) => (
        <mesh key={idx} position={pos} castShadow receiveShadow>
          <coneGeometry args={[0.2, 0.4, 4]} />
          <meshStandardMaterial color="limegreen" />
        </mesh>
      ))}
    </>
  );
};

const Sprayer = ({ severity, playing, boxes }: { severity: string, playing: boolean, boxes?: DetectionRecord["boundingBoxes"] }) => {
  const sprayerRef = useRef<THREE.Group>(null);
  const sprayColor = severity === "High" ? "red" : severity === "Medium" ? "orange" : "lightblue";
  
  const { scene } = useGLTF("/models/drone_for_agriculturelow_poly.glb");
  const clone = useMemo(() => {
    const c = scene.clone();
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
      }
    });
    return c;
  }, [scene]);

  const droneHeight = 4.5;

  const waypoints = useMemo(() => {
    if (boxes && boxes.length > 0) {
      return boxes.map((b) => {
        const centerX = b.x + b.w / 2;
        const centerY = b.y + b.h / 2;
        const x = (centerX / 100) * 20 - 10;
        const z = (centerY / 100) * 20 - 10;
        return new THREE.Vector3(x, droneHeight, z);
      });
    }
    // Fallback simple path
    return [
      new THREE.Vector3(4, droneHeight, 2),
      new THREE.Vector3(-3, droneHeight, -4),
      new THREE.Vector3(2, droneHeight, -3)
    ];
  }, [boxes]);

  const [targetIndex, setTargetIndex] = useState(0);
  const [isSpraying, setIsSpraying] = useState(false);
  const sprayTime = useRef(0);

  useFrame((state, delta) => {
    if (!sprayerRef.current || !playing || waypoints.length === 0) return;

    const target = waypoints[targetIndex];
    const current = sprayerRef.current.position;
    const distance = current.distanceTo(target);

    if (distance > 0.5) {
      // Fly towards the weed
      current.lerp(target, delta * 1.5);
      
      // Rotate drone to face target
      const dir = target.clone().sub(current).normalize();
      const targetRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      sprayerRef.current.quaternion.slerp(targetRotation, delta * 4);
      
      setIsSpraying(false);
    } else {
      // Reached the weed, hover and spray
      sprayerRef.current.quaternion.slerp(new THREE.Quaternion(), delta * 4); // level out
      
      if (!isSpraying) {
        setIsSpraying(true);
        sprayTime.current = 0;
      }
      
      sprayTime.current += delta;
      if (sprayTime.current > 2) {
        // Move to next weed after spraying for 2 seconds
        setTargetIndex((prev) => (prev + 1) % waypoints.length);
        setIsSpraying(false);
      }
=======
// --- 3D Components ---

function FieldMap({ imageUrl, progress, weedSpots }: { imageUrl: string; progress: number; weedSpots: any[] }) {
  // Loads the uploaded image as a 3D texture
  const texture = useTexture(imageUrl);

  return (
    <group>
      {/* Base Field Plane (Not flat anymore! Displacement added) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        {/* အနိမ့်အမြင့်ဖော်ရန် 128x128 segments ပိုင်းထားပါသည် */}
        <planeGeometry args={[12, 8, 128, 128]} />
        <meshStandardMaterial
          map={texture}
          displacementMap={texture}
          displacementScale={0.5} // ပုံဘယ်လောက်ကြွတက်မလဲဆိုတာ ဒီမှာ အတိုးအလျှော့လုပ်ပါ
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Sprayed Area Overlay (Green Tint) - မြေပြင်ကြွလာလို့ Y ကို 0.5 အထိ မြှင့်ထားပါသည် */}
      {progress > 0 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-6 + (progress * 12) / 2, 0.5, 0]}>
          <planeGeometry args={[progress * 12, 8]} />
          <meshStandardMaterial color="rgba(80, 200, 120, 0.5)" transparent depthWrite={false} />
        </mesh>
      )}

      {/* Weed Markers - မြေပြင်ကြွလာလို့ Y ကို 0.5 အထိ မြှင့်ထားပါသည် */}
      {weedSpots.map((w, i) => (
        <mesh key={i} position={[-6 + w.x * 12, 0.5, -4 + w.y * 8]}>
          <sphereGeometry args={[0.1 * w.size, 16, 16]} />
          <meshStandardMaterial color="rgba(220, 60, 60, 0.85)" />
        </mesh>
      ))}
    </group>
  );
}

function SprayerDrone({ playing, speed, progress, setProgress }: any) {
  const droneRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (playing && progress < 1) {
      // Calculate spray speed
      const next = Math.min(1, progress + delta * 0.05 * speed);
      setProgress(next);
    }
    if (droneRef.current) {
      // Move drone from left (-6) to right (+6)
      droneRef.current.position.x = -6 + progress * 12;
>>>>>>> 4dc4195644780bbcef66d6f5c26132c54c00326f
    }
  });

  return (
<<<<<<< HEAD
    <group ref={sprayerRef} position={[0, droneHeight, 0]}>
      {/* GLB Drone Model */}
      <primitive object={clone} scale={6.5} position={[0, 0, 0]} />
      
      {playing && isSpraying && (
        <mesh position={[0, -droneHeight / 2, 0]}>
          <coneGeometry args={[1.2, droneHeight, 16]} />
          <meshStandardMaterial 
            color={sprayColor} 
            transparent={true} 
            opacity={0.4} 
            depthWrite={false}
          />
=======
    <group ref={droneRef} position={[-6, 2.0, 0]}>
      {/* Drone Body */}
      <mesh>
        <boxGeometry args={[0.8, 0.3, 0.8]} />
        <meshStandardMaterial color="#1e3a2b" />
      </mesh>

      {/* Spray Cone Indicator */}
      {playing && progress < 1 && (
        <mesh position={[0, -0.75, 0]}>
          <coneGeometry args={[1.5, 1.5, 16]} />
          <meshStandardMaterial color="rgba(120, 200, 255, 0.4)" transparent depthWrite={false} />
>>>>>>> 4dc4195644780bbcef66d6f5c26132c54c00326f
        </mesh>
      )}
    </group>
  );
<<<<<<< HEAD
};

useGLTF.preload("/models/drone_for_agriculturelow_poly.glb");

const Ground = ({ imageSrc }: { imageSrc: string }) => {
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load(imageSrc, (tex) => {
      // Use just one image stretched across the plane without repeating
      tex.needsUpdate = true;
    });
  }, [imageSrc]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
};
=======
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ccc" wireframe />
    </mesh>
  );
}

// --- Main Page Component ---
>>>>>>> 4dc4195644780bbcef66d6f5c26132c54c00326f

function SimPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [rec, setRec] = useState<DetectionRecord | null>(null);
<<<<<<< HEAD
  const [playing, setPlaying] = useState(true);
=======

  // Simulation State
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Generate mock weed spots once
  const [weedSpots] = useState(() =>
    Array.from({ length: 24 }, (_, i) => ({
      x: (Math.sin(i * 3.7) + 1) / 2,
      y: (Math.cos(i * 5.3) + 1) / 2,
      size: 1 + (i % 3),
    }))
  );
>>>>>>> 4dc4195644780bbcef66d6f5c26132c54c00326f

  useEffect(() => {
    setRec(getCurrentDetection());
  }, []);

<<<<<<< HEAD
=======
  const restart = () => {
    setProgress(0);
    setPlaying(true);
  };

  const togglePlay = () => setPlaying((p) => !p);

  const resetView = () => {
    controlsRef.current?.reset();
  };

>>>>>>> 4dc4195644780bbcef66d6f5c26132c54c00326f
  if (!rec) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <p className="text-muted-foreground">Complete a scan to view simulation.</p>
        <Button asChild className="mt-4 bg-gradient-primary"><Link to="/scan">Go to Scan</Link></Button>
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
      ratePerAcre: 1.0,
      suitableCrop: "General",
      targetWeed: rec.weedName,
      applicationMethod: "Foliar spray",
      usage: "Consult guidelines",
      safety: "Wear protective gear"
    }
  };
  const acres = rec.areaUnit === "Acre" ? rec.fieldArea : rec.fieldArea * 2.47;
  const sprayArea = acres * (rec.coverage / 100);
  const herbicideV = sprayArea * weed.herbicide.ratePerAcre;
  const waterV = sprayArea * 200;

  return (
<<<<<<< HEAD
    <div className="mx-auto max-w-5xl space-y-6">
      <Card className="overflow-hidden p-0 shadow-lg">
        <div className="relative aspect-video w-full rounded-t-xl overflow-hidden sm:aspect-[21/9]">
          <Canvas shadows camera={{ position: [0, 6, 12], fov: 45 }}>
            <color attach="background" args={['#87CEEB']} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
            <Sky sunPosition={[10, 20, 10]} />
            
            <Ground imageSrc={rec.image} />
            
            <Weeds boxes={rec.boundingBoxes} fallbackCount={Math.min(50, rec.detectedCount)} />
            {rec.detectedCount > 0 && <Sprayer severity={rec.density} playing={playing} boxes={rec.boundingBoxes} />}
            
            <OrbitControls enableZoom={true} maxPolarAngle={Math.PI / 2 - 0.05} />
          </Canvas>
          <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur shadow-sm">
=======
    <div className="mx-auto max-w-6xl space-y-6">
      <Card className="overflow-hidden p-0">

        {/* 3D Canvas Environment */}
        <div className="relative aspect-[16/10] bg-gradient-to-b from-[#dcefe0] to-[#a3d4b0] cursor-grab active:cursor-grabbing">
          <Canvas camera={{ position: [0, 6, 8], fov: 50 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

            <Suspense fallback={<LoadingFallback />}>
              <FieldMap imageUrl={rec.image} progress={progress} weedSpots={weedSpots} />
            </Suspense>

            <SprayerDrone playing={playing} speed={speed} progress={progress} setProgress={setProgress} />

            {/* Built-in Camera Controls */}
            <OrbitControls
              ref={controlsRef}
              makeDefault
              maxPolarAngle={Math.PI / 2 - 0.1}
              minDistance={2}
              maxDistance={20}
            />
          </Canvas>

          <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur">
>>>>>>> 4dc4195644780bbcef66d6f5c26132c54c00326f
            Drag to rotate · Scroll to zoom
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3 border-t p-4">
          <Button size="sm" onClick={() => setPlaying(!playing)} className="bg-gradient-primary">
            {playing ? <><Pause className="mr-2 h-4 w-4" />{t("pause")}</> : <><Play className="mr-2 h-4 w-4" />{t("play")}</>}
          </Button>
          <Button size="sm" variant="outline" onClick={() => {
            setPlaying(false);
            setTimeout(() => setPlaying(true), 100);
          }}>
            <RotateCcw className="mr-2 h-4 w-4" />{t("restart")}
          </Button>
<<<<<<< HEAD
=======
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Gauge className="ml-2 h-4 w-4 text-muted-foreground" />
            {[0.5, 1, 2].map((s) => (
              <Button key={s} size="sm" variant={speed === s ? "default" : "ghost"} className="h-7 px-2 text-xs" onClick={() => setSpeed(s)}>
                {s}x
              </Button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={resetView}>Reset View</Button>
          </div>
>>>>>>> 4dc4195644780bbcef66d6f5c26132c54c00326f
        </div>
      </Card>

      <Card className="p-5 shadow-md">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
              <Box className="h-5 w-5" />
            </div>
            <div>
<<<<<<< HEAD
              <h3 className="text-lg font-bold">{t("spraying")} (3D)</h3>
              <div className="text-xs text-muted-foreground">Simulation Prototype</div>
=======
              <h3 className="text-lg font-bold">{t("spraying")}</h3>
              <div className="text-xs text-muted-foreground">Interactive 3D simulation powered by WebGL.</div>
>>>>>>> 4dc4195644780bbcef66d6f5c26132c54c00326f
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
          <Button onClick={async () => {
            if (!user || !rec) return;
            try {
              toast.loading("Saving record...", { id: "sim_save_toast" });
              await saveDetectionRecord(user.id, rec);
              toast.success(t("savedSuccess"), { id: "sim_save_toast" });
            } catch (error) {
              toast.error("Failed to save record", { id: "sim_save_toast" });
            }
          }} className="bg-gradient-primary">
            <Save className="mr-2 h-4 w-4" />{t("saveRecord")}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-gradient-card p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-base font-bold">{value}</div>
    </div>
  );
}