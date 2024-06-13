import { LatLngBounds } from "leaflet";
import { create } from "zustand";

interface Bounds {
  bounds: LatLngBounds;
  setBounds: (bounds: LatLngBounds) => void;
}

const useBoundsStore = create<Bounds>((set) => ({
  bounds: new LatLngBounds({ lat: NaN, lng: NaN }, { lat: NaN, lng: NaN }),
  setBounds: (bounds: LatLngBounds) => set({ bounds }),
}));

export { useBoundsStore };
