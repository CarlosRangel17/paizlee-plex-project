import { useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { CloseIcon, SearchIcon } from '@/components/Icons'
import { metadataSubtitle } from '@/components/MediaRow'
import { PosterCard } from '@/components/PosterCard'
import { usePlexLibrary } from '@/context/PlexLibraryContext'
import { normalizeForSearch } from '@/lib/library'
import { useBackHandler } from '@/navigation/backStack'
import { focusElement } from '@/navigation/useSpatialNavigation'
import type { Metadatum } from '@/types/plex'

const KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')
const RESULT_LIMIT = 60

interface SearchOverlayProps {
  onClose: () => void
  onSelectItem: (m: Metadatum) => void
}

interface IndexedItem {
  item: Metadatum
  haystack: string
  title: string
}

export function SearchOverlay({ onClose, onSelectItem }: SearchOverlayProps) {
  const { movies, shows } = usePlexLibrary()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const inputRef = useRef<HTMLInputElement>(null)

  useBackHandler(true, onClose)

  useEffect(() => {
    if (inputRef.current) focusElement(inputRef.current)
  }, [])

  const index = useMemo<IndexedItem[]>(
    () =>
      [...movies.items, ...shows.items].map((item) => ({
        item,
        title: normalizeForSearch(item.title),
        haystack: normalizeForSearch(`${item.title} ${item.originalTitle ?? ''}`),
      })),
    [movies.items, shows.items],
  )

  const results = useMemo(() => {
    const q = normalizeForSearch(deferredQuery)
    if (!q) return []
    return index
      .filter((e) => e.haystack.includes(q))
      .sort((a, b) => Number(b.title.startsWith(q)) - Number(a.title.startsWith(q)) || a.title.localeCompare(b.title))
      .map((e) => e.item)
  }, [index, deferredQuery])

  const append = (ch: string) => setQuery((q) => q + ch)

  // Physical keyboards still type into the query while focus sits on the on-screen keys.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target === inputRef.current || e.metaKey || e.ctrlKey || e.altKey) return
    if (e.key.length === 1 && /[a-z0-9 ]/i.test(e.key)) {
      e.preventDefault()
      append(e.key)
    }
  }

  const keyClass =
    'tv-focus grid h-14 place-items-center rounded-lg border border-violet bg-surface text-xl font-semibold text-ink'

  return (
    <div
      data-focus-scope
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onKeyDown={onKeyDown}
      className="pz-overlay-in fixed inset-0 z-50 overflow-y-auto bg-canvas/97 backdrop-blur-2xl"
    >
      <div className="mx-auto flex max-w-[1700px] gap-12 px-16 py-14">
        <div className="w-[26rem] shrink-0">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-4xl font-extrabold tracking-tight">Search</h1>
            <button
              type="button"
              data-focusable
              aria-label="Close search"
              onClick={onClose}
              className="tv-focus grid size-12 place-items-center rounded-full border border-violet bg-surface"
            >
              <CloseIcon className="size-6" />
            </button>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-plum/60 bg-surface-raised px-4">
            <SearchIcon className="size-6 shrink-0 text-plum" />
            <input
              ref={inputRef}
              data-focusable
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Movies & shows"
              aria-label="Search movies and TV shows"
              className="tv-focus h-16 w-full rounded-lg bg-transparent text-2xl text-ink placeholder:text-ink-dim"
            />
          </label>

          <div className="mt-6 grid grid-cols-6 gap-2">
            {KEYS.map((k) => (
              <button key={k} type="button" data-focusable onClick={() => append(k)} className={keyClass}>
                {k}
              </button>
            ))}
            <button type="button" data-focusable onClick={() => append(' ')} className={`${keyClass} col-span-2 text-base`}>
              Space
            </button>
            <button
              type="button"
              data-focusable
              onClick={() => setQuery((q) => q.slice(0, -1))}
              className={`${keyClass} col-span-2 text-base`}
            >
              Delete
            </button>
            <button type="button" data-focusable onClick={() => setQuery('')} className={`${keyClass} col-span-2 text-base`}>
              Clear
            </button>
          </div>
        </div>

        <section className="min-w-0 flex-1" aria-live="polite">
          <div className="mb-4 font-mono text-sm tracking-[0.16em] text-ink-dim">
            {query.trim()
              ? `${results.length.toLocaleString()} RESULT${results.length === 1 ? '' : 'S'}${
                  results.length > RESULT_LIMIT ? ` · SHOWING FIRST ${RESULT_LIMIT}` : ''
                }`
              : `${index.length.toLocaleString()} TITLES INDEXED`}
          </div>
          {deferredQuery.trim() && deferredQuery === query && results.length === 0 && (
            <p className="text-2xl text-ink-muted">No titles match “{query.trim()}”.</p>
          )}
          <div className="flex flex-wrap gap-6 pt-2">
            {results.slice(0, RESULT_LIMIT).map((m) => (
              <PosterCard
                key={m.ratingKey}
                title={m.title}
                subtitle={metadataSubtitle(m)}
                thumb={m.thumb}
                onSelect={() => onSelectItem(m)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
