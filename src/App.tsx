import { useState, useEffect, useCallback } from 'react'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type TelemetryState = 'connecting' | 'online' | 'error'
type Theme = 'dark' | 'light'

interface Movie {
  id: number
  title: string
  year: number
  rating: string
  posterId: string
  fanartId: string
}

interface ContentRow {
  key: string
  label: string
  movies: Movie[]
}

// ─────────────────────────────────────────────
// Unsplash helpers
// ─────────────────────────────────────────────
const p = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=300&h=450&fit=crop&auto=format`
const fa = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1920&h=1080&fit=crop&auto=format`

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────
const ROWS: ContentRow[] = [
  {
    key: 'recently-added',
    label: 'Recently Added',
    movies: [
      { id: 101, title: 'Hollow Ground',    year: 2024, rating: 'R',     posterId: '1580130732478-4e339fb33a5b', fanartId: '1536440136628-849c177e76a1' },
      { id: 102, title: 'The Warden',       year: 2024, rating: 'PG-13', posterId: '1507003211169-0a1dd7228f2d', fanartId: '1440404653325-ab127d49abc1' },
      { id: 103, title: 'Neon Requiem',     year: 2023, rating: 'R',     posterId: '1524504388940-b1c1722653e1', fanartId: '1542204165-65bf26472b9b' },
      { id: 104, title: 'Last Laugh',       year: 2024, rating: 'PG',    posterId: '1552374196-c4e7ffc6e126',   fanartId: '1489599849927-2ee91cede3ba' },
      { id: 105, title: "Venus & Mars",     year: 2023, rating: 'PG-13', posterId: '1529626455594-4ff0802cfb7e', fanartId: '1501854140801-50d01698950b' },
    ],
  },
  {
    key: 'horror',
    label: 'Horror',
    movies: [
      { id: 201, title: 'Phantasm Rising',  year: 2024, rating: 'R',     posterId: '1531746020798-e6953c6e8e04', fanartId: '1493246507139-91e8fad9978e' },
      { id: 202, title: 'The Hollow',       year: 2023, rating: 'R',     posterId: '1557804506-669a67965ba0',   fanartId: '1536440136628-849c177e76a1' },
      { id: 203, title: 'Dark Frequency',   year: 2024, rating: 'NR',    posterId: '1506794778202-cad84cf45f1d', fanartId: '1440404653325-ab127d49abc1' },
      { id: 204, title: 'Moth Light',       year: 2022, rating: 'R',     posterId: '1519699047748-de8e457a634e', fanartId: '1542204165-65bf26472b9b' },
      { id: 205, title: 'Salt Flats',       year: 2023, rating: 'PG-13', posterId: '1534528741775-53994a69daeb', fanartId: '1518676590629-3dcbd9c5a5c9' },
      { id: 206, title: 'Wound Protocol',   year: 2024, rating: 'R',     posterId: '1494790108377-be9c29b29330', fanartId: '1493246507139-91e8fad9978e' },
    ],
  },
  {
    key: 'comedy',
    label: 'Comedy',
    movies: [
      { id: 301, title: 'Perfect Strangers', year: 2024, rating: 'PG-13', posterId: '1552374196-c4e7ffc6e126',   fanartId: '1489599849927-2ee91cede3ba' },
      { id: 302, title: 'Nine Lives',        year: 2023, rating: 'PG',    posterId: '1494790108377-be9c29b29330', fanartId: '1501854140801-50d01698950b' },
      { id: 303, title: 'Office Hours',      year: 2022, rating: 'PG-13', posterId: '1507003211169-0a1dd7228f2d', fanartId: '1440404653325-ab127d49abc1' },
      { id: 304, title: 'Meltdown',          year: 2024, rating: 'PG',    posterId: '1529626455594-4ff0802cfb7e', fanartId: '1536440136628-849c177e76a1' },
      { id: 305, title: 'Side Effects',      year: 2023, rating: 'PG',    posterId: '1519699047748-de8e457a634e', fanartId: '1489599849927-2ee91cede3ba' },
    ],
  },
  {
    key: 'drama',
    label: 'Drama',
    movies: [
      { id: 401, title: 'Meridian',          year: 2024, rating: 'PG-13', posterId: '1524504388940-b1c1722653e1', fanartId: '1518676590629-3dcbd9c5a5c9' },
      { id: 402, title: 'Harbour Light',     year: 2023, rating: 'PG-13', posterId: '1506794778202-cad84cf45f1d', fanartId: '1501854140801-50d01698950b' },
      { id: 403, title: 'The Agreement',     year: 2022, rating: 'PG-13', posterId: '1531746020798-e6953c6e8e04', fanartId: '1440404653325-ab127d49abc1' },
      { id: 404, title: 'Broken Latitude',   year: 2024, rating: 'R',     posterId: '1580130732478-4e339fb33a5b', fanartId: '1542204165-65bf26472b9b' },
      { id: 405, title: 'Fracture Point',    year: 2023, rating: 'PG-13', posterId: '1557804506-669a67965ba0',   fanartId: '1493246507139-91e8fad9978e' },
    ],
  },
  {
    key: 'romantic',
    label: 'Romantic Movies',
    movies: [
      { id: 501, title: 'Slow Burn',         year: 2024, rating: 'PG-13', posterId: '1529626455594-4ff0802cfb7e', fanartId: '1489599849927-2ee91cede3ba' },
      { id: 502, title: 'The Distance',      year: 2023, rating: 'PG',    posterId: '1534528741775-53994a69daeb', fanartId: '1501854140801-50d01698950b' },
      { id: 503, title: 'Last Summer',       year: 2022, rating: 'PG-13', posterId: '1494790108377-be9c29b29330', fanartId: '1518676590629-3dcbd9c5a5c9' },
      { id: 504, title: 'Meridiem',          year: 2024, rating: 'PG',    posterId: '1519699047748-de8e457a634e', fanartId: '1440404653325-ab127d49abc1' },
      { id: 505, title: 'After Rain',        year: 2023, rating: 'PG-13', posterId: '1552374196-c4e7ffc6e126',   fanartId: '1536440136628-849c177e76a1' },
    ],
  },
]

const NAV_ITEMS = [
  { id: 'home',           label: 'Home' },
  { id: 'recently-added', label: 'Recently Added' },
  { id: 'horror',         label: 'Horror' },
  { id: 'comedy',         label: 'Comedy' },
  { id: 'drama',          label: 'Drama' },
  { id: 'romantic',       label: 'Romantic Movies' },
  { id: 'settings',       label: 'App Settings' },
]

const DIAG = [
  'Initializing Local Datastream...',
  'Authenticating Plex Token...',
  'Fetching Media Libraries...',
  'Loading Artwork Cache...',
  'Syncing Watch History...',
  'Establishing Peer Connection...',
  'RetroStream Ready.',
]

// ─────────────────────────────────────────────
// Telemetry config
// ─────────────────────────────────────────────
const TELE: Record<TelemetryState, { color: string; glow: string; label: string; pulse: boolean }> = {
  connecting: { color: '#F59E0B', glow: 'rgba(245,158,11,0.5)', label: 'Connecting',  pulse: true },
  online:     { color: '#10B981', glow: 'rgba(16,185,129,0.9)', label: 'Online',       pulse: false },
  error:      { color: '#EF4444', glow: 'transparent',          label: 'Local Error',  pulse: false },
}

// ─────────────────────────────────────────────
// Theme tokens
// ─────────────────────────────────────────────
const TOKENS = {
  dark: {
    pageBg:        '#000000',
    sidebarBg:     'rgba(8,8,8,0.94)',
    sidebarBorder: 'rgba(255,255,255,0.07)',
    textPrimary:   '#FAFAFA',
    textSecondary: '#A1A1AA',
    textMuted:     '#52525B',
    accent:        '#EF4444',
    cardBg:        '#141414',
    focusBorder:   '#EF4444',
    focusShadow:   'rgba(239,68,68,0.35)',
    rowHeader:     '#FAFAFA',
    navActive:     'rgba(239,68,68,0.14)',
    badge:         'rgba(239,68,68,0.18)',
    scanline:      'rgba(255,255,255,0.015)',
  },
  light: {
    pageBg:        '#F4F4F5',
    sidebarBg:     'rgba(236,236,240,0.97)',
    sidebarBorder: 'rgba(0,0,0,0.10)',
    textPrimary:   '#18181B',
    textSecondary: '#52525B',
    textMuted:     '#A1A1AA',
    accent:        '#DC2626',
    cardBg:        '#E4E4E7',
    focusBorder:   '#18181B',
    focusShadow:   'rgba(0,0,0,0.30)',
    rowHeader:     '#18181B',
    navActive:     'rgba(220,38,38,0.10)',
    badge:         'rgba(220,38,38,0.12)',
    scanline:      'rgba(0,0,0,0)',
  },
}

// ─────────────────────────────────────────────
// Loading Screen
// ─────────────────────────────────────────────
function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [msgIdx, setMsgIdx] = useState(0)
  const [exiting, setExiting] = useState(false)

  const finish = useCallback(() => {
    setExiting(true)
    setTimeout(onComplete, 480)
  }, [onComplete])

  useEffect(() => {
    let idx = 0
    const iv = setInterval(() => {
      idx++
      setMsgIdx(idx)
      if (idx >= DIAG.length - 1) {
        clearInterval(iv)
        setTimeout(finish, 700)
      }
    }, 520)
    return () => clearInterval(iv)
  }, [finish])

  // SVG ring dimensions
  const CX = 110
  const CY = 110
  const R1 = 96   // outer ring
  const R2 = 76   // mid ring
  const C1 = 2 * Math.PI * R1
  const C2 = 2 * Math.PI * R2
  const seg1 = (C1 / 8) * 0.62
  const gap1 = (C1 / 8) * 0.38
  const seg2 = (C2 / 14) * 0.50
  const gap2 = (C2 / 14) * 0.50

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: '#000000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Outfit', sans-serif",
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.48s ease',
      }}
    >
      {/* Ring assembly */}
      <svg width={220} height={220} viewBox="0 0 220 220" style={{ overflow: 'visible' }}>
        {/* Static outer track */}
        <circle cx={CX} cy={CY} r={R1} fill="none" stroke="#1C1C1C" strokeWidth="1.5" />
        {/* Static mid track */}
        <circle cx={CX} cy={CY} r={R2} fill="none" stroke="#181818" strokeWidth="1" />
        {/* Outer spinning segments */}
        <circle
          cx={CX} cy={CY} r={R1}
          fill="none" stroke="#EF4444" strokeWidth="3.5"
          strokeDasharray={`${seg1} ${gap1}`}
          strokeLinecap="round"
          className="rs-spin-cw"
        />
        {/* Mid counter-spinning segments */}
        <circle
          cx={CX} cy={CY} r={R2}
          fill="none" stroke="#EF4444" strokeWidth="1.5"
          strokeDasharray={`${seg2} ${gap2}`}
          strokeLinecap="round"
          opacity="0.55"
          className="rs-spin-ccw"
        />
        {/* Inner static ring */}
        <circle cx={CX} cy={CY} r={56} fill="none" stroke="#222" strokeWidth="1" />
        {/* Hexagon frame */}
        <polygon
          points={`${CX},${CY - 38} ${CX + 33},${CY - 19} ${CX + 33},${CY + 19} ${CX},${CY + 38} ${CX - 33},${CY + 19} ${CX - 33},${CY - 19}`}
          fill="none" stroke="#EF4444" strokeWidth="1" opacity="0.35"
        />
        {/* Center disc */}
        <circle cx={CX} cy={CY} r={30} fill="#0A0A0A" />
        {/* Play triangle */}
        <polygon
          points={`${CX - 9},${CY - 13} ${CX - 9},${CY + 13} ${CX + 16},${CY}`}
          fill="#EF4444"
        />
        {/* Corner tick marks */}
        {[0, 90, 180, 270].map(deg => {
          const rad = (deg * Math.PI) / 180
          const ix = CX + (R1 + 8) * Math.cos(rad)
          const iy = CY + (R1 + 8) * Math.sin(rad)
          const ox = CX + (R1 + 16) * Math.cos(rad)
          const oy = CY + (R1 + 16) * Math.sin(rad)
          return <line key={deg} x1={ix} y1={iy} x2={ox} y2={oy} stroke="#EF4444" strokeWidth="1.5" opacity="0.5" />
        })}
      </svg>

      {/* Version badge */}
      <div
        style={{
          marginTop: 10,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, color: '#3F3F46',
          letterSpacing: '0.18em',
        }}
      >
        RETROSTREAM v4.2.1 — BUILD 20240728
      </div>

      {/* Diagnostic text */}
      <div
        key={msgIdx}
        className="rs-fadein"
        style={{
          marginTop: 36,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13, color: '#A1A1AA',
          letterSpacing: '0.06em',
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        <span>{DIAG[Math.min(msgIdx, DIAG.length - 1)]}</span>
        <span className="rs-blink" style={{ color: '#EF4444' }}>▮</span>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, marginTop: 28 }}>
        {DIAG.map((_, i) => (
          <div
            key={i}
            style={{
              width: 5, height: 5, borderRadius: '50%',
              background: i <= msgIdx ? '#EF4444' : '#27272A',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* Skip */}
      <button
        onClick={finish}
        style={{
          marginTop: 40,
          padding: '8px 22px',
          background: 'transparent',
          border: '1px solid #3F3F46',
          color: '#71717A',
          fontFamily: "'Outfit', sans-serif",
          fontSize: 12, letterSpacing: '0.08em',
          cursor: 'pointer', borderRadius: 4,
        }}
      >
        SKIP INTRO
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Telemetry LED Indicator
// ─────────────────────────────────────────────
function TelemetryLED({
  state,
  onClick,
}: {
  state: TelemetryState
  onClick: () => void
}) {
  const cfg = TELE[state]
  return (
    <button
      onClick={onClick}
      title={`Status: ${cfg.label} — click to cycle`}
      style={{
        position: 'absolute', top: 28, right: 20,
        width: 12, height: 12, borderRadius: '50%',
        background: cfg.color,
        border: 'none', cursor: 'pointer', padding: 0,
        boxShadow: state !== 'error'
          ? `0 0 0 4px ${cfg.glow}, 0 0 12px 4px ${cfg.glow}`
          : 'none',
        transition: 'background 0.4s ease, box-shadow 0.4s ease',
      }}
      className={cfg.pulse ? 'rs-pulse-glow' : ''}
    />
  )
}

// ─────────────────────────────────────────────
// Poster Card
// ─────────────────────────────────────────────
function PosterCard({
  movie, focused, theme, onEnter, onLeave,
}: {
  movie: Movie
  focused: boolean
  theme: Theme
  onEnter: (m: Movie) => void
  onLeave: () => void
}) {
  const t = TOKENS[theme]
  return (
    <div
      onMouseEnter={() => onEnter(movie)}
      onMouseLeave={onLeave}
      style={{
        flexShrink: 0,
        width: 'clamp(120px, 13.5vw, 175px)',
        aspectRatio: '2 / 3',
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
        background: t.cardBg,
        border: focused ? `4px solid ${t.focusBorder}` : '4px solid transparent',
        transform: focused ? 'scale(1.12)' : 'scale(1)',
        transformOrigin: 'center bottom',
        transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), border-color 0.15s ease, box-shadow 0.2s ease',
        boxShadow: focused
          ? `0 12px 40px rgba(0,0,0,0.8), 0 0 0 1px ${t.focusBorder}44, 0 0 24px 4px ${t.focusShadow}`
          : '0 4px 16px rgba(0,0,0,0.4)',
        cursor: 'pointer',
        zIndex: focused ? 20 : 1,
      }}
    >
      <img
        src={p(movie.posterId)}
        alt={movie.title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        loading="lazy"
      />

      {/* Overlay on focus */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0) 55%)',
          opacity: focused ? 1 : 0,
          transition: 'opacity 0.2s ease',
          padding: '0 10px 10px',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }}
      >
        <div style={{
          color: '#FAFAFA', fontWeight: 700, fontSize: 12,
          fontFamily: "'Outfit', sans-serif",
          lineHeight: 1.25, marginBottom: 3,
        }}>
          {movie.title}
        </div>
        <div style={{
          color: '#A1A1AA', fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.04em',
        }}>
          {movie.year} · {movie.rating}
        </div>
        {/* Rating badge */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: 'rgba(239,68,68,0.85)',
          color: '#fff', fontSize: 9, fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          padding: '2px 5px', borderRadius: 3,
          letterSpacing: '0.05em',
        }}>
          {movie.rating}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Content Row
// ─────────────────────────────────────────────
function ContentRowComp({
  row, focusedId, theme, onEnter, onLeave,
}: {
  row: ContentRow
  focusedId: number | null
  theme: Theme
  onEnter: (m: Movie) => void
  onLeave: () => void
}) {
  const t = TOKENS[theme]
  return (
    <div style={{ marginBottom: 44 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 26, fontWeight: 700,
          color: t.rowHeader,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          margin: 0,
        }}>
          {row.label}
        </h2>
        <div style={{
          width: 32, height: 2,
          background: t.accent,
          borderRadius: 1, opacity: 0.7,
        }} />
      </div>

      <div
        className="rs-scroll"
        style={{
          display: 'flex', gap: 14,
          overflowX: 'auto', paddingBottom: 20,
          paddingLeft: 2, paddingRight: 2,
          paddingTop: 8,
        }}
      >
        {row.movies.map(m => (
          <PosterCard
            key={m.id}
            movie={m}
            focused={focusedId === m.id}
            theme={theme}
            onEnter={onEnter}
            onLeave={onLeave}
          />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────
function Sidebar({
  activeNav, theme, telemetry,
  onNav, onTelemetry, onThemeToggle,
}: {
  activeNav: string
  theme: Theme
  telemetry: TelemetryState
  onNav: (id: string) => void
  onTelemetry: () => void
  onThemeToggle: () => void
}) {
  const t = TOKENS[theme]
  const cfg = TELE[telemetry]

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: '20%', minWidth: 210, maxWidth: 290,
        background: t.sidebarBg,
        backdropFilter: 'blur(24px)',
        borderRight: `1px solid ${t.sidebarBorder}`,
        display: 'flex', flexDirection: 'column',
        paddingTop: 80, paddingBottom: 80,
        paddingLeft: 80, paddingRight: 24,
        zIndex: 50,
      }}
    >
      {/* Telemetry LED — top-right corner of sidebar */}
      <TelemetryLED state={telemetry} onClick={onTelemetry} />

      {/* Telemetry label */}
      <div style={{
        position: 'absolute', top: 24, right: 38,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, color: cfg.color,
        letterSpacing: '0.12em',
        opacity: 0.75, whiteSpace: 'nowrap',
      }}>
        {cfg.label.toUpperCase()}
      </div>

      {/* Logo */}
      <div style={{ marginBottom: 52 }}>
        <div style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 26, fontWeight: 800,
          letterSpacing: '-0.025em', lineHeight: 1,
        }}>
          <span style={{ color: t.accent }}>RETRO</span>
          <span style={{ color: t.textPrimary }}>STREAM</span>
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, color: t.textMuted,
          letterSpacing: '0.18em', marginTop: 5,
        }}>
          PLEX CLIENT v4.2.1
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(item => {
          const active = activeNav === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '11px 14px',
                background: active ? t.navActive : 'transparent',
                border: 'none',
                borderLeft: active ? `3px solid ${t.accent}` : '3px solid transparent',
                borderRadius: '0 6px 6px 0',
                color: active ? t.accent : t.textSecondary,
                fontFamily: "'Outfit', sans-serif",
                fontSize: 22, fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                transition: 'all 0.15s ease',
                lineHeight: 1.25,
                marginLeft: -14,
                paddingLeft: 14,
              }}
            >
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* A/B Theme toggle */}
      <button
        onClick={onThemeToggle}
        style={{
          marginTop: 'auto',
          padding: '10px 12px',
          background: 'transparent',
          border: `1px solid ${t.sidebarBorder}`,
          borderRadius: 5,
          color: t.textMuted,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, cursor: 'pointer',
          letterSpacing: '0.07em',
          textAlign: 'left',
          transition: 'border-color 0.15s, color 0.15s',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <span style={{
          display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
          background: theme === 'dark' ? '#27272A' : '#D4D4D8',
          border: `1px solid ${t.textMuted}`,
        }} />
        A/B: {theme === 'dark' ? 'DARK THEME' : 'LIGHT THEME'}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Telemetry State Demo Showcase
// ─────────────────────────────────────────────
function TelemetryShowcase({ theme }: { theme: Theme }) {
  const t = TOKENS[theme]
  const states: TelemetryState[] = ['connecting', 'online', 'error']

  return (
    <div style={{
      display: 'flex', gap: 20, flexWrap: 'wrap',
      padding: '20px 24px',
      background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
      borderRadius: 10,
      border: `1px solid ${t.sidebarBorder}`,
      marginTop: 8, marginBottom: 44,
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, color: t.textMuted,
        letterSpacing: '0.12em',
        width: '100%', marginBottom: 4,
      }}>
        TELEMETRY NODE STATES
      </div>
      {states.map(s => {
        const cfg = TELE[s]
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 12, height: 12, borderRadius: '50%',
              background: cfg.color,
              flexShrink: 0,
              boxShadow: s !== 'error' ? `0 0 0 4px ${cfg.glow}` : 'none',
            }}
              className={cfg.pulse ? 'rs-pulse-glow' : ''}
            />
            <div>
              <div style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13, fontWeight: 600, color: t.textPrimary,
              }}>
                {cfg.label}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, color: cfg.color,
                letterSpacing: '0.06em',
              }}>
                {s === 'connecting' && 'glow 50% opacity · amber'}
                {s === 'online'     && 'glow 100% · green'}
                {s === 'error'      && 'no glow dispersion · crimson'}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// Main View
// ─────────────────────────────────────────────
function MainView({
  theme, telemetry, onTelemetry, onThemeToggle,
}: {
  theme: Theme
  telemetry: TelemetryState
  onTelemetry: () => void
  onThemeToggle: () => void
}) {
  const [activeNav, setActiveNav] = useState('home')
  const [focusedMovie, setFocusedMovie] = useState<Movie | null>(null)
  const t = TOKENS[theme]

  const handleEnter = useCallback((m: Movie) => setFocusedMovie(m), [])
  const handleLeave = useCallback(() => setFocusedMovie(null), [])

  const currentLabel = NAV_ITEMS.find(n => n.id === activeNav)?.label ?? 'Home'

  return (
    <div style={{
      minHeight: '100vh',
      background: t.pageBg,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ── Fanart background layer ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        pointerEvents: 'none',
      }}>
        {focusedMovie && (
          <div
            key={focusedMovie.fanartId}
            className="rs-fadein"
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${fa(focusedMovie.fanartId)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: theme === 'dark' ? 'brightness(0.22) saturate(0.8)' : 'brightness(0.12) saturate(0.4)',
            }}
          />
        )}
        {/* Always-on vignette for depth */}
        <div style={{
          position: 'absolute', inset: 0,
          background: theme === 'dark'
            ? 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0.5) 100%)'
            : 'linear-gradient(to right, rgba(244,244,245,0.92) 0%, rgba(244,244,245,0.3) 70%, rgba(244,244,245,0.6) 100%)',
          opacity: focusedMovie ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }} />
        {/* Scanline texture (dark only) */}
        {theme === 'dark' && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* ── Sidebar ── */}
      <Sidebar
        activeNav={activeNav}
        theme={theme}
        telemetry={telemetry}
        onNav={setActiveNav}
        onTelemetry={onTelemetry}
        onThemeToggle={onThemeToggle}
      />

      {/* ── Content area ── */}
      <div style={{
        marginLeft: '20%',
        minHeight: '100vh',
        padding: '80px 80px 80px 48px',
        position: 'relative', zIndex: 10,
      }}>
        {/* Page header */}
        <div style={{ marginBottom: 48, minHeight: 72 }}>
          <div
            key={focusedMovie?.id ?? activeNav}
            className="rs-fadein"
          >
            <h1 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 48, fontWeight: 800,
              color: t.textPrimary,
              letterSpacing: '-0.025em',
              lineHeight: 1,
              margin: 0,
              marginBottom: 8,
            }}>
              {focusedMovie ? focusedMovie.title : currentLabel}
            </h1>
            {focusedMovie && (
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13, color: t.textSecondary,
                letterSpacing: '0.04em',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span>{focusedMovie.year}</span>
                <span style={{ color: t.accent }}>·</span>
                <span>{focusedMovie.rating}</span>
                <span style={{ color: t.accent }}>·</span>
                <span style={{ color: t.accent }}>▶ Press SELECT to Play</span>
              </div>
            )}
          </div>
        </div>

        {/* Telemetry showcase */}
        <TelemetryShowcase theme={theme} />

        {/* Content rows */}
        {ROWS.map(row => (
          <ContentRowComp
            key={row.key}
            row={row}
            focusedId={focusedMovie?.id ?? null}
            theme={theme}
            onEnter={handleEnter}
            onLeave={handleLeave}
          />
        ))}

        {/* Footer */}
        <div style={{
          marginTop: 40, paddingTop: 24,
          borderTop: `1px solid ${t.sidebarBorder}`,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11, color: t.textMuted,
          letterSpacing: '0.08em',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>RETROSTREAM v4.2.1</span>
          <span>10-FOOT UI FRAMEWORK · {theme.toUpperCase()} THEME</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Root App
// ─────────────────────────────────────────────
export default function App() {
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<Theme>('dark')
  const [telemetry, setTelemetry] = useState<TelemetryState>('connecting')

  // Auto-advance connecting → online after splash
  useEffect(() => {
    const t = setTimeout(() => setTelemetry('online'), 5200)
    return () => clearTimeout(t)
  }, [])

  const cycleTelemetry = useCallback(() => {
    const seq: TelemetryState[] = ['connecting', 'online', 'error']
    setTelemetry(prev => seq[(seq.indexOf(prev) + 1) % seq.length])
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <>
      {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      {!loading && (
        <MainView
          theme={theme}
          telemetry={telemetry}
          onTelemetry={cycleTelemetry}
          onThemeToggle={toggleTheme}
        />
      )}
    </>
  )
}
