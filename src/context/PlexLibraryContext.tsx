import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchLibraryItems, fetchLibrarySections, PlexRequestError } from '@/api/plexClient'
import { PLEX_CONFIG } from '@/config/plex'
import type { Metadatum } from '@/types/plex'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface LibraryState {
  status: LoadStatus
  items: Metadatum[]
  error: string | null
  sectionKey: string | null
}

interface PlexLibraryValue {
  movies: LibraryState
  shows: LibraryState
  /** Aggregate connection state for the sidebar telemetry LED. */
  connection: 'connecting' | 'online' | 'error'
  findByRatingKey: (ratingKey: string) => Metadatum | undefined
  reload: () => void
}

const initialState: LibraryState = { status: 'idle', items: [], error: null, sectionKey: null }

const PlexLibraryContext = createContext<PlexLibraryValue | null>(null)

const messageOf = (err: unknown): string =>
  err instanceof PlexRequestError || err instanceof Error ? err.message : 'Unknown error contacting Plex.'

const isAbort = (err: unknown) => err instanceof DOMException && err.name === 'AbortError'

export function PlexLibraryProvider({ children }: { children: ReactNode }) {
  const [movies, setMovies] = useState<LibraryState>(initialState)
  const [shows, setShows] = useState<LibraryState>(initialState)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    const movieKey = PLEX_CONFIG.movieSection
    setMovies({ status: 'loading', items: [], error: null, sectionKey: movieKey })
    fetchLibraryItems(movieKey, signal)
      .then((items) => setMovies({ status: 'ready', items, error: null, sectionKey: movieKey }))
      .catch((err: unknown) => {
        if (!isAbort(err)) setMovies({ status: 'error', items: [], error: messageOf(err), sectionKey: movieKey })
      })

    setShows({ ...initialState, status: 'loading' })
    const resolveTvKey = PLEX_CONFIG.tvSection
      ? Promise.resolve<string | null>(PLEX_CONFIG.tvSection)
      : fetchLibrarySections(signal).then((sections) => sections.find((s) => s.type === 'show')?.key ?? null)

    resolveTvKey
      .then(async (tvKey) => {
        if (!tvKey) {
          setShows({ status: 'ready', items: [], error: null, sectionKey: null })
          return
        }
        const items = await fetchLibraryItems(tvKey, signal)
        setShows({ status: 'ready', items, error: null, sectionKey: tvKey })
      })
      .catch((err: unknown) => {
        if (!isAbort(err)) setShows({ status: 'error', items: [], error: messageOf(err), sectionKey: null })
      })

    return () => controller.abort()
  }, [reloadToken])

  const index = useMemo(() => {
    const map = new Map<string, Metadatum>()
    for (const m of movies.items) map.set(m.ratingKey, m)
    for (const m of shows.items) map.set(m.ratingKey, m)
    return map
  }, [movies.items, shows.items])

  const findByRatingKey = useCallback((key: string) => index.get(key), [index])
  const reload = useCallback(() => setReloadToken((n) => n + 1), [])

  const connection: PlexLibraryValue['connection'] =
    movies.status === 'error' ? 'error' : movies.status === 'ready' ? 'online' : 'connecting'

  const value = useMemo<PlexLibraryValue>(
    () => ({ movies, shows, connection, findByRatingKey, reload }),
    [movies, shows, connection, findByRatingKey, reload],
  )

  return <PlexLibraryContext.Provider value={value}>{children}</PlexLibraryContext.Provider>
}

export function usePlexLibrary(): PlexLibraryValue {
  const ctx = useContext(PlexLibraryContext)
  if (!ctx) throw new Error('usePlexLibrary must be used inside <PlexLibraryProvider>')
  return ctx
}
