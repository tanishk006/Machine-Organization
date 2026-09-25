import { Component, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import BuildingShell from './BuildingShell';
import PlayerAvatar from './PlayerAvatar';
import SectorLight from './SectorLight';

class SceneErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <Html center>Unable to load the house model.</Html>;
    }
    return this.props.children;
  }
}

export default function HouseScene() {
  const playerRef = useRef();
  const occupants = [playerRef];

  return (
    <Canvas
      shadows
      camera={{ position: [0, 6.2, 9.5], fov: 34 }}
      gl={{ toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <color attach="background" args={['#171d22']} />
      <ambientLight intensity={0.18} />
      <hemisphereLight
        skyColor="#dfe9f3"
        groundColor="#2a2a2a"
        intensity={0.38}
      />
      <directionalLight
        position={[6, 9, 5]}
        intensity={0.45}
        color="#f5f0e8"
        castShadow
      />

      <SceneErrorBoundary>
        <Suspense fallback={<Html center>Loading scene...</Html>}>
          <BuildingShell url="/models/loft_13_living_room_interior.glb" />
        </Suspense>
      </SceneErrorBoundary>

      <SectorLight
        id="living-room"
        position={[-4.8, 2.3, -1.2]}
        lightColor="#ffdca8"
        occupants={occupants}
        radius={2.1}
        idleIntensity={0.015}
      />
      <SectorLight
        id="kitchen"
        position={[-1.6, 2.3, -1.1]}
        lightColor="#fff6d8"
        occupants={occupants}
        radius={1.8}
        idleIntensity={0.015}
      />
      <SectorLight
        id="bedroom"
        position={[0.4, 2.3, 1.3]}
        lightColor="#ffe9c7"
        occupants={occupants}
        radius={1.8}
        idleIntensity={0.015}
      />

      <Suspense fallback={null}>
        <PlayerAvatar ref={playerRef} startPosition={[-4.8, 0.4, 1.2]} />
      </Suspense>

      <OrbitControls
        target={[0, 1.2, 0]}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={5}
        maxDistance={18}
      />
    </Canvas>
  );
}
