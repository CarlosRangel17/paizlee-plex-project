import { useState, type FormEvent } from 'react'
import { CheckIcon, PlusIcon } from '@/components/Icons'
import { PageHeader } from '@/components/StatusPanel'
import { PLEX_CONFIG } from '@/config/plex'
import { usePlexLibrary } from '@/context/PlexLibraryContext'
import { useProfiles } from '@/context/ProfileContext'

export function ProfilesScreen() {
  const { profiles, activeProfile, setActiveProfile, addProfile, removeProfile, clearHistory, continueWatching, history } =
    useProfiles()
  const { movies, shows, connection, reload } = usePlexLibrary()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const profile = addProfile(name)
    setActiveProfile(profile.id)
    setName('')
    setCreating(false)
  }

  const panel = 'rounded-2xl border border-violet bg-surface/80 p-8'
  const actionButton = 'tv-focus rounded-xl border border-plum/60 bg-violet-soft px-5 py-3 text-lg font-semibold'

  return (
    <>
      <PageHeader eyebrow="Who’s watching?" title="Profiles & Admin" />

      <section aria-label="Profiles" className="mb-12 flex flex-wrap gap-8 px-2">
        {profiles.map((p) => {
          const active = p.id === activeProfile.id
          return (
            <button
              key={p.id}
              type="button"
              data-focusable
              data-autofocus={active || undefined}
              aria-pressed={active}
              onClick={() => setActiveProfile(p.id)}
              className="tv-focus flex w-44 flex-col items-center gap-4 rounded-2xl p-4"
            >
              <span
                className={`relative grid size-36 place-items-center rounded-full text-6xl font-extrabold text-canvas ring-offset-4 ring-offset-canvas ${
                  active ? 'ring-4 ring-plum' : ''
                }`}
                style={{ background: p.color }}
              >
                {p.name.charAt(0).toUpperCase()}
                {active && (
                  <span className="absolute -right-1 -bottom-1 grid size-10 place-items-center rounded-full bg-plum text-ink">
                    <CheckIcon className="size-6" />
                  </span>
                )}
              </span>
              <span className={`text-xl font-semibold ${active ? 'text-ink' : 'text-ink-muted'}`}>{p.name}</span>
            </button>
          )
        })}

        {creating ? (
          <form onSubmit={submit} className="flex w-80 flex-col justify-center gap-3">
            <input
              data-focusable
              autoFocus
              value={name}
              maxLength={24}
              onChange={(e) => setName(e.target.value)}
              placeholder="Profile name"
              aria-label="New profile name"
              className="tv-focus h-14 rounded-xl border border-plum/60 bg-surface-raised px-4 text-xl"
            />
            <div className="flex gap-3">
              <button type="submit" data-focusable className={actionButton}>
                Create
              </button>
              <button type="button" data-focusable onClick={() => setCreating(false)} className={actionButton}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            data-focusable
            onClick={() => setCreating(true)}
            className="tv-focus flex w-44 flex-col items-center gap-4 rounded-2xl p-4"
          >
            <span className="grid size-36 place-items-center rounded-full border-2 border-dashed border-plum/60 text-plum">
              <PlusIcon className="size-12" />
            </span>
            <span className="text-xl font-semibold text-ink-muted">Add Profile</span>
          </button>
        )}
      </section>

      <div className="grid gap-8 px-2 xl:grid-cols-2">
        <section className={panel} aria-label="Profile admin">
          <h2 className="text-2xl font-bold">{activeProfile.name}’s data</h2>
          <p className="mt-2 text-ink-muted">
            Watch history is stored on this device and isolated per profile.
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-4 font-mono text-sm">
            <div>
              <dt className="text-ink-dim">IN PROGRESS</dt>
              <dd className="text-2xl text-ink">{continueWatching.length}</dd>
            </div>
            <div>
              <dt className="text-ink-dim">WATCHED</dt>
              <dd className="text-2xl text-ink">{Object.keys(history.watched).length}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" data-focusable onClick={clearHistory} className={actionButton}>
              Clear Watch History
            </button>
            <button
              type="button"
              data-focusable
              disabled={profiles.length <= 1}
              onClick={() => {
                const next = profiles.find((p) => p.id !== activeProfile.id)
                if (!next) return
                removeProfile(activeProfile.id)
                setActiveProfile(next.id)
              }}
              className={`${actionButton} border-rose-500/50 bg-rose-950/30`}
            >
              Remove Profile
            </button>
          </div>
        </section>

        <section className={panel} aria-label="Server status">
          <h2 className="text-2xl font-bold">Plex Server</h2>
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 font-mono text-sm">
            <div className="col-span-2">
              <dt className="text-ink-dim">HOST</dt>
              <dd className="text-lg break-all text-ink">{PLEX_CONFIG.serverUrl}</dd>
            </div>
            <div>
              <dt className="text-ink-dim">STATUS</dt>
              <dd className="text-lg text-ink">{connection.toUpperCase()}</dd>
            </div>
            <div>
              <dt className="text-ink-dim">TOKEN</dt>
              <dd className="text-lg text-ink">{PLEX_CONFIG.token ? 'CONFIGURED' : 'MISSING'}</dd>
            </div>
            <div>
              <dt className="text-ink-dim">MOVIES · SECTION {movies.sectionKey ?? '—'}</dt>
              <dd className="text-lg text-ink">{movies.items.length.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-ink-dim">TV · SECTION {shows.sectionKey ?? '—'}</dt>
              <dd className="text-lg text-ink">{shows.items.length.toLocaleString()}</dd>
            </div>
          </dl>
          <button type="button" data-focusable onClick={reload} className={`${actionButton} mt-6`}>
            Reload Libraries
          </button>
        </section>
      </div>
    </>
  )
}
