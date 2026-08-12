import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sky, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Play, Pause, RotateCcw, Box, Save } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { getCurrentDetection, WEED_SPECIES, type DetectionRecord } from "@/data/mock";
import { saveDetectionRecord } from "@/lib/firebaseService";
import { useAuth } from "@/lib/auth";
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
    }
  });

  return (
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
        </mesh>
      )}
    </group>
  );
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

function SimPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [rec, setRec] = useState<DetectionRecord | null>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    setRec(getCurrentDetection());
  }, []);

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
            Drag to rotate · Scroll to zoom
          </div>
        </div>

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
        </div>
      </Card>

      <Card className="p-5 shadow-md">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{t("spraying")} (3D)</h3>
              <div className="text-xs text-muted-foreground">Simulation Prototype</div>
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
