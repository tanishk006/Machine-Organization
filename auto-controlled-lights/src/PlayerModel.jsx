import { useEffect, useRef, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

const PlayerModel = forwardRef(function PlayerModel(
  { url, startPosition = [0, 0, 0], speed = 3, scale = 1 },
  ref
) {
  const { scene, animations } = useGLTF(url);
  const cloned = useRef(SkeletonUtils.clone(scene)).current;
  const { actions } = useAnimations(animations, cloned);
  const keys = useRef({});
  const groupRef = useRef();

  useEffect(() => {
    const clipName = Object.keys(actions || {})[0];
    if (!clipName) return undefined;
    actions[clipName].reset().fadeIn(0.2).play();
    return () => actions[clipName].fadeOut(0.2);
  }, [actions]);

  useEffect(() => {
    const down = (event) => (keys.current[event.code] = true);
    const up = (event) => (keys.current[event.code] = false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useFrame((_, delta) => {
    const object = groupRef.current;
    if (!object) return;

    const direction = new THREE.Vector3();
    if (keys.current.KeyW || keys.current.ArrowUp) direction.z -= 1;
    if (keys.current.KeyS || keys.current.ArrowDown) direction.z += 1;
    if (keys.current.KeyA || keys.current.ArrowLeft) direction.x -= 1;
    if (keys.current.KeyD || keys.current.ArrowRight) direction.x += 1;

    if (direction.lengthSq() > 0) {
      direction.normalize().multiplyScalar(speed * delta);
      object.position.add(direction);
      object.rotation.y = Math.atan2(direction.x, direction.z);
    }
  });

  return (
    <group
      ref={(node) => {
        groupRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      position={startPosition}
    >
      <primitive object={cloned} scale={scale} />
    </group>
  );
});

export default PlayerModel;
