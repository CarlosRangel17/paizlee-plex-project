import { useState } from 'react'
import { posterUrl } from '@/api/plexClient'

interface PosterCardProps {
  title: string
  subtitle?: string
  thumb?: string
  /** 0–1 playback progress for the active profile. */
  progress?: number
  autoFocus?: boolean
  onSelect: () => void
}

export function PosterCard({ title, subtitle, thumb, progress, autoFocus, onSelect }: PosterCardProps) {
  const [failed, setFailed] = useState(false)
  const src = failed ? undefined : posterUrl(thumb)

  return (
    <button
      type="button"
      data-focusable
      data-autofocus={autoFocus || undefined}
      onClick={onSelect}
      aria-label={subtitle ? `${title}, ${subtitle}` : title}
      className="tv-focus group w-44 shrink-0 rounded-xl text-left xl:w-48"
    >
      <span className="relative block aspect-[2/3] overflow-hidden rounded-xl border border-violet/80 bg-surface-raised">
        {src ? (
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="size-full object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center p-4 text-center text-lg font-semibold text-ink-muted">
            {title}
          </span>
        )}
        {progress !== undefined && progress > 0 && (
          <span className="absolute inset-x-0 bottom-0 h-1.5 bg-black/60">
            <span className="block h-full bg-plum" style={{ width: `${Math.min(100, progress * 100)}%` }} />
          </span>
        )}
      </span>
      <span className="mt-2.5 block truncate px-1 text-base font-semibold text-ink">{title}</span>
      {subtitle && <span className="block truncate px-1 font-mono text-xs text-ink-dim">{subtitle}</span>}
    </button>
  )
}
