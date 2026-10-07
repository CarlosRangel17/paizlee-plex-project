import { useMemo, useState } from 'react'
import { CategoryDropdown, type DropdownGroup } from '@/components/CategoryDropdown'
import { MetadataRow, RowSkeleton } from '@/components/MediaRow'
import { LibraryErrorPanel, PageHeader } from '@/components/StatusPanel'
import { buildCuratedRows, CURATED_CATEGORIES } from '@/config/curatedRows'
import { usePlexLibrary } from '@/context/PlexLibraryContext'
import {
  byScore,
  byTitle,
  genresByCount,
  hasGenre,
  recentlyAdded,
  ROW_LIMIT,
  type MediaRowModel,
} from '@/lib/library'
import type { Metadatum } from '@/types/plex'

export type LibraryKind = 'movies' | 'tv'

const ALL = 'all'
const GENRE_PREFIX = 'genre:'
const GENRE_ROWS_IN_ALL = 12

const COPY: Record<LibraryKind, { title: string; allLabel: string; noun: string }> = {
  movies: { title: 'Movies', allLabel: 'All Movies', noun: 'movies' },
  tv: { title: 'TV Shows', allLabel: 'All TV Shows', noun: 'shows' },
}

function buildRows(category: string, items: Metadatum[]): MediaRowModel[] {
  const curated = CURATED_CATEGORIES.find((c) => c.id === category)
  if (curated) return buildCuratedRows(curated, items)

  if (category.startsWith(GENRE_PREFIX)) {
    const genre = category.slice(GENRE_PREFIX.length)
    const inGenre = items.filter((m) => hasGenre(m, genre))
    return [
      { id: 'top', title: `Top Rated ${genre}`, items: [...inGenre].sort(byScore).slice(0, ROW_LIMIT) },
      { id: 'recent', title: `Recently Added ${genre}`, items: recentlyAdded(inGenre) },
      { id: 'az', title: `All ${genre} · A–Z`, items: [...inGenre].sort(byTitle) },
    ]
  }

  const rows: MediaRowModel[] = [
    { id: 'recent', title: 'Recently Added', items: recentlyAdded(items) },
    { id: 'top', title: 'Top Rated', items: [...items].sort(byScore).slice(0, ROW_LIMIT) },
  ]
  for (const { genre } of genresByCount(items).slice(0, GENRE_ROWS_IN_ALL)) {
    rows.push({
      id: `${GENRE_PREFIX}${genre}`,
      title: genre,
      items: items.filter((m) => hasGenre(m, genre)).sort(byScore).slice(0, ROW_LIMIT),
    })
  }
  return rows
}

interface LibraryScreenProps {
  kind: LibraryKind
  onSelectItem: (m: Metadatum) => void
}

export function LibraryScreen({ kind, onSelectItem }: LibraryScreenProps) {
  const library = usePlexLibrary()
  const state = kind === 'movies' ? library.movies : library.shows
  const copy = COPY[kind]
  const [category, setCategory] = useState(ALL)

  const groups = useMemo<DropdownGroup[]>(() => {
    const result: DropdownGroup[] = [
      { label: 'Browse', options: [{ id: ALL, label: copy.allLabel, hint: String(state.items.length) }] },
    ]
    if (kind === 'movies') {
      result.push({
        label: 'Curated Collections',
        options: CURATED_CATEGORIES.map((c) => ({
          id: c.id,
          label: `${c.label} Picks`,
          hint: `${c.rows.length} rows`,
        })),
      })
    }
    const genres = genresByCount(state.items)
    if (genres.length) {
      result.push({
        label: 'Genres',
        options: genres.map(({ genre, count }) => ({ id: `${GENRE_PREFIX}${genre}`, label: genre, hint: String(count) })),
      })
    }
    return result
  }, [kind, state.items, copy.allLabel])

  const rows = useMemo(() => buildRows(category, state.items), [category, state.items])
  const isCurated = CURATED_CATEGORIES.some((c) => c.id === category)

  return (
    <>
      <PageHeader eyebrow={`${state.items.length.toLocaleString()} ${copy.noun}`} title={copy.title}>
        {state.status === 'ready' && state.items.length > 0 && (
          <CategoryDropdown label="Category" groups={groups} value={category} onChange={setCategory} />
        )}
      </PageHeader>

      {state.status === 'error' && state.error && <LibraryErrorPanel message={state.error} />}

      {(state.status === 'loading' || state.status === 'idle') &&
        ['Recently Added', 'Top Rated', 'Loading…'].map((t) => <RowSkeleton key={t} title={t} />)}

      {state.status === 'ready' && state.items.length === 0 && (
        <p className="px-2 text-xl text-ink-muted">
          {kind === 'tv' ? 'No TV library was found on this Plex server.' : 'This library is empty.'}
        </p>
      )}

      {state.status === 'ready' &&
        rows.map((row) => (
          <MetadataRow
            key={`${category}-${row.id}`}
            row={row}
            onSelect={onSelectItem}
            showCount={category.startsWith(GENRE_PREFIX) || isCurated}
            emptyMessage="No matches in your library for this row yet."
          />
        ))}
    </>
  )
}
