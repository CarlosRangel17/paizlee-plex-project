import type { Metadatum } from '@/types/plex'

export type ScreenId = 'home' | 'movies' | 'tv' | 'profiles'

export type PlayableType = 'movie' | 'episode'

/** Minimal snapshot of something playable, so history rows render without a library lookup. */
export interface PlayableItem {
  ratingKey: string
  type: PlayableType
  title: string
  subtitle?: string
  thumb?: string
  art?: string
  durationMs: number
  showRatingKey?: string
}

export interface PlaybackRequest {
  item: PlayableItem
  startMs: number
}

export interface WatchEntry extends PlayableItem {
  positionMs: number
  updatedAt: number
}

export interface Profile {
  id: string
  name: string
  color: string
  createdAt: number
}

export interface ProfileHistory {
  inProgress: Record<string, WatchEntry>
  watched: Record<string, number>
}

export function toPlayable(m: Metadatum): PlayableItem | null {
  if (m.type !== 'movie' && m.type !== 'episode') return null
  const isEpisode = m.type === 'episode'
  return {
    ratingKey: m.ratingKey,
    type: m.type,
    title: isEpisode ? (m.grandparentTitle ?? m.title) : m.title,
    subtitle: isEpisode ? `S${m.parentIndex ?? '?'} · E${m.index ?? '?'} — ${m.title}` : m.year?.toString(),
    thumb: isEpisode ? (m.grandparentThumb ?? m.thumb) : m.thumb,
    art: isEpisode ? (m.grandparentArt ?? m.art) : m.art,
    durationMs: m.duration ?? m.Media?.[0]?.duration ?? 0,
    showRatingKey: isEpisode ? m.grandparentRatingKey : undefined,
  }
}
