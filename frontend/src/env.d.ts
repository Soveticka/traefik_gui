/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRAEFIK_BEARER_TOKEN: string
  readonly VITE_TRAEFIK_API_KEY: string
  readonly VITE_TRAEFIK_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}