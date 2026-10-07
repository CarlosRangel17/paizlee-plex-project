import { PLEX_CONFIG, PLEX_JSON_HEADERS, plexIdentityParams } from '@/config/plex'
import type {
  LibraryResponse,
  LibrarySection,
  LibrarySectionsResponse,
  Metadatum,
} from '@/types/plex'

export class PlexRequestError extends Error {
  readonly status: number | null

  constructor(message: string, status: number | null) {
    super(message)
    this.name = 'PlexRequestError'
    this.status = status
  }
}

function buildUrl(path: string, params: Record<string, string | number> = {}): string {
  const url = new URL(path, `${PLEX_CONFIG.serverUrl}/`)
  for (const [k, v] of Object.entries({ ...params, ...plexIdentityParams() })) {
    url.searchParams.set(k, String(v))
  }
  return url.toString()
}

async function plexGet<T>(path: string, signal?: AbortSignal, params?: Record<string, string | number>): Promise<T> {
  let res: Response
  try {
    res = await fetch(buildUrl(path, params), { headers: PLEX_JSON_HEADERS, signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new PlexRequestError(
      `Could not reach Plex at ${PLEX_CONFIG.serverUrl}. Check that the SHIELD is on the same network, and that this page is not served over HTTPS (mixed content is blocked).`,
      null,
    )
  }
  if (!res.ok) {
    const hint = res.status === 401 ? ' — the X-Plex-Token was rejected.' : ''
    throw new PlexRequestError(`Plex responded ${res.status} for ${path}${hint}`, res.status)
  }
  return (await res.json()) as T
}

export async function fetchLibrarySections(signal?: AbortSignal): Promise<LibrarySection[]> {
  const data = await plexGet<LibrarySectionsResponse>('/library/sections', signal)
  return data.MediaContainer.Directory ?? []
}

export async function fetchLibraryItems(sectionKey: string, signal?: AbortSignal): Promise<Metadatum[]> {
  const data = await plexGet<LibraryResponse>(`/library/sections/${sectionKey}/all`, signal)
  return data.MediaContainer.Metadata ?? []
}

/** Every episode of a show, in season/episode order. */
export async function fetchShowEpisodes(showRatingKey: string, signal?: AbortSignal): Promise<Metadatum[]> {
  const data = await plexGet<LibraryResponse>(`/library/metadata/${showRatingKey}/allLeaves`, signal)
  return data.MediaContainer.Metadata ?? []
}

/** Resized poster/thumbnail via the Plex photo transcoder, so 1,000+ tiles stay light. */
export function posterUrl(path: string | undefined, width = 300, height = 450): string | undefined {
  if (!path) return undefined
  return buildUrl('/photo/:/transcode', {
    width,
    height,
    minSize: 1,
    upscale: 1,
    url: path,
  })
}

/** Original, full-resolution artwork (e.g. the fanart chosen on the server). */
export function originalArtUrl(path: string | undefined): string | undefined {
  if (!path) return undefined
  const url = new URL(path, `${PLEX_CONFIG.serverUrl}/`)
  url.searchParams.set('X-Plex-Token', PLEX_CONFIG.token)
  return url.toString()
}

export interface StreamOptions {
  ratingKey: string
  offsetSeconds?: number
  session: string
}

/** Universal transcoder start URL for the native <video> element. */
export function transcodeStreamUrl({ ratingKey, offsetSeconds = 0, session }: StreamOptions): string {
  return buildUrl('/video/:/transcode/universal/start', {
    path: `${PLEX_CONFIG.serverUrl}/library/metadata/${ratingKey}`,
    mediaIndex: 0,
    partIndex: 0,
    protocol: 'http',
    offset: Math.max(0, Math.floor(offsetSeconds)),
    fastSeek: 1,
    directPlay: 0,
    directStream: 1,
    subtitleSize: 100,
    audioBoost: 100,
    session,
  })
}

/** Tells the server to tear down a transcode session; best-effort. */
export function stopTranscodeSession(session: string): void {
  void fetch(buildUrl('/video/:/transcode/universal/stop', { session }), {
    headers: PLEX_JSON_HEADERS,
    keepalive: true,
  }).catch(() => undefined)
}
