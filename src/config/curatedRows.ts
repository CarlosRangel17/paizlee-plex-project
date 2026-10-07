import { byScore, hasActor, hasGenre, ROW_LIMIT, type MediaRowModel } from '@/lib/library'
import type { Metadatum } from '@/types/plex'

/**
 * Curated rows are rules over the live library rather than hard-coded title lists,
 * so they keep working as the catalog grows. Tune the keyword lists to taste.
 */
interface CuratedRowRule {
  id: string
  title: string
  match: (m: Metadatum) => boolean
  sort?: (a: Metadatum, b: Metadatum) => number
}

export interface CuratedCategory {
  id: string
  label: string
  rows: CuratedRowRule[]
}

const summaryMatches = (pattern: RegExp) => (m: Metadatum) => pattern.test(`${m.title} ${m.tagline ?? ''} ${m.summary}`)

const JUMP_SCARE = /\b(haunt\w*|possess\w*|demon\w*|ghost\w*|spirit\w*|paranormal|poltergeist|curse\w*|entity|exorcis\w*|apparition)\b/i
const GORE = /\b(slash\w*|massacre|blood\w*|butcher\w*|chainsaw|cannibal\w*|tortur\w*|dismember\w*|zombie\w*|carnage|maniac|serial killer|killing spree|gore)\b/i
const MATURE_RATINGS = new Set(['R', 'NC-17', 'Not Rated', 'Unrated', 'TV-MA'])

const isHorror = (m: Metadatum) => hasGenre(m, 'Horror')
const isComedy = (m: Metadatum) => hasGenre(m, 'Comedy')

export const CURATED_CATEGORIES: CuratedCategory[] = [
  {
    id: 'curated-horror',
    label: 'Horror',
    rows: [
      { id: 'top-picks', title: 'Top Picks', match: isHorror, sort: byScore },
      { id: 'jump-scares', title: 'Jump Scares', match: (m) => isHorror(m) && summaryMatches(JUMP_SCARE)(m) },
      {
        id: 'gorey',
        title: 'Gorey',
        match: (m) => isHorror(m) && MATURE_RATINGS.has(m.contentRating ?? '') && summaryMatches(GORE)(m),
      },
      { id: 'classic-scares', title: 'Classic Scares', match: (m) => isHorror(m) && (m.year ?? 9999) < 1990, sort: byScore },
      { id: 'thrillers', title: 'Thrillers', match: (m) => hasGenre(m, 'Thriller'), sort: byScore },
    ],
  },
  {
    id: 'curated-comedy',
    label: 'Comedy',
    rows: [
      { id: 'top-picks', title: 'Top Picks', match: isComedy, sort: byScore },
      {
        id: 'pee-your-pants',
        title: 'Pee Your Pants',
        match: (m) =>
          isComedy(m) &&
          !hasGenre(m, 'Drama') &&
          !hasGenre(m, 'Romance') &&
          (m.contentRating === 'R' || m.contentRating === 'PG-13'),
        sort: byScore,
      },
      { id: 'will-ferrell', title: 'Will Ferrell', match: (m) => hasActor(m, 'Will Ferrell'), sort: byScore },
      { id: 'jim-carrey', title: 'Jim Carrey', match: (m) => hasActor(m, 'Jim Carrey'), sort: byScore },
    ],
  },
]

export function buildCuratedRows(category: CuratedCategory, items: Metadatum[]): MediaRowModel[] {
  return category.rows.map((rule) => {
    const matched = items.filter(rule.match)
    if (rule.sort) matched.sort(rule.sort)
    return { id: `${category.id}-${rule.id}`, title: rule.title, items: matched.slice(0, ROW_LIMIT) }
  })
}
