import type { ReactNode } from 'react'
import { PosterCard } from '@/components/PosterCard'
import type { MediaRowModel } from '@/lib/library'
import type { Metadatum } from '@/types/plex'

interface MediaRowProps {
  title: string
  count?: number
  emptyMessage?: string
  children: ReactNode
  isEmpty?: boolean
}

export function MediaRow({ title, count, emptyMessage, isEmpty, children }: MediaRowProps) {
  return (
    <section className="mb-8" aria-label={title}>
      <header className="mb-1 flex items-baseline gap-4 px-2">
        <h2 className="text-[26px] font-bold tracking-tight text-ink">{title}</h2>
        <span className="h-0.5 w-10 rounded bg-plum/70" />
        {count !== undefined && <span className="font-mono text-xs text-ink-dim">{count}</span>}
      </header>
      {isEmpty ? (
        <p className="mx-2 my-4 rounded-xl border border-dashed border-violet px-6 py-8 text-ink-muted">
          {emptyMessage ?? 'Nothing here yet.'}
        </p>
      ) : (
        <div className="pz-row -mx-2 flex gap-5 overflow-x-auto px-4 pt-5 pb-6">{children}</div>
      )}
    </section>
  )
}

export function metadataSubtitle(m: Metadatum): string | undefined {
  if (m.type === 'show') {
    const seasons = m.childCount ? `${m.childCount} season${m.childCount === 1 ? '' : 's'}` : null
    return [m.year, seasons].filter(Boolean).join(' · ') || undefined
  }
  return [m.year, m.contentRating].filter(Boolean).join(' · ') || undefined
}

interface MetadataRowProps {
  row: MediaRowModel
  onSelect: (m: Metadatum) => void
  emptyMessage?: string
  showCount?: boolean
}

export function MetadataRow({ row, onSelect, emptyMessage, showCount }: MetadataRowProps) {
  return (
    <MediaRow
      title={row.title}
      count={showCount ? row.items.length : undefined}
      isEmpty={row.items.length === 0}
      emptyMessage={emptyMessage}
    >
      {row.items.map((m) => (
        <PosterCard
          key={m.ratingKey}
          title={m.title}
          subtitle={metadataSubtitle(m)}
          thumb={m.thumb}
          onSelect={() => onSelect(m)}
        />
      ))}
    </MediaRow>
  )
}

export function RowSkeleton({ title }: { title: string }) {
  return (
    <section className="mb-8" aria-busy="true" aria-label={title}>
      <h2 className="mb-1 px-2 text-[26px] font-bold tracking-tight text-ink-dim">{title}</h2>
      <div className="flex gap-5 overflow-hidden px-2 pt-5 pb-6">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="pz-skeleton aspect-[2/3] w-44 shrink-0 rounded-xl xl:w-48" />
        ))}
      </div>
    </section>
  )
}
