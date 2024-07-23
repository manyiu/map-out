import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Source } from "../components/Map/types";

export enum Language {
  EN_US = "en",
  ZH_HK = "tc",
  ZH_CN = "sc",
}

export enum Mode {
  Map = "map",
  List = "list",
}

interface Preference {
  language: Language;
  source: Source;
  mode: Mode;
  radius: number;
  refetchInterval: number;
  minDisplayZoom: number;
  setLanguage: (language: Language) => void;
  setSource: (mapSource: Source) => void;
  setMode: (mode: Mode) => void;
  setRadius: (radius: number) => void;
  setRefetchInterval: (refetchInterval: number) => void;
  setMinDisplayZoom: (minDisplayZoom: number) => void;
}

const usePreferenceStore = create<Preference>()(
  persist(
    (set) => ({
      language: Language.ZH_HK,
      source: Source.OpenStreetMap,
      mode: Mode.Map,
      radius: 100,
      refetchInterval: 1000 * 30,
      minDisplayZoom: 15,
      setLanguage: (language: Language) => set({ language }),
      setSource: (source: Source) => set({ source }),
      setMode: (mode: Mode) => set({ mode }),
      setRadius: (radius: number) => set({ radius }),
      setRefetchInterval: (refetchInterval: number) => set({ refetchInterval }),
      setMinDisplayZoom: (minDisplayZoom: number) => set({ minDisplayZoom }),
    }),
    {
      name: "preference",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export { usePreferenceStore };
