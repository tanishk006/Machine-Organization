import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Zone from './Zone';
import NpcAgent from './NpcAgent';

function DeskCluster({ position = [0, 0, 0], rowCount = 3 }) {
  const desks = Array.from({ length: rowCount }, (_, index) => index - (rowCount - 1) / 2);

  return (
    <group position={position}>
      {desks.map((offset) => (
        <group key={offset} position={[offset * 1.5, 0, 0]}>
          <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.4, 0.12, 0.7]} />
            <meshStandardMaterial color="#dfeaf4" />
          </mesh>
          <mesh position={[0, 0.2, 0.18]} castShadow>
            <boxGeometry args={[0.7, 0.32, 0.14]} />
            <meshStandardMaterial color="#4b5563" />
          </mesh>
          <mesh position={[0, 0.18, -0.26]} castShadow>
            <boxGeometry args={[0.45, 0.28, 0.45]} />
            <meshStandardMaterial color="#8aa1b7" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function MeetingSet({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.12, 1.5]} />
        <meshStandardMaterial color="#e9e0d8" />
      </mesh>
      {[-1, 0, 1].map((x) => (
        <group key={x} position={[x * 1.1, 0, 1.4]}>
          <mesh position={[0, 0.22, 0]} castShadow>
            <boxGeometry args={[0.5, 0.44, 0.5]} />
            <meshStandardMaterial color="#d0d7df" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.2, -1.3]} castShadow>
        <boxGeometry args={[2.2, 1.2, 0.12]} />
        <meshStandardMaterial color="#f1f4f9" emissive="#b9d1ef" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function BreakSetup({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.12, 1.3]} />
        <meshStandardMaterial color="#e9d7c8" />
      </mesh>
      {[-1, 1].map((x) => (
        <group key={x} position={[x * 1.2, 0.18, 0.7]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.36, 0.55]} />
            <meshStandardMaterial color="#cfb7a0" />
          </mesh>
        </group>
      ))}
      <mesh position={[-1.2, 0.85, -0.7]} castShadow>
        <boxGeometry args={[0.7, 1.1, 0.7]} />
        <meshStandardMaterial color="#aaaeb2" />
      </mesh>
    </group>
  );
}

export default function OfficeScene() {
  const npc1 = useRef();
  const npc2 = useRef();
  const npc3 = useRef();
  const occupants = [npc1, npc2, npc3];

  return (
    <Canvas shadows camera={{ position: [0, 12, 16], fov: 38 }}>
      <color attach="background" args={['#171d22']} />
      <ambientLight intensity={0.16} />
      <hemisphereLight
        skyColor="#dfe9f3"
        groundColor="#232323"
        intensity={0.4}
      />
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.55}
        color="#f3efe8"
        castShadow
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[22, 18]} />
        <meshStandardMaterial color="#dfe4df" />
      </mesh>

      <Zone
        id="sector-a"
        position={[-5, 0, -3]}
        size={[6, 3, 5]}
        wallColor="#dfe3e6"
        floorColor="#dfeaf3"
        lightColor="#eaf3ff"
        lightIntensity={2.5}
        idleIntensity={0.015}
        occupants={[npc1, npc2]}
      />
      <DeskCluster position={[-5, 0, -3]} rowCount={3} />

      <Zone
        id="sector-b"
        position={[3, 0, -3]}
        size={[5, 3, 5]}
        wallColor="#e2e6e2"
        floorColor="#e4ebdf"
        lightColor="#eaf3ff"
        lightIntensity={2.7}
        idleIntensity={0.015}
        occupants={[npc2, npc3]}
      />
      <MeetingSet position={[3, 0, -3]} />

      <Zone
        id="sector-c"
        position={[-1, 0, 5]}
        size={[6, 3, 4]}
        wallColor="#e6e2df"
        floorColor="#f0e1d6"
        lightColor="#fff3e0"
        lightIntensity={2.6}
        idleIntensity={0.015}
        occupants={[npc3]}
      />
      <BreakSetup position={[-1, 0, 5]} />

      <NpcAgent
        ref={npc1}
        waypoints={[
          [-6, 0.5, -4],
          [-3, 0.5, -2],
          [-6, 0.5, -1],
        ]}
        color="#3a6ea5"
      />
      <NpcAgent
        ref={npc2}
        waypoints={[
          [2, 0.5, -4],
          [4, 0.5, -2],
          [2, 0.5, -1],
        ]}
        color="#5aa56b"
        pauseTime={3}
      />
      <NpcAgent
        ref={npc3}
        waypoints={[
          [-5, 0.5, -3],
          [3, 0.5, -3],
          [-1, 0.5, 5],
        ]}
        color="#a5573a"
        pauseTime={1}
        speed={0.9}
      />

      <OrbitControls
        target={[0, 0.8, 0]}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={8}
        maxDistance={24}
      />
    </Canvas>
  );
}
