/// <reference types="vite/client" />

interface ImportMetaEnv {
  // frontend currently does not require custom environment variables
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
