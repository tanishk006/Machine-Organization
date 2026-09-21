# Auto-Controlled Lights — House & Office scaffold (React Three Fiber)

## Install (in your existing React project)
```bash
npm install three @react-three/fiber @react-three/drei zustand
```

## Files
- `useZoneStore.js` — shared occupancy state (Zustand). Any UI overlay
  (stats panel, "energy saved %") can subscribe to this same store.
- `Zone.jsx` — the core reusable engine. One room/sector: walls, floor,
  ceiling fixture, and a light that lerps smoothly based on whether any
  occupant is within its detection radius. This is the ONE piece you
  reuse for house rooms, office sectors, and (later) storage aisles —
  don't rewrite this per building, just change props.
- `PlayerAvatar.jsx` — WASD/arrow-key controlled capsule for the house.
- `NpcAgent.jsx` — autonomous capsule that patrols waypoints, pausing at
  each one. Use a few of these per building to demonstrate sector
  clustering (a single occupant can't show "lit where people cluster").
- `HouseScene.jsx` — 3 rooms, player avatar, proximity-based motion
  detection.
- `OfficeScene.jsx` — 3 sectors, 3 wandering NPCs, sector-based usage
  (A/B stay lit more often, C mostly stays dim).

## Drop-in usage
```jsx
// App.jsx
import HouseScene from './HouseScene';
// import OfficeScene from './OfficeScene';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <HouseScene />
    </div>
  );
}
```

## What's intentionally left for you to decide
- **Storage facility** isn't built yet — same `Zone` engine, just lay out
  aisles instead of rooms and reuse `NpcAgent` for wandering workers.
- **NPC waypoints** are placeholder coordinates — nudge them to match
  your actual floor plan once you model real geometry (walls/desks/shelves).
- **Stats overlay** (energy saved %, active zones) reads naturally off
  `useZoneStore` — not built yet, but the data's already there for it.
- **Visual detail** (furniture, textures, better geometry) is deliberately
  minimal here — this is the *logic engine*, not the final art pass.
