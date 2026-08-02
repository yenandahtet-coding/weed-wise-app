import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export function Ground() {
  const { scene: groundScene } = useGLTF('/models/ground.glb');
  const { scene: cartScene } = useGLTF('/models/myanmar_agriculture_cart.glb');
  const { scene: grassScene } = useGLTF('/models/grass_patches.glb');

  // Clone manually to prevent React StrictMode mounting crashes
  const clonedGround = useMemo(() => {
    const clone = groundScene.clone();
    clone.traverse((c) => { if ((c as THREE.Mesh).isMesh) c.receiveShadow = true; });
    return clone;
  }, [groundScene]);

  const clonedCart = useMemo(() => {
    const clone = cartScene.clone();
    clone.traverse((c) => { 
      if ((c as THREE.Mesh).isMesh) { c.receiveShadow = true; c.castShadow = true; } 
    });
    return clone;
  }, [cartScene]);

  // Scatter some grass patches around the edges
  const grassPositions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < 40; i++) {
      const x = (Math.random() - 0.5) * 60;
      const z = (Math.random() - 0.5) * 60;
      pos.push(new THREE.Vector3(x, 0, z));
    }
    return pos;
  }, []);

  const grassClones = useMemo(() => {
    return grassPositions.map(() => grassScene.clone());
  }, [grassScene, grassPositions]);

  return (
    <group>
      {/* Main ground plane - extremely small scale just in case the model is massive */}
      <primitive object={clonedGround} scale={0.05} position={[0, -0.5, 0]} />
      
      {/* Myanmar Cart Decoration */}
      <primitive object={clonedCart} scale={0.05} position={[20, 0, -15]} rotation={[0, -Math.PI / 3, 0]} />

      {/* Random grass patches */}
      {grassClones.map((clone, i) => (
        <primitive key={`grass-${i}`} object={clone} position={grassPositions[i]} scale={0.05 + Math.random() * 0.02} rotation={[0, Math.random() * Math.PI, 0]} />
      ))}
    </group>
  );
}

useGLTF.preload('/models/ground.glb');
useGLTF.preload('/models/myanmar_agriculture_cart.glb');
useGLTF.preload('/models/grass_patches.glb');
