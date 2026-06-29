/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MVP_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
