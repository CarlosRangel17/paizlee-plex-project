const env = import.meta.env

export const PLEX_CONFIG = {
  serverUrl: (env.VITE_PLEX_SERVER_URL ?? 'http://192.168.1.100:32400').replace(/\/+$/, ''),
  token: env.VITE_PLEX_TOKEN ?? '',
  movieSection: env.VITE_PLEX_MOVIE_SECTION || '2',
  tvSection: env.VITE_PLEX_TV_SECTION || null,
  product: env.VITE_PLEX_PRODUCT ?? 'PaizleePlexProject',
  clientIdentifier: env.VITE_PLEX_CLIENT_ID ?? 'Paizlee-Plex-Project-MacBook-Client',
} as const

/**
 * Plex identity values. Sent as query params rather than request headers:
 * Plex accepts both, and custom `X-Plex-*` headers would force a CORS preflight
 * that the server does not always answer for arbitrary origins.
 */
export function plexIdentityParams(): Record<string, string> {
  return {
    'X-Plex-Token': PLEX_CONFIG.token,
    'X-Plex-Product': PLEX_CONFIG.product,
    'X-Plex-Client-Identifier': PLEX_CONFIG.clientIdentifier,
    'X-Plex-Platform': 'Chrome',
    'X-Plex-Device': 'Browser',
  }
}

export const PLEX_JSON_HEADERS: HeadersInit = { Accept: 'application/json' }
