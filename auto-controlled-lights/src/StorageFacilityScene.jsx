import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Zone from './Zone';
import NpcAgent from './NpcAgent';

function RackBlock({ position = [0, 0, 0], length = 2.2, height = 2.6 }) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.28, height, length]} />
        <meshStandardMaterial color="#8f9ba5" />
      </mesh>
      <mesh position={[0, 0.2, 0]} receiveShadow>
        <boxGeometry args={[0.8, 0.18, length]} />
        <meshStandardMaterial color="#7a8b99" />
      </mesh>
      {[0.6, 1.2, 1.8].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 0.08, length]} />
          <meshStandardMaterial color="#b7bec6" />
        </mesh>
      ))}
    </group>
  );
}

function AisleRacks({ xPosition, zStart = -7, zLength = 12, rackCount = 4 }) {
  const racks = Array.from(
    { length: rackCount },
    (_, index) => zStart + index * (zLength / (rackCount - 1))
  );

  return (
    <group>
      {racks.map((z) => (
        <RackBlock key={`${xPosition}-${z}`} position={[xPosition, 0, z]} length={2.2} />
      ))}
    </group>
  );
}

function DockMarkings() {
  return (
    <group position={[0, 0.02, 8.2]}>
      {[-8, -4, 0, 4, 8].map((x) => (
        <mesh key={x} position={[x, 0, 0.2]} receiveShadow>
          <boxGeometry args={[1.5, 0.03, 0.24]} />
          <meshStandardMaterial color="#f2d174" />
        </mesh>
      ))}
    </group>
  );
}

export default function StorageFacilityScene() {
  const npc1 = useRef();
  const npc2 = useRef();
  const npc3 = useRef();
  const npc4 = useRef();
  const npc5 = useRef();

  const aisle1Occupants = [npc1];
  const aisle2Occupants = [npc2];
  const aisle3Occupants = [npc3];
  const aisle4Occupants = [npc4];
  const aisle5Occupants = [npc5];
  const dockOccupants = [npc5];

  return (
    <Canvas shadows camera={{ position: [0, 18, 24], fov: 35 }}>
      <color attach="background" args={['#171d22']} />
      <ambientLight intensity={0.15} />
      <hemisphereLight
        skyColor="#dfe9f3"
        groundColor="#2f3032"
        intensity={0.38}
      />
      <directionalLight
        position={[7, 12, 4]}
        intensity={0.52}
        color="#f4f1ea"
        castShadow
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[36, 24]} />
        <meshStandardMaterial color="#d6d9d2" />
      </mesh>

      <Zone
        id="storage/aisle-1"
        zoneStore="storageFacilityZones"
        position={[-12, 0, -5]}
        size={[3.4, 3, 7]}
        wallColor="#c7d0d8"
        floorColor="#d5dfe8"
        lightColor="#dfeeff"
        lightIntensity={2.5}
        idleIntensity={0.015}
        occupants={aisle1Occupants}
        radius={3.2}
      />
      <Zone
        id="storage/aisle-2"
        zoneStore="storageFacilityZones"
        position={[-6, 0, -5]}
        size={[3.4, 3, 7]}
        wallColor="#d1d5ce"
        floorColor="#dfe5d9"
        lightColor="#e1f7e3"
        lightIntensity={2.5}
        idleIntensity={0.015}
        occupants={aisle2Occupants}
        radius={3.2}
      />
      <Zone
        id="storage/aisle-3"
        zoneStore="storageFacilityZones"
        position={[-0, 0, -5]}
        size={[3.4, 3, 7]}
        wallColor="#d8d8d1"
        floorColor="#e6e2d8"
        lightColor="#fef1d7"
        lightIntensity={2.7}
        idleIntensity={0.015}
        occupants={aisle3Occupants}
        radius={3.2}
      />
      <Zone
        id="storage/aisle-4"
        zoneStore="storageFacilityZones"
        position={[6, 0, -5]}
        size={[3.4, 3, 7]}
        wallColor="#d7d3cf"
        floorColor="#e7e2dd"
        lightColor="#ffe8d3"
        lightIntensity={2.6}
        idleIntensity={0.015}
        occupants={aisle4Occupants}
        radius={3.2}
      />
      <Zone
        id="storage/aisle-5"
        zoneStore="storageFacilityZones"
        position={[12, 0, -5]}
        size={[3.4, 3, 7]}
        wallColor="#d7d6d1"
        floorColor="#dfe4e7"
        lightColor="#dfe9ff"
        lightIntensity={2.4}
        idleIntensity={0.015}
        occupants={aisle5Occupants}
        radius={3.2}
      />
      <Zone
        id="storage/loading-dock"
        zoneStore="storageFacilityZones"
        position={[0, 0, 7.5]}
        size={[24, 3, 4]}
        wallColor="#ece5df"
        floorColor="#e4ddd5"
        lightColor="#fff2be"
        lightIntensity={2.8}
        idleIntensity={0.015}
        occupants={dockOccupants}
        radius={9}
      />

      <group position={[0, 0, 0]}>
        {[-12, -6, 0, 6, 12].map((x) => (
          <AisleRacks key={x} xPosition={x} zStart={-8.5} zLength={12} rackCount={5} />
        ))}
      </group>

      <DockMarkings />
      <mesh position={[0, 0.03, 5.5]} receiveShadow>
        <boxGeometry args={[20, 0.04, 2]} />
        <meshStandardMaterial color="#ddddd4" />
      </mesh>

      <NpcAgent
        ref={npc1}
        waypoints={[
          [-12, 0.5, -8],
          [-12, 0.5, 1],
          [-6, 0.5, 1],
          [-6, 0.5, -8],
          [-12, 0.5, -8],
        ]}
        color="#3d7cb5"
        speed={0.8}
        pauseTime={3}
      />
      <NpcAgent
        ref={npc2}
        waypoints={[
          [-6, 0.5, -8],
          [-6, 0.5, 1],
          [0, 0.5, 1],
          [0, 0.5, -8],
          [-6, 0.5, -8],
        ]}
        color="#5c9d66"
        speed={0.7}
        pauseTime={3.4}
      />
      <NpcAgent
        ref={npc3}
        waypoints={[
          [0, 0.5, -8],
          [0, 0.5, 1],
          [6, 0.5, 1],
          [6, 0.5, -8],
          [0, 0.5, -8],
        ]}
        color="#a86341"
        speed={0.75}
        pauseTime={3.2}
      />
      <NpcAgent
        ref={npc4}
        waypoints={[
          [6, 0.5, -8],
          [6, 0.5, 1],
          [12, 0.5, 1],
          [12, 0.5, -8],
          [6, 0.5, -8],
        ]}
        color="#9a6fcb"
        speed={0.68}
        pauseTime={3.8}
      />
      <NpcAgent
        ref={npc5}
        waypoints={[
          [0, 0.5, 9],
          [12, 0.5, 9],
          [12, 0.5, 1],
          [-12, 0.5, 1],
          [0, 0.5, 9],
        ]}
        color="#d39c31"
        speed={0.95}
        pauseTime={2.5}
      />

      <OrbitControls
        target={[0, 0.7, 0]}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={12}
        maxDistance={32}
      />
    </Canvas>
  );
}
