/// <reference types="vite/client" />

declare const __firebase_config: string;
declare const __app_id: string;

interface ImportMetaEnv {
  readonly VITE_FIREBASE_CONFIG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
