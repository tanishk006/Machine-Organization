import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Zone from './Zone';
import NpcAgent from './NpcAgent';
import { useZoneStore } from './useZoneStore';

function ReceptionDesk({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.16, 0.9]} />
        <meshStandardMaterial color="#d7dde7" />
      </mesh>
      <mesh position={[-0.8, 0.2, 0.2]} castShadow>
        <boxGeometry args={[0.7, 0.4, 0.55]} />
        <meshStandardMaterial color="#848f9d" />
      </mesh>
      <mesh position={[0.8, 0.2, 0.2]} castShadow>
        <boxGeometry args={[0.7, 0.4, 0.55]} />
        <meshStandardMaterial color="#848f9d" />
      </mesh>
    </group>
  );
}

function CubicleRow({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      {[-1.5, 0, 1.5].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 0.1, 0.7]} />
            <meshStandardMaterial color="#e0ebf5" />
          </mesh>
          <mesh position={[0, 0.15, 0.15]} castShadow>
            <boxGeometry args={[0.7, 0.3, 0.14]} />
            <meshStandardMaterial color="#4a5560" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function MeetingTable({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.14, 1.6]} />
        <meshStandardMaterial color="#e7ddca" />
      </mesh>
      {[-1.2, 0, 1.2].map((x) => (
        <group key={x} position={[x, 0, 1.45]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.42, 0.5]} />
            <meshStandardMaterial color="#d0d7df" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.1, -0.9]} castShadow>
        <boxGeometry args={[2.3, 1, 0.1]} />
        <meshStandardMaterial color="#f5f7fa" emissive="#b1d0f2" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

function BreakCorner({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.12, 1.2]} />
        <meshStandardMaterial color="#e9d9c8" />
      </mesh>
      <mesh position={[0, 0.7, -0.7]} castShadow>
        <boxGeometry args={[0.9, 1.1, 0.7]} />
        <meshStandardMaterial color="#a8aeb4" />
      </mesh>
      <mesh position={[-1.2, 0.25, 0.9]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#c3b7aa" />
      </mesh>
    </group>
  );
}

export default function OfficeComplexScene() {
  const npc1 = useRef();
  const npc2 = useRef();
  const npc3 = useRef();
  const npc4 = useRef();
  const npc5 = useRef();

  const officeComplexZones = useZoneStore((state) => state.officeComplexZones);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('debug=zones')) {
      console.table(
        Object.entries(officeComplexZones).map(([id, data]) => ({
          id,
          occupied: Boolean(data?.occupied),
        }))
      );
    }
  }, [officeComplexZones]);

  const receptionOccupants = [npc1, npc4];
  const cubicleOccupants = [npc1, npc2, npc3, npc4];
  const meetingOccupants = [npc2, npc3, npc5];
  const breakOccupants = [npc3, npc5];
  const westCorridorOccupants = [npc1, npc4];
  const mainCorridorOccupants = [npc2, npc3, npc4, npc5];
  const eastCorridorOccupants = [npc2, npc3, npc5];

  return (
    <Canvas shadows camera={{ position: [0, 14, 22], fov: 36 }}>
      <color attach="background" args={['#171d22']} />
      <ambientLight intensity={0.16} />
      <hemisphereLight
        skyColor="#dfe9f3"
        groundColor="#2f2f30"
        intensity={0.4}
      />
      <directionalLight
        position={[6, 10, 3]}
        intensity={0.55}
        color="#f2efe9"
        castShadow
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <planeGeometry args={[34, 18]} />
        <meshStandardMaterial color="#e5e5e0" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8.5, -0.02, 0.5]} receiveShadow>
        <boxGeometry args={[6.2, 0.04, 2.5]} />
        <meshStandardMaterial color="#d9d7d0" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, -0.02, 1.5]} receiveShadow>
        <boxGeometry args={[11.5, 0.04, 2.5]} />
        <meshStandardMaterial color="#d1d7d2" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8.5, -0.02, 1.5]} receiveShadow>
        <boxGeometry args={[6.2, 0.04, 2.5]} />
        <meshStandardMaterial color="#d9d7d0" />
      </mesh>

      <Zone
        id="office-complex/reception"
        zoneStore="officeComplexZones"
        position={[-10, 0, -6]}
        size={[5, 3, 4.5]}
        wallColor="#dfe7ee"
        floorColor="#d7dfe6"
        lightColor="#eaf5ff"
        lightIntensity={2.6}
        idleIntensity={0.015}
        occupants={receptionOccupants}
      />
      <ReceptionDesk position={[-10, 0, -6]} />
      <Zone
        id="office-complex/cubicles"
        zoneStore="officeComplexZones"
        position={[-2.5, 0, -6]}
        size={[9, 3, 4.5]}
        wallColor="#dfe1d8"
        floorColor="#d8e3d4"
        lightColor="#e6f7ff"
        lightIntensity={2.7}
        idleIntensity={0.015}
        occupants={cubicleOccupants}
      />
      <CubicleRow position={[-2.5, 0, -6]} />
      <Zone
        id="office-complex/meeting-room"
        zoneStore="officeComplexZones"
        position={[8, 0, -6]}
        size={[7, 3, 5]}
        wallColor="#ece3d6"
        floorColor="#eae1d7"
        lightColor="#fff2d3"
        lightIntensity={2.8}
        idleIntensity={0.015}
        occupants={meetingOccupants}
      />
      <MeetingTable position={[8, 0, -6]} />
      <Zone
        id="office-complex/break-room"
        zoneStore="officeComplexZones"
        position={[8, 0, 4.5]}
        size={[7, 3, 5]}
        wallColor="#e7e0df"
        floorColor="#f0ddd5"
        lightColor="#ffecc8"
        lightIntensity={2.4}
        idleIntensity={0.015}
        occupants={breakOccupants}
      />
      <BreakCorner position={[8, 0, 4.5]} />
      <Zone
        id="office-complex/corridor-west"
        zoneStore="officeComplexZones"
        position={[-8.5, 0, 0.5]}
        size={[5, 3, 2.2]}
        wallColor="#f0efeb"
        floorColor="#dad9d1"
        lightColor="#dfefff"
        lightIntensity={2.1}
        idleIntensity={0.015}
        occupants={westCorridorOccupants}
        radius={2.8}
      />
      <Zone
        id="office-complex/corridor-main"
        zoneStore="officeComplexZones"
        position={[0.5, 0, 1.5]}
        size={[11, 3, 2.2]}
        wallColor="#f3f1eb"
        floorColor="#d6d9d0"
        lightColor="#dff3ff"
        lightIntensity={2.2}
        idleIntensity={0.015}
        occupants={mainCorridorOccupants}
        radius={3.8}
      />
      <Zone
        id="office-complex/corridor-east"
        zoneStore="officeComplexZones"
        position={[8.5, 0, 1.5]}
        size={[5, 3, 2.2]}
        wallColor="#f4f0eb"
        floorColor="#d9d7d0"
        lightColor="#fff2d9"
        lightIntensity={2.1}
        idleIntensity={0.015}
        occupants={eastCorridorOccupants}
        radius={2.8}
      />

      <NpcAgent
        ref={npc1}
        waypoints={[
          [-10, 0.5, -6],
          [-2.5, 0.5, -6],
          [-2.5, 0.5, 1.5],
          [-8.5, 0.5, 1.5],
          [-10, 0.5, -6],
        ]}
        color="#4b86b4"
        speed={1.15}
        pauseTime={1.2}
      />
      <NpcAgent
        ref={npc2}
        waypoints={[
          [-2.5, 0.5, -6],
          [8, 0.5, -6],
          [8, 0.5, 1.5],
          [0.5, 0.5, 1.5],
          [-2.5, 0.5, -6],
        ]}
        color="#5fa05a"
        speed={1.1}
        pauseTime={1.8}
      />
      <NpcAgent
        ref={npc3}
        waypoints={[
          [8, 0.5, 4.5],
          [8, 0.5, 1.5],
          [0.5, 0.5, 1.5],
          [-2.5, 0.5, -6],
          [8, 0.5, 4.5],
        ]}
        color="#b36d50"
        speed={1.2}
        pauseTime={1.4}
      />
      <NpcAgent
        ref={npc4}
        waypoints={[
          [-10, 0.5, -6],
          [-10, 0.5, 1.5],
          [0.5, 0.5, 1.5],
          [8, 0.5, 1.5],
          [-10, 0.5, -6],
        ]}
        color="#8b69d8"
        speed={1.35}
        pauseTime={1.1}
      />
      <NpcAgent
        ref={npc5}
        waypoints={[
          [8, 0.5, 4.5],
          [8, 0.5, -6],
          [-2.5, 0.5, -6],
          [0.5, 0.5, 1.5],
          [8, 0.5, 4.5],
        ]}
        color="#d09d3a"
        speed={1.05}
        pauseTime={1.9}
      />

      <OrbitControls
        target={[0, 0.8, 0]}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={12}
        maxDistance={30}
      />
    </Canvas>
  );
}
