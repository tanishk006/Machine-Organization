# Auto-Controlled Lights — Project State

## 1. Current state of the project

This project is now a working React + Three.js prototype for an intelligent building-lighting system. It demonstrates how room and sector lighting can react to occupancy, movement, and traffic patterns in a 3D environment.

### What is already working
- A working 3D scene stack is in place using React Three Fiber and Three.js.
- The default app renders a house-based lighting demo where the player can move around with WASD/arrow keys.
- Light zones react dynamically to proximity, fading in as occupants get closer and dimming as they move away.
- A shared Zustand store tracks occupancy and per-zone intensity state.
- The project now includes multiple reusable office and warehouse scene patterns built from the same zone logic.
- The lighting system is reusable across rooms, corridors, offices, and storage aisles instead of being tied to a single room layout.

### Core project idea
The app is built around a reusable zone-based lighting logic:
- each room, corridor, or aisle is treated as a zone,
- the system checks whether an occupant is inside that zone,
- light intensity is updated based on occupancy and proximity,
- the same pattern can be reused for houses, offices, warehousing, or larger building layouts.

### Current status
- Status: working prototype / demo application
- Main rendered scene: `HouseScene` (still the default app scene)
- Additional scenes now available: `OfficeScene`, `OfficeComplexScene`, and `StorageFacilityScene`
- Functional maturity: mid prototype stage; the logic is stable and demonstrates the concept clearly, but the project is still a simulation rather than a polished product interface

### Verified build status
The project was verified with:
```bash
npm install && npm run build
```
This completed successfully with Vite, producing a production build. There is a non-blocking bundle-size warning, but the build itself passes.

---

## 2. Number of scenes that have been made

There are 4 distinct scene implementations in the current project:

1. `HouseScene.jsx`
   - 3 light zones
   - player-controlled avatar
   - proximity-based motion detection
   - designed as a residential room demo

2. `OfficeScene.jsx`
   - 3 sectors
   - 3 NPC agents moving through waypoints
   - sector-based occupancy simulation
   - designed as a simple office/workspace lighting pattern

3. `OfficeComplexScene.jsx`
   - 5+ sector zones including reception, cubicles, meeting rooms, break room, and corridors
   - 5 NPC agents with independent waypoint patterns
   - designed to demonstrate multi-zone office complexity and shared corridor lighting behavior

4. `StorageFacilityScene.jsx`
   - 5 aisles plus a loading dock zone
   - slower worker/forklift-style NPC motion
   - built to showcase the strongest sector-usage feature: only the actively used aisle lights up while adjacent aisles dim

### Scene usage in the app
- The active app view currently renders the `HouseScene` in `App.jsx`.
- The other scene components are implemented as standalone renderable variants and are not part of the scene-switcher yet.

So, in total: 4 scene types have been created, with 1 of them active in the current app.

---

## 3. UI level

The UI is still a basic prototype level, but the project has evolved from a single-room demo into a multi-scene concept showcase.

### Current UI characteristics
- The interface remains minimal and lightweight.
- There is a simple overlay label showing:
  - project name: "Auto-Controlled Lights"
  - controls: "WASD to move"
- The 3D canvas fills the screen with no heavy dashboard or management UI.
- There is no dedicated settings panel, analytics panel, energy savings dashboard, or scene-switching interface yet.
- The visual design is intentionally focused on spatial clarity and lighting behavior rather than polished product UX.

### UI maturity
- Level: demo UI / prototype interface
- Presentation: immersive 3D scene with lightweight overlay text only
- Missing features: control menu, live stats panel, zone metrics, scene selector, visual polish, production UI patterns

This project is still primarily focused on the lighting logic and 3D simulation rather than a complete end-user product design.

---

## Project architecture summary

### Key files
- `src/App.jsx` — app entry point; currently renders `HouseScene`
- `src/HouseScene.jsx` — player-controlled lighting demonstration in a modeled interior
- `src/OfficeScene.jsx` — NPC-based office sector simulation
- `src/Zone.jsx` — reusable room/zone logic for occupancy and light intensity
- `src/SectorLight.jsx` — light element that responds to nearby occupants
- `src/PlayerAvatar.jsx` — WALD/arrow-key-controlled player capsule
- `src/NpcAgent.jsx` — NPC motion logic and patrol behavior
- `src/useZoneStore.js` — central state for occupancy and zone updates
- `src/BuildingShell.jsx` — loads the 3D model used for the house scene

### Technology stack
- React
- Vite
- @react-three/fiber
- @react-three/drei
- Three.js
- Zustand

---

## Overall assessment

The project is in a solid prototype stage: the lighting system works, the scene logic is reusable, and the app demonstrates the core concept clearly. The project is not yet a polished final product, but it already shows a strong foundation for building a larger intelligent-building system.

### Suggested next steps
- add a real UI dashboard with active zones and energy metrics,
- implement scene switching between house and office demos,
- create a larger facility/warehouse concept,
- improve model realism and visual polish,
- add test coverage for the zone logic and energy calculations.
