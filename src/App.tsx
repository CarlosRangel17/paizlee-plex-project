import { useCallback, useEffect, useRef, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { PlexLibraryProvider, usePlexLibrary } from '@/context/PlexLibraryContext'
import { ProfileProvider } from '@/context/ProfileContext'
import { captureFocus, focusElement, focusFirstIn, useSpatialNavigation } from '@/navigation/useSpatialNavigation'
import { DetailsOverlay } from '@/overlays/DetailsOverlay'
import { PlayerOverlay } from '@/overlays/PlayerOverlay'
import { HomeScreen } from '@/screens/HomeScreen'
import { LibraryScreen } from '@/screens/LibraryScreen'
import { ProfilesScreen } from '@/screens/ProfilesScreen'
import { SearchOverlay } from '@/screens/SearchOverlay'
import type { PlayableItem, PlaybackRequest, ScreenId, WatchEntry } from '@/types/app'
import type { Metadatum } from '@/types/plex'

function focusActiveNav() {
  const el = document.querySelector<HTMLElement>('[data-nav-active]')
  if (el) focusElement(el)
}

function playableFromEntry({ positionMs: _p, updatedAt: _u, ...item }: WatchEntry): PlayableItem {
  return item
}

/** Overlay state paired with the focus-restore callback captured when it opened. */
function useOverlay<T>() {
  const [value, setValue] = useState<T | null>(null)
  const isOpenRef = useRef(false)
  const restoreRef = useRef<(() => void) | null>(null)

  const open = useCallback((next: T) => {
    if (!isOpenRef.current) restoreRef.current = captureFocus()
    isOpenRef.current = true
    setValue(next)
  }, [])

  const close = useCallback(() => {
    isOpenRef.current = false
    setValue(null)
    const restore = restoreRef.current
    restoreRef.current = null
    requestAnimationFrame(() => restore?.())
  }, [])

  return [value, open, close] as const
}

function Shell() {
  const { findByRatingKey } = usePlexLibrary()
  const [screen, setScreen] = useState<ScreenId>('home')
  const [searchOpen, openSearch, closeSearch] = useOverlay<true>()
  const [details, openDetails, closeDetails] = useOverlay<Metadatum>()
  const [playback, openPlayer, closePlayer] = useOverlay<PlaybackRequest>()
  const mainRef = useRef<HTMLElement>(null)

  useSpatialNavigation(focusActiveNav)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (!mainRef.current || !focusFirstIn(mainRef.current)) focusActiveNav()
    })
    return () => cancelAnimationFrame(id)
  }, [screen])

  const navigate = useCallback(
    (next: ScreenId) => {
      if (searchOpen) closeSearch()
      setScreen(next)
      window.scrollTo({ top: 0 })
    },
    [searchOpen, closeSearch],
  )

  const resume = useCallback(
    (entry: WatchEntry) => {
      const movie = entry.type === 'movie' ? findByRatingKey(entry.ratingKey) : undefined
      if (movie) openDetails(movie)
      else openPlayer({ item: playableFromEntry(entry), startMs: entry.positionMs })
    },
    [findByRatingKey, openDetails, openPlayer],
  )

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(178,77,255,0.10),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(59,33,96,0.35),transparent_60%)]"
      />

      <div inert={searchOpen !== null || details !== null || playback !== null}>
        <Sidebar screen={screen} searchOpen={searchOpen !== null} onNavigate={navigate} onOpenSearch={() => openSearch(true)} />

        <main ref={mainRef} data-focus-region="main" className="relative ml-72 min-h-screen px-14 py-12">
          {screen === 'home' && <HomeScreen onSelectItem={openDetails} onResume={resume} />}
          {screen === 'movies' && <LibraryScreen key="movies" kind="movies" onSelectItem={openDetails} />}
          {screen === 'tv' && <LibraryScreen key="tv" kind="tv" onSelectItem={openDetails} />}
          {screen === 'profiles' && <ProfilesScreen />}
        </main>
      </div>

      {searchOpen && (
        <div inert={details !== null || playback !== null}>
          <SearchOverlay onClose={closeSearch} onSelectItem={openDetails} />
        </div>
      )}
      {details && (
        <div inert={playback !== null}>
          <DetailsOverlay key={details.ratingKey} item={details} onClose={closeDetails} onPlay={openPlayer} onSelectRelated={openDetails} />
        </div>
      )}
      {playback && <PlayerOverlay request={playback} onClose={closePlayer} />}
    </div>
  )
}

export default function App() {
  return (
    <PlexLibraryProvider>
      <ProfileProvider>
        <Shell />
      </ProfileProvider>
    </PlexLibraryProvider>
  )
}
