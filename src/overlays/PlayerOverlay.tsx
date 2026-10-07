import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { stopTranscodeSession, transcodeStreamUrl } from '@/api/plexClient'
import { CloseIcon, ForwardIcon, PauseIcon, PlayIcon, RewindIcon } from '@/components/Icons'
import { useProfiles } from '@/context/ProfileContext'
import { formatClock } from '@/lib/library'
import { useBackHandler } from '@/navigation/backStack'
import { focusFirstIn } from '@/navigation/useSpatialNavigation'
import type { PlaybackRequest } from '@/types/app'

const SAVE_INTERVAL_MS = 10_000
const CONTROLS_HIDE_MS = 4_000
const SKIP_BACK_S = 10
const SKIP_FORWARD_S = 30

// crypto.randomUUID is only available in secure contexts, and LAN dev URLs are plain http.
const newSessionId = () =>
  `pz-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

interface PlayerOverlayProps {
  request: PlaybackRequest
  onClose: () => void
}

export function PlayerOverlay({ request, onClose }: PlayerOverlayProps) {
  const { item } = request
  const { recordProgress } = useProfiles()
  const session = useMemo(newSessionId, [])
  const videoRef = useRef<HTMLVideoElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // Transcoded streams start at `offset`, so the element's currentTime is relative to it.
  // Seeking restarts the transcode at a new offset instead of seeking inside the stream.
  const [baseOffset, setBaseOffset] = useState(() => Math.floor(request.startMs / 1000))
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const [buffering, setBuffering] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [controlsVisible, setControlsVisible] = useState(true)

  const position = baseOffset + elapsed
  const positionRef = useRef(position)
  positionRef.current = position

  const durationS = item.durationMs / 1000
  const src = useMemo(
    () => transcodeStreamUrl({ ratingKey: item.ratingKey, offsetSeconds: baseOffset, session }),
    [item.ratingKey, baseOffset, session],
  )

  const save = useCallback(() => recordProgress(item, positionRef.current * 1000), [item, recordProgress])

  const close = useCallback(() => {
    save()
    onClose()
  }, [save, onClose])

  useBackHandler(true, close)

  useEffect(() => {
    if (rootRef.current) focusFirstIn(rootRef.current)
  }, [])

  useEffect(() => {
    const id = window.setInterval(save, SAVE_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [save])

  useEffect(() => () => stopTranscodeSession(session), [session])

  const hideTimer = useRef<number | undefined>(undefined)
  const pokeControls = useCallback(() => {
    setControlsVisible(true)
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => {
      if (!videoRef.current?.paused) setControlsVisible(false)
    }, CONTROLS_HIDE_MS)
  }, [])
  useEffect(() => {
    pokeControls()
    return () => window.clearTimeout(hideTimer.current)
  }, [pokeControls])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) void v.play().catch(() => undefined)
    else v.pause()
  }, [])

  const seekBy = useCallback(
    (delta: number) => {
      const max = durationS > 0 ? Math.max(0, durationS - 5) : Infinity
      const next = Math.min(max, Math.max(0, positionRef.current + delta))
      setElapsed(0)
      setBuffering(true)
      setBaseOffset(Math.floor(next))
    },
    [durationS],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      pokeControls()
      switch (e.key) {
        case 'MediaPlayPause':
        case 'MediaPlay':
        case 'MediaPause':
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'MediaFastForward':
          e.preventDefault()
          seekBy(SKIP_FORWARD_S)
          break
        case 'MediaRewind':
          e.preventDefault()
          seekBy(-SKIP_BACK_S)
          break
        case 'MediaStop':
          e.preventDefault()
          close()
          break
      }
    }
    // Capture phase so media keys win over the global D-pad handler.
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [pokeControls, togglePlay, seekBy, close])

  const pct = durationS > 0 ? Math.min(100, (position / durationS) * 100) : 0
  const ctrlBtn = 'tv-focus grid size-16 place-items-center rounded-full border border-violet bg-canvas/70 text-ink'

  return (
    <div
      ref={rootRef}
      data-focus-scope
      role="dialog"
      aria-modal="true"
      aria-label={`Playing ${item.title}`}
      onMouseMove={pokeControls}
      className={`pz-overlay-in fixed inset-0 z-[60] bg-black ${controlsVisible ? '' : 'cursor-none'}`}
    >
      <video
        ref={videoRef}
        key={src}
        src={src}
        autoPlay
        playsInline
        onClick={togglePlay}
        onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
        onPlaying={() => {
          setBuffering(false)
          setPaused(false)
          setError(null)
        }}
        onPause={() => {
          setPaused(true)
          setControlsVisible(true)
          save()
        }}
        onWaiting={() => setBuffering(true)}
        onEnded={() => {
          recordProgress(item, item.durationMs)
          onClose()
        }}
        onError={() => {
          setBuffering(false)
          setError(
            'Plex could not start this stream. Make sure the server is reachable and that transcoding is enabled for this client.',
          )
        }}
        className="size-full bg-black object-contain"
      />

      {buffering && !error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="size-20 animate-spin rounded-full border-4 border-violet border-t-gold" />
        </div>
      )}

      {error && (
        <div role="alert" className="absolute inset-0 grid place-items-center bg-black/70">
          <div className="max-w-2xl rounded-2xl border border-rose-500/40 bg-surface p-8 text-center">
            <h2 className="text-2xl font-bold">Playback failed</h2>
            <p className="mt-3 text-lg text-ink-muted">{error}</p>
          </div>
        </div>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent px-16 pt-24 pb-12 transition-opacity duration-300 ${
          controlsVisible || paused || error ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="mb-1 text-3xl font-bold">{item.title}</div>
        {item.subtitle && <div className="mb-5 text-lg text-ink-muted">{item.subtitle}</div>}

        <div className="flex items-center gap-4 font-mono text-sm text-ink-muted">
          <span>{formatClock(position)}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-plum" style={{ width: `${pct}%` }} />
          </div>
          <span>{durationS > 0 ? formatClock(durationS) : '--:--'}</span>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button type="button" data-focusable aria-label={`Back ${SKIP_BACK_S} seconds`} onClick={() => seekBy(-SKIP_BACK_S)} className={ctrlBtn}>
            <RewindIcon className="size-7" />
          </button>
          <button
            type="button"
            data-focusable
            data-autofocus
            aria-label={paused ? 'Play' : 'Pause'}
            onClick={togglePlay}
            className={`${ctrlBtn} size-20 bg-ink text-canvas`}
          >
            {paused ? <PlayIcon className="size-8" /> : <PauseIcon className="size-8" />}
          </button>
          <button type="button" data-focusable aria-label={`Forward ${SKIP_FORWARD_S} seconds`} onClick={() => seekBy(SKIP_FORWARD_S)} className={ctrlBtn}>
            <ForwardIcon className="size-7" />
          </button>
          <button type="button" data-focusable aria-label="Close player" onClick={close} className={`${ctrlBtn} ml-10`}>
            <CloseIcon className="size-7" />
          </button>
        </div>
      </div>
    </div>
  )
}
