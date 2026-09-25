import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { create } from 'zustand';

/**
 * Global Zustand Zone Store extended with an isolated namespaced slice:
 * 'storageZones' tracks active aisle illumination and forklift occupancy.
 */
export const useZoneStore = create((set, get) => ({
  storageZones: {
    'aisle-1': {
      id: 'aisle-1',
      name: 'Aisle 01',
      label: 'Aisle 1 · Raw Materials',
      isOccupied: false,
    },
    'aisle-2': {
      id: 'aisle-2',
      name: 'Aisle 02',
      label: 'Aisle 2 · Hardware',
      isOccupied: false,
    },
    'aisle-3': {
      id: 'aisle-3',
      name: 'Aisle 03',
      label: 'Aisle 3 · Electronics',
      isOccupied: false,
    },
    'aisle-4': {
      id: 'aisle-4',
      name: 'Aisle 04',
      label: 'Aisle 4 · Packaging',
      isOccupied: false,
    },
    'aisle-5': {
      id: 'aisle-5',
      name: 'Aisle 05',
      label: 'Aisle 5 · Overstock',
      isOccupied: false,
    },
    'loading-dock': {
      id: 'loading-dock',
      name: 'Dock Bay',
      label: 'Loading Dock & Staging',
      isOccupied: true, // Player spawns in the dock
    },
  },

  setPlayerActiveZone: (activeZoneId) =>
    set((state) => {
      let changed = false;
      const updated = { ...state.storageZones };
      Object.keys(updated).forEach((id) => {
        const shouldBeOccupied = id === activeZoneId;
        if (updated[id].isOccupied !== shouldBeOccupied) {
          updated[id] = { ...updated[id], isOccupied: shouldBeOccupied };
          changed = true;
        }
      });
      return changed ? { storageZones: updated } : state;
    }),
}));

export const STORAGE_ZONES = [
  {
    id: 'aisle-1',
    name: 'Aisle 01',
    label: 'Aisle 1 · Raw Materials',
    bounds: { minX: -10.5, maxX: -6.5, minZ: -9.0, maxZ: 1.5 },
    center: [-8.5, 0, -3.75],
    lightPos: [-8.5, 4.4, -3.75],
    lightLength: 8.5,
    lightColor: 0xfffaf0, // 4000K crisp warehouse illumination
    activeIntensity: 30.0,
    idleIntensity: 1.2,
    distance: 12.0,
  },
  {
    id: 'aisle-2',
    name: 'Aisle 02',
    label: 'Aisle 2 · Hardware',
    bounds: { minX: -6.5, maxX: -2.5, minZ: -9.0, maxZ: 1.5 },
    center: [-4.5, 0, -3.75],
    lightPos: [-4.5, 4.4, -3.75],
    lightLength: 8.5,
    lightColor: 0xfffaf0,
    activeIntensity: 30.0,
    idleIntensity: 1.2,
    distance: 12.0,
  },
  {
    id: 'aisle-3',
    name: 'Aisle 03',
    label: 'Aisle 3 · Electronics',
    bounds: { minX: -2.5, maxX: 1.5, minZ: -9.0, maxZ: 1.5 },
    center: [-0.5, 0, -3.75],
    lightPos: [-0.5, 4.4, -3.75],
    lightLength: 8.5,
    lightColor: 0xfffaf0,
    activeIntensity: 30.0,
    idleIntensity: 1.2,
    distance: 12.0,
  },
  {
    id: 'aisle-4',
    name: 'Aisle 04',
    label: 'Aisle 4 · Packaging',
    bounds: { minX: 1.5, maxX: 5.5, minZ: -9.0, maxZ: 1.5 },
    center: [3.5, 0, -3.75],
    lightPos: [3.5, 4.4, -3.75],
    lightLength: 8.5,
    lightColor: 0xfffaf0,
    activeIntensity: 30.0,
    idleIntensity: 1.2,
    distance: 12.0,
  },
  {
    id: 'aisle-5',
    name: 'Aisle 05',
    label: 'Aisle 5 · Overstock',
    bounds: { minX: 5.5, maxX: 9.5, minZ: -9.0, maxZ: 1.5 },
    center: [7.5, 0, -3.75],
    lightPos: [7.5, 4.4, -3.75],
    lightLength: 8.5,
    lightColor: 0xfffaf0,
    activeIntensity: 30.0,
    idleIntensity: 1.2,
    distance: 12.0,
  },
  {
    id: 'loading-dock',
    name: 'Dock Bay',
    label: 'Loading Dock & Staging',
    bounds: { minX: -11.0, maxX: 10.0, minZ: 1.5, maxZ: 8.5 },
    center: [-0.5, 0, 5.0],
    lightPos: [-0.5, 4.5, 5.0],
    lightLength: 16.0,
    lightColor: 0xfff6ea,
    activeIntensity: 34.0,
    idleIntensity: 1.8,
    distance: 16.0,
  },
];

function createWarehouseBadgeTexture(name, isOccupied) {
  const canvas = document.createElement('canvas');
  canvas.width = 440;
  canvas.height = 110;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, 440, 110);

  // Matte charcoal industrial plaque background
  ctx.fillStyle = isOccupied ? 'rgba(24, 24, 27, 0.94)' : 'rgba(24, 24, 27, 0.78)';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(10, 10, 420, 90, 18);
    ctx.fill();
  } else {
    ctx.fillRect(10, 10, 420, 90);
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
  ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 72, 55);

  // Status text
  const statusStr = isOccupied ? 'ACTIVE' : 'STANDBY';
  ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", monospace';
  ctx.fillStyle = isOccupied ? '#d4d4d8' : '#71717a';
  const textWidth = ctx.measureText(statusStr).width;
  ctx.fillText(statusStr, 410 - textWidth, 55);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createIndustrialSectorLight(length = 6.0, colorHex = 0xfffaf0) {
  const group = new THREE.Group();

  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.9,
    roughness: 0.3,
  });

  const cablePositions = [-length * 0.38, length * 0.38];
  cablePositions.forEach((cx) => {
    const cable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.6, 8),
      cableMat
    );
    cable.position.set(0, 0.3, cx);
    group.add(cable);

    const ceilingJunction = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.04, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
    );
    ceilingJunction.position.set(0, 0.6, cx);
    group.add(ceilingJunction);
  });

  const housingMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.8,
  });
  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.12, length),
    housingMat
  );
  housing.position.set(0, 0, 0);
  housing.castShadow = true;
  group.add(housing);

  const lensMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.1,
    roughness: 0.15,
  });
  const lens = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.03, length * 0.96),
    lensMat
  );
  lens.position.set(0, -0.065, 0);
  group.add(lens);

  return { fixtureGroup: group, lensMat };
}

function createPalletRackingRow(length = 8.5, height = 3.6, depth = 1.0) {
  const group = new THREE.Group();

  const uprightMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.6,
  });
  const beamMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.5,
    metalness: 0.5,
  });
  const woodPalletMat = new THREE.MeshStandardMaterial({
    color: 0xc8a882,
    roughness: 0.7,
  });

  const cartonColors = [0xb59e84, 0xa38c70, 0xc5b196, 0x8c785f];
  const cartonMaterials = cartonColors.map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 })
  );

  const numBays = 4;
  const bayWidth = length / numBays;
  const beamLevels = [0.85, 1.85, 2.85];

  for (let b = 0; b <= numBays; b++) {
    const zPos = -length / 2 + b * bayWidth;
    [-depth / 2, depth / 2].forEach((xPos) => {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, height, 0.08),
        uprightMat
      );
      post.position.set(xPos, height / 2, zPos);
      post.castShadow = true;
      group.add(post);
    });

    const brace = new THREE.Mesh(
      new THREE.BoxGeometry(depth * 0.9, 0.04, 0.04),
      uprightMat
    );
    brace.position.set(0, height * 0.55, zPos);
    group.add(brace);
  }

  beamLevels.forEach((elev) => {
    [-depth / 2 + 0.03, depth / 2 - 0.03].forEach((xPos) => {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.1, length),
        beamMat
      );
      beam.position.set(xPos, elev, 0);
      beam.castShadow = true;
      group.add(beam);
    });

    for (let b = 0; b < numBays; b++) {
      const bayZ = -length / 2 + (b + 0.5) * bayWidth;

      const pallet = new THREE.Mesh(
        new THREE.BoxGeometry(depth * 0.85, 0.1, bayWidth * 0.82),
        woodPalletMat
      );
      pallet.position.set(0, elev + 0.06, bayZ);
      pallet.castShadow = true;
      pallet.receiveShadow = true;
      group.add(pallet);

      const stackType = (b + Math.floor(elev * 2)) % 3;
      if (stackType === 0) {
        [-0.15, 0.15].forEach((dx, idx) => {
          const cMat = cartonMaterials[(b + idx) % cartonMaterials.length];
          const box = new THREE.Mesh(
            new THREE.BoxGeometry(depth * 0.38, 0.65, bayWidth * 0.38),
            cMat
          );
          box.position.set(dx, elev + 0.1 + 0.325, bayZ);
          box.castShadow = true;
          group.add(box);
        });
      } else if (stackType === 1) {
        [-0.15, 0.15].forEach((dx) => {
          [-0.22, 0.22].forEach((dz) => {
            const cMat = cartonMaterials[(b + 1) % cartonMaterials.length];
            const box = new THREE.Mesh(
              new THREE.BoxGeometry(0.3, 0.45, 0.35),
              cMat
            );
            box.position.set(dx, elev + 0.1 + 0.225, bayZ + dz);
            box.castShadow = true;
            group.add(box);
          });
        });
      } else {
        const crateMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          roughness: 0.4,
          metalness: 0.2,
        });
        const crate = new THREE.Mesh(
          new THREE.BoxGeometry(depth * 0.78, 0.72, bayWidth * 0.75),
          crateMat
        );
        crate.position.set(0, elev + 0.1 + 0.36, bayZ);
        crate.castShadow = true;
        group.add(crate);
      }
    }
  });

  return group;
}

function createDrivableForklift() {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // OSHA Industrial Safety Amber
    roughness: 0.4,
    metalness: 0.2,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.3,
    metalness: 0.8,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.8,
  });

  // Heavy Counterweight Body & Chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.65, 1.8), bodyMat);
  chassis.position.set(0, 0.55, -0.2);
  chassis.castShadow = true;
  group.add(chassis);

  const counterweight = new THREE.Mesh(
    new THREE.BoxGeometry(1.18, 0.75, 0.6),
    steelMat
  );
  counterweight.position.set(0, 0.6, -0.85);
  counterweight.castShadow = true;
  group.add(counterweight);

  // Driver Operator Overhead Guard (Roll Cage)
  const cagePillarGeo = new THREE.BoxGeometry(0.06, 1.35, 0.06);
  [
    [-0.5, -0.6],
    [0.5, -0.6],
    [-0.5, 0.4],
    [0.5, 0.4],
  ].forEach(([px, pz]) => {
    const pillar = new THREE.Mesh(cagePillarGeo, steelMat);
    pillar.position.set(px, 1.5, pz);
    pillar.castShadow = true;
    group.add(pillar);
  });

  const cageRoof = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 1.1), steelMat);
  cageRoof.position.set(0, 2.18, -0.1);
  group.add(cageRoof);

  // Driver Seat & Steering Wheel
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.35, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.7 })
  );
  seat.position.set(0, 1.05, -0.2);
  group.add(seat);

  const steerColumn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8),
    steelMat
  );
  steerColumn.position.set(0, 1.25, 0.28);
  steerColumn.rotation.x = -0.3;
  group.add(steerColumn);

  // Front Lift Mast Channels (Dual vertical upright rails)
  [-0.38, 0.38].forEach((mx) => {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 2.4, 0.1),
      steelMat
    );
    rail.position.set(mx, 1.3, 0.85);
    rail.castShadow = true;
    group.add(rail);
  });

  // Fork Carriage & Horizontal Base
  const carriage = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.06), steelMat);
  carriage.position.set(0, 0.35, 0.92);
  group.add(carriage);

  // Heavy steel lifting forks
  [-0.25, 0.25].forEach((fx) => {
    const fork = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.03, 1.1),
      steelMat
    );
    fork.position.set(fx, 0.065, 1.45);
    fork.castShadow = true;
    group.add(fork);
  });

  // Staged wooden pallet resting on the forks
  const stagedPallet = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.1, 0.9),
    new THREE.MeshStandardMaterial({ color: 0xc8a882, roughness: 0.7 })
  );
  stagedPallet.position.set(0, 0.13, 1.45);
  stagedPallet.castShadow = true;
  group.add(stagedPallet);

  const cargoBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.65, 0.75),
    new THREE.MeshStandardMaterial({ color: 0xa38c70, roughness: 0.8 })
  );
  cargoBox.position.set(0, 0.5, 1.45);
  cargoBox.castShadow = true;
  group.add(cargoBox);

  // Front Headlights
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.2,
  });
  [-0.35, 0.35].forEach((hx) => {
    const lightMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), headlightMat);
    lightMesh.position.set(hx, 1.6, 0.9);
    group.add(lightMesh);
  });

  // Dynamic Headlight Beam (turned up when driving)
  const vehicleBeam = new THREE.SpotLight(0xfff7ed, 0, 15, Math.PI / 4, 0.4, 1.5);
  vehicleBeam.position.set(0, 1.6, 1.0);
  vehicleBeam.target.position.set(0, 0, 8.0);
  group.add(vehicleBeam);
  group.add(vehicleBeam.target);

  // 4 Industrial Tires (Keep references for driving spin animations)
  const tireGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.2, 16);
  const wheels = [];
  [
    [-0.55, 0.24, 0.6],
    [0.55, 0.24, 0.6],
    [-0.52, 0.24, -0.65],
    [0.52, 0.24, -0.65],
  ].forEach(([tx, ty, tz]) => {
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.position.set(tx, ty, tz);
    tire.castShadow = true;
    group.add(tire);
    wheels.push(tire);
  });

  // Driver avatar placeholder inside the forklift (hidden until mounted)
  const driverSeatAvatar = new THREE.Group();
  driverSeatAvatar.position.set(0, 1.05, -0.15);
  driverSeatAvatar.visible = false;

  const dTorso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.22, 0.52, 12),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
  );
  dTorso.position.set(0, 0.26, 0);
  const dVest = new THREE.Mesh(
    new THREE.CylinderGeometry(0.245, 0.245, 0.35, 12),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 })
  );
  dVest.position.set(0, 0.3, 0);
  const dHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0xf1ebe1 })
  );
  dHead.position.set(0, 0.68, 0);
  const dHelmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 })
  );
  dHelmet.position.set(0, 0.74, 0);

  driverSeatAvatar.add(dTorso, dVest, dHead, dHelmet);
  group.add(driverSeatAvatar);

  // Forklift Proximity Prompt Ring (appears when player is close)
  const promptRing = new THREE.Mesh(
    new THREE.RingGeometry(1.8, 1.95, 32),
    new THREE.MeshBasicMaterial({
      color: 0xd4d4d8,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
    })
  );
  promptRing.rotation.x = -Math.PI / 2;
  promptRing.position.set(0, 0.04, 0);
  group.add(promptRing);

  return {
    forkliftGroup: group,
    wheels,
    vehicleBeam,
    headlightMat,
    driverSeatAvatar,
    promptRing,
  };
}

function createPlayerMesh() {
  const playerGroup = new THREE.Group();

  // Subtle floor tracking halo
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.42, 32),
    new THREE.MeshBasicMaterial({
      color: 0xd4d4d8,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.set(0, 0.03, 0);
  playerGroup.add(halo);

  // Ground shadow disc
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.35, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.02, 0);
  playerGroup.add(shadow);

  // Worker Trousers / Lower Body
  const legs = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.25, 0.65, 14),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
  );
  legs.position.set(0, 0.45, 0);
  legs.castShadow = true;
  playerGroup.add(legs);

  // Hi-Vis Safety Vest Upper Body
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.24, 0.55, 14),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 })
  );
  torso.position.set(0, 0.95, 0);
  torso.castShadow = true;
  playerGroup.add(torso);

  // Silver reflective vest stripe
  const stripe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.265, 0.265, 0.08, 14),
    new THREE.MeshStandardMaterial({ color: 0xf4f4f5, roughness: 0.2, metalness: 0.5 })
  );
  stripe.position.set(0, 0.92, 0);
  playerGroup.add(stripe);

  // Worker Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 14),
    new THREE.MeshStandardMaterial({ color: 0xf1ebe1, roughness: 0.6 })
  );
  head.position.set(0, 1.35, 0);
  head.castShadow = true;
  playerGroup.add(head);

  // Safety Hardhat Helmet
  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.21, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 })
  );
  helmet.position.set(0, 1.42, 0);
  helmet.castShadow = true;
  playerGroup.add(helmet);

  // Direction Visor
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.08, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 })
  );
  visor.position.set(0, 1.36, 0.16);
  playerGroup.add(visor);

  // Personal subtle illumination in warm neutral light
  const taskLight = new THREE.PointLight(0xfff7ed, 1.0, 3.2, 2);
  taskLight.position.set(0, 1.2, 0.2);
  playerGroup.add(taskLight);

  return { playerGroup, halo };
}

function buildWarehouseArchitecture() {
  const root = new THREE.Group();

  const WALL_H = 4.8;
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.8,
  });
  const concreteFloorMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.55,
    metalness: 0.1,
  });
  const yellowLineMat = new THREE.MeshBasicMaterial({
    color: 0xd97706,
  });
  const whiteLineMat = new THREE.MeshBasicMaterial({
    color: 0xe2e8f0,
  });

  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(23.6, 0.2, 19.6),
    concreteFloorMat
  );
  foundation.position.set(-0.5, -0.1, -0.25);
  foundation.receiveShadow = true;
  root.add(foundation);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(23.0, 19.0),
    concreteFloorMat
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(-0.5, 0.005, -0.25);
  floor.receiveShadow = true;
  root.add(floor);

  // Floor Markings for Aisles
  const aisleDividersX = [-10.5, -6.5, -2.5, 1.5, 5.5, 9.5];
  aisleDividersX.forEach((x) => {
    const leftStripe = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, 10.5),
      yellowLineMat
    );
    leftStripe.rotation.x = -Math.PI / 2;
    leftStripe.position.set(x + 0.35, 0.012, -3.75);
    root.add(leftStripe);

    const rightStripe = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, 10.5),
      yellowLineMat
    );
    rightStripe.rotation.x = -Math.PI / 2;
    rightStripe.position.set(x - 0.35, 0.012, -3.75);
    root.add(rightStripe);
  });

  const dockStagingStripe = new THREE.Mesh(
    new THREE.PlaneGeometry(21.0, 0.16),
    whiteLineMat
  );
  dockStagingStripe.rotation.x = -Math.PI / 2;
  dockStagingStripe.position.set(-0.5, 0.014, 1.5);
  root.add(dockStagingStripe);

  // Staging parking bays in the loading dock zone
  [-6.0, 0.0, 6.0].forEach((bx) => {
    const bayOutline = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 0.1),
      yellowLineMat
    );
    bayOutline.rotation.x = -Math.PI / 2;
    bayOutline.position.set(bx, 0.015, 7.5);
    root.add(bayOutline);
  });

  const northWall = new THREE.Mesh(
    new THREE.BoxGeometry(23.2, WALL_H, 0.2),
    wallMat
  );
  northWall.position.set(-0.5, WALL_H / 2, -9.5);
  northWall.castShadow = true;

  const westWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, WALL_H, 19.2),
    wallMat
  );
  westWall.position.set(-12.0, WALL_H / 2, -0.25);
  westWall.castShadow = true;

  const eastWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, WALL_H, 19.2),
    wallMat
  );
  eastWall.position.set(11.0, WALL_H / 2, -0.25);
  eastWall.castShadow = true;

  const southWall = new THREE.Mesh(
    new THREE.BoxGeometry(23.2, WALL_H, 0.2),
    wallMat
  );
  southWall.position.set(-0.5, WALL_H / 2, 9.0);
  southWall.castShadow = true;

  root.add(northWall, westWall, eastWall, southWall);

  const dockDoorMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.4,
    metalness: 0.7,
  });
  const bumperMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.9,
  });

  [-5.0, 4.0].forEach((dx) => {
    const door = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.8, 0.08), dockDoorMat);
    door.position.set(dx, 1.9, 8.88);
    root.add(door);

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 4.4, 16),
      wallMat
    );
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(dx, 3.9, 8.82);
    root.add(barrel);

    [-2.2, 2.2].forEach((bx) => {
      const bumper = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.9, 12),
        bumperMat
      );
      bumper.position.set(dx + bx, 0.45, 8.6);
      bumper.castShadow = true;
      root.add(bumper);
    });
  });

  return root;
}

export function StorageFacilityScene() {
  const containerRef = useRef(null);
  const storageZones = useZoneStore((state) => state.storageZones);

  const [activeZoneName, setActiveZoneName] = useState('Loading Dock & Staging');
  const [isDrivingForklift, setIsDrivingForklift] = useState(false);
  const [canMountForklift, setCanMountForklift] = useState(false);
  const [vehicleSpeedKmh, setVehicleSpeedKmh] = useState(0);

  const keysPressed = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    interact: false,
  });

  const runtimeRef = useRef({
    lights: {},
    lenses: {},
    badges: {},
    hitboxes: [],
    player: null,
    forklift: null,
    isDriving: false,
    canMount: false,
    scene: null,
    camera: null,
    renderer: null,
    clickTarget: null,
  });

  // Mobile / UI virtual input helper
  const handleVirtualKey = (dir, isDown) => {
    if (keysPressed.current[dir] !== undefined) {
      keysPressed.current[dir] = isDown;
      if (isDown) runtimeRef.current.clickTarget = null;
    }
  };

  // Toggle Driving the Forklift
  const toggleForkliftMode = () => {
    const r = runtimeRef.current;
    if (!r.player || !r.forklift) return;

    if (r.isDriving) {
      // Dismount: place player to the left of the forklift
      r.isDriving = false;
      setIsDrivingForklift(false);
      setVehicleSpeedKmh(0);

      r.player.group.visible = true;
      const leftOffset = new THREE.Vector3(-1.4, 0, 0).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        r.forklift.rotation
      );
      r.player.pos.copy(r.forklift.pos).add(leftOffset);
      r.player.pos.y = 0;
      r.player.group.position.copy(r.player.pos);
      r.player.rotation = r.forklift.rotation;

      r.forklift.driverSeatAvatar.visible = false;
      r.forklift.vehicleBeam.intensity = 0;
      r.forklift.headlightMat.emissiveIntensity = 0.2;
    } else if (r.canMount) {
      // Mount Forklift
      r.isDriving = true;
      setIsDrivingForklift(true);
      r.clickTarget = null;

      r.player.group.visible = false;
      r.forklift.driverSeatAvatar.visible = true;
      r.forklift.vehicleBeam.intensity = 32.0;
      r.forklift.headlightMat.emissiveIntensity = 2.5;
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
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      120
    );
    camera.position.set(-0.5, 20.0, 16.5);
    camera.lookAt(-0.5, 0, 0.0);

    // Dim gray ambient light so unoccupied aisles remain visible in high contrast
    const hemiLight = new THREE.HemisphereLight(0xe2e8f0, 0x090d16, 0.35);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.45);
    sunLight.position.set(12, 24, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0002;
    scene.add(sunLight);

    const warehouseArch = buildWarehouseArchitecture();
    scene.add(warehouseArch);

    const rackPositionsX = [-10.5, -6.5, -2.5, 1.5, 5.5, 9.5];
    rackPositionsX.forEach((rx) => {
      const rack = createPalletRackingRow(8.8, 3.6, 1.0);
      rack.position.set(rx, 0, -3.75);
      scene.add(rack);
    });

    [-1.0, 2.5, 7.0].forEach((dx) => {
      const pallet = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.12, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xc8a882, roughness: 0.7 })
      );
      pallet.position.set(dx, 0.06, 5.2);
      pallet.castShadow = true;
      scene.add(pallet);

      const stack = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 0.95, 1.05),
        new THREE.MeshStandardMaterial({ color: 0xb59e84, roughness: 0.85 })
      );
      stack.position.set(dx, 0.6, 5.2);
      stack.castShadow = true;
      scene.add(stack);
    });

    const lightsMap = {};
    const lensesMap = {};
    const badgesMap = {};
    const hitboxes = [];

    const initialStore = useZoneStore.getState().storageZones;

    STORAGE_ZONES.forEach((z) => {
      const isOcc = initialStore[z.id]?.isOccupied || false;

      const { fixtureGroup, lensMat } = createIndustrialSectorLight(
        z.lightLength || 7.0,
        z.lightColor
      );
      fixtureGroup.position.set(...z.lightPos);
      scene.add(fixtureGroup);

      const pLight = new THREE.PointLight(
        z.lightColor,
        isOcc ? z.activeIntensity : z.idleIntensity,
        z.distance,
        2.0
      );
      pLight.position.set(z.lightPos[0], z.lightPos[1] - 0.25, z.lightPos[2]);
      pLight.castShadow = true;
      pLight.shadow.bias = -0.0001;
      scene.add(pLight);

      lightsMap[z.id] = { light: pLight, def: z };
      lensesMap[z.id] = lensMat;

      const badgeGeo = new THREE.PlaneGeometry(2.3, 0.58);
      const initialTex = createWarehouseBadgeTexture(z.name, isOcc);
      const badgeMat = new THREE.MeshBasicMaterial({
        map: initialTex,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
      badgeMesh.position.set(z.center[0], 4.8, z.center[2]);
      scene.add(badgeMesh);
      badgesMap[z.id] = { mesh: badgeMesh, def: z };

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

    const { playerGroup, halo } = createPlayerMesh();
    const playerStartPos = new THREE.Vector3(-1.8, 0, 5.0);
    playerGroup.position.copy(playerStartPos);
    scene.add(playerGroup);

    const playerEntity = {
      group: playerGroup,
      halo,
      pos: playerStartPos.clone(),
      speed: 4.6,
      rotation: 0,
      walkTimer: 0,
      currentZoneId: 'loading-dock',
    };

    const forkliftComponents = createDrivableForklift();
    const forkliftStartPos = new THREE.Vector3(-4.5, 0, 4.8);
    forkliftComponents.forkliftGroup.position.copy(forkliftStartPos);
    forkliftComponents.forkliftGroup.rotation.y = -Math.PI * 0.15;
    scene.add(forkliftComponents.forkliftGroup);

    const forkliftEntity = {
      ...forkliftComponents,
      pos: forkliftStartPos.clone(),
      speed: 0,
      maxForwardSpeed: 6.2,
      maxReverseSpeed: 3.5,
      acceleration: 7.0,
      drag: 4.5,
      rotation: -Math.PI * 0.15,
      steerAngle: 0,
      wheelRoll: 0,
    };

    runtimeRef.current = {
      lights: lightsMap,
      lenses: lensesMap,
      badges: badgesMap,
      hitboxes,
      player: playerEntity,
      forklift: forkliftEntity,
      isDriving: false,
      canMount: false,
      scene,
      camera,
      renderer,
      clickTarget: null,
    };

    let isDragging = false;
    let isPanning = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let spherical = { radius: 26, theta: -0.05, phi: 0.74 };
    let cameraTarget = new THREE.Vector3(-0.5, 0.5, 3.0);

    const updateCamera = () => {
      spherical.phi = Math.max(0.15, Math.min(Math.PI / 2.05, spherical.phi));
      spherical.radius = Math.max(8, Math.min(48, spherical.radius));

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
      if (code === 'KeyE') {
        toggleForkliftMode();
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
        // Short click: set floor move destination if on foot
        if (dist < 5 && !runtimeRef.current.isDriving) {
          raycaster.setFromCamera(mouse, camera);
          const hits = raycaster.intersectObjects(hitboxes);
          if (hits.length > 0) {
            const hitPoint = hits[0].point;
            runtimeRef.current.clickTarget = new THREE.Vector3(
              THREE.MathUtils.clamp(hitPoint.x, -10.5, 9.5),
              0,
              THREE.MathUtils.clamp(hitPoint.z, -8.8, 8.0)
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
      const f = r.forklift;

      let activeEntityPos = p.pos;

      if (!r.isDriving) {
        // ================= PLAYER ON FOOT SIMULATION =================
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

        // Boundary Clamp
        p.pos.x = THREE.MathUtils.clamp(p.pos.x, -11.0, 10.0);
        p.pos.z = THREE.MathUtils.clamp(p.pos.z, -9.0, 8.2);

        // Walking Bobbing
        if (isMoving) {
          p.walkTimer += delta * 11;
          p.group.position.set(p.pos.x, Math.sin(p.walkTimer) * 0.035, p.pos.z);
        } else {
          p.group.position.set(p.pos.x, 0, p.pos.z);
        }

        // Proximity detection to Forklift
        const distToForklift = p.pos.distanceTo(f.pos);
        const nearForklift = distToForklift < 2.3;
        if (nearForklift !== r.canMount) {
          r.canMount = nearForklift;
          setCanMountForklift(nearForklift);
        }

        f.promptRing.material.opacity = nearForklift
          ? 0.5 + Math.sin(clock.getElapsedTime() * 4) * 0.25
          : 0.0;

        activeEntityPos = p.pos;
        cameraTarget.lerp(p.pos, delta * 3.5);
      } else {
        // ================= FORKLIFT VEHICLE DRIVING SIMULATION =================
        // Steering input
        const steerRate = 2.4;
        if (keysPressed.current.left) f.rotation += steerRate * delta;
        if (keysPressed.current.right) f.rotation -= steerRate * delta;

        // Acceleration / Reverse / Braking
        if (keysPressed.current.forward) {
          f.speed = Math.min(f.speed + f.acceleration * delta, f.maxForwardSpeed);
        } else if (keysPressed.current.backward) {
          f.speed = Math.max(f.speed - f.acceleration * delta, -f.maxReverseSpeed);
        } else {
          // Friction Drag
          if (f.speed > 0) {
            f.speed = Math.max(f.speed - f.drag * delta, 0);
          } else if (f.speed < 0) {
            f.speed = Math.min(f.speed + f.drag * delta, 0);
          }
        }

        // Forward vector derived from forklift rotation
        const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          f.rotation
        );
        f.pos.addScaledVector(forward, f.speed * delta);

        // Clamp to warehouse bounds
        f.pos.x = THREE.MathUtils.clamp(f.pos.x, -10.6, 9.6);
        f.pos.z = THREE.MathUtils.clamp(f.pos.z, -8.6, 7.8);

        f.forkliftGroup.position.copy(f.pos);
        f.forkliftGroup.rotation.y = f.rotation;

        // Wheel roll animation
        f.wheelRoll += f.speed * delta * 4;
        f.wheels.forEach((w) => {
          w.rotation.x = f.wheelRoll;
        });

        // Speedometer telemetry update
        const speedKmh = Math.round(Math.abs(f.speed) * 3.6);
        setVehicleSpeedKmh(speedKmh);

        activeEntityPos = f.pos;
        cameraTarget.lerp(f.pos, delta * 4.0);
      }

      updateCamera();

      const ex = activeEntityPos.x;
      const ez = activeEntityPos.z;
      let detectedZoneId = null;

      for (const zone of STORAGE_ZONES) {
        if (
          ex >= zone.bounds.minX &&
          ex <= zone.bounds.maxX &&
          ez >= zone.bounds.minZ &&
          ez <= zone.bounds.maxZ
        ) {
          detectedZoneId = zone.id;
          break;
        }
      }

      // If the player entered a new aisle/zone, switch on its lights and dim the rest!
      if (detectedZoneId && detectedZoneId !== p.currentZoneId) {
        p.currentZoneId = detectedZoneId;
        const zDef = STORAGE_ZONES.find((z) => z.id === detectedZoneId);
        if (zDef) {
          setActiveZoneName(zDef.label);
        }
        useZoneStore.getState().setPlayerActiveZone(detectedZoneId);
      }

      const liveZones = useZoneStore.getState().storageZones;

      STORAGE_ZONES.forEach((z) => {
        const zoneData = liveZones[z.id];
        const isOcc = zoneData?.isOccupied || false;

        const targetIntensity = isOcc ? z.activeIntensity : z.idleIntensity;
        const targetEmissive = isOcc ? 2.4 : 0.12;

        const lightObj = lightsMap[z.id];
        if (lightObj && lightObj.light) {
          lightObj.light.intensity = THREE.MathUtils.lerp(
            lightObj.light.intensity,
            targetIntensity,
            delta * 7.5
          );
        }

        const lensMat = lensesMap[z.id];
        if (lensMat) {
          lensMat.emissiveIntensity = THREE.MathUtils.lerp(
            lensMat.emissiveIntensity,
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
      const zoneData = storageZones[zoneId];
      const badgeItem = badges[zoneId];
      if (badgeItem && badgeItem.mesh && zoneData) {
        const newTexture = createWarehouseBadgeTexture(
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
  }, [storageZones]);

  return (
    <div className="relative w-full h-screen bg-stone-950 text-stone-100 font-sans select-none overflow-hidden">
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />

      {/* Top Header Card */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between pointer-events-none gap-3 z-10">
        <div className="bg-stone-900/90 backdrop-blur-md border border-stone-800 px-4 py-2.5 rounded-xl shadow-xl pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isDrivingForklift ? 'bg-amber-400 animate-pulse' : 'bg-stone-300'
              }`}
            />
            <h1 className="text-xs font-semibold tracking-wider text-stone-200 uppercase">
              {isDrivingForklift
                ? 'Forklift Vehicle Pilot · Storage Facility'
                : 'Player Dynamic Lighting · Warehouse Engine'}
            </h1>
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Walk or drive into any aisle to illuminate it. Exiting automatically turns lights off.
          </p>
        </div>

        {/* Selected Zone & Vehicle Telemetry */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {isDrivingForklift && (
            <div className="bg-stone-900/90 backdrop-blur-md border border-amber-600/70 px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-2.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400">
                Speed
              </span>
              <span className="text-xs font-bold font-mono text-stone-100">
                {vehicleSpeedKmh} KM/H
              </span>
            </div>
          )}

          <div className="bg-stone-900/90 backdrop-blur-md border border-stone-800 px-4 py-2 rounded-xl shadow-lg flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                Active Zone
              </span>
              <span className="text-xs font-medium text-stone-100">{activeZoneName}</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-stone-200 shadow-[0_0_6px_rgba(255,255,255,0.4)]" />
          </div>
        </div>
      </div>

      {/* Live Zone Status Pills */}
      <div className="absolute top-20 left-4 flex flex-wrap gap-1.5 max-w-2xl pointer-events-none z-10">
        {Object.values(storageZones).map((zone) => {
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

      {/* Forklift Mount/Dismount Action Button */}
      {(canMountForklift || isDrivingForklift) && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto z-20">
          <button
            onClick={toggleForkliftMode}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase shadow-2xl transition-all border active:scale-95 ${
              isDrivingForklift
                ? 'bg-stone-900/95 text-stone-200 border-stone-700 hover:bg-stone-800'
                : 'bg-amber-600 hover:bg-amber-500 text-stone-950 border-amber-400'
            }`}
          >
            <span className="px-1.5 py-0.5 rounded bg-black/25 text-[10px] font-mono">
              [E]
            </span>
            <span>{isDrivingForklift ? 'Dismount Forklift' : 'Drive Forklift'}</span>
          </button>
        </div>
      )}

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
          {isDrivingForklift ? 'Steer Vehicle' : 'Move Worker'}
        </span>
      </div>

      {/* Bottom Instructions Legend */}
      <div className="absolute bottom-4 left-4 bg-stone-900/85 backdrop-blur-md border border-stone-800/90 px-3.5 py-2 rounded-lg text-[11px] text-stone-400 pointer-events-none shadow-md flex flex-wrap items-center gap-3">
        <span>
          <strong className="text-stone-200 font-medium">WASD / Arrow Keys:</strong>{' '}
          {isDrivingForklift ? 'Accelerate & Steer' : 'Move Player'}
        </span>
        <span>•</span>
        <span>
          <strong className="text-stone-200 font-medium">E:</strong> Mount / Dismount Forklift
        </span>
        <span>•</span>
        <span>
          <strong className="text-stone-300 font-normal">Click Floor:</strong> Walk to Point
        </span>
        <span>•</span>
        <span>
          <strong className="text-stone-300 font-normal">Drag:</strong> Orbit View
        </span>
      </div>
    </div>
  );
}

export default function App() {
  return <StorageFacilityScene />;
}