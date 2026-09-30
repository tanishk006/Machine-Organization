import React from 'react';
import OfficeComplexScene from './OfficeComplexScene';
import OfficeScene from './OfficeScene';
import HouseScene from './HouseScene';
import StorageFacilityScene from './StorageFacilityScene';

export {
  OfficeComplexScene,
  OfficeScene,
  HouseScene,
  StorageFacilityScene,
};

export interface SceneRegistryItem {
  id: string;
  label: string;
  category: string;
  hint: string;
  component: React.ComponentType;
}

export const SCENE_REGISTRY: SceneRegistryItem[] = [
  {
    id: 'officeComplex',
    label: 'Office Complex',
    category: 'Commercial',
    hint: 'Multi-zone flow · Click floor or WASD to walk',
    component: OfficeComplexScene,
  },
  {
    id: 'office',
    label: 'Office Suites',
    category: 'Corporate',
    hint: 'Focus & team rooms · Click floor to toggle zones',
    component: OfficeScene,
  },
  {
    id: 'house',
    label: 'Single Family House',
    category: 'Residential',
    hint: '4-room residence · WASD or click floor to move',
    component: HouseScene,
  },
  {
    id: 'storage',
    label: 'Storage Facility',
    category: 'Industrial',
    hint: 'Warehouse & forklift · E to mount/dismount',
    component: StorageFacilityScene,
  },
];

export const SCENE_MAP: Record<string, SceneRegistryItem> = Object.fromEntries(
  SCENE_REGISTRY.map((scene) => [scene.id, scene])
);
