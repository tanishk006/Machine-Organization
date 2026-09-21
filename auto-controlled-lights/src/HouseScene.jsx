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

/**
 * House demo: proximity-based motion detection.
 * Walk the avatar (WASD/arrows) between rooms and watch each light
 * fade up as you approach and dim back down as you leave.
 */
export default function HouseScene() {
  const playerRef = useRef();
  const occupants = [playerRef];

  return (
    <Canvas
      shadows
      camera={{ position: [-1, 5.5, 10], fov: 50 }}
      gl={{ toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <ambientLight intensity={0.15} />
      <hemisphereLight
        skyColor="#dfe9f3"
        groundColor="#3a3a3a"
        intensity={0.3}
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
      />
      <SectorLight
        id="kitchen"
        position={[-1.6, 2.3, -1.1]}
        lightColor="#fff6d8"
        occupants={occupants}
        radius={1.8}
      />
      <SectorLight
        id="bedroom"
        position={[0.4, 2.3, 1.3]}
        lightColor="#ffe9c7"
        occupants={occupants}
        radius={1.8}
      />

      <Suspense fallback={null}>
        <PlayerAvatar ref={playerRef} startPosition={[-4.8, 0.4, 1.2]} />
      </Suspense>

      <OrbitControls
        maxPolarAngle={Math.PI / 2.1}
        minDistance={5}
        maxDistance={25}
      />
    </Canvas>
  );
}
