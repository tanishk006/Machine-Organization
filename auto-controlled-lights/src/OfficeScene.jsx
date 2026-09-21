import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Zone from './Zone';
import NpcAgent from './NpcAgent';

/**
 * Office demo: sector-based usage. A few NPCs wander mostly within
 * sectors A and B, rarely visiting C — so you'll typically see A/B
 * lit while C stays dim, demonstrating "lights only where people are".
 */
export default function OfficeScene() {
  const npc1 = useRef();
  const npc2 = useRef();
  const npc3 = useRef();
  const occupants = [npc1, npc2, npc3];

  return (
    <Canvas shadows camera={{ position: [0, 12, 16], fov: 50 }}>
      <ambientLight intensity={0.12} />
      <hemisphereLight
        skyColor="#dfe9f3"
        groundColor="#3a3a3a"
        intensity={0.25}
      />

      {/* Sector A - desk cluster, usually busy */}
      <Zone
        id="sector-a"
        position={[-5, 0, -3]}
        size={[6, 3, 5]}
        wallColor="#dfe3e6"
        lightColor="#eaf3ff"
        occupants={occupants}
      />
      {/* Sector B - meeting room, intermittently busy */}
      <Zone
        id="sector-b"
        position={[3, 0, -3]}
        size={[5, 3, 5]}
        wallColor="#e2e6e2"
        lightColor="#eaf3ff"
        occupants={occupants}
      />
      {/* Sector C - break area, rarely visited -> should mostly stay dim */}
      <Zone
        id="sector-c"
        position={[-1, 0, 5]}
        size={[6, 3, 4]}
        wallColor="#e6e2df"
        lightColor="#fff3e0"
        occupants={occupants}
      />

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
        maxPolarAngle={Math.PI / 2.1}
        minDistance={6}
        maxDistance={30}
      />
    </Canvas>
  );
}
