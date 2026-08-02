import React, { useRef, useMemo } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WeedProps {
  position: THREE.Vector3;
  isSprayed: boolean;
  confidence: number;
}

export function Weed({ position, isSprayed, confidence }: WeedProps) {
  const { scene } = useGLTF('/models/clovers_-_plants__foliage.glb');
  
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  
  const clone = useMemo(() => {
    const c = scene.clone();
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Clone the material so changing color doesn't affect other weeds
        if (mesh.material && !materialRef.current) {
          const mat = (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
          mesh.material = mat;
          materialRef.current = mat;
        } else if (mesh.material && materialRef.current) {
          mesh.material = materialRef.current;
        }
      }
    });
    return c;
  }, [scene]);

  useFrame(() => {
    if (materialRef.current) {
      // Transition to a brownish color if sprayed
      const targetColor = isSprayed ? new THREE.Color(0x8B6508) : new THREE.Color(0xffffff);
      materialRef.current.color.lerp(targetColor, 0.05);
    }
  });

  return (
    <group position={position}>
      {/* Massively scaled down to fix huge leaves */}
      <primitive object={clone} scale={0.02 + Math.random() * 0.01} rotation={[0, Math.random() * Math.PI, 0]} />
      
      {/* Floating Confidence Label */}
      <Html position={[0, 2, 0]} center zIndexRange={[100, 0]} style={{ transition: 'all 0.3s', opacity: isSprayed ? 0 : 1, transform: isSprayed ? 'scale(0)' : 'scale(1)' }}>
        <div className="rounded-md border border-red-500/30 bg-red-600/90 px-2 py-1 text-[11px] font-bold tracking-wide text-white shadow-lg backdrop-blur-md">
          {confidence}% WEED
        </div>
      </Html>
    </group>
  );
}

useGLTF.preload('/models/clovers_-_plants__foliage.glb');
