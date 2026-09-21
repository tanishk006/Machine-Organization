import { useRef, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Wanders between a list of waypoints, pausing briefly at each one
 * (simulates someone sitting at a desk / working an aisle). A handful
 * of these moving around a Zone is what actually makes sector-based
 * lighting visible — one occupant alone can't show "clustering".
 */
const NpcAgent = forwardRef(function NpcAgent(
  { waypoints, speed = 1.2, color = '#a5573a', pauseTime = 2 },
  ref
) {
  const localRef = useRef();
  const targetIndex = useRef(0);
  const pauseTimer = useRef(0);

  useFrame((_, delta) => {
    const obj = localRef.current;
    if (!obj || !waypoints?.length) return;

    if (pauseTimer.current > 0) {
      pauseTimer.current -= delta;
      return;
    }

    const target = new THREE.Vector3(...waypoints[targetIndex.current]);
    const toTarget = target.clone().sub(obj.position);
    const dist = toTarget.length();

    if (dist < 0.15) {
      targetIndex.current = (targetIndex.current + 1) % waypoints.length;
      pauseTimer.current = pauseTime;
      return;
    }

    toTarget.normalize().multiplyScalar(speed * delta);
    obj.position.add(toTarget);
  });

  return (
    <mesh
      ref={(node) => {
        localRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      position={waypoints[0]}
      castShadow
    >
      <capsuleGeometry args={[0.28, 0.55, 4, 8]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
});

export default NpcAgent;
