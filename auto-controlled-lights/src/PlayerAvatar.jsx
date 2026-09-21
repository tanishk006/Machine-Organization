import { useRef, useEffect, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Simple WASD/arrow-key controlled avatar. No external input library
 * required — plain keydown/keyup listeners, kept dependency-light.
 * Pass a ref in from the parent scene so Zones can track its position.
 */
const PlayerAvatar = forwardRef(function PlayerAvatar(
  { startPosition = [0, 0.5, 0], speed = 3 },
  ref
) {
  const keys = useRef({});
  const localRef = useRef();

  useEffect(() => {
    const down = (e) => (keys.current[e.code] = true);
    const up = (e) => (keys.current[e.code] = false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useFrame((_, delta) => {
    const obj = localRef.current;
    if (!obj) return;

    const dir = new THREE.Vector3();
    if (keys.current['KeyW'] || keys.current['ArrowUp']) dir.z -= 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown']) dir.z += 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) dir.x -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) dir.x += 1;

    if (dir.lengthSq() > 0) {
      dir.normalize().multiplyScalar(speed * delta);
      obj.position.add(dir);
    }
  });

  return (
    <mesh
      ref={(node) => {
        localRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      position={startPosition}
      castShadow
    >
      <capsuleGeometry args={[0.3, 0.6, 4, 8]} />
      <meshStandardMaterial color="#3a6ea5" />
    </mesh>
  );
});

export default PlayerAvatar;
