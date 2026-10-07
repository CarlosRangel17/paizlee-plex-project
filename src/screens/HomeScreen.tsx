import { useMemo } from 'react'
import { MediaRow, MetadataRow, RowSkeleton } from '@/components/MediaRow'
import { PosterCard } from '@/components/PosterCard'
import { LibraryErrorPanel, PageHeader } from '@/components/StatusPanel'
import { usePlexLibrary, type LibraryState } from '@/context/PlexLibraryContext'
import { useProfiles } from '@/context/ProfileContext'
import { recentlyAdded } from '@/lib/library'
import type { WatchEntry } from '@/types/app'
import type { Metadatum } from '@/types/plex'

interface HomeScreenProps {
  onSelectItem: (m: Metadatum) => void
  onResume: (entry: WatchEntry) => void
}

export function HomeScreen({ onSelectItem, onResume }: HomeScreenProps) {
  const { movies, shows } = usePlexLibrary()
  const { activeProfile, continueWatching } = useProfiles()

  const recentMovies = useMemo(() => recentlyAdded(movies.items), [movies.items])
  const recentShows = useMemo(() => recentlyAdded(shows.items), [shows.items])

  return (
    <>
      <PageHeader eyebrow={`Welcome back, ${activeProfile.name}`} title="Home" />

      {movies.status === 'error' && movies.error ? (
        <LibraryErrorPanel message={movies.error} />
      ) : (
        <>
          <MediaRow
            title="Continue Watching"
            isEmpty={continueWatching.length === 0}
            emptyMessage={`Nothing in progress for ${activeProfile.name}. Start a movie and it will show up here.`}
          >
            {continueWatching.map((entry) => (
              <PosterCard
                key={entry.ratingKey}
                title={entry.title}
                subtitle={entry.subtitle}
                thumb={entry.thumb}
                progress={entry.durationMs ? entry.positionMs / entry.durationMs : undefined}
                onSelect={() => onResume(entry)}
              />
            ))}
          </MediaRow>

          <LibraryRow
            state={movies}
            title="Recently Added Movies"
            items={recentMovies}
            onSelect={onSelectItem}
          />
          <LibraryRow
            state={shows}
            title="Recently Added TV Shows"
            items={recentShows}
            onSelect={onSelectItem}
            emptyMessage="No TV library was found on this Plex server."
          />
        </>
      )}
    </>
  )
}

function LibraryRow({
  state,
  title,
  items,
  onSelect,
  emptyMessage,
}: {
  state: LibraryState
  title: string
  items: Metadatum[]
  onSelect: (m: Metadatum) => void
  emptyMessage?: string
}) {
  if (state.status === 'loading' || state.status === 'idle') return <RowSkeleton title={title} />
  if (state.status === 'error') {
    return <MediaRow title={title} isEmpty emptyMessage={state.error ?? 'Could not load this library.'}>{null}</MediaRow>
  }
  return <MetadataRow row={{ id: title, title, items }} onSelect={onSelect} emptyMessage={emptyMessage} />
}
