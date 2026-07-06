/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional registration submit endpoint. When unset, a placeholder submitter is used. */
  readonly VITE_REGISTRATION_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
