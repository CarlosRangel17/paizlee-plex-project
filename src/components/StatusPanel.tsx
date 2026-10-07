import type { ReactNode } from 'react'
import { usePlexLibrary } from '@/context/PlexLibraryContext'

export function LibraryErrorPanel({ message }: { message: string }) {
  const { reload } = usePlexLibrary()
  return (
    <div role="alert" className="max-w-3xl rounded-2xl border border-rose-500/40 bg-rose-950/20 p-8">
      <h2 className="text-2xl font-bold text-ink">Can’t reach your Plex server</h2>
      <p className="mt-3 text-lg leading-relaxed text-ink-muted">{message}</p>
      <button
        type="button"
        data-focusable
        data-autofocus
        onClick={reload}
        className="tv-focus mt-6 rounded-xl border border-plum/60 bg-violet px-6 py-3 text-lg font-semibold"
      >
        Try Again
      </button>
    </div>
  )
}

export function PageHeader({ title, eyebrow, children }: { title: string; eyebrow?: string; children?: ReactNode }) {
  return (
    <header className="pz-fadein relative z-30 mb-10 flex flex-wrap items-end justify-between gap-6 px-2">
      <div>
        {eyebrow && <div className="mb-2 font-mono text-xs tracking-[0.2em] text-plum">{eyebrow.toUpperCase()}</div>}
        <h1 className="text-5xl leading-none font-extrabold tracking-tight">{title}</h1>
      </div>
      {children}
    </header>
  )
}
