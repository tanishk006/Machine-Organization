import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { create } from 'zustand';

export interface OfficeZoneDefinition {
  id: string;
  name: string;
  bounds: { width: number; depth: number; center: [number, number, number] };
  lightPos: [number, number, number];
  lightColor: number;
  activeIntensity: number;
  idleIntensity: number;
  distance: number;
}

export interface OccupancyStoreState {
  occupancy: Record<string, boolean>;
  setOccupancy: (zoneId: string, isOccupied: boolean) => void;
  toggleOccupancy: (zoneId: string) => void;
}

/**
 * Global occupancy state store.
 * Allows synchronized control between the 3D raycast world and 2D UI controls.
 */
export const useOccupancyStore = create<OccupancyStoreState>((set) => ({
  occupancy: {
    'office-a': true,
    'office-b': false,
    'meeting-room': true,
    'corridor': false,
  },
  setOccupancy: (zoneId: string, isOccupied: boolean) =>
    set((state) => ({
      occupancy: { ...state.occupancy, [zoneId]: isOccupied },
    })),
  toggleOccupancy: (zoneId: string) =>
    set((state) => ({
      occupancy: { ...state.occupancy, [zoneId]: !state.occupancy[zoneId] },
    })),
}));

export const ZONE_DEFINITIONS: OfficeZoneDefinition[] = [
  {
    id: 'office-a',
    name: 'Office A (Focus)',
    bounds: { width: 5.6, depth: 3.8, center: [-2.9, 0, -2.9] },
    lightPos: [-2.9, 2.1, -2.9],
    lightColor: 0xffedd5,
    activeIntensity: 22,
    idleIntensity: 1.5,
    distance: 8.0,
  },
  {
    id: 'office-b',
    name: 'Office B (Team)',
    bounds: { width: 5.6, depth: 3.8, center: [2.9, 0, -2.9] },
    lightPos: [2.9, 2.1, -2.9],
    lightColor: 0xfef3c7,
    activeIntensity: 22,
    idleIntensity: 1.5,
    distance: 8.0,
  },
  {
    id: 'meeting-room',
    name: 'Meeting Room',
    bounds: { width: 11.6, depth: 3.8, center: [0, 0, 2.95] },
    lightPos: [0, 2.1, 2.95],
    lightColor: 0xf0f9ff,
    activeIntensity: 28,
    idleIntensity: 2.0,
    distance: 10.5,
  },
  {
    id: 'corridor',
    name: 'Corridor',
    bounds: { width: 11.6, depth: 1.6, center: [0, 0, 0] },
    lightPos: [0, 2.1, 0],
    lightColor: 0xe2e8f0,
    activeIntensity: 14,
    idleIntensity: 1.2,
    distance: 9.0,
  },
];

function createZoneBadgeTexture(name: string, isOccupied: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, 512, 128);

  // Pill container
  ctx.fillStyle = isOccupied ? 'rgba(15, 23, 42, 0.94)' : 'rgba(30, 41, 59, 0.88)';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(16, 16, 480, 96, 24);
    ctx.fill();
  } else {
    ctx.fillRect(16, 16, 480, 96);
  }

  // Border stroke
  ctx.lineWidth = 4;
  ctx.strokeStyle = isOccupied ? '#38bdf8' : '#64748b';
  ctx.stroke();

  // Status indicator LED
  ctx.fillStyle = isOccupied ? '#22c55e' : '#94a3b8';
  ctx.beginPath();
  ctx.arc(58, 64, 14, 0, Math.PI * 2);
  ctx.fill();

  // Zone Name
  ctx.fillStyle = isOccupied ? '#ffffff' : '#cbd5e1';
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 88, 64);

  // Status text
  const statusText = isOccupied ? 'OCCUPIED' : 'VACANT';
  ctx.fillStyle = isOccupied ? '#38bdf8' : '#94a3b8';
  ctx.font = 'bold 22px monospace';
  const statusWidth = ctx.measureText(statusText).width;
  ctx.fillText(statusText, 470 - statusWidth, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createOfficeDesk() {
  const deskGroup = new THREE.Group();

  // Desktop
  const topGeo = new THREE.BoxGeometry(1.5, 0.05, 0.75);
  const topMat = new THREE.MeshStandardMaterial({ color: 0xd4b996, roughness: 0.6 });
  const topMesh = new THREE.Mesh(topGeo, topMat);
  topMesh.position.set(0, 0.73, 0);
  topMesh.castShadow = true;
  topMesh.receiveShadow = true;
  deskGroup.add(topMesh);

  // Steel legs
  const legGeo = new THREE.BoxGeometry(0.05, 0.72, 0.7);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.position.set(-0.68, 0.36, 0);
  leftLeg.castShadow = true;
  const rightLeg = leftLeg.clone();
  rightLeg.position.set(0.68, 0.36, 0);
  deskGroup.add(leftLeg, rightLeg);

  // Modesty Panel
  const panelGeo = new THREE.BoxGeometry(1.3, 0.4, 0.02);
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
  const panel = new THREE.Mesh(panelGeo, panelMat);
  panel.position.set(0, 0.42, -0.32);
  deskGroup.add(panel);

  // Monitor
  const monitorGroup = new THREE.Group();
  monitorGroup.position.set(0, 0.755, -0.12);

  const mBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.015, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x0f172a })
  );
  mBase.position.set(0, 0.02, 0);

  const mStand = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.24, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
  );
  mStand.position.set(0, 0.14, -0.04);

  const mFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.38, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x020617 })
  );
  mFrame.position.set(0, 0.24, 0);

  const mScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.64, 0.34),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  mScreen.position.set(0, 0.24, 0.017);

  monitorGroup.add(mBase, mStand, mFrame, mScreen);
  deskGroup.add(monitorGroup);

  return deskGroup;
}

function createOfficeChair() {
  const chairGroup = new THREE.Group();

  // Base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.04, 5),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
  );
  base.position.set(0, 0.05, 0);

  // Gas cylinder
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.35, 12),
    new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 })
  );
  pole.position.set(0, 0.25, 0);

  // Seat
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.08, 0.44),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
  );
  seat.position.set(0, 0.44, 0);
  seat.castShadow = true;

  // Backrest
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.5, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.8 })
  );
  back.position.set(0, 0.72, -0.19);
  back.rotation.x = 0.08;
  back.castShadow = true;

  chairGroup.add(base, pole, seat, back);
  return chairGroup;
}

function createMeetingTableSet() {
  const tableGroup = new THREE.Group();

  // Table base
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.52, 0.06, 24),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 })
  );
  plinth.position.set(0, 0.03, 0);
  plinth.receiveShadow = true;

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 0.64, 20),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 })
  );
  pedestal.position.set(0, 0.37, 0);
  pedestal.castShadow = true;

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.05, 0.05, 32),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 })
  );
  top.position.set(0, 0.72, 0);
  top.castShadow = true;
  top.receiveShadow = true;

  const centerpiece = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.02, 16),
    new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.4 })
  );
  centerpiece.position.set(0, 0.75, 0);

  tableGroup.add(plinth, pedestal, top, centerpiece);

  // 5 Radial surrounding chairs
  const chairCount = 5;
  for (let i = 0; i < chairCount; i++) {
    const angle = (i / chairCount) * Math.PI * 2;
    const radius = 1.35;
    const chair = createOfficeChair();
    chair.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
    chair.rotation.y = angle + Math.PI;
    tableGroup.add(chair);
  }

  return tableGroup;
}

function createPottedPlant() {
  const plantGroup = new THREE.Group();

  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.18, 0.56, 16),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 })
  );
  pot.position.set(0, 0.28, 0);
  pot.castShadow = true;

  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.04, 14),
    new THREE.MeshStandardMaterial({ color: 0x2d2216, roughness: 0.9 })
  );
  soil.position.set(0, 0.53, 0);

  const foliage1 = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 })
  );
  foliage1.position.set(0, 0.85, 0);
  foliage1.castShadow = true;

  const foliage2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 7, 7),
    new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 })
  );
  foliage2.position.set(0.12, 1.05, -0.05);
  foliage2.castShadow = true;

  plantGroup.add(pot, soil, foliage1, foliage2);
  return plantGroup;
}

function createSectorLightFixture(colorHex: number) {
  const fixtureGroup = new THREE.Group();

  // Canopy
  const canopy = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 })
  );
  canopy.position.set(0, 0.45, 0);

  // Suspension wire
  const wire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x0f172a })
  );
  wire.position.set(0, 0.23, 0);

  // Modern housing
  const housing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.25, 0.18, 24),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.9 })
  );
  housing.position.set(0, 0, 0);

  // Emissive diffuser lens
  const lensMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });
  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.19, 0.02, 24),
    lensMat
  );
  lens.position.set(0, -0.09, 0);

  fixtureGroup.add(canopy, wire, housing, lens);
  return { fixtureGroup, lensMat };
}

function buildOfficeArchitecture() {
  const archGroup = new THREE.Group();

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.7 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.38,
    roughness: 0.08,
    metalness: 0.15,
  });

  const WALL_H = 1.9;

  // Base Foundation
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(12.4, 0.1, 10.4),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
  );
  foundation.position.set(0, -0.05, 0);
  foundation.receiveShadow = true;
  archGroup.add(foundation);

  // Floor (Scandinavian Oak)
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12.0, 10.0),
    new THREE.MeshStandardMaterial({ color: 0xd8c5ac, roughness: 0.65, metalness: 0.05 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 0);
  floor.receiveShadow = true;
  archGroup.add(floor);

  // Meeting Room Slate Carpet Tile
  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(11.6, 3.8),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 })
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.005, 2.95);
  carpet.receiveShadow = true;
  archGroup.add(carpet);

  // Perimeter Walls (Seamless, 0 gaps)
  const northWall = new THREE.Mesh(new THREE.BoxGeometry(12.0, WALL_H, 0.2), wallMat);
  northWall.position.set(0, WALL_H / 2, -5.0);
  northWall.castShadow = true;
  northWall.receiveShadow = true;

  const southWall = new THREE.Mesh(new THREE.BoxGeometry(12.0, WALL_H, 0.2), wallMat);
  southWall.position.set(0, WALL_H / 2, 5.0);
  southWall.castShadow = true;
  southWall.receiveShadow = true;

  const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, WALL_H, 10.2), wallMat);
  westWall.position.set(-6.0, WALL_H / 2, 0);
  westWall.castShadow = true;
  westWall.receiveShadow = true;

  const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, WALL_H, 10.2), wallMat);
  eastWall.position.set(6.0, WALL_H / 2, 0);
  eastWall.castShadow = true;
  eastWall.receiveShadow = true;

  archGroup.add(northWall, southWall, westWall, eastWall);

  // Interior Divider between Office A and B
  const officeDivider = new THREE.Mesh(new THREE.BoxGeometry(0.2, WALL_H, 3.9), wallMat);
  officeDivider.position.set(0, WALL_H / 2, -2.95);
  officeDivider.castShadow = true;
  officeDivider.receiveShadow = true;
  archGroup.add(officeDivider);

  // Office A Corridor Wall with Doorway
  const oAWall1 = new THREE.Mesh(new THREE.BoxGeometry(3.8, WALL_H, 0.2), wallMat);
  oAWall1.position.set(-4.0, WALL_H / 2, -0.9);
  const oAHeader = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.2), wallMat);
  oAHeader.position.set(-1.5, WALL_H - 0.2, -0.9);
  const oAWall2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, WALL_H, 0.2), wallMat);
  oAWall2.position.set(-0.45, WALL_H / 2, -0.9);
  archGroup.add(oAWall1, oAHeader, oAWall2);

  // Office B Corridor Wall with Doorway
  const oBWall1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, WALL_H, 0.2), wallMat);
  oBWall1.position.set(0.45, WALL_H / 2, -0.9);
  const oBHeader = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.2), wallMat);
  oBHeader.position.set(1.5, WALL_H - 0.2, -0.9);
  const oBWall2 = new THREE.Mesh(new THREE.BoxGeometry(3.8, WALL_H, 0.2), wallMat);
  oBWall2.position.set(4.0, WALL_H / 2, -0.9);
  archGroup.add(oBWall1, oBHeader, oBWall2);

  // South Corridor Glass Partition System
  const meetWallLeft = new THREE.Mesh(new THREE.BoxGeometry(2.4, WALL_H, 0.2), wallMat);
  meetWallLeft.position.set(-4.7, WALL_H / 2, 0.9);

  const glassBase = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.16, 0.06), trimMat);
  glassBase.position.set(0.4, 0.08, 0.9);

  const glassTop = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.16, 0.06), trimMat);
  glassTop.position.set(0.4, WALL_H - 0.08, 0.9);

  const glassPane = new THREE.Mesh(new THREE.BoxGeometry(7.4, WALL_H - 0.32, 0.04), glassMat);
  glassPane.position.set(0.4, WALL_H / 2, 0.9);

  archGroup.add(meetWallLeft, glassBase, glassTop, glassPane);

  // Glass mullions
  [-2.0, 0.4, 2.8].forEach((xPos) => {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.05, WALL_H - 0.16, 0.07), trimMat);
    mullion.position.set(xPos, WALL_H / 2, 0.9);
    archGroup.add(mullion);
  });

  // Meeting Room Entry Wall & Lintel
  const meetWallRight = new THREE.Mesh(new THREE.BoxGeometry(0.7, WALL_H, 0.2), wallMat);
  meetWallRight.position.set(5.55, WALL_H / 2, 0.9);
  const meetHeader = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.2), wallMat);
  meetHeader.position.set(4.6, WALL_H - 0.2, 0.9);
  archGroup.add(meetWallRight, meetHeader);

  return archGroup;
}

interface OfficeSceneRuntimeState {
  lights: Record<string, { light: THREE.PointLight; fixture?: THREE.Group; def: OfficeZoneDefinition }>;
  lenses: Record<string, THREE.MeshStandardMaterial>;
  badges: Record<string, { mesh: THREE.Mesh; name: string }>;
  hitboxes: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[];
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
}

export function OfficeScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const occupancy = useOccupancyStore((state) => state.occupancy);
  const toggle = useOccupancyStore((state) => state.toggleOccupancy);
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);

  // References for runtime dynamic light updates
  const sceneStateRef = useRef<OfficeSceneRuntimeState>({
    lights: {},
    lenses: {},
    badges: {},
    hitboxes: [],
    scene: null,
    camera: null,
    renderer: null,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 14, 12);
    camera.lookAt(0, 0, 0);

    // Ambient/Hemisphere illumination
    const hemiLight = new THREE.HemisphereLight(0xf8fafc, 0x0f172a, 0.45);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.65);
    sunLight.position.set(8, 14, 6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 30;
    sunLight.shadow.camera.left = -8;
    sunLight.shadow.camera.right = 8;
    sunLight.shadow.camera.top = 8;
    sunLight.shadow.camera.bottom = -8;
    scene.add(sunLight);

    // Office Architecture
    const architecture = buildOfficeArchitecture();
    scene.add(architecture);

    // Office A props
    const deskA = createOfficeDesk();
    deskA.position.set(-3.2, 0, -3.2);
    const chairA = createOfficeChair();
    chairA.position.set(-3.2, 0, -2.5);
    chairA.rotation.y = Math.PI;
    const plantA = createPottedPlant();
    plantA.position.set(-5.2, 0, -4.2);

    const cabinetA = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.9, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
    );
    cabinetA.position.set(-5.3, 0.45, -2.5);
    cabinetA.castShadow = true;
    scene.add(deskA, chairA, plantA, cabinetA);

    // Office B props
    const deskB1 = createOfficeDesk();
    deskB1.position.set(2.4, 0, -3.2);
    const chairB1 = createOfficeChair();
    chairB1.position.set(2.4, 0, -2.5);
    chairB1.rotation.y = Math.PI;

    const deskB2 = createOfficeDesk();
    deskB2.position.set(4.3, 0, -3.2);
    const chairB2 = createOfficeChair();
    chairB2.position.set(4.3, 0, -2.5);
    chairB2.rotation.y = Math.PI;

    const plantB = createPottedPlant();
    plantB.position.set(5.2, 0, -4.2);
    scene.add(deskB1, chairB1, deskB2, chairB2, plantB);

    // Meeting Room props
    const conferenceTable = createMeetingTableSet();
    conferenceTable.position.set(0, 0, 2.95);

    // Presentation Screen
    const screenMount = new THREE.Group();
    screenMount.position.set(0, 1.15, 4.88);
    const screenFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 1.2, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.2, metalness: 0.9 })
    );
    const screenGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(2.7, 1.1),
      new THREE.MeshBasicMaterial({ color: 0x0284c7 })
    );
    screenGlass.position.set(0, 0, -0.03);
    screenGlass.rotation.y = Math.PI;
    screenMount.add(screenFrame, screenGlass);

    const plantM1 = createPottedPlant();
    plantM1.position.set(-5.2, 0, 4.3);
    const plantM2 = createPottedPlant();
    plantM2.position.set(5.2, 0, 4.3);
    scene.add(conferenceTable, screenMount, plantM1, plantM2);

    const lightsMap: Record<string, { light: THREE.PointLight; fixture?: THREE.Group; def: OfficeZoneDefinition }> = {};
    const lensesMap: Record<string, THREE.MeshStandardMaterial> = {};
    const badgesMap: Record<string, { mesh: THREE.Mesh; name: string }> = {};
    const hitboxes: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];

    const initialOcc = useOccupancyStore.getState().occupancy;

    ZONE_DEFINITIONS.forEach((z) => {
      // Dynamic SectorLight Fixture
      const { fixtureGroup, lensMat } = createSectorLightFixture(z.lightColor);
      fixtureGroup.position.set(z.lightPos[0], z.lightPos[1], z.lightPos[2]);
      scene.add(fixtureGroup);

      const pLight = new THREE.PointLight(
        z.lightColor,
        initialOcc[z.id] ? z.activeIntensity : z.idleIntensity,
        z.distance,
        2
      );
      pLight.position.set(z.lightPos[0], z.lightPos[1] - 0.15, z.lightPos[2]);
      pLight.castShadow = true;
      pLight.shadow.bias = -0.0001;
      scene.add(pLight);

      lightsMap[z.id] = { light: pLight, def: z };
      lensesMap[z.id] = lensMat;

      // Floating Zone Status Badge Billboard
      const badgeGeo = new THREE.PlaneGeometry(2.2, 0.55);
      const initialTex = createZoneBadgeTexture(z.name, initialOcc[z.id]);
      const badgeMat = new THREE.MeshBasicMaterial({
        map: initialTex,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
      badgeMesh.position.set(z.bounds.center[0], 2.3, z.bounds.center[2]);
      scene.add(badgeMesh);
      badgesMap[z.id] = { mesh: badgeMesh, name: z.name };

      // Raycast Floor Hitbox
      const hitGeo = new THREE.PlaneGeometry(z.bounds.width, z.bounds.depth);
      const hitMat = new THREE.MeshBasicMaterial({
        color: initialOcc[z.id] ? 0x38bdf8 : 0x94a3b8,
        transparent: true,
        opacity: 0.0,
      });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.rotation.x = -Math.PI / 2;
      hitMesh.position.set(z.bounds.center[0], 0.015, z.bounds.center[2]);
      hitMesh.userData = { zoneId: z.id };
      scene.add(hitMesh);
      hitboxes.push(hitMesh);
    });

    sceneStateRef.current = {
      lights: lightsMap,
      lenses: lensesMap,
      badges: badgesMap,
      hitboxes,
      scene,
      camera,
      renderer,
    };

    let isDragging = false;
    let isPanning = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let spherical = { radius: 19, theta: 0.0, phi: 0.85 };
    let target = new THREE.Vector3(0, 0.5, 0);

    const updateCameraPosition = () => {
      spherical.phi = Math.max(0.1, Math.min(Math.PI / 2.1, spherical.phi));
      spherical.radius = Math.max(4, Math.min(30, spherical.radius));

      camera.position.x =
        target.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = target.y + spherical.radius * Math.cos(spherical.phi);
      camera.position.z =
        target.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(target);
    };
    updateCameraPosition();

    // Raycasting setup
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 2 || e.shiftKey) {
        isPanning = true;
      } else if (e.button === 0) {
        isDragging = true;
      }
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        spherical.theta -= deltaX * 0.006;
        spherical.phi -= deltaY * 0.006;
        updateCameraPosition();
      } else if (isPanning) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
        target.addScaledVector(right, -deltaX * 0.015);
        target.addScaledVector(forward, deltaY * 0.015);
        updateCameraPosition();
      } else {
        // Floor hover detection
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(hitboxes);
        if (intersects.length > 0) {
          const hoveredId = intersects[0].object.userData.zoneId;
          setActiveHoverId(hoveredId);
          hitboxes.forEach((hb) => {
            (hb.material as THREE.MeshBasicMaterial).opacity =
              hb.userData.zoneId === hoveredId ? 0.16 : 0.0;
          });
        } else {
          setActiveHoverId(null);
          hitboxes.forEach((hb) => {
            (hb.material as THREE.MeshBasicMaterial).opacity = 0.0;
          });
        }
      }

      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      // Raycast click zone toggle
      if (isDragging) {
        const moveDist = Math.hypot(e.clientX - prevMouseX, e.clientY - prevMouseY);
        if (moveDist < 5) {
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(hitboxes);
          if (intersects.length > 0) {
            const clickedId = intersects[0].object.userData.zoneId as string;
            useOccupancyStore.getState().toggleOccupancy(clickedId);
          }
        }
      }
      isDragging = false;
      isPanning = false;
    };

    const onWheel = (e: WheelEvent) => {
      spherical.radius += e.deltaY * 0.01;
      updateCameraPosition();
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domEl.addEventListener('wheel', onWheel, { passive: true });
    domEl.addEventListener('contextmenu', onContextMenu);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const currentOcc = useOccupancyStore.getState().occupancy;

      // Smooth lerp for sector lights and lens emissive power
      ZONE_DEFINITIONS.forEach((z) => {
        const isOcc = currentOcc[z.id];
        const targetIntensity = isOcc ? z.activeIntensity : z.idleIntensity;
        const targetEmissive = isOcc ? 1.8 : 0.2;

        const lightObj = lightsMap[z.id];
        if (lightObj && lightObj.light) {
          lightObj.light.intensity = THREE.MathUtils.lerp(
            lightObj.light.intensity,
            targetIntensity,
            delta * 6
          );
        }

        const lensMat = lensesMap[z.id];
        if (lensMat) {
          lensMat.emissiveIntensity = THREE.MathUtils.lerp(
            lensMat.emissiveIntensity,
            targetEmissive,
            delta * 6
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
    const { badges } = sceneStateRef.current;
    if (!badges) return;

    Object.keys(badges).forEach((zoneId) => {
      const isOcc = occupancy[zoneId];
      const badgeInfo = badges[zoneId];
      if (badgeInfo && badgeInfo.mesh) {
        const newTexture = createZoneBadgeTexture(badgeInfo.name, isOcc);
        if (newTexture) {
          const mat = badgeInfo.mesh.material as THREE.MeshBasicMaterial;
          if (mat) {
            const oldMap = mat.map;
            if (oldMap) oldMap.dispose();
            mat.map = newTexture;
            mat.needsUpdate = true;
          }
        }
      }
    });
  }, [occupancy]);

  return (
    <div className="relative w-full h-screen bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between pointer-events-none gap-3">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 px-4 py-2.5 rounded-xl shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
            </span>
            <h1 className="text-sm font-bold tracking-wide text-sky-400 uppercase">
              Smart Office 3D · Native Engine
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any floor zone or use toggle buttons to automate occupancy & lighting
          </p>
        </div>

        {/* Room Toggle Pills */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {[
            { id: 'office-a', label: 'Office A' },
            { id: 'office-b', label: 'Office B' },
            { id: 'meeting-room', label: 'Meeting Room' },
            { id: 'corridor', label: 'Corridor' },
          ].map((zone) => {
            const isOcc = occupancy[zone.id];
            const isHovered = activeHoverId === zone.id;
            return (
              <button
                key={zone.id}
                onClick={() => toggle(zone.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all shadow-md active:scale-95 ${
                  isOcc
                    ? 'bg-sky-500/20 border-sky-400/50 text-sky-200 hover:bg-sky-500/30'
                    : 'bg-slate-900/80 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                } ${isHovered ? 'ring-2 ring-sky-400/60' : ''}`}
              >
                <span
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isOcc ? 'bg-emerald-400 shadow-[0_0_8px_#22c55e]' : 'bg-slate-500'
                  }`}
                />
                {zone.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation Hint Overlay */}
      <div className="absolute bottom-4 left-4 bg-slate-900/85 backdrop-blur-md border border-slate-800 px-3.5 py-1.5 rounded-lg text-[11px] text-slate-400 pointer-events-none shadow-lg">
        Left Click + Drag: Rotate · Right Click / Shift + Drag: Pan · Scroll: Zoom · Click Floor: Toggle Zone
      </div>
    </div>
  );
}

export default OfficeScene;