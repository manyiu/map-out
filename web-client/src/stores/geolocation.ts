import { create } from "zustand";

interface Geolocation {
  geolocation: GeolocationPosition | null;
  setGeolocation: (geolocation: GeolocationPosition) => void;
}

const useGeolocationStore = create<Geolocation>((set) => ({
  geolocation: null,
  setGeolocation: (geolocation: GeolocationPosition) => set({ geolocation }),
}));

export { useGeolocationStore };
