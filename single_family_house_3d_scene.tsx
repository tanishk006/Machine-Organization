import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { create } from 'zustand';

/**
 * Global Zustand Zone Store with namespaced 'houseZones' slice.
 * Tracks dynamic occupancy for the residential single-family house.
 */
export const useZoneStore = create((set) => ({
  houseZones: {
    'living-room': {
      id: 'living-room',
      name: 'Living Room',
      label: 'Living Room · Lounge & Media',
      isOccupied: false,
    },
    'kitchen': {
      id: 'kitchen',
      name: 'Kitchen & Dining',
      label: 'Kitchen · Culinary & Dining',
      isOccupied: false,
    },
    'bedroom': {
      id: 'bedroom',
      name: 'Master Bedroom',
      label: 'Bedroom · Private Suite',
      isOccupied: false,
    },
    'hallway': {
      id: 'hallway',
      name: 'Central Hallway',
      label: 'Hallway · Transition Corridor',
      isOccupied: true, // Player spawns in the hallway
    },
  },

  setPlayerActiveZone: (activeZoneId) =>
    set((state) => {
      let changed = false;
      const updated = { ...state.houseZones };
      Object.keys(updated).forEach((id) => {
        const shouldBeOccupied = id === activeZoneId;
        if (updated[id].isOccupied !== shouldBeOccupied) {
          updated[id] = { ...updated[id], isOccupied: shouldBeOccupied };
          changed = true;
        }
      });
      return changed ? { houseZones: updated } : state;
    }),
}));

export const HOUSE_ZONES = [
  {
    id: 'living-room',
    name: 'Living Room',
    label: 'Living Room · Lounge & Media',
    bounds: { minX: -0.75, maxX: 6.25, minZ: 0.75, maxZ: 5.25 },
    center: [2.75, 0, 3.0],
    lightPos: [2.75, 2.5, 3.0],
    lightColor: 0xffedd5, // Warm 2700K tungsten
    activeIntensity: 26.0,
    idleIntensity: 1.6,
    distance: 10.5,
  },
  {
    id: 'kitchen',
    name: 'Kitchen & Dining',
    label: 'Kitchen · Culinary & Dining',
    bounds: { minX: -0.75, maxX: 6.25, minZ: -5.25, maxZ: -0.75 },
    center: [2.75, 0, -3.0],
    lightPos: [2.75, 2.5, -3.0],
    lightColor: 0xf8fafc, // Crisp neutral 4000K daylight
    activeIntensity: 26.0,
    idleIntensity: 1.6,
    distance: 10.5,
  },
  {
    id: 'bedroom',
    name: 'Master Bedroom',
    label: 'Bedroom · Private Suite',
    bounds: { minX: -6.25, maxX: -1.75, minZ: -5.25, maxZ: 0.25 },
    center: [-4.0, 0, -2.5],
    lightPos: [-4.0, 2.5, -2.5],
    lightColor: 0xffecd1, // Cozy 2500K warm glow
    activeIntensity: 24.0,
    idleIntensity: 1.5,
    distance: 9.5,
  },
  {
    id: 'hallway',
    name: 'Central Hallway',
    label: 'Hallway · Transition Corridor',
    bounds: { minX: -6.25, maxX: -0.75, minZ: 0.25, maxZ: 5.25 },
    center: [-3.5, 0, 2.75],
    lightPos: [-3.5, 2.5, 2.75],
    lightColor: 0xf1f5f9,
    activeIntensity: 20.0,
    idleIntensity: 1.4,
    distance: 9.0,
  },
];

function createZoneBadgeTexture(name, isOccupied) {
  const canvas = document.createElement('canvas');
  canvas.width = 460;
  canvas.height = 110;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, 460, 110);

  // Matte charcoal plaque
  ctx.fillStyle = isOccupied ? 'rgba(24, 24, 27, 0.94)' : 'rgba(24, 24, 27, 0.78)';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(10, 10, 440, 90, 18);
    ctx.fill();
  } else {
    ctx.fillRect(10, 10, 440, 90);
  }

  // Border outline
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = isOccupied ? '#71717a' : '#3f3f46';
  ctx.stroke();

  // Status indicator dot
  ctx.fillStyle = isOccupied ? '#f4f4f5' : '#52525b';
  ctx.beginPath();
  ctx.arc(46, 55, 9, 0, Math.PI * 2);
  ctx.fill();

  // Zone Label
  ctx.fillStyle = isOccupied ? '#fafafa' : '#a1a1aa';
  ctx.font = '600 23px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 72, 55);

  // Status text
  const statusStr = isOccupied ? 'ACTIVE' : 'STANDBY';
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", monospace';
  ctx.fillStyle = isOccupied ? '#d4d4d8' : '#71717a';
  const textWidth = ctx.measureText(statusStr).width;
  ctx.fillText(statusStr, 430 - textWidth, 55);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createSectorPendantFixture(colorHex = 0xffedd5) {
  const group = new THREE.Group();

  // Ceiling mounting canopy rosette
  const canopy = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.04, 16),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3, metalness: 0.8 })
  );
  canopy.position.set(0, 0.48, 0);

  // Suspension cord
  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.46, 8),
    new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4 })
  );
  cord.position.set(0, 0.24, 0);

  // Sculpted matte fixture shade
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.28, 0.22, 24, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.4,
      metalness: 0.6,
      side: THREE.DoubleSide,
    })
  );
  shade.position.set(0, 0.04, 0);

  // Emissive bulb lens
  const bulbMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.2,
    roughness: 0.2,
  });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 14), bulbMat);
  bulb.position.set(0, -0.04, 0);

  group.add(canopy, cord, shade, bulb);
  return { fixtureGroup: group, bulbMat };
}

function createLivingRoomProps() {
  const group = new THREE.Group();

  // L-Shaped Sectional Sofa
  const sofaMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
  const cushionMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.75 });

  // Main sofa base & seat
  const mainBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.28, 0.9), sofaMat);
  mainBase.position.set(2.8, 0.14, 4.4);
  mainBase.castShadow = true;
  mainBase.receiveShadow = true;

  const mainCushion = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.14, 0.82), cushionMat);
  mainCushion.position.set(2.8, 0.35, 4.4);
  mainCushion.castShadow = true;

  const mainBack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.52, 0.22), sofaMat);
  mainBack.position.set(2.8, 0.55, 4.88);
  mainBack.castShadow = true;

  // Chaise section
  const chaiseBase = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.28, 1.3), sofaMat);
  chaiseBase.position.set(1.4, 0.14, 3.45);
  chaiseBase.castShadow = true;

  const chaiseCushion = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.14, 1.25), cushionMat);
  chaiseCushion.position.set(1.4, 0.35, 3.45);
  chaiseCushion.castShadow = true;

  const chaiseSideArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.44, 2.1), sofaMat);
  chaiseSideArm.position.set(0.88, 0.45, 3.9);
  chaiseSideArm.castShadow = true;

  // Textured geometric floor rug
  const rugMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.95 });
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.2), rugMat);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(3.2, 0.012, 3.1);
  rug.receiveShadow = true;

  // Low minimalist coffee table
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.65 });
  const tableLegMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 });
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.7), tableMat);
  tableTop.position.set(3.2, 0.34, 3.1);
  tableTop.castShadow = true;

  [-0.55, 0.55].forEach((tx) => {
    [-0.26, 0.26].forEach((tz) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 8), tableLegMat);
      leg.position.set(3.2 + tx, 0.16, 3.1 + tz);
      leg.castShadow = true;
      group.add(leg);
    });
  });

  // Media Credenza & Television Screen
  const consoleMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.5 });
  const consoleUnit = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.46, 0.42), consoleMat);
  consoleUnit.position.set(3.0, 0.23, 1.25);
  consoleUnit.castShadow = true;

  const tvScreen = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.88, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2, metalness: 0.8 })
  );
  tvScreen.position.set(3.0, 0.98, 1.25);
  tvScreen.castShadow = true;

  // Potted Ficus accent plant
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.18, 0.48, 14),
    new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.6 })
  );
  pot.position.set(5.4, 0.24, 4.6);
  pot.castShadow = true;

  const leaves = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.36, 1),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 })
  );
  leaves.position.set(5.4, 0.72, 4.6);
  leaves.castShadow = true;

  group.add(
    mainBase,
    mainCushion,
    mainBack,
    chaiseBase,
    chaiseCushion,
    chaiseSideArm,
    rug,
    tableTop,
    consoleUnit,
    tvScreen,
    pot,
    leaves
  );
  return group;
}

function createKitchenProps() {
  const group = new THREE.Group();

  const cabinetMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55 });
  const counterMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4, metalness: 0.6 });

  // Main counter run along north wall
  const mainCounterBase = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.88, 0.8), cabinetMat);
  mainCounterBase.position.set(3.4, 0.44, -4.75);
  mainCounterBase.castShadow = true;
  mainCounterBase.receiveShadow = true;

  const mainCounterTop = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.06, 0.86), counterMat);
  mainCounterTop.position.set(3.4, 0.91, -4.75);
  mainCounterTop.castShadow = true;

  // Cabinet door insets
  for (let i = 0; i < 4; i++) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.74, 0.02), trimMat);
    door.position.set(1.6 + i * 1.05, 0.44, -4.34);
    group.add(door);
  }

  // Kitchen Sink & Basin
  const sinkBasin = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.02, 0.48),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 })
  );
  sinkBasin.position.set(2.8, 0.942, -4.75);

  const faucet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.26, 8),
    new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 })
  );
  faucet.position.set(2.8, 1.07, -5.0);
  group.add(sinkBasin, faucet);

  // Modern Tall Refrigerator
  const fridgeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.65, roughness: 0.3 });
  const fridge = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.95, 0.82), fridgeMat);
  fridge.position.set(5.6, 0.975, -4.72);
  fridge.castShadow = true;

  // Dining Table with 4 Chairs
  const diningWood = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.65 });
  const tableBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 1.1), diningWood);
  tableBase.position.set(2.4, 0.72, -2.1);
  tableBase.castShadow = true;

  [-0.7, 0.7].forEach((dx) => {
    [-0.45, 0.45].forEach((dz) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8), cabinetMat);
      leg.position.set(2.4 + dx, 0.35, -2.1 + dz);
      leg.castShadow = true;
      group.add(leg);
    });
  });

  // 4 Dining Chairs around the table
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
  const chairOffsets = [
    [-0.55, -2.7, 0],
    [0.55, -2.7, 0],
    [-0.55, -1.5, Math.PI],
    [0.55, -1.5, Math.PI],
  ];

  chairOffsets.forEach(([cx, cz, rot]) => {
    const chairGroup = new THREE.Group();
    chairGroup.position.set(2.4 + cx, 0, cz);
    chairGroup.rotation.y = rot;

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.38), chairMat);
    seat.position.set(0, 0.44, 0);
    seat.castShadow = true;

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.03), chairMat);
    back.position.set(0, 0.63, -0.18);
    back.castShadow = true;

    [-0.16, 0.16].forEach((lx) => {
      [-0.16, 0.16].forEach((lz) => {
        const cLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.42, 6), cabinetMat);
        cLeg.position.set(lx, 0.21, lz);
        chairGroup.add(cLeg);
      });
    });

    chairGroup.add(seat, back);
    group.add(chairGroup);
  });

  group.add(mainCounterBase, mainCounterTop, fridge, tableBase);
  return group;
}

function createBedroomProps() {
  const group = new THREE.Group();

  const bedFrameMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.75 });
  const mattressMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });
  const duvetMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.8 });
  const pillowMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 });

  // Platform Bed
  const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 2.2), bedFrameMat);
  bedFrame.position.set(-4.0, 0.15, -4.0);
  bedFrame.castShadow = true;

  const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.95, 0.14), bedFrameMat);
  headboard.position.set(-4.0, 0.52, -5.05);
  headboard.castShadow = true;

  const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.24, 2.05), mattressMat);
  mattress.position.set(-4.0, 0.38, -4.05);
  mattress.castShadow = true;

  const duvet = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.08, 1.45), duvetMat);
  duvet.position.set(-4.0, 0.44, -3.7);
  duvet.castShadow = true;

  // Twin sleeping pillows
  [-0.48, 0.48].forEach((px) => {
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.42), pillowMat);
    pillow.position.set(-4.0 + px, 0.47, -4.75);
    pillow.rotation.x = 0.12;
    pillow.castShadow = true;
    group.add(pillow);
  });

  // Nightstands on both sides of the bed
  const standMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.7 });
  [-5.4, -2.6].forEach((nx) => {
    const nightstand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.44, 0.46), standMat);
    nightstand.position.set(nx, 0.22, -4.85);
    nightstand.castShadow = true;

    // Small table lamp
    const lampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.02, 10),
      new THREE.MeshStandardMaterial({ color: 0x71717a })
    );
    lampBase.position.set(nx, 0.45, -4.85);

    const lampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.14, 0.18, 12),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 })
    );
    lampShade.position.set(nx, 0.56, -4.85);

    group.add(nightstand, lampBase, lampShade);
  });

  // Large Bedroom Wardrobe along west wall
  const wardrobeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
  const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.2, 1.8), wardrobeMat);
  wardrobe.position.set(-5.75, 1.1, -1.6);
  wardrobe.castShadow = true;

  // Door crease groove
  const doorGroove = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 2.05, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x0f172a })
  );
  doorGroove.position.set(-5.39, 1.1, -1.6);

  group.add(bedFrame, headboard, mattress, duvet, wardrobe, doorGroove);
  return group;
}

function buildHouseArchitecture() {
  const root = new THREE.Group();

  const WALL_H = 2.4;
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9, // Neutral off-white drywall
    roughness: 0.85,
  });

  // Distinct room floor finishes
  const livingFloorMat = new THREE.MeshStandardMaterial({
    color: 0xc8a882, // Warm honey oak planks
    roughness: 0.65,
  });
  const kitchenTileMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Slate ceramic floor tile
    roughness: 0.45,
    metalness: 0.05,
  });
  const bedroomWoodMat = new THREE.MeshStandardMaterial({
    color: 0xba9c7d, // Soft muted maple wood
    roughness: 0.7,
  });
  const hallwayFloorMat = new THREE.MeshStandardMaterial({
    color: 0xd4c2a7, // Polished architectural oak
    roughness: 0.55,
  });

  // Foundation Subfloor base slab
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(13.2, 0.2, 11.2),
    new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.9 })
  );
  foundation.position.set(0, -0.1, 0);
  foundation.receiveShadow = true;
  root.add(foundation);

  // 1. Living Room Floor Slab (East Wing South)
  const livingFloor = new THREE.Mesh(new THREE.PlaneGeometry(7.0, 4.5), livingFloorMat);
  livingFloor.rotation.x = -Math.PI / 2;
  livingFloor.position.set(2.75, 0.005, 3.0);
  livingFloor.receiveShadow = true;

  // 2. Kitchen Floor Slab (East Wing North)
  const kitchenFloor = new THREE.Mesh(new THREE.PlaneGeometry(7.0, 4.5), kitchenTileMat);
  kitchenFloor.rotation.x = -Math.PI / 2;
  kitchenFloor.position.set(2.75, 0.005, -3.0);
  kitchenFloor.receiveShadow = true;

  // 3. Bedroom Floor Slab (West Wing North)
  const bedroomFloor = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 5.5), bedroomWoodMat);
  bedroomFloor.rotation.x = -Math.PI / 2;
  bedroomFloor.position.set(-4.0, 0.005, -2.5);
  bedroomFloor.receiveShadow = true;

  // 4. Hallway / Entry Floor Slab (West Wing South)
  const hallwayFloor = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 5.0), hallwayFloorMat);
  hallwayFloor.rotation.x = -Math.PI / 2;
  hallwayFloor.position.set(-3.5, 0.005, 2.75);
  hallwayFloor.receiveShadow = true;

  root.add(livingFloor, kitchenFloor, bedroomFloor, hallwayFloor);

  // Exterior Perimeter Walls (Continuous with zero gaps)
  // North Wall
  const northWall = new THREE.Mesh(new THREE.BoxGeometry(12.8, WALL_H, 0.2), wallMat);
  northWall.position.set(0.0, WALL_H / 2, -5.35);
  northWall.castShadow = true;

  // South Wall
  const southWall = new THREE.Mesh(new THREE.BoxGeometry(12.8, WALL_H, 0.2), wallMat);
  southWall.position.set(0.0, WALL_H / 2, 5.35);
  southWall.castShadow = true;

  // West Wall
  const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, WALL_H, 10.9), wallMat);
  westWall.position.set(-6.35, WALL_H / 2, 0);
  westWall.castShadow = true;

  // East Wall
  const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, WALL_H, 10.9), wallMat);
  eastWall.position.set(6.35, WALL_H / 2, 0);
  eastWall.castShadow = true;

  root.add(northWall, southWall, westWall, eastWall);

  // Interior Divider A: Kitchen vs Living Room (Z = 0.75) with Wide Open Archway
  const kvlLeft = new THREE.Mesh(new THREE.BoxGeometry(2.2, WALL_H, 0.2), wallMat);
  kvlLeft.position.set(0.35, WALL_H / 2, 0.75);
  kvlLeft.castShadow = true;

  const kvlRight = new THREE.Mesh(new THREE.BoxGeometry(2.6, WALL_H, 0.2), wallMat);
  kvlRight.position.set(4.95, WALL_H / 2, 0.75);
  kvlRight.castShadow = true;

  const kvlLintel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.2), wallMat);
  kvlLintel.position.set(2.55, WALL_H - 0.25, 0.75);
  kvlLintel.castShadow = true;
  root.add(kvlLeft, kvlRight, kvlLintel);

  // Interior Divider B: Central Hallway Spine Wall (X = -0.75)
  // Wall segment North (flanking kitchen door)
  const spineNorth = new THREE.Mesh(new THREE.BoxGeometry(0.2, WALL_H, 2.4), wallMat);
  spineNorth.position.set(-0.75, WALL_H / 2, -4.15);
  spineNorth.castShadow = true;

  // Open doorway to Kitchen with Lintel
  const spineKitchenLintel = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 1.8), wallMat);
  spineKitchenLintel.position.set(-0.75, WALL_H - 0.25, -2.05);

  // Spine Wall Middle Segment
  const spineMid = new THREE.Mesh(new THREE.BoxGeometry(0.2, WALL_H, 1.6), wallMat);
  spineMid.position.set(-0.75, WALL_H / 2, -0.35);
  spineMid.castShadow = true;

  // Open doorway to Living Room with Lintel
  const spineLivingLintel = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 1.8), wallMat);
  spineLivingLintel.position.set(-0.75, WALL_H - 0.25, 1.35);

  // Spine Wall South Segment
  const spineSouth = new THREE.Mesh(new THREE.BoxGeometry(0.2, WALL_H, 3.1), wallMat);
  spineSouth.position.set(-0.75, WALL_H / 2, 3.8);
  spineSouth.castShadow = true;

  root.add(spineNorth, spineKitchenLintel, spineMid, spineLivingLintel, spineSouth);

  // Interior Divider C: Hallway vs Bedroom Wall (Z = 0.25) with Open Doorway
  const bedWallWest = new THREE.Mesh(new THREE.BoxGeometry(2.4, WALL_H, 0.2), wallMat);
  bedWallWest.position.set(-5.05, WALL_H / 2, 0.25);
  bedWallWest.castShadow = true;

  const bedWallEast = new THREE.Mesh(new THREE.BoxGeometry(1.5, WALL_H, 0.2), wallMat);
  bedWallEast.position.set(-1.6, WALL_H / 2, 0.25);
  bedWallEast.castShadow = true;

  const bedDoorLintel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.2), wallMat);
  bedDoorLintel.position.set(-3.05, WALL_H - 0.25, 0.25);

  root.add(bedWallWest, bedWallEast, bedDoorLintel);

  return root;
}

function createPlayerAvatar() {
  const avatarGroup = new THREE.Group();

  // Floor tracking beacon ring
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.35, 0.42, 32),
    new THREE.MeshBasicMaterial({
      color: 0xf1f5f9,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, 0.03, 0);
  avatarGroup.add(ring);

  // Soft contact ground shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.02, 0);
  avatarGroup.add(shadow);

  // Materials palette
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf3cfb3,
    roughness: 0.7,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.9,
  });
  const jacketMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Clean graphite slate jacket
    roughness: 0.6,
  });
  const shirtMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // Crisp off-white inner tee
    roughness: 0.8,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Tailored dark navy/charcoal trousers
    roughness: 0.75,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Dark sneakers
    roughness: 0.5,
  });
  const soleMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9, // Clean white sneaker soles
    roughness: 0.4,
  });

  // Pelvis / Hips
  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.22), pantsMat);
  hips.position.set(0, 0.82, 0);
  hips.castShadow = true;
  avatarGroup.add(hips);

  // Torso / Outer Jacket
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.44, 0.25), jacketMat);
  torso.position.set(0, 1.11, 0);
  torso.castShadow = true;
  avatarGroup.add(torso);

  // Inner Shirt Lapel V-Neck
  const innerShirt = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.02), shirtMat);
  innerShirt.position.set(0, 1.18, 0.126);
  avatarGroup.add(innerShirt);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.12, 10), skinMat);
  neck.position.set(0, 1.36, 0);
  neck.castShadow = true;
  avatarGroup.add(neck);

  // Stylized Humanoid Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.25, 0.22), skinMat);
  head.position.set(0, 1.51, 0);
  head.castShadow = true;
  avatarGroup.add(head);

  // Sculpted Modern Hair
  const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.25), hairMat);
  hairTop.position.set(0, 1.63, 0.01);
  const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.18, 0.07), hairMat);
  hairBack.position.set(0, 1.54, -0.095);
  avatarGroup.add(hairTop, hairBack);

  // Modern Minimalist Eyewear / Brow line
  const glasses = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.045, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2, metalness: 0.7 })
  );
  glasses.position.set(0, 1.53, 0.11);
  avatarGroup.add(glasses);

  // Left Leg Pivot Group
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.11, 0.8, 0);

  const leftPants = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.68, 0.16), pantsMat);
  leftPants.position.set(0, -0.34, 0);
  leftPants.castShadow = true;

  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.22), shoeMat);
  leftShoe.position.set(0, -0.71, 0.03);
  leftShoe.castShadow = true;

  const leftSole = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.03, 0.23), soleMat);
  leftSole.position.set(0, -0.76, 0.03);

  leftLegPivot.add(leftPants, leftShoe, leftSole);
  avatarGroup.add(leftLegPivot);

  // Right Leg Pivot Group
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.11, 0.8, 0);

  const rightPants = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.68, 0.16), pantsMat);
  rightPants.position.set(0, -0.34, 0);
  rightPants.castShadow = true;

  const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.22), shoeMat);
  rightShoe.position.set(0, -0.71, 0.03);
  rightShoe.castShadow = true;

  const rightSole = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.03, 0.23), soleMat);
  rightSole.position.set(0, -0.76, 0.03);

  rightLegPivot.add(rightPants, rightShoe, rightSole);
  avatarGroup.add(rightLegPivot);

  // Left Arm Pivot Group
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.25, 1.28, 0);

  const leftSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.38, 0.13), jacketMat);
  leftSleeve.position.set(0, -0.19, 0);
  leftSleeve.castShadow = true;

  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.1), skinMat);
  leftHand.position.set(0, -0.42, 0);
  leftHand.castShadow = true;

  leftArmPivot.add(leftSleeve, leftHand);
  avatarGroup.add(leftArmPivot);

  // Right Arm Pivot Group
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.25, 1.28, 0);

  const rightSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.38, 0.13), jacketMat);
  rightSleeve.position.set(0, -0.19, 0);
  rightSleeve.castShadow = true;

  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.1), skinMat);
  rightHand.position.set(0, -0.42, 0);
  rightHand.castShadow = true;

  rightArmPivot.add(rightSleeve, rightHand);
  avatarGroup.add(rightArmPivot);

  // Soft personal light
  const personalLight = new THREE.PointLight(0xfff7ed, 0.5, 2.5, 2);
  personalLight.position.set(0, 1.2, 0.2);
  avatarGroup.add(personalLight);

  return {
    avatarGroup,
    ring,
    leftLegPivot,
    rightLegPivot,
    leftArmPivot,
    rightArmPivot,
    torso,
  };
}

export function HouseScene() {
  const containerRef = useRef(null);
  const houseZones = useZoneStore((state) => state.houseZones);
  const [currentZoneName, setCurrentZoneName] = useState('Central Hallway');

  const keysPressed = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  const runtimeRef = useRef({
    lights: {},
    bulbs: {},
    badges: {},
    hitboxes: [],
    player: null,
    scene: null,
    camera: null,
    renderer: null,
    clickTarget: null,
  });

  const handleVirtualKey = (dir, isDown) => {
    if (keysPressed.current[dir] !== undefined) {
      keysPressed.current[dir] = isDown;
      if (isDown) runtimeRef.current.clickTarget = null;
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);

    // Perspective Camera framing the full single-family house layout comfortably
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      120
    );
    camera.position.set(0, 16.5, 14.5);
    camera.lookAt(0, 0.5, 0.5);

    // Ambient / Hemisphere fill light (unoccupied rooms stay dimly visible in soft gray)
    const hemiLight = new THREE.HemisphereLight(0xf1f5f9, 0x090d16, 0.42);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.52);
    sunLight.position.set(10, 20, 12);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0002;
    scene.add(sunLight);

    // Architectural Shell & Partition Walls
    const architecture = buildHouseArchitecture();
    scene.add(architecture);

    // Furniture Props
    const livingProps = createLivingRoomProps();
    const kitchenProps = createKitchenProps();
    const bedroomProps = createBedroomProps();
    scene.add(livingProps, kitchenProps, bedroomProps);

    const lightsMap = {};
    const bulbsMap = {};
    const badgesMap = {};
    const hitboxes = [];

    const initialStore = useZoneStore.getState().houseZones;

    HOUSE_ZONES.forEach((z) => {
      const isOcc = initialStore[z.id]?.isOccupied || false;

      // Real 3D pendant luminaire fixture
      const { fixtureGroup, bulbMat } = createSectorPendantFixture(z.lightColor);
      fixtureGroup.position.set(...z.lightPos);
      scene.add(fixtureGroup);

      // Attached dynamic Three.js PointLight
      const pLight = new THREE.PointLight(
        z.lightColor,
        isOcc ? z.activeIntensity : z.idleIntensity,
        z.distance,
        2.0
      );
      pLight.position.set(z.lightPos[0], z.lightPos[1] - 0.18, z.lightPos[2]);
      pLight.castShadow = true;
      pLight.shadow.bias = -0.0001;
      scene.add(pLight);

      lightsMap[z.id] = { light: pLight, def: z };
      bulbsMap[z.id] = bulbMat;

      // Floating Zone Label Badge
      const badgeGeo = new THREE.PlaneGeometry(2.3, 0.55);
      const initialTex = createZoneBadgeTexture(z.name, isOcc);
      const badgeMat = new THREE.MeshBasicMaterial({
        map: initialTex,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
      badgeMesh.position.set(z.center[0], 2.8, z.center[2]);
      scene.add(badgeMesh);
      badgesMap[z.id] = { mesh: badgeMesh, def: z };

      // Floor Raycast Hitbox
      const width = Math.abs(z.bounds.maxX - z.bounds.minX);
      const depth = Math.abs(z.bounds.maxZ - z.bounds.minZ);
      const hitGeo = new THREE.PlaneGeometry(width, depth);
      const hitMat = new THREE.MeshBasicMaterial({
        color: z.lightColor,
        transparent: true,
        opacity: 0.0,
      });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.rotation.x = -Math.PI / 2;
      hitMesh.position.set(z.center[0], 0.02, z.center[2]);
      hitMesh.userData = { zoneId: z.id };
      scene.add(hitMesh);
      hitboxes.push(hitMesh);
    });

    // Player Capsule Setup (Spawn in Central Hallway)
    const {
      avatarGroup,
      ring,
      leftLegPivot,
      rightLegPivot,
      leftArmPivot,
      rightArmPivot,
      torso,
    } = createPlayerAvatar();
    const spawnPos = new THREE.Vector3(-3.2, 0, 2.5);
    avatarGroup.position.copy(spawnPos);
    scene.add(avatarGroup);

    const playerEntity = {
      group: avatarGroup,
      ring,
      leftLeg: leftLegPivot,
      rightLeg: rightLegPivot,
      leftArm: leftArmPivot,
      rightArm: rightArmPivot,
      torso,
      pos: spawnPos.clone(),
      speed: 4.5,
      rotation: 0,
      walkTimer: 0,
      currentZoneId: 'hallway',
    };

    runtimeRef.current = {
      lights: lightsMap,
      bulbs: bulbsMap,
      badges: badgesMap,
      hitboxes,
      player: playerEntity,
      scene,
      camera,
      renderer,
      clickTarget: null,
    };

    let isDragging = false;
    let isPanning = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let spherical = { radius: 22, theta: 0.0, phi: 0.82 };
    let cameraTarget = new THREE.Vector3(0, 0.4, 0.5);

    const updateCamera = () => {
      spherical.phi = Math.max(0.15, Math.min(Math.PI / 2.05, spherical.phi));
      spherical.radius = Math.max(8, Math.min(38, spherical.radius));

      camera.position.x =
        cameraTarget.x +
        spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y =
        cameraTarget.y + spherical.radius * Math.cos(spherical.phi);
      camera.position.z =
        cameraTarget.z +
        spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(cameraTarget);
    };
    updateCamera();

    const onKeyDown = (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') {
        keysPressed.current.forward = true;
        runtimeRef.current.clickTarget = null;
      }
      if (code === 'KeyS' || code === 'ArrowDown') {
        keysPressed.current.backward = true;
        runtimeRef.current.clickTarget = null;
      }
      if (code === 'KeyA' || code === 'ArrowLeft') {
        keysPressed.current.left = true;
        runtimeRef.current.clickTarget = null;
      }
      if (code === 'KeyD' || code === 'ArrowRight') {
        keysPressed.current.right = true;
        runtimeRef.current.clickTarget = null;
      }
    };

    const onKeyUp = (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') keysPressed.current.forward = false;
      if (code === 'KeyS' || code === 'ArrowDown') keysPressed.current.backward = false;
      if (code === 'KeyA' || code === 'ArrowLeft') keysPressed.current.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') keysPressed.current.right = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e) => {
      if (e.button === 2 || e.shiftKey) {
        isPanning = true;
      } else if (e.button === 0) {
        isDragging = true;
      }
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        spherical.theta -= dx * 0.005;
        spherical.phi -= dy * 0.005;
        updateCamera();
      } else if (isPanning) {
        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
        cameraTarget.addScaledVector(right, -dx * 0.02);
        cameraTarget.addScaledVector(forward, dy * 0.02);
        updateCamera();
      } else {
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(hitboxes);
        if (hits.length > 0) {
          const hoveredId = hits[0].object.userData.zoneId;
          hitboxes.forEach((hb) => {
            hb.material.opacity = hb.userData.zoneId === hoveredId ? 0.08 : 0.0;
          });
        } else {
          hitboxes.forEach((hb) => {
            hb.material.opacity = 0.0;
          });
        }
      }
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerUp = (e) => {
      if (isDragging) {
        const dist = Math.hypot(e.clientX - prevMouseX, e.clientY - prevMouseY);
        if (dist < 5) {
          raycaster.setFromCamera(mouse, camera);
          const hits = raycaster.intersectObjects(hitboxes);
          if (hits.length > 0) {
            const hitPoint = hits[0].point;
            runtimeRef.current.clickTarget = new THREE.Vector3(
              THREE.MathUtils.clamp(hitPoint.x, -5.9, 5.9),
              0,
              THREE.MathUtils.clamp(hitPoint.z, -4.9, 4.9)
            );
          }
        }
      }
      isDragging = false;
      isPanning = false;
    };

    const onWheel = (e) => {
      spherical.radius += e.deltaY * 0.015;
      updateCamera();
    };

    const onContextMenu = (e) => e.preventDefault();

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domEl.addEventListener('wheel', onWheel, { passive: true });
    domEl.addEventListener('contextmenu', onContextMenu);

    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);

      const r = runtimeRef.current;
      const p = r.player;

      if (p) {
        const moveDir = new THREE.Vector3(0, 0, 0);
        if (keysPressed.current.forward) moveDir.z -= 1;
        if (keysPressed.current.backward) moveDir.z += 1;
        if (keysPressed.current.left) moveDir.x -= 1;
        if (keysPressed.current.right) moveDir.x += 1;

        let isMoving = false;

        if (moveDir.lengthSq() > 0) {
          moveDir.normalize();
          p.pos.addScaledVector(moveDir, p.speed * delta);
          isMoving = true;

          const targetAngle = Math.atan2(moveDir.x, moveDir.z);
          p.group.rotation.y = THREE.MathUtils.lerp(
            p.group.rotation.y,
            targetAngle,
            delta * 12
          );
        } else if (r.clickTarget) {
          const diff = new THREE.Vector3().subVectors(r.clickTarget, p.pos);
          diff.y = 0;
          const dist = diff.length();

          if (dist > 0.15) {
            diff.normalize();
            p.pos.addScaledVector(diff, p.speed * delta);
            isMoving = true;

            const targetAngle = Math.atan2(diff.x, diff.z);
            p.group.rotation.y = THREE.MathUtils.lerp(
              p.group.rotation.y,
              targetAngle,
              delta * 12
            );
          } else {
            r.clickTarget = null;
          }
        }

        // Exterior Wall Collision Bounding Clamp
        p.pos.x = THREE.MathUtils.clamp(p.pos.x, -5.95, 5.95);
        p.pos.z = THREE.MathUtils.clamp(p.pos.z, -5.0, 5.0);

        if (isMoving) {
          p.walkTimer += delta * 11;
          const bounce = Math.abs(Math.sin(p.walkTimer)) * 0.04;
          p.group.position.set(p.pos.x, bounce, p.pos.z);

          // Arm and Leg swinging mechanics
          const stride = Math.sin(p.walkTimer) * 0.52;
          p.leftLeg.rotation.x = stride;
          p.rightLeg.rotation.x = -stride;
          p.leftArm.rotation.x = -stride * 0.75;
          p.rightArm.rotation.x = stride * 0.75;

          // Subtle torso sway
          p.torso.rotation.y = Math.sin(p.walkTimer) * 0.06;
        } else {
          p.group.position.set(p.pos.x, 0, p.pos.z);

          // Smoothly relax limbs to standing idle stance
          p.leftLeg.rotation.x = THREE.MathUtils.lerp(p.leftLeg.rotation.x, 0, delta * 10);
          p.rightLeg.rotation.x = THREE.MathUtils.lerp(p.rightLeg.rotation.x, 0, delta * 10);
          p.leftArm.rotation.x = THREE.MathUtils.lerp(p.leftArm.rotation.x, 0, delta * 10);
          p.rightArm.rotation.x = THREE.MathUtils.lerp(p.rightArm.rotation.x, 0, delta * 10);
          p.torso.rotation.y = THREE.MathUtils.lerp(p.torso.rotation.y, 0, delta * 10);
        }

        // Camera smoothly tracks player
        cameraTarget.lerp(new THREE.Vector3(p.pos.x * 0.6, 0.4, p.pos.z * 0.6), delta * 3.5);
        updateCamera();

        // Zone Detection Query
        const px = p.pos.x;
        const pz = p.pos.z;
        let detectedZoneId = null;

        for (const zone of HOUSE_ZONES) {
          if (
            px >= zone.bounds.minX &&
            px <= zone.bounds.maxX &&
            pz >= zone.bounds.minZ &&
            pz <= zone.bounds.maxZ
          ) {
            detectedZoneId = zone.id;
            break;
          }
        }

        // Automatic Lighting: Light up active room, dim former room
        if (detectedZoneId && detectedZoneId !== p.currentZoneId) {
          p.currentZoneId = detectedZoneId;
          const zDef = HOUSE_ZONES.find((z) => z.id === detectedZoneId);
          if (zDef) {
            setCurrentZoneName(zDef.label);
          }
          useZoneStore.getState().setPlayerActiveZone(detectedZoneId);
        }
      }

      // Smooth point light and emissive bulb interpolation
      const liveZones = useZoneStore.getState().houseZones;

      HOUSE_ZONES.forEach((z) => {
        const zoneData = liveZones[z.id];
        const isOcc = zoneData?.isOccupied || false;

        const targetIntensity = isOcc ? z.activeIntensity : z.idleIntensity;
        const targetEmissive = isOcc ? 2.5 : 0.12;

        const lightObj = lightsMap[z.id];
        if (lightObj && lightObj.light) {
          lightObj.light.intensity = THREE.MathUtils.lerp(
            lightObj.light.intensity,
            targetIntensity,
            delta * 7.5
          );
        }

        const bulbMat = bulbsMap[z.id];
        if (bulbMat) {
          bulbMat.emissiveIntensity = THREE.MathUtils.lerp(
            bulbMat.emissiveIntensity,
            targetEmissive,
            delta * 7.5
          );
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('wheel', onWheel);
      domEl.removeEventListener('contextmenu', onContextMenu);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const { badges } = runtimeRef.current;
    if (!badges) return;

    Object.keys(badges).forEach((zoneId) => {
      const zoneData = houseZones[zoneId];
      const badgeItem = badges[zoneId];
      if (badgeItem && badgeItem.mesh && zoneData) {
        const newTexture = createZoneBadgeTexture(
          badgeItem.def.name,
          zoneData.isOccupied
        );
        if (newTexture) {
          const oldMap = badgeItem.mesh.material.map;
          if (oldMap) oldMap.dispose();
          badgeItem.mesh.material.map = newTexture;
          badgeItem.mesh.material.needsUpdate = true;
        }
      }
    });
  }, [houseZones]);

  return (
    <div className="relative w-full h-screen bg-stone-950 text-stone-100 font-sans select-none overflow-hidden">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />

      {/* Top Header Information Bar */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between pointer-events-none gap-3 z-10">
        <div className="bg-stone-900/90 backdrop-blur-md border border-stone-800 px-4 py-2.5 rounded-xl shadow-xl pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-stone-300" />
            <h1 className="text-xs font-semibold tracking-wider text-stone-200 uppercase">
              Single-Family House Interior · Dynamic Lighting
            </h1>
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Walk into any room to illuminate it. Leaving automatically dims it.
          </p>
        </div>

        {/* Current Active Room Indicator */}
        <div className="bg-stone-900/90 backdrop-blur-md border border-stone-800 px-4 py-2 rounded-xl shadow-lg flex items-center gap-3 pointer-events-auto">
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
              Current Zone
            </span>
            <span className="text-xs font-medium text-stone-100">{currentZoneName}</span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-stone-200 shadow-[0_0_6px_rgba(255,255,255,0.4)]" />
        </div>
      </div>

      {/* Live Zone Status Pills */}
      <div className="absolute top-20 left-4 flex flex-wrap gap-1.5 max-w-xl pointer-events-none z-10">
        {Object.values(houseZones).map((zone) => {
          const isOcc = zone.isOccupied;
          return (
            <div
              key={zone.id}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-[11px] font-medium border backdrop-blur-sm transition-all ${
                isOcc
                  ? 'bg-stone-800/95 border-stone-500/80 text-stone-100 shadow-sm'
                  : 'bg-stone-900/70 border-stone-800 text-stone-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  isOcc ? 'bg-stone-200' : 'bg-stone-600'
                }`}
              />
              <span>{zone.name}</span>
            </div>
          );
        })}
      </div>

      {/* On-Screen Mobile / Touch D-Pad */}
      <div className="absolute bottom-6 right-6 pointer-events-auto z-20 flex flex-col items-center gap-1.5 bg-stone-900/85 backdrop-blur-md p-3 rounded-2xl border border-stone-800 shadow-xl">
        <button
          onPointerDown={() => handleVirtualKey('forward', true)}
          onPointerUp={() => handleVirtualKey('forward', false)}
          onPointerLeave={() => handleVirtualKey('forward', false)}
          className="w-11 h-11 rounded-xl bg-stone-800/90 hover:bg-stone-700 active:bg-stone-600 text-stone-200 flex items-center justify-center font-medium text-base shadow-sm border border-stone-700/60 active:scale-95 transition-all"
        >
          ▲
        </button>
        <div className="flex gap-1.5">
          <button
            onPointerDown={() => handleVirtualKey('left', true)}
            onPointerUp={() => handleVirtualKey('left', false)}
            onPointerLeave={() => handleVirtualKey('left', false)}
            className="w-11 h-11 rounded-xl bg-stone-800/90 hover:bg-stone-700 active:bg-stone-600 text-stone-200 flex items-center justify-center font-medium text-base shadow-sm border border-stone-700/60 active:scale-95 transition-all"
          >
            ◀
          </button>
          <button
            onPointerDown={() => handleVirtualKey('backward', true)}
            onPointerUp={() => handleVirtualKey('backward', false)}
            onPointerLeave={() => handleVirtualKey('backward', false)}
            className="w-11 h-11 rounded-xl bg-stone-800/90 hover:bg-stone-700 active:bg-stone-600 text-stone-200 flex items-center justify-center font-medium text-base shadow-sm border border-stone-700/60 active:scale-95 transition-all"
          >
            ▼
          </button>
          <button
            onPointerDown={() => handleVirtualKey('right', true)}
            onPointerUp={() => handleVirtualKey('right', false)}
            onPointerLeave={() => handleVirtualKey('right', false)}
            className="w-11 h-11 rounded-xl bg-stone-800/90 hover:bg-stone-700 active:bg-stone-600 text-stone-200 flex items-center justify-center font-medium text-base shadow-sm border border-stone-700/60 active:scale-95 transition-all"
          >
            ▶
          </button>
        </div>
        <span className="text-[9px] uppercase tracking-wider text-stone-400 font-medium mt-0.5">
          Move Player
        </span>
      </div>

      {/* Bottom Navigation Legend */}
      <div className="absolute bottom-4 left-4 bg-stone-900/85 backdrop-blur-md border border-stone-800/90 px-3.5 py-2 rounded-lg text-[11px] text-stone-400 pointer-events-none shadow-md flex flex-wrap items-center gap-3">
        <span>
          <strong className="text-stone-200 font-medium">WASD / Arrow Keys:</strong> Move Avatar
        </span>
        <span>•</span>
        <span>
          <strong className="text-stone-300 font-normal">Click Floor:</strong> Walk to Point
        </span>
        <span>•</span>
        <span>
          <strong className="text-stone-300 font-normal">Drag:</strong> Orbit / Pan
        </span>
        <span>•</span>
        <span>
          <strong className="text-stone-300 font-normal">Scroll:</strong> Zoom
        </span>
      </div>
    </div>
  );
}

export default function App() {
  return <HouseScene />;
}