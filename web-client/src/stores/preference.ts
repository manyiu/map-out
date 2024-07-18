import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export enum Language {
  EN_US = "en",
  ZH_HK = "tc",
  ZH_CN = "sc",
}

export enum Mode {
  Map = "map",
  List = "list",
}

export interface Preference {
  language: Language;
  mode: Mode;
  radius: number;
  refetchInterval: number;
  setLanguage: (language: Language) => void;
  setMode: (mode: Mode) => void;
  setRadius: (radius: number) => void;
  setRefetchInterval: (refetchInterval: number) => void;
}

const usePreferenceStore = create<Preference>()(
  persist(
    (set) => ({
      language: Language.ZH_HK,
      mode: Mode.Map,
      radius: 100,
      refetchInterval: 1000 * 30,
      setLanguage: (language: Language) => set({ language }),
      setMode: (mode: Mode) => set({ mode }),
      setRadius: (radius: number) => set({ radius }),
      setRefetchInterval: (refetchInterval: number) => set({ refetchInterval }),
    }),
    {
      name: "preference",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export { usePreferenceStore };
