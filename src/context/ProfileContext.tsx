import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PlayableItem, Profile, ProfileHistory, WatchEntry } from '@/types/app'

const PROFILES_KEY = 'paizlee.profiles.v1'
const ACTIVE_KEY = 'paizlee.activeProfile.v1'
const historyKey = (profileId: string) => `paizlee.history.v1.${profileId}`

const MIN_RECORD_MS = 30_000
const WATCHED_RATIO = 0.95

export const PROFILE_COLORS = ['#a855f7', '#f5b942', '#22d3ee', '#f472b6', '#4ade80', '#fb923c'] as const

const DEFAULT_PROFILES: Profile[] = [
  { id: 'paizlee', name: 'Paizlee', color: PROFILE_COLORS[0], createdAt: 0 },
  { id: 'guest', name: 'Guest', color: PROFILE_COLORS[2], createdAt: 0 },
]

const emptyHistory = (): ProfileHistory => ({ inProgress: {}, watched: {} })

function readJson<T>(key: string, guard: (v: unknown) => v is T, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    return guard(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

const isProfileList = (v: unknown): v is Profile[] =>
  Array.isArray(v) &&
  v.length > 0 &&
  v.every((p) => isRecord(p) && typeof p.id === 'string' && typeof p.name === 'string' && typeof p.color === 'string')

const isHistory = (v: unknown): v is ProfileHistory => isRecord(v) && isRecord(v.inProgress) && isRecord(v.watched)

const isString = (v: unknown): v is string => typeof v === 'string'

interface ProfileValue {
  profiles: Profile[]
  activeProfile: Profile
  history: ProfileHistory
  continueWatching: WatchEntry[]
  setActiveProfile: (id: string) => void
  addProfile: (name: string) => Profile
  removeProfile: (id: string) => void
  clearHistory: () => void
  recordProgress: (item: PlayableItem, positionMs: number) => void
  progressFor: (ratingKey: string) => WatchEntry | undefined
}

const ProfileContext = createContext<ProfileValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>(() => readJson(PROFILES_KEY, isProfileList, DEFAULT_PROFILES))
  const [activeId, setActiveId] = useState<string>(() => readJson(ACTIVE_KEY, isString, DEFAULT_PROFILES[0].id))

  const activeProfile = profiles.find((p) => p.id === activeId) ?? profiles[0]

  // History is cached per profile id; switching profiles reloads from that profile's own bucket.
  const [cache, setCache] = useState<{ profileId: string; data: ProfileHistory }>(() => ({
    profileId: activeProfile.id,
    data: readJson(historyKey(activeProfile.id), isHistory, emptyHistory()),
  }))
  if (cache.profileId !== activeProfile.id) {
    setCache({ profileId: activeProfile.id, data: readJson(historyKey(activeProfile.id), isHistory, emptyHistory()) })
  }
  const history = cache.data

  useEffect(() => localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)), [profiles])
  useEffect(() => localStorage.setItem(ACTIVE_KEY, JSON.stringify(activeProfile.id)), [activeProfile.id])

  const writeHistory = useCallback(
    (update: (prev: ProfileHistory) => ProfileHistory) => {
      const profileId = activeProfile.id
      setCache((prev) => {
        if (prev.profileId !== profileId) return prev
        const next = update(prev.data)
        if (next === prev.data) return prev
        localStorage.setItem(historyKey(profileId), JSON.stringify(next))
        return { profileId, data: next }
      })
    },
    [activeProfile.id],
  )

  const recordProgress = useCallback(
    (item: PlayableItem, positionMs: number) => {
      writeHistory((prev) => {
        const inProgress = { ...prev.inProgress }
        const watched = { ...prev.watched }
        const finished = item.durationMs > 0 && positionMs / item.durationMs >= WATCHED_RATIO
        if (finished) {
          delete inProgress[item.ratingKey]
          watched[item.ratingKey] = Date.now()
        } else if (positionMs >= MIN_RECORD_MS) {
          inProgress[item.ratingKey] = { ...item, positionMs, updatedAt: Date.now() }
        } else {
          return prev
        }
        return { inProgress, watched }
      })
    },
    [writeHistory],
  )

  const clearHistory = useCallback(() => writeHistory(() => emptyHistory()), [writeHistory])

  const addProfile = useCallback(
    (name: string) => {
      const profile: Profile = {
        id: `p-${Date.now().toString(36)}`,
        name: name.trim() || 'New Profile',
        color: PROFILE_COLORS[profiles.length % PROFILE_COLORS.length],
        createdAt: Date.now(),
      }
      setProfiles((prev) => [...prev, profile])
      return profile
    },
    [profiles.length],
  )

  const removeProfile = useCallback((id: string) => {
    setProfiles((prev) => (prev.length <= 1 ? prev : prev.filter((p) => p.id !== id)))
    localStorage.removeItem(historyKey(id))
  }, [])

  const continueWatching = useMemo(
    () => Object.values(history.inProgress).sort((a, b) => b.updatedAt - a.updatedAt),
    [history.inProgress],
  )

  const progressFor = useCallback((ratingKey: string) => history.inProgress[ratingKey], [history.inProgress])

  const value = useMemo<ProfileValue>(
    () => ({
      profiles,
      activeProfile,
      history,
      continueWatching,
      setActiveProfile: setActiveId,
      addProfile,
      removeProfile,
      clearHistory,
      recordProgress,
      progressFor,
    }),
    [profiles, activeProfile, history, continueWatching, addProfile, removeProfile, clearHistory, recordProgress, progressFor],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfiles(): ProfileValue {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfiles must be used inside <ProfileProvider>')
  return ctx
}
