import { create } from 'zustand';

// Central occupancy registry. Every Zone reads/writes here, and any
// UI overlay (stats panel, energy-saved %) can subscribe to the same store.
export const useZoneStore = create((set) => ({
  zones: {},

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
}));
