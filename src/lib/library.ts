import type { Metadatum } from '@/types/plex'

export interface MediaRowModel {
  id: string
  title: string
  items: Metadatum[]
}

export const ROW_LIMIT = 80

export const tagsOf = (tags: { tag: string }[] | undefined): string[] => (tags ?? []).map((t) => t.tag)

export const hasGenre = (m: Metadatum, genre: string): boolean =>
  (m.Genre ?? []).some((g) => g.tag.toLowerCase() === genre.toLowerCase())

export const hasActor = (m: Metadatum, actor: string): boolean =>
  (m.Role ?? []).some((r) => r.tag.toLowerCase() === actor.toLowerCase())

export const score = (m: Metadatum): number => m.audienceRating ?? m.rating ?? 0

export const byScore = (a: Metadatum, b: Metadatum): number => score(b) - score(a)
export const byAddedAt = (a: Metadatum, b: Metadatum): number => b.addedAt - a.addedAt
export const byTitle = (a: Metadatum, b: Metadatum): number =>
  (a.titleSort ?? a.title).localeCompare(b.titleSort ?? b.title)

export function recentlyAdded(items: Metadatum[], limit = ROW_LIMIT): Metadatum[] {
  return [...items].sort(byAddedAt).slice(0, limit)
}

/** Genres present in a library, most common first. */
export function genresByCount(items: Metadatum[]): { genre: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const m of items) for (const g of tagsOf(m.Genre)) counts.set(g, (counts.get(g) ?? 0) + 1)
  return [...counts.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre))
}

export function normalizeForSearch(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Items most related to `target`: shared collections first, then genre overlap. */
export function relatedItems(target: Metadatum, pool: Metadatum[], limit = 24): Metadatum[] {
  const genres = new Set(tagsOf(target.Genre))
  const collections = new Set(tagsOf(target.Collection))
  if (!genres.size && !collections.size) return []

  return pool
    .filter((m) => m.ratingKey !== target.ratingKey)
    .map((m) => {
      const sharedCollections = tagsOf(m.Collection).filter((c) => collections.has(c)).length
      const sharedGenres = tagsOf(m.Genre).filter((g) => genres.has(g)).length
      return { m, rank: sharedCollections * 100 + sharedGenres * 10 + score(m) / 10 }
    })
    .filter(({ rank }) => rank >= 10)
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit)
    .map(({ m }) => m)
}

export function formatDuration(ms: number | undefined): string | null {
  if (!ms) return null
  const totalMin = Math.round(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(h ? 2 : 1, '0')
  return `${h ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`
}
