import React, { useRef, useState, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DroneProps {
  waypoints: THREE.Vector3[];
  playing: boolean;
  onSpray: (index: number) => void;
}

export function Drone({ waypoints, playing, onSpray }: DroneProps) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/drone_for_agriculturelow_poly.glb');
  
  const [targetIndex, setTargetIndex] = useState(0);
  const [isSpraying, setIsSpraying] = useState(false);
  
  const hoverTime = useRef(0);
  const sprayTime = useRef(0);
  const particlesRef = useRef<THREE.Group>(null);
  const propellersRef = useRef<THREE.Object3D[]>([]);

  const clone = useMemo(() => {
    const c = scene.clone();
    const props: THREE.Object3D[] = [];
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      const name = child.name.toLowerCase();
      if (name.includes('prop') || name.includes('rotor') || name.includes('blade')) {
        props.push(child);
      }
    });
    propellersRef.current = props;
    return c;
  }, [scene]);

  useFrame((state, delta) => {
    if (!group.current || !playing) return;

    // Spin propellers
    if (propellersRef.current.length > 0) {
      propellersRef.current.forEach((p) => p.rotateY(delta * 25));
    }

    if (waypoints.length === 0) return;

    hoverTime.current += delta;
    const hoverBob = Math.sin(hoverTime.current * 4) * 0.15;
    
    // Animate spray particles
    if (isSpraying && particlesRef.current) {
      particlesRef.current.children.forEach((p, i) => {
        p.position.y -= delta * 5;
        if (p.position.y < -4) {
          p.position.y = 0;
          p.position.x = (Math.random() - 0.5) * 1.5;
          p.position.z = (Math.random() - 0.5) * 1.5;
        }
      });
    }

    const target = waypoints[targetIndex].clone().setY(5); // Hover height
    const current = group.current.position;
    const distance = current.distanceTo(target);

    if (distance > 0.5) {
      // Fly towards waypoint
      current.lerp(target, delta * 1.5);
      
      // Calculate rotation to face the target
      const dir = target.clone().sub(current).normalize();
      const targetRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      
      // Add slight pitch (tilt forward) when moving
      const pitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.25);
      targetRotation.multiply(pitch);
      
      group.current.quaternion.slerp(targetRotation, delta * 4);
      setIsSpraying(false);
    } else {
      // Reached waypoint, hover and spray
      // Level out rotation
      group.current.quaternion.slerp(new THREE.Quaternion(), delta * 4);
      
      if (!isSpraying) {
        setIsSpraying(true);
        sprayTime.current = 0;
      }
      
      sprayTime.current += delta;
      
      if (sprayTime.current > 2) {
        // Done spraying
        onSpray(targetIndex);
        if (targetIndex < waypoints.length - 1) {
          setTargetIndex(targetIndex + 1);
        } else {
          setTargetIndex(0); // loop back or stop
        }
      }
    }
    
    // Apply bobbing offset
    group.current.position.y += hoverBob * delta;
  });

  return (
    <group ref={group} position={[0, 5, 0]}>
      {/* Scaled down to match environment */}
      <primitive object={clone} scale={0.5} />
      
      {/* Light projecting down to simulate detection cone */}
      <SpotLight position={[0, -0.5, 0]} angle={0.6} penumbra={0.5} intensity={2} color="#00ff88" distance={10} />
      
      {/* Transparent detection cone visual */}
      <mesh position={[0, -2.5, 0]}>
        <coneGeometry args={[2, 5, 32]} />
        <meshStandardMaterial color="#00ff88" transparent opacity={0.15} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Spray Particles */}
      {isSpraying && playing && (
        <group ref={particlesRef} position={[0, -1, 0]}>
          {Array.from({ length: 30 }).map((_, i) => (
            <mesh key={i} position={[(Math.random() - 0.5) * 1.5, -Math.random() * 4, (Math.random() - 0.5) * 1.5]}>
              <sphereGeometry args={[0.08, 4, 4]} />
              <meshBasicMaterial color="#e0f7fa" transparent opacity={0.6} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

// Helper SpotLight component
function SpotLight(props: any) {
  const light = useRef<THREE.SpotLight>(null);
  useFrame(() => {
    if (light.current) {
      light.current.target.position.set(0, -5, 0);
      light.current.target.updateMatrixWorld();
    }
  });
  return <spotLight ref={light} {...props} />;
}

useGLTF.preload('/models/drone_for_agriculturelow_poly.glb');
