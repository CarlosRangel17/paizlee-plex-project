/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PLEX_SERVER_URL?: string
  readonly VITE_PLEX_TOKEN?: string
  readonly VITE_PLEX_MOVIE_SECTION?: string
  readonly VITE_PLEX_TV_SECTION?: string
  readonly VITE_PLEX_PRODUCT?: string
  readonly VITE_PLEX_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
