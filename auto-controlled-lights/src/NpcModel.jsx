import { useRef, useEffect, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

const NpcModel = forwardRef(function NpcModel(
  { url, waypoints, speed = 1.2, pauseTime = 2, scale = 1 },
  ref
) {
  const { scene, animations } = useGLTF(url);
  const cloned = useRef(SkeletonUtils.clone(scene)).current;
  const { actions } = useAnimations(animations, cloned);
  const groupRef = useRef();
  const targetIndex = useRef(0);
  const pauseTimer = useRef(0);

  useEffect(() => {
    const clipName = Object.keys(actions || {})[0];
    if (!clipName) return undefined;
    actions[clipName].reset().fadeIn(0.2).play();
    return () => actions[clipName].fadeOut(0.2);
  }, [actions]);

  useFrame((_, delta) => {
    const object = groupRef.current;
    if (!object || !waypoints?.length) return;

    if (pauseTimer.current > 0) {
      pauseTimer.current -= delta;
      return;
    }

    const target = new THREE.Vector3(...waypoints[targetIndex.current]);
    const direction = target.sub(object.position);
    if (direction.length() < 0.15) {
      targetIndex.current = (targetIndex.current + 1) % waypoints.length;
      pauseTimer.current = pauseTime;
      return;
    }

    direction.normalize().multiplyScalar(speed * delta);
    object.position.add(direction);
    object.rotation.y = Math.atan2(direction.x, direction.z);
  });

  return (
    <group
      ref={(node) => {
        groupRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      position={waypoints[0]}
    >
      <primitive object={cloned} scale={scale} />
    </group>
  );
});

export default NpcModel;
