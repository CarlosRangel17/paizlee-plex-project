import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchShowEpisodes, originalArtUrl, posterUrl } from '@/api/plexClient'
import { CloseIcon, PlayIcon, RewindIcon } from '@/components/Icons'
import { MetadataRow } from '@/components/MediaRow'
import { usePlexLibrary } from '@/context/PlexLibraryContext'
import { useProfiles } from '@/context/ProfileContext'
import { formatClock, formatDuration, relatedItems, tagsOf } from '@/lib/library'
import { useBackHandler } from '@/navigation/backStack'
import { focusFirstIn } from '@/navigation/useSpatialNavigation'
import { toPlayable, type PlaybackRequest, type ProfileHistory } from '@/types/app'
import type { Metadatum } from '@/types/plex'

interface DetailsOverlayProps {
  item: Metadatum
  onClose: () => void
  onPlay: (request: PlaybackRequest) => void
  onSelectRelated: (m: Metadatum) => void
}

/** The episode a profile should land on: its in-progress one, else the first it hasn't finished. */
function nextEpisode(episodes: Metadatum[], history: ProfileHistory): { episode: Metadatum; startMs: number } | null {
  const inProgress = episodes
    .map((e) => history.inProgress[e.ratingKey])
    .filter((e) => e !== undefined)
    .sort((a, b) => b.updatedAt - a.updatedAt)[0]
  if (inProgress) {
    const episode = episodes.find((e) => e.ratingKey === inProgress.ratingKey)
    if (episode) return { episode, startMs: inProgress.positionMs }
  }
  const episode = episodes.find((e) => !history.watched[e.ratingKey]) ?? episodes[0]
  return episode ? { episode, startMs: 0 } : null
}

export function DetailsOverlay({ item, onClose, onPlay, onSelectRelated }: DetailsOverlayProps) {
  const { movies, shows } = usePlexLibrary()
  const { progressFor, history } = useProfiles()
  const rootRef = useRef<HTMLDivElement>(null)
  const [episodeState, setEpisodeState] = useState<'idle' | 'loading' | 'error'>('idle')

  useBackHandler(true, onClose)

  useEffect(() => {
    rootRef.current?.scrollTo({ top: 0 })
    if (rootRef.current) focusFirstIn(rootRef.current)
  }, [item.ratingKey])

  const isShow = item.type === 'show'
  const progress = isShow ? undefined : progressFor(item.ratingKey)
  const pool = isShow ? shows.items : movies.items
  const related = useMemo(() => relatedItems(item, pool), [item, pool])

  const startMovie = (startMs: number) => {
    const playable = toPlayable(item)
    if (playable) onPlay({ item: playable, startMs })
  }

  const startShow = async () => {
    setEpisodeState('loading')
    try {
      const target = nextEpisode(await fetchShowEpisodes(item.ratingKey), history)
      const playable = target && toPlayable(target.episode)
      if (!target || !playable) throw new Error('No playable episodes')
      setEpisodeState('idle')
      onPlay({ item: playable, startMs: target.startMs })
    } catch {
      setEpisodeState('error')
    }
  }

  const art = originalArtUrl(item.art)
  const meta = [
    item.year,
    item.contentRating,
    isShow
      ? item.childCount && `${item.childCount} season${item.childCount === 1 ? '' : 's'}`
      : formatDuration(item.duration ?? item.Media?.[0]?.duration),
    item.Media?.[0]?.videoResolution && `${item.Media[0].videoResolution.toUpperCase()}${/^\d+$/.test(item.Media[0].videoResolution) ? 'p' : ''}`,
  ].filter(Boolean)
  const genres = tagsOf(item.Genre)
  const directors = tagsOf(item.Director)
  const cast = tagsOf(item.Role).slice(0, 4)
  const collections = tagsOf(item.Collection)

  const primaryBtn =
    'tv-focus flex items-center gap-3 rounded-xl bg-ink px-8 py-4 text-xl font-bold text-canvas'
  const secondaryBtn =
    'tv-focus flex items-center gap-3 rounded-xl border border-plum/60 bg-violet-soft/80 px-7 py-4 text-xl font-semibold text-ink'

  return (
    <div
      ref={rootRef}
      data-focus-scope
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="pz-overlay-in fixed inset-0 z-50 overflow-y-auto bg-canvas"
    >
      <div className="pointer-events-none fixed inset-0">
        {art && <img src={art} alt="" className="size-full object-cover opacity-55" />}
        <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/85 to-canvas/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/30 to-transparent" />
      </div>

      <div className="relative px-20 pt-16 pb-12">
        <button
          type="button"
          data-focusable
          aria-label="Close details"
          onClick={onClose}
          className="tv-focus absolute top-10 right-12 grid size-14 place-items-center rounded-full border border-violet bg-canvas/70"
        >
          <CloseIcon className="size-7" />
        </button>

        <div className="flex min-h-[62vh] items-end gap-12">
          <img
            src={posterUrl(item.thumb, 400, 600)}
            alt=""
            className="hidden aspect-[2/3] w-64 shrink-0 rounded-2xl border border-violet object-cover shadow-2xl shadow-black/70 2xl:block"
          />
          <div className="max-w-4xl">
            {collections[0] && (
              <div className="mb-3 font-mono text-sm tracking-[0.2em] text-plum">{collections[0].toUpperCase()}</div>
            )}
            <h1 className="text-6xl leading-[1.05] font-extrabold tracking-tight">{item.title}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-lg text-ink-muted">
              {meta.map((m, i) => (
                <span key={i} className={i === 1 ? 'rounded border border-ink-dim px-2 py-0.5 text-base' : ''}>
                  {m}
                </span>
              ))}
              {item.audienceRating !== undefined && (
                <span className="text-gold">★ {item.audienceRating.toFixed(1)}</span>
              )}
            </div>
            {genres.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {genres.map((g) => (
                  <span key={g} className="rounded-full border border-plum/40 bg-violet-soft/70 px-3 py-1 text-sm">
                    {g}
                  </span>
                ))}
              </div>
            )}
            {item.tagline && <p className="mt-6 text-xl text-ink italic">{item.tagline}</p>}
            <p className="mt-4 max-w-3xl text-xl leading-relaxed text-ink-muted">{item.summary}</p>
            <dl className="mt-5 space-y-1 text-base">
              {directors.length > 0 && (
                <div className="flex gap-3">
                  <dt className="text-ink-dim">Directed by</dt>
                  <dd>{directors.join(', ')}</dd>
                </div>
              )}
              {cast.length > 0 && (
                <div className="flex gap-3">
                  <dt className="text-ink-dim">Starring</dt>
                  <dd>{cast.join(', ')}</dd>
                </div>
              )}
            </dl>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              {isShow ? (
                <button
                  type="button"
                  data-focusable
                  data-autofocus
                  disabled={episodeState === 'loading'}
                  onClick={() => void startShow()}
                  className={primaryBtn}
                >
                  <PlayIcon className="size-6" />
                  {episodeState === 'loading' ? 'Loading episodes…' : 'Play'}
                </button>
              ) : progress ? (
                <>
                  <button type="button" data-focusable data-autofocus onClick={() => startMovie(progress.positionMs)} className={primaryBtn}>
                    <PlayIcon className="size-6" />
                    Resume from {formatClock(progress.positionMs / 1000)}
                  </button>
                  <button type="button" data-focusable onClick={() => startMovie(0)} className={secondaryBtn}>
                    <RewindIcon className="size-6" />
                    Play from Beginning
                  </button>
                </>
              ) : (
                <button type="button" data-focusable data-autofocus onClick={() => startMovie(0)} className={primaryBtn}>
                  <PlayIcon className="size-6" />
                  Play
                </button>
              )}
              {episodeState === 'error' && (
                <span role="alert" className="text-lg text-rose-400">
                  Couldn’t load episodes for this show.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-14">
          <MetadataRow
            row={{ id: 'related', title: 'More Like This', items: related }}
            onSelect={onSelectRelated}
            emptyMessage="No related titles in the same genres or collections."
          />
        </div>
      </div>
    </div>
  )
}
