import { create } from 'zustand';

// Central occupancy registry. Every Zone reads/writes here, and any
// UI overlay (stats panel, energy-saved %) can subscribe to the same store.
export const useZoneStore = create((set) => ({
  zones: {},
  officeComplexZones: {},
  storageFacilityZones: {},

  registerZone: (id, initial = { occupied: false, intensity: 0 }) =>
    set((state) => ({
      zones: { ...state.zones, [id]: initial },
    })),

  setOccupied: (id, occupied) =>
    set((state) => ({
      zones: {
        ...state.zones,
        [id]: { ...state.zones[id], occupied },
      },
    })),

  registerOfficeComplexZone: (id, initial = { occupied: false, intensity: 0 }) =>
    set((state) => ({
      officeComplexZones: { ...state.officeComplexZones, [id]: initial },
    })),

  setOfficeComplexOccupied: (id, occupied) =>
    set((state) => ({
      officeComplexZones: {
        ...state.officeComplexZones,
        [id]: { ...state.officeComplexZones[id], occupied },
      },
    })),

  registerStorageFacilityZone: (id, initial = { occupied: false, intensity: 0 }) =>
    set((state) => ({
      storageFacilityZones: { ...state.storageFacilityZones, [id]: initial },
    })),

  setStorageFacilityOccupied: (id, occupied) =>
    set((state) => ({
      storageFacilityZones: {
        ...state.storageFacilityZones,
        [id]: { ...state.storageFacilityZones[id], occupied },
      },
    })),
}));
