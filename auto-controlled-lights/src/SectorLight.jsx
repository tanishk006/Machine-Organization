import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useZoneStore } from './useZoneStore';

export default function SectorLight({
  id,
  position = [0, 0, 0],
  lightColor = '#fff2d0',
  lightIntensity = 2.5,
  idleIntensity = 0.015,
  occupants = [],
  radius = 3,
  distance,
  showHelper = false,
  zoneStore = 'zones',
}) {
  const groupRef = useRef();
  const lightRef = useRef();
  const bulbRef = useRef();
  const currentIntensity = useRef(idleIntensity);
  const registerZone = useZoneStore((state) => {
    if (zoneStore === 'officeComplexZones') return state.registerOfficeComplexZone;
    if (zoneStore === 'storageFacilityZones') return state.registerStorageFacilityZone;
    return state.registerZone;
  });
  const setOccupied = useZoneStore((state) => {
    if (zoneStore === 'officeComplexZones') return state.setOfficeComplexOccupied;
    if (zoneStore === 'storageFacilityZones') return state.setStorageFacilityOccupied;
    return state.setOccupied;
  });

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
    if (bulbRef.current) {
      const brightness = 0.5 + currentIntensity.current * 2.1;
      bulbRef.current.scale.setScalar(Math.max(0.6, brightness));
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.08, 18]} />
        <meshStandardMaterial
          color="#f6f0df"
          emissive={lightColor}
          emissiveIntensity={0.8}
        />
      </mesh>
      <mesh ref={bulbRef} position={[0, -0.1, 0]} castShadow>
        <sphereGeometry args={[0.14, 18, 18]} />
        <meshStandardMaterial
          color={lightColor}
          emissive={lightColor}
          emissiveIntensity={1.7}
          metalness={0.15}
          roughness={0.25}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, -0.2, 0]}
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