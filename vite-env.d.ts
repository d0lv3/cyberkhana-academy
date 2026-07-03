/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API base URL — defaults to http://localhost:5002/api */
  readonly VITE_API_URL?: string;
  /** Google Identity Services client id — enables real Google sign-in */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** JSCPP ships no types — it's a C/C++ interpreter used by the client-side runner. */
declare module 'JSCPP';
