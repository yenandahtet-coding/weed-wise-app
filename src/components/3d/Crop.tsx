import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export function CropRows() {
  const { scene } = useGLTF('/models/crops_low_poly.glb');

  // Generate structured crop rows
  const cropPositions = useMemo(() => {
    const pos = [];
    // 6 rows, 12 plants per row
    for (let row = -3; row <= 3; row++) {
      for (let col = -6; col <= 6; col++) {
        // Leave some random gaps for realism
        if (Math.random() > 0.15) {
          pos.push(new THREE.Vector3(col * 3.5, 0, row * 4));
        }
      }
    }
    return pos;
  }, []);

  const clones = useMemo(() => {
    return cropPositions.map(() => {
      const clone = scene.clone();
      clone.traverse((c) => {
        if ((c as THREE.Mesh).isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });
      return clone;
    });
  }, [scene, cropPositions]);

  return (
    <group>
      {clones.map((clone, i) => (
        // Massively scaled down because model is likely enormous natively
        <primitive key={`crop-${i}`} object={clone} position={cropPositions[i]} scale={0.01 + Math.random() * 0.005} rotation={[0, Math.random() * Math.PI, 0]} />
      ))}
    </group>
  );
}

useGLTF.preload('/models/crops_low_poly.glb');
