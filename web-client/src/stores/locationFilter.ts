import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface LocationFilter {
  kmb: boolean;
  citybus: boolean;
  gmb: boolean;
  rvm: boolean;
  setKmb: (kmb: boolean) => void;
  setCitybus: (citybus: boolean) => void;
  setGmb: (gmb: boolean) => void;
  setRvm: (rvm: boolean) => void;
  setTransportation: (value: boolean) => void;
  setAll: (value: boolean) => void;
}

const useLocationFilterStore = create<LocationFilter>()(
  persist(
    (set) => ({
      kmb: true,
      citybus: true,
      gmb: true,
      rvm: false,
      setKmb: (kmb: boolean) => set({ kmb }),
      setCitybus: (citybus: boolean) => set({ citybus }),
      setGmb: (gmb: boolean) => set({ gmb }),
      setRvm: (rvm: boolean) => set({ rvm }),
      setTransportation: (value: boolean) =>
        set({ kmb: value, citybus: value, gmb: value }),
      setAll: (value: boolean) =>
        set({ kmb: value, citybus: value, gmb: value, rvm: value }),
    }),
    {
      name: "locationFilter",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export { useLocationFilterStore };
