import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useZoneStore } from './useZoneStore';

/**
 * Zone = one room / sector. Detects any occupant (player or NPC) within
 * `radius` of its center and smoothly lerps its light toward full
 * brightness when occupied, and down to a dim idle glow when empty.
 *
 * Reuse this same component for house rooms, office sectors, and
 * storage aisles — only position/size/colors/occupants change.
 */
export default function Zone({
  id,
  position = [0, 0, 0],
  size = [4, 3, 4],
  wallColor = '#e8e4da',
  floorColor = '#c9c2b2',
  lightColor = '#fff2d0',
  lightIntensity = 2.5,
  idleIntensity = 0.05, // dim glow when empty, avoids a jarring hard cut to black
  occupants = [], // array of refs, e.g. [playerRef] or [npc1Ref, npc2Ref, ...]
  radius, // detection radius; defaults from footprint size if omitted
}) {
  const groupRef = useRef();
  const lightRef = useRef();
  const currentIntensity = useRef(idleIntensity);

  const registerZone = useZoneStore((s) => s.registerZone);
  const setOccupied = useZoneStore((s) => s.setOccupied);

  const [w, h, d] = size;
  const detectRadius = radius ?? Math.sqrt(w * w + d * d) / 2 + 0.5;

  useEffect(() => {
    registerZone(id, { occupied: false, intensity: idleIntensity });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const zoneWorldPos = new THREE.Vector3();
    groupRef.current.getWorldPosition(zoneWorldPos);

    let isOccupied = false;
    for (const occ of occupants) {
      if (!occ?.current) continue;
      const occPos = new THREE.Vector3();
      occ.current.getWorldPosition(occPos);
      if (occPos.distanceTo(zoneWorldPos) <= detectRadius) {
        isOccupied = true;
        break;
      }
    }

    setOccupied(id, isOccupied);

    const target = isOccupied ? lightIntensity : idleIntensity;
    // Framerate-independent smoothing so it never feels like a light switch
    const t = 1 - Math.pow(0.001, delta);
    currentIntensity.current = THREE.MathUtils.lerp(
      currentIntensity.current,
      target,
      t
    );

    if (lightRef.current) {
      lightRef.current.intensity = currentIntensity.current;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={floorColor} />
      </mesh>

      {/* Back + side walls (front left open so the camera can see in) */}
      <mesh position={[0, h / 2, -d / 2]} receiveShadow>
        <boxGeometry args={[w, h, 0.15]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh position={[-w / 2, h / 2, 0]} receiveShadow>
        <boxGeometry args={[0.15, h, d]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh position={[w / 2, h / 2, 0]} receiveShadow>
        <boxGeometry args={[0.15, h, d]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* Ceiling fixture (visual anchor for the light) */}
      <mesh position={[0, h - 0.1, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
        <meshStandardMaterial
          color={lightColor}
          emissive={lightColor}
          emissiveIntensity={1}
        />
      </mesh>

      <pointLight
        ref={lightRef}
        position={[0, h - 0.3, 0]}
        color={lightColor}
        intensity={idleIntensity}
        distance={Math.max(w, d) * 1.5}
        decay={2}
        castShadow
      />
    </group>
  );
}
