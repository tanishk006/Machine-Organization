import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useZoneStore } from './useZoneStore';

export default function SectorLight({
  id,
  position = [0, 0, 0],
  lightColor = '#fff2d0',
  lightIntensity = 2.5,
  idleIntensity = 0.05,
  occupants = [],
  radius = 3,
  distance,
  showHelper = false,
}) {
  const groupRef = useRef();
  const lightRef = useRef();
  const currentIntensity = useRef(idleIntensity);
  const registerZone = useZoneStore((state) => state.registerZone);
  const setOccupied = useZoneStore((state) => state.setOccupied);

  useEffect(() => {
    registerZone(id, { occupied: false, intensity: idleIntensity });
  }, [id, idleIntensity, registerZone]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const sectorPosition = new THREE.Vector3();
    groupRef.current.getWorldPosition(sectorPosition);
    const occupantPosition = new THREE.Vector3();
    const isOccupied = occupants.some((occupant) => {
      if (!occupant?.current) return false;
      occupant.current.getWorldPosition(occupantPosition);
      return occupantPosition.distanceTo(sectorPosition) <= radius;
    });

    setOccupied(id, isOccupied);
    const target = isOccupied ? lightIntensity : idleIntensity;
    const smoothing = 1 - Math.pow(0.001, delta);
    currentIntensity.current = THREE.MathUtils.lerp(
      currentIntensity.current,
      target,
      smoothing
    );

    if (lightRef.current) lightRef.current.intensity = currentIntensity.current;
  });

  return (
    <group ref={groupRef} position={position}>
      <pointLight
        ref={lightRef}
        color={lightColor}
        intensity={idleIntensity}
        distance={distance ?? radius * 3}
        decay={2}
        castShadow
      />
      {showHelper && (
        <mesh>
          <sphereGeometry args={[radius, 16, 16]} />
          <meshBasicMaterial color="red" wireframe transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}