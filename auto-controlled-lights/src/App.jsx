import { useState } from 'react';
import HouseScene from './HouseScene';
import OfficeScene from './OfficeScene';
import OfficeComplexScene from './OfficeComplexScene';
import StorageFacilityScene from './StorageFacilityScene';
import { useZoneStore } from './useZoneStore';
import './App.css';

const sceneMap = {
  house: { label: 'House', component: HouseScene, hint: 'WASD to move' },
  office: { label: 'Office', component: OfficeScene, hint: 'NPC activity' },
  officeComplex: {
    label: 'Office Complex',
    component: OfficeComplexScene,
    hint: 'Multi-zone flow',
  },
  storage: {
    label: 'Storage',
    component: StorageFacilityScene,
    hint: 'Aisle occupancy',
  },
};

const zoneLookup = {
  house: 'zones',
  office: 'zones',
  officeComplex: 'officeComplexZones',
  storage: 'storageFacilityZones',
};

export default function App() {
  const [activeScene, setActiveScene] = useState('officeComplex');
  const ActiveScene = sceneMap[activeScene].component;
  const zones = useZoneStore((state) => state[zoneLookup[activeScene]] ?? {});
  const litZones = Object.values(zones).filter((zone) => zone?.occupied).length;
  const totalZones = Object.keys(zones).length;

  return (
    <main className="scene-app">
      <ActiveScene />

      <div className="scene-overlay" aria-label="Scene information">
        <strong>Auto-Controlled Lights</strong>
        <span>{sceneMap[activeScene].label}</span>
        <span>{sceneMap[activeScene].hint}</span>
        <div className="hud-metrics">
          <span>{litZones}/{totalZones} zones lit</span>
        </div>
        <div className="hud-legend" aria-label="Legend">
          <span className="legend-item">
            <span className="legend-swatch player" />
            Player
          </span>
          <span className="legend-item">
            <span className="legend-swatch npc" />
            NPC
          </span>
        </div>
      </div>

      <div className="scene-switcher" aria-label="Scene selector">
        {Object.entries(sceneMap).map(([key, scene]) => (
          <button
            key={key}
            type="button"
            className={activeScene === key ? 'scene-button active' : 'scene-button'}
            onClick={() => setActiveScene(key)}
          >
            {scene.label}
          </button>
        ))}
      </div>
    </main>
  );
}