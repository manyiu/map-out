import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export enum Language {
  EN = "en",
  ZH_HK = "zh-HK",
  ZH_CN = "zh-CN",
}

export enum Mode {
  Map = "map",
  List = "list",
}

export interface Preference {
  language: Language;
  mode: Mode;
  radius: number;
}

const usePreferenceStore = create<Preference>()(
  persist(
    (set) => ({
      language: Language.ZH_HK,
      mode: Mode.Map,
      radius: 100,
      setLanguage: (language: Language) => set({ language }),
      setMode: (mode: Mode) => set({ mode }),
      setRadius: (radius: number) => set({ radius }),
    }),
    {
      name: "preference",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export { usePreferenceStore };
