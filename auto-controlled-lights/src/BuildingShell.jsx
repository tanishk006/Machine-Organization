import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

export default function BuildingShell({ url, onAnchors, ...props }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    if (!onAnchors) return;

    const anchors = {};
    scene.traverse((object) => {
      if (object.name?.startsWith('Zone_')) {
        anchors[object.name.replace('Zone_', '')] = object.position.toArray();
      }
    });
    onAnchors(anchors);
  }, [onAnchors, scene]);

  return <primitive object={scene} {...props} />;
}

useGLTF.preload('/models/loft_13_living_room_interior.glb');