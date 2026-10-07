import type { ComponentType, SVGProps } from 'react'
import { FilmIcon, HomeIcon, SearchIcon, TvIcon, UsersIcon } from '@/components/Icons'
import { usePlexLibrary } from '@/context/PlexLibraryContext'
import { useProfiles } from '@/context/ProfileContext'
import type { ScreenId } from '@/types/app'

interface NavNode {
  id: ScreenId | 'search'
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

const NAV_NODES: NavNode[] = [
  { id: 'search', label: 'Search', Icon: SearchIcon },
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'movies', label: 'Movies', Icon: FilmIcon },
  { id: 'tv', label: 'TV Shows', Icon: TvIcon },
  { id: 'profiles', label: 'Profiles & Admin', Icon: UsersIcon },
]

const CONNECTION_STYLES = {
  connecting: { color: 'bg-gold', label: 'Connecting', pulse: true },
  online: { color: 'bg-emerald-400', label: 'Online', pulse: false },
  error: { color: 'bg-rose-500', label: 'Offline', pulse: false },
} as const

interface SidebarProps {
  screen: ScreenId
  searchOpen: boolean
  onNavigate: (screen: ScreenId) => void
  onOpenSearch: () => void
}

export function Sidebar({ screen, searchOpen, onNavigate, onOpenSearch }: SidebarProps) {
  const { connection } = usePlexLibrary()
  const { activeProfile } = useProfiles()
  const status = CONNECTION_STYLES[connection]

  return (
    <aside
      data-focus-region="sidebar"
      className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-violet/70 bg-canvas-deep/95 px-6 py-10 backdrop-blur-xl"
    >
      <div className="mb-12 px-3">
        <div className="text-[28px] leading-none font-extrabold tracking-tight">
          <span className="text-plum">PAIZLEE</span>
          <span className="text-ink">PLEX</span>
        </div>
        <div className="mt-3 flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-ink-dim">
          <span className={`size-2 rounded-full ${status.color} ${status.pulse ? 'pz-pulse' : ''}`} />
          {status.label.toUpperCase()}
        </div>
      </div>

      <nav aria-label="Primary" className="flex flex-1 flex-col gap-2">
        {NAV_NODES.map(({ id, label, Icon }) => {
          const active = id === 'search' ? searchOpen : !searchOpen && screen === id
          return (
            <button
              key={id}
              type="button"
              data-focusable
              data-nav-active={active || undefined}
              aria-current={active ? 'page' : undefined}
              onClick={() => (id === 'search' ? onOpenSearch() : onNavigate(id))}
              className={`tv-focus flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left text-xl font-semibold ${
                active
                  ? 'border-plum/70 bg-violet-soft text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              <Icon className={`size-6 shrink-0 ${active ? 'text-plum' : ''}`} />
              {label}
            </button>
          )
        })}
      </nav>

      <button
        type="button"
        data-focusable
        onClick={() => onNavigate('profiles')}
        className="tv-focus mt-6 flex items-center gap-3 rounded-xl border border-violet/70 bg-surface px-4 py-3 text-left"
      >
        <span
          className="grid size-10 place-items-center rounded-full text-lg font-bold text-canvas"
          style={{ background: activeProfile.color }}
        >
          {activeProfile.name.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block font-mono text-[10px] tracking-[0.16em] text-ink-dim">WATCHING AS</span>
          <span className="block truncate text-lg font-semibold">{activeProfile.name}</span>
        </span>
      </button>
    </aside>
  )
}
