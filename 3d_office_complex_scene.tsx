import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { create } from 'zustand';

/**
 * Global Zustand Zone Store extended with an isolated namespaced slice:
 * 'officeComplexZones' guarantees zero collision with existing scenes.
 */
export const useZoneStore = create((set, get) => ({
  // Dedicated slice for the larger Office Complex
  officeComplexZones: {
    'workstations': {
      id: 'workstations',
      name: 'Workstation Cluster',
      type: 'room',
      isOccupied: false,
      manualOverride: false,
      color: 0x94a3b8,
      accentHex: '#cbd5e1',
    },
    'meeting-alpha': {
      id: 'meeting-alpha',
      name: 'Meeting Room Alpha',
      type: 'room',
      isOccupied: false,
      manualOverride: false,
      color: 0x94a3b8,
      accentHex: '#e2e8f0',
    },
    'meeting-beta': {
      id: 'meeting-beta',
      name: 'Meeting Room Beta',
      type: 'room',
      isOccupied: false,
      manualOverride: false,
      color: 0x94a3b8,
      accentHex: '#e2e8f0',
    },
    'reception': {
      id: 'reception',
      name: 'Reception & Lobby',
      type: 'room',
      isOccupied: true, // Player spawns here
      manualOverride: false,
      color: 0x94a3b8,
      accentHex: '#f1f5f9',
    },
    'break-room': {
      id: 'break-room',
      name: 'Break Room & Pantry',
      type: 'room',
      isOccupied: false,
      manualOverride: false,
      color: 0x94a3b8,
      accentHex: '#cbd5e1',
    },
    'corridor-north': {
      id: 'corridor-north',
      name: 'Corridor North',
      type: 'corridor',
      isOccupied: false,
      manualOverride: false,
      color: 0x64748b,
      accentHex: '#94a3b8',
    },
    'corridor-south': {
      id: 'corridor-south',
      name: 'Corridor South',
      type: 'corridor',
      isOccupied: false,
      manualOverride: false,
      color: 0x64748b,
      accentHex: '#94a3b8',
    },
  },

  // Atomic action: automatically activate only the player's current room and shut down the rest
  setPlayerActiveZone: (activeZoneId) =>
    set((state) => {
      let hasChange = false;
      const updated = { ...state.officeComplexZones };
      Object.keys(updated).forEach((id) => {
        const shouldBeOccupied = id === activeZoneId;
        if (updated[id].isOccupied !== shouldBeOccupied) {
          updated[id] = { ...updated[id], isOccupied: shouldBeOccupied };
          hasChange = true;
        }
      });
      return hasChange ? { officeComplexZones: updated } : state;
    }),
}));

export const COMPLEX_ZONES = [
  {
    id: 'workstations',
    name: 'Workstations',
    type: 'room',
    bounds: { minX: -10.8, maxX: -2.2, minZ: -7.8, maxZ: -0.8 },
    center: [-6.5, 0, -4.3],
    lightPos: [-6.5, 2.7, -4.3],
    lightColor: 0xfff8ee, // Neutral warm 3200K
    activeIntensity: 26,
    idleIntensity: 1.8,
    distance: 12.0,
  },
  {
    id: 'break-room',
    name: 'Pantry / Break Room',
    type: 'room',
    bounds: { minX: -10.8, maxX: -2.2, minZ: 0.8, maxZ: 7.8 },
    center: [-6.5, 0, 4.3],
    lightPos: [-6.5, 2.7, 4.3],
    lightColor: 0xfff6ea, // Soft natural warm light
    activeIntensity: 24,
    idleIntensity: 1.8,
    distance: 11.5,
  },
  {
    id: 'meeting-alpha',
    name: 'Meeting Alpha',
    type: 'room',
    bounds: { minX: 2.2, maxX: 10.8, minZ: -7.8, maxZ: -2.8 },
    center: [6.5, 0, -5.3],
    lightPos: [6.5, 2.7, -5.3],
    lightColor: 0xfafafa, // Balanced architectural 3500K
    activeIntensity: 24,
    idleIntensity: 1.5,
    distance: 11.0,
  },
  {
    id: 'meeting-beta',
    name: 'Meeting Beta',
    type: 'room',
    bounds: { minX: 2.2, maxX: 10.8, minZ: -2.4, maxZ: 2.4 },
    center: [6.5, 0, 0.0],
    lightPos: [6.5, 2.7, 0.0],
    lightColor: 0xfafafa,
    activeIntensity: 24,
    idleIntensity: 1.5,
    distance: 11.0,
  },
  {
    id: 'reception',
    name: 'Reception & Lobby',
    type: 'room',
    bounds: { minX: 2.2, maxX: 10.8, minZ: 2.8, maxZ: 7.8 },
    center: [6.5, 0, 5.3],
    lightPos: [6.5, 2.7, 5.3],
    lightColor: 0xfff3e0, // Inviting soft warm tungsten
    activeIntensity: 25,
    idleIntensity: 2.0,
    distance: 11.5,
  },
  {
    id: 'corridor-north',
    name: 'Corridor North',
    type: 'corridor',
    bounds: { minX: -2.0, maxX: 2.0, minZ: -7.8, maxZ: 0.0 },
    center: [0.0, 0, -3.9],
    lightPos: [0.0, 2.7, -3.9],
    lightColor: 0xf1f5f9,
    activeIntensity: 20,
    idleIntensity: 1.2,
    distance: 8.5,
  },
  {
    id: 'corridor-south',
    name: 'Corridor South',
    type: 'corridor',
    bounds: { minX: -2.0, maxX: 2.0, minZ: 0.0, maxZ: 7.8 },
    center: [0.0, 0, 3.9],
    lightPos: [0.0, 2.7, 3.9],
    lightColor: 0xf1f5f9,
    activeIntensity: 20,
    idleIntensity: 1.2,
    distance: 8.5,
  },
];

function createPlayerMesh() {
  const playerGroup = new THREE.Group();

  // Subtle floor beacon ring under the player (neutral slate/white)
  const ringGeo = new THREE.RingGeometry(0.36, 0.44, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xe2e8f0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.4,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, 0.03, 0);
  playerGroup.add(ring);

  // Soft shadow disc
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.35, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.02, 0);
  playerGroup.add(shadow);

  // Player Body (Modern charcoal / graphite attire)
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.28, 0.76, 16),
    new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.1,
    })
  );
  body.position.set(0, 0.68, 0);
  body.castShadow = true;
  playerGroup.add(body);

  // Belt / Accent Stripe (Muted zinc)
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.285, 0.285, 0.1, 16),
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4 })
  );
  belt.position.set(0, 0.52, 0);
  playerGroup.add(belt);

  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xf1ebe1, roughness: 0.6 })
  );
  head.position.set(0, 1.25, 0);
  head.castShadow = true;
  playerGroup.add(head);

  // Visor / Directional Indicator (Understated slate)
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.09, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 })
  );
  visor.position.set(0, 1.26, 0.17);
  playerGroup.add(visor);

  // Personal subtle illumination in warm neutral light
  const pLight = new THREE.PointLight(0xfff7ed, 1.2, 3.5, 2);
  pLight.position.set(0, 1.1, 0.2);
  playerGroup.add(pLight);

  return { playerGroup, ringMesh: ring };
}

function createZoneCanvasTexture(name, isOccupied, accentHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 120;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, 512, 120);

  // Background rounded pill - understated deep charcoal
  ctx.fillStyle = isOccupied ? 'rgba(24, 24, 27, 0.95)' : 'rgba(24, 24, 27, 0.85)';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(16, 12, 480, 96, 24);
    ctx.fill();
  } else {
    ctx.fillRect(16, 12, 480, 96);
  }

  // Border outline - muted stone / zinc
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = isOccupied ? '#71717a' : '#3f3f46';
  ctx.stroke();

  // Status indicator dot - warm ivory when active, dark zinc when idle
  ctx.fillStyle = isOccupied ? '#f4f4f5' : '#52525b';
  ctx.beginPath();
  ctx.arc(52, 60, 9, 0, Math.PI * 2);
  ctx.fill();

  // Zone Name label
  ctx.fillStyle = isOccupied ? '#fafafa' : '#a1a1aa';
  ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 78, 60);

  // Occupancy text - clean architectural typography
  const statusStr = isOccupied ? 'ACTIVE' : 'IDLE';
  ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
  ctx.fillStyle = isOccupied ? '#d4d4d8' : '#71717a';
  const textWidth = ctx.measureText(statusStr).width;
  ctx.fillText(statusStr, 475 - textWidth, 60);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createPhysicalSectorLight(colorHex) {
  const fixtureGroup = new THREE.Group();

  // Ceiling mounting box
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.05, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.8 })
  );
  canopy.position.set(0, 0.3, 0);

  // Twin suspension drop rods
  const rod1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.35, 8),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 })
  );
  rod1.position.set(-0.25, 0.12, 0);

  const rod2 = rod1.clone();
  rod2.position.set(0.25, 0.12, 0);

  // Linear luminaire body
  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.1, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.8 })
  );
  housing.position.set(0, -0.05, 0);

  // Frosted high-emissive diffuser lens
  const lensMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 1.8,
    roughness: 0.15,
  });
  const lens = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.02, 0.18), lensMat);
  lens.position.set(0, -0.11, 0);

  fixtureGroup.add(canopy, rod1, rod2, housing, lens);
  return { fixtureGroup, lensMat };
}

function createDeskCluster() {
  const group = new THREE.Group();

  const deskMat = new THREE.MeshStandardMaterial({ color: 0xebd5bd, roughness: 0.55 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
  const partitionMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });

  // 4 Desks in dual face-to-face pod
  const positions = [
    [-1.0, -0.65],
    [1.0, -0.65],
    [-1.0, 0.65],
    [1.0, 0.65],
  ];

  positions.forEach(([dx, dz]) => {
    // Desk surface
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.8), deskMat);
    top.position.set(dx, 0.73, dz);
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    // Steel leg frames
    [-0.7, 0.7].forEach((lx) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.72, 0.74), steelMat);
      leg.position.set(dx + lx, 0.36, dz);
      leg.castShadow = true;
      group.add(leg);
    });

    // Dual Monitor
    const screenRot = dz < 0 ? 0 : Math.PI;
    const monitorGroup = new THREE.Group();
    monitorGroup.position.set(dx, 0.755, dz + (dz < 0 ? -0.2 : 0.2));
    monitorGroup.rotation.y = screenRot;

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.015, 0.16), steelMat);
    base.position.set(0, 0.01, 0);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.26, 0.03), steelMat);
    post.position.set(0, 0.14, 0);
    const screenFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.38, 0.025),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    screenFrame.position.set(0, 0.25, 0);
    const screenGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(0.68, 0.34),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2 })
    );
    screenGlass.position.set(0, 0.25, 0.014);

    monitorGroup.add(base, post, screenFrame, screenGlass);
    group.add(monitorGroup);

    // Ergonomic Chair
    const chairGroup = new THREE.Group();
    const chairOffsetZ = dz < 0 ? 0.65 : -0.65;
    chairGroup.position.set(dx, 0, dz + chairOffsetZ);
    chairGroup.rotation.y = dz < 0 ? Math.PI : 0;

    const cBase = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 6), steelMat);
    cBase.position.set(0, 0.05, 0);
    const cPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.36, 8), steelMat);
    cPole.position.set(0, 0.23, 0);
    const cSeat = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.07, 0.44),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
    );
    cSeat.position.set(0, 0.43, 0);
    cSeat.castShadow = true;
    const cBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.48, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    cBack.position.set(0, 0.68, -0.18);
    cBack.castShadow = true;

    chairGroup.add(cBase, cPole, cSeat, cBack);
    group.add(chairGroup);
  });

  // Acoustic center partition
  const divider = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.48, 0.05), partitionMat);
  divider.position.set(0, 0.95, 0);
  divider.castShadow = true;
  group.add(divider);

  return group;
}

function createConferenceSuite(radius = 1.3, chairCount = 6) {
  const group = new THREE.Group();

  // Conference Table Base
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.6, 0.06, 24),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
  );
  plinth.position.set(0, 0.03, 0);

  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.18, 0.64, 20),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 })
  );
  column.position.set(0, 0.36, 0);

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.06, 32),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 })
  );
  top.position.set(0, 0.72, 0);
  top.castShadow = true;
  top.receiveShadow = true;

  const inset = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.35, radius * 0.35, 0.015, 24),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
  );
  inset.position.set(0, 0.755, 0);

  group.add(plinth, column, top, inset);

  // Radial Chairs
  for (let i = 0; i < chairCount; i++) {
    const angle = (i / chairCount) * Math.PI * 2;
    const chairDist = radius + 0.45;
    const chair = new THREE.Group();
    chair.position.set(Math.sin(angle) * chairDist, 0, Math.cos(angle) * chairDist);
    chair.rotation.y = angle + Math.PI;

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.04, 5),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
    );
    base.position.set(0, 0.05, 0);
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.34, 8),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 })
    );
    post.position.set(0, 0.22, 0);
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.06, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
    );
    seat.position.set(0, 0.41, 0);
    seat.castShadow = true;
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.45, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 })
    );
    back.position.set(0, 0.65, -0.18);
    back.castShadow = true;

    chair.add(base, post, seat, back);
    group.add(chair);
  }

  return group;
}

function createReceptionDesk() {
  const group = new THREE.Group();

  // Curved / segmented front reception counter - subtle charcoal & warm oak ledge
  const counterMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
  const ledgeMat = new THREE.MeshStandardMaterial({ color: 0xb59e84, roughness: 0.45 });

  const counterBase = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.1, 0.8), counterMat);
  counterBase.position.set(0, 0.55, 0);
  counterBase.castShadow = true;

  const transactionLedge = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.06, 0.4), ledgeMat);
  transactionLedge.position.set(0, 1.13, 0.22);
  transactionLedge.castShadow = true;

  const interiorDesk = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.05, 0.6),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 })
  );
  interiorDesk.position.set(0, 0.75, -0.3);

  // Monitor
  const pc = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.38, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x1e293b })
  );
  pc.position.set(0, 0.98, -0.3);

  // Receptionist chair
  const chair = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.7, 0.46),
    new THREE.MeshStandardMaterial({ color: 0x334155 })
  );
  chair.position.set(0, 0.38, -0.9);

  group.add(counterBase, transactionLedge, interiorDesk, pc, chair);
  return group;
}

function createLoungeArea() {
  const group = new THREE.Group();

  const sofaMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const cushionMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 });

  // Modern low 2-seater sofa
  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 0.8), sofaMat);
  seatBase.position.set(0, 0.22, 0);
  seatBase.castShadow = true;

  const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.7), cushionMat);
  seatCushion.position.set(0, 0.4, 0);

  const backRest = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.2), sofaMat);
  backRest.position.set(0, 0.6, 0.32);
  backRest.castShadow = true;

  // Coffee Table
  const table = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.32, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xd4b996, roughness: 0.5 })
  );
  table.position.set(0, 0.16, -0.75);
  table.castShadow = true;

  group.add(seatBase, seatCushion, backRest, table);
  return group;
}

function createBreakRoomFurniture() {
  const group = new THREE.Group();

  // Pantry Counter with sink & coffee bar
  const counterBase = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.9, 0.85),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
  );
  counterBase.position.set(0, 0.45, -2.5);
  counterBase.castShadow = true;

  const counterTop = new THREE.Mesh(
    new THREE.BoxGeometry(4.3, 0.06, 0.9),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
  );
  counterTop.position.set(0, 0.92, -2.5);
  counterTop.castShadow = true;

  // Espresso Machine
  const espresso = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.45, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
  );
  espresso.position.set(-1.2, 1.18, -2.5);

  // Tall Refrigerator
  const fridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 1.9, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 })
  );
  fridge.position.set(2.4, 0.95, -2.5);
  fridge.castShadow = true;

  // Communal Dining Table & Benches
  const diningTable = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.74, 1.0),
    new THREE.MeshStandardMaterial({ color: 0xc8a882, roughness: 0.6 })
  );
  diningTable.position.set(0, 0.37, 0.8);
  diningTable.castShadow = true;

  [-0.8, 0.8].forEach((bz) => {
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.44, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
    );
    bench.position.set(0, 0.22, 0.8 + bz);
    bench.castShadow = true;
    group.add(bench);
  });

  group.add(counterBase, counterTop, espresso, fridge, diningTable);
  return group;
}

function createPottedFicus() {
  const group = new THREE.Group();

  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.2, 0.65, 16),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 })
  );
  pot.position.set(0, 0.325, 0);
  pot.castShadow = true;

  const plant1 = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 })
  );
  plant1.position.set(0, 0.95, 0);
  plant1.castShadow = true;

  const plant2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 7, 7),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 })
  );
  plant2.position.set(0.12, 1.25, -0.06);

  group.add(pot, plant1, plant2);
  return group;
}

function buildComplexArchitecture() {
  const root = new THREE.Group();

  const WALL_H = 2.4;
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.85 });
  const corridorFloorMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Dark slate to clearly distinguish corridor zone from rooms
    roughness: 0.5,
    metalness: 0.1,
  });
  const roomFloorOak = new THREE.MeshStandardMaterial({
    color: 0xd6c2a8, // Warm Scandinavian oak
    roughness: 0.65,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.35,
    roughness: 0.05,
    metalness: 0.2,
  });
  const metalTrimMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.3,
    metalness: 0.85,
  });

  // Continuous Base Foundation (no gaps)
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(22.6, 0.2, 16.6),
    new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.9 })
  );
  foundation.position.set(0, -0.1, 0);
  foundation.receiveShadow = true;
  root.add(foundation);

  // Central Corridor Floor Slab
  const corridorFloor = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 16.0), corridorFloorMat);
  corridorFloor.rotation.x = -Math.PI / 2;
  corridorFloor.position.set(0, 0.005, 0);
  corridorFloor.receiveShadow = true;
  root.add(corridorFloor);

  // West Wing Floor Slab (Workstations & Break Room)
  const westFloor = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 16.0), roomFloorOak);
  westFloor.rotation.x = -Math.PI / 2;
  westFloor.position.set(-6.5, 0.005, 0);
  westFloor.receiveShadow = true;
  root.add(westFloor);

  // East Wing Floor Slab (Meeting Rooms & Reception)
  const eastFloor = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 16.0), roomFloorOak);
  eastFloor.rotation.x = -Math.PI / 2;
  eastFloor.position.set(6.5, 0.005, 0);
  eastFloor.receiveShadow = true;
  root.add(eastFloor);

  // Perimeter Exterior Walls
  const northWall = new THREE.Mesh(new THREE.BoxGeometry(22.2, WALL_H, 0.2), wallMat);
  northWall.position.set(0, WALL_H / 2, -8.0);
  northWall.castShadow = true;

  const southWall = new THREE.Mesh(new THREE.BoxGeometry(22.2, WALL_H, 0.2), wallMat);
  southWall.position.set(0, WALL_H / 2, 8.0);
  southWall.castShadow = true;

  const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, WALL_H, 16.2), wallMat);
  westWall.position.set(-11.0, WALL_H / 2, 0);
  westWall.castShadow = true;

  const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, WALL_H, 16.2), wallMat);
  eastWall.position.set(11.0, WALL_H / 2, 0);
  eastWall.castShadow = true;

  root.add(northWall, southWall, westWall, eastWall);

  // Interior Divider 1: Workstation Cluster vs Break Room
  const westDivider = new THREE.Mesh(new THREE.BoxGeometry(8.8, WALL_H, 0.2), wallMat);
  westDivider.position.set(-6.5, WALL_H / 2, 0);
  westDivider.castShadow = true;
  root.add(westDivider);

  // West Wing Corridor Boundary Wall with Door Openings
  const westCorrWallN = new THREE.Mesh(new THREE.BoxGeometry(0.2, WALL_H, 5.0), wallMat);
  westCorrWallN.position.set(-2.0, WALL_H / 2, -5.5);

  const westCorrLintelN = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 1.8), wallMat);
  westCorrLintelN.position.set(-2.0, WALL_H - 0.25, -2.1);

  const westCorrMid = new THREE.Mesh(new THREE.BoxGeometry(0.2, WALL_H, 2.4), wallMat);
  westCorrMid.position.set(-2.0, WALL_H / 2, 0);

  const westCorrLintelS = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 1.8), wallMat);
  westCorrLintelS.position.set(-2.0, WALL_H - 0.25, 2.1);

  const westCorrWallS = new THREE.Mesh(new THREE.BoxGeometry(0.2, WALL_H, 5.0), wallMat);
  westCorrWallS.position.set(-2.0, WALL_H / 2, 5.5);

  root.add(westCorrWallN, westCorrLintelN, westCorrMid, westCorrLintelS, westCorrWallS);

  // East Wing: Meeting Alpha & Beta Glass Partitions with Doorways
  // Solid dividers between rooms
  const eastDivider1 = new THREE.Mesh(new THREE.BoxGeometry(8.8, WALL_H, 0.2), wallMat);
  eastDivider1.position.set(6.5, WALL_H / 2, -2.6);

  const eastDivider2 = new THREE.Mesh(new THREE.BoxGeometry(8.8, WALL_H, 0.2), wallMat);
  eastDivider2.position.set(6.5, WALL_H / 2, 2.6);

  root.add(eastDivider1, eastDivider2);

  // Corridor Facing Glass Partition for Meeting Alpha
  const glassAlpha = new THREE.Mesh(new THREE.BoxGeometry(0.04, WALL_H - 0.3, 3.4), glassMat);
  glassAlpha.position.set(2.0, WALL_H / 2 - 0.1, -6.1);
  const mullionAlpha1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, WALL_H, 0.08), metalTrimMat);
  mullionAlpha1.position.set(2.0, WALL_H / 2, -7.8);
  const mullionAlpha2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, WALL_H, 0.08), metalTrimMat);
  mullionAlpha2.position.set(2.0, WALL_H / 2, -4.4);
  const lintelAlpha = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 1.6), wallMat);
  lintelAlpha.position.set(2.0, WALL_H - 0.25, -3.6);

  // Corridor Facing Glass Partition for Meeting Beta
  const glassBeta = new THREE.Mesh(new THREE.BoxGeometry(0.04, WALL_H - 0.3, 3.4), glassMat);
  glassBeta.position.set(2.0, WALL_H / 2 - 0.1, 0.0);
  const mullionBeta1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, WALL_H, 0.08), metalTrimMat);
  mullionBeta1.position.set(2.0, WALL_H / 2, -1.7);
  const mullionBeta2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, WALL_H, 0.08), metalTrimMat);
  mullionBeta2.position.set(2.0, WALL_H / 2, 1.7);
  const lintelBeta = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 1.4), wallMat);
  lintelBeta.position.set(2.0, WALL_H - 0.25, -2.0);

  // Reception Lobby Wide Portal Entrance
  const recepWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, WALL_H, 2.0), wallMat);
  recepWall.position.set(2.0, WALL_H / 2, 7.0);
  const recepLintel = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 3.2), wallMat);
  recepLintel.position.set(2.0, WALL_H - 0.25, 4.4);

  root.add(
    glassAlpha,
    mullionAlpha1,
    mullionAlpha2,
    lintelAlpha,
    glassBeta,
    mullionBeta1,
    mullionBeta2,
    lintelBeta,
    recepWall,
    recepLintel
  );

  return root;
}

export default function App() {
  const containerRef = useRef(null);
  const zones = useZoneStore((state) => state.officeComplexZones);
  const [currentZoneName, setCurrentZoneName] = useState('Reception & Lobby');
  const [activeHoverId, setActiveHoverId] = useState(null);

  // Key tracking state ref for zero-latency 60fps input response
  const keysPressed = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  // Mutable runtime references to bypass React overhead in the Three.js tick loop
  const runtimeRef = useRef({
    lights: {},
    lenses: {},
    badges: {},
    hitboxes: [],
    player: null,
    scene: null,
    camera: null,
    renderer: null,
    clickTarget: null,
  });

  // Mobile / UI on-screen button press helper
  const handleVirtualKey = (dir, isDown) => {
    if (keysPressed.current[dir] !== undefined) {
      keysPressed.current[dir] = isDown;
      // Reset click target when user manually presses directions
      if (isDown) runtimeRef.current.clickTarget = null;
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // 2. Three.js Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);

    // 3. Perspective Camera
    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / container.clientHeight,
      0.1,
      120
    );
    camera.position.set(6.5, 18, 16);
    camera.lookAt(6.5, 0, 5.0);

    // 4. Ambient & Hemisphere Illumination
    const hemiLight = new THREE.HemisphereLight(0xf8fafc, 0x090d16, 0.38);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.48);
    sunLight.position.set(14, 26, 12);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0002;
    scene.add(sunLight);

    // 5. Build Architecture
    const architecture = buildComplexArchitecture();
    scene.add(architecture);

    // Props Setup (Workstations, Break Room, Meetings, Reception)
    const pod1 = createDeskCluster();
    pod1.position.set(-6.5, 0, -5.5);
    const pod2 = createDeskCluster();
    pod2.position.set(-6.5, 0, -2.0);
    const ficusW1 = createPottedFicus();
    ficusW1.position.set(-10.2, 0, -7.2);
    scene.add(pod1, pod2, ficusW1);

    const breakFurniture = createBreakRoomFurniture();
    breakFurniture.position.set(-6.5, 0, 4.3);
    const ficusB = createPottedFicus();
    ficusB.position.set(-10.2, 0, 7.2);
    scene.add(breakFurniture, ficusB);

    const meetingAlpha = createConferenceSuite(1.3, 6);
    meetingAlpha.position.set(6.5, 0, -5.3);
    scene.add(meetingAlpha);

    const meetingBeta = createConferenceSuite(1.1, 5);
    meetingBeta.position.set(6.5, 0, 0.0);
    scene.add(meetingBeta);

    const receptionDesk = createReceptionDesk();
    receptionDesk.position.set(6.5, 0, 4.0);
    const lounge = createLoungeArea();
    lounge.position.set(6.5, 0, 6.8);
    const ficusR1 = createPottedFicus();
    ficusR1.position.set(10.2, 0, 7.2);
    scene.add(receptionDesk, lounge, ficusR1);

    const lightsMap = {};
    const lensesMap = {};
    const badgesMap = {};
    const hitboxes = [];

    const initialStoreZones = useZoneStore.getState().officeComplexZones;

    COMPLEX_ZONES.forEach((z) => {
      const isOccupied = initialStoreZones[z.id]?.isOccupied || false;

      // SectorLight physical fixture
      const { fixtureGroup, lensMat } = createPhysicalSectorLight(z.lightColor);
      fixtureGroup.position.set(...z.lightPos);
      scene.add(fixtureGroup);

      // PointLight with smooth decay
      const pLight = new THREE.PointLight(
        z.lightColor,
        isOccupied ? z.activeIntensity : z.idleIntensity,
        z.distance,
        2.0
      );
      pLight.position.set(z.lightPos[0], z.lightPos[1] - 0.2, z.lightPos[2]);
      pLight.castShadow = true;
      pLight.shadow.bias = -0.0001;
      scene.add(pLight);

      lightsMap[z.id] = { light: pLight, def: z };
      lensesMap[z.id] = lensMat;

      // Floating Zone Status Badge Billboard
      const badgeGeo = new THREE.PlaneGeometry(2.4, 0.56);
      const initialTexture = createZoneCanvasTexture(
        z.name,
        isOccupied,
        initialStoreZones[z.id]?.accentHex || '#38bdf8'
      );
      const badgeMat = new THREE.MeshBasicMaterial({
        map: initialTexture,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
      badgeMesh.position.set(z.center[0], 2.85, z.center[2]);
      scene.add(badgeMesh);
      badgesMap[z.id] = { mesh: badgeMesh, def: z };

      // Raycast Hitbox for Floor
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

    const { playerGroup, ringMesh } = createPlayerMesh();
    // Start player inside Reception Lobby
    const startX = 6.5;
    const startZ = 5.2;
    playerGroup.position.set(startX, 0, startZ);
    scene.add(playerGroup);

    const playerState = {
      group: playerGroup,
      ringMesh,
      pos: new THREE.Vector3(startX, 0, startZ),
      speed: 4.8,
      rotation: 0,
      walkTimer: 0,
      currentZoneId: 'reception',
    };

    runtimeRef.current = {
      lights: lightsMap,
      lenses: lensesMap,
      badges: badgesMap,
      hitboxes,
      player: playerState,
      scene,
      camera,
      renderer,
      clickTarget: null,
    };

    let isDragging = false;
    let isPanning = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let spherical = { radius: 25, theta: 0.1, phi: 0.78 };
    let cameraTarget = new THREE.Vector3(startX, 0.5, startZ);

    const updateCamera = () => {
      spherical.phi = Math.max(0.15, Math.min(Math.PI / 2.05, spherical.phi));
      spherical.radius = Math.max(8, Math.min(48, spherical.radius));

      camera.position.x =
        cameraTarget.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = cameraTarget.y + spherical.radius * Math.cos(spherical.phi);
      camera.position.z =
        cameraTarget.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(cameraTarget);
    };
    updateCamera();

    // Keyboard handlers
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
        // Floor hover highlighting
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(hitboxes);
        if (hits.length > 0) {
          const hoveredId = hits[0].object.userData.zoneId;
          setActiveHoverId(hoveredId);
          hitboxes.forEach((hb) => {
            hb.material.opacity = hb.userData.zoneId === hoveredId ? 0.08 : 0.0;
          });
        } else {
          setActiveHoverId(null);
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
        // Short click = set move target for player
        if (dist < 5) {
          raycaster.setFromCamera(mouse, camera);
          const hits = raycaster.intersectObjects(hitboxes);
          if (hits.length > 0) {
            const hitPoint = hits[0].point;
            runtimeRef.current.clickTarget = new THREE.Vector3(
              THREE.MathUtils.clamp(hitPoint.x, -10.5, 10.5),
              0,
              THREE.MathUtils.clamp(hitPoint.z, -7.5, 7.5)
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

      const p = runtimeRef.current.player;
      if (p) {
        // Compute input movement vector
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

          // Rotate facing angle towards movement
          const targetAngle = Math.atan2(moveDir.x, moveDir.z);
          p.group.rotation.y = THREE.MathUtils.lerp(
            p.group.rotation.y,
            targetAngle,
            delta * 12
          );
        } else if (runtimeRef.current.clickTarget) {
          // Move towards clicked destination
          const target = runtimeRef.current.clickTarget;
          const diff = new THREE.Vector3().subVectors(target, p.pos);
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
            runtimeRef.current.clickTarget = null;
          }
        }

        // Clamp inside office boundaries
        p.pos.x = THREE.MathUtils.clamp(p.pos.x, -10.6, 10.6);
        p.pos.z = THREE.MathUtils.clamp(p.pos.z, -7.6, 7.6);

        // Bobbing vertical oscillation when walking
        if (isMoving) {
          p.walkTimer += delta * 12;
          const bob = Math.sin(p.walkTimer) * 0.04;
          p.group.position.set(p.pos.x, p.pos.y + bob, p.pos.z);
        } else {
          p.group.position.set(p.pos.x, p.pos.y, p.pos.z);
        }

        // Pulsing floor indicator ring
        if (p.ringMesh) {
          p.ringMesh.material.opacity = 0.6 + Math.sin(clock.getElapsedTime() * 4) * 0.25;
        }

        // Camera smoothly follows player
        cameraTarget.lerp(p.pos, delta * 3.5);
        updateCamera();

        const px = p.pos.x;
        const pz = p.pos.z;
        let detectedZoneId = null;

        // Check enclosed rooms first (gives priority over corridor threshold)
        const roomsOnly = COMPLEX_ZONES.filter((z) => z.type === 'room');
        for (const room of roomsOnly) {
          if (
            px >= room.bounds.minX - 0.2 &&
            px <= room.bounds.maxX + 0.2 &&
            pz >= room.bounds.minZ - 0.2 &&
            pz <= room.bounds.maxZ + 0.2
          ) {
            detectedZoneId = room.id;
            break;
          }
        }

        // If not in a room, check corridor sectors
        if (!detectedZoneId) {
          const corridors = COMPLEX_ZONES.filter((z) => z.type === 'corridor');
          for (const corr of corridors) {
            if (
              px >= corr.bounds.minX - 0.3 &&
              px <= corr.bounds.maxX + 0.3 &&
              pz >= corr.bounds.minZ - 0.3 &&
              pz <= corr.bounds.maxZ + 0.3
            ) {
              detectedZoneId = corr.id;
              break;
            }
          }
        }

        // If player stepped into a new zone, trigger auto-lighting update
        if (detectedZoneId && detectedZoneId !== p.currentZoneId) {
          p.currentZoneId = detectedZoneId;
          const zoneObj = COMPLEX_ZONES.find((z) => z.id === detectedZoneId);
          if (zoneObj) {
            setCurrentZoneName(zoneObj.name);
          }
          // The entered room lights up; all others shut down automatically!
          useZoneStore.getState().setPlayerActiveZone(detectedZoneId);
        }
      }

      const liveZones = useZoneStore.getState().officeComplexZones;

      COMPLEX_ZONES.forEach((z) => {
        const zoneData = liveZones[z.id];
        const isOcc = zoneData?.isOccupied || false;

        const targetIntensity = isOcc ? z.activeIntensity : z.idleIntensity;
        const targetEmissive = isOcc ? 2.0 : 0.15;

        const lightItem = lightsMap[z.id];
        if (lightItem && lightItem.light) {
          lightItem.light.intensity = THREE.MathUtils.lerp(
            lightItem.light.intensity,
            targetIntensity,
            delta * 6.5
          );
        }

        const lensMat = lensesMap[z.id];
        if (lensMat) {
          lensMat.emissiveIntensity = THREE.MathUtils.lerp(
            lensMat.emissiveIntensity,
            targetEmissive,
            delta * 6.5
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
      const zoneData = zones[zoneId];
      const badgeItem = badges[zoneId];
      if (badgeItem && badgeItem.mesh && zoneData) {
        const newTexture = createZoneCanvasTexture(
          badgeItem.def.name,
          zoneData.isOccupied,
          zoneData.accentHex || '#38bdf8'
        );
        if (newTexture) {
          const oldMap = badgeItem.mesh.material.map;
          if (oldMap) oldMap.dispose();
          badgeItem.mesh.material.map = newTexture;
          badgeItem.mesh.material.needsUpdate = true;
        }
      }
    });
  }, [zones]);

  return (
    <div className="relative w-full h-screen bg-stone-950 text-stone-100 font-sans select-none overflow-hidden">
      {/* Three.js Canvas Mount */}
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />

      {/* Top Main Navigation Bar */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between pointer-events-none gap-3 z-10">
        <div className="bg-stone-900/90 backdrop-blur-md border border-stone-800 px-4 py-2.5 rounded-xl shadow-xl pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-stone-300" />
            <h1 className="text-xs font-semibold tracking-wider text-stone-200 uppercase">
              Dynamic Lighting · Office Engine
            </h1>
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Walk into any room to turn its lights on. Exiting automatically dims them.
          </p>
        </div>

        {/* Current Active Room Indicator */}
        <div className="bg-stone-900/90 backdrop-blur-md border border-stone-700/80 px-4 py-2 rounded-xl shadow-lg flex items-center gap-3 pointer-events-auto">
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
        {Object.values(zones).map((zone) => {
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

      {/* Mobile / Touch On-Screen D-Pad Controller */}
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

      {/* Bottom Navigation Legend & Instructions */}
      <div className="absolute bottom-4 left-4 bg-stone-900/85 backdrop-blur-md border border-stone-800/90 px-3.5 py-2 rounded-lg text-[11px] text-stone-400 pointer-events-none shadow-md flex flex-wrap items-center gap-3">
        <span>
          <strong className="text-stone-200 font-medium">WASD / Arrow Keys:</strong> Move
        </span>
        <span>•</span>
        <span>
          <strong className="text-stone-200 font-medium">Click Floor:</strong> Walk to Point
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