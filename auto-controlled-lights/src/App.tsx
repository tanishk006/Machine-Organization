import { useState } from 'react';
import { SCENE_REGISTRY, SCENE_MAP } from './scenes';

export default function App() {
  const [activeSceneId, setActiveSceneId] = useState<string>('officeComplex');

  const activeSceneItem = SCENE_MAP[activeSceneId] || SCENE_REGISTRY[0];
  const ActiveScene = activeSceneItem.component;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans">
      {/* 3D Scene Viewport - mounted with unique key for clean unmount/lifecycle */}
      <ActiveScene key={activeSceneId} />

      {/* Floating Scene Selector Bar - centered at top with z-50 to avoid overlapping scene HUDs */}
      <nav
        aria-label="Scene Selector"
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1 bg-stone-900/90 backdrop-blur-md border border-stone-700/70 rounded-full shadow-2xl"
      >
        {SCENE_REGISTRY.map((scene) => {
          const isActive = scene.id === activeSceneId;
          return (
            <button
              key={scene.id}
              type="button"
              onClick={() => setActiveSceneId(scene.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all ${
                isActive
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-400/50 shadow-sm'
                  : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/80 border border-transparent'
              }`}
            >
              {scene.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
