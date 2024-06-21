import { LatLngBounds } from "leaflet";
import { create } from "zustand";

interface Bounds {
  bounds: LatLngBounds | null;
  setBounds: (bounds: LatLngBounds) => void;
}

const useBoundsStore = create<Bounds>((set) => ({
  bounds: null,
  setBounds: (bounds: LatLngBounds) => set({ bounds }),
}));

export { useBoundsStore };
