/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HF_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
