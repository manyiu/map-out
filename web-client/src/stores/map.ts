import { LatLngBounds } from "leaflet";
import { create } from "zustand";

interface Map {
  bounds: LatLngBounds | null;
  zoom: number;
  setBounds: (bounds: LatLngBounds) => void;
  setZoom: (zoom: number) => void;
}

const useMapStore = create<Map>((set) => ({
  bounds: null,
  zoom: 18,
  setBounds: (bounds: LatLngBounds) => set({ bounds }),
  setZoom: (zoom: number) => set({ zoom }),
}));

export { useMapStore };
