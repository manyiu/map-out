/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GITHUB_REF_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
