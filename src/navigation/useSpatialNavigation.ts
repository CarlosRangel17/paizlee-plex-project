import { useEffect } from 'react'
import { runBackHandler } from '@/navigation/backStack'

/**
 * D-pad navigation for the 10-foot UI.
 *
 * Markup contract:
 *  - `data-focusable` on every remote-reachable control (buttons, inputs, tiles).
 *  - `data-focus-scope` on overlays/popovers; only the last one in DOM order is navigable.
 *  - `data-focus-region="<name>"` on large areas (sidebar, main) so re-entering a region
 *    restores the element that was focused there last.
 *  - `data-autofocus` marks the preferred landing element for a scope.
 *  - `data-nav-active` marks a region's landing element when nothing there was focused yet.
 */

type Direction = 'up' | 'down' | 'left' | 'right'

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

const BACK_KEYS = new Set(['Escape', 'BrowserBack', 'GoBack', 'Back'])
// webOS (461) and Tizen (10009) remotes report Back with no standard `key`.
const BACK_KEY_CODES = new Set([461, 10009])

const FOCUSABLE = '[data-focusable]:not([disabled])'

const lastFocusedByRegion = new Map<string, HTMLElement>()

function activeScope(): ParentNode {
  const scopes = document.querySelectorAll<HTMLElement>('[data-focus-scope]')
  return scopes.length ? scopes[scopes.length - 1] : document
}

function isVisible(el: HTMLElement): boolean {
  return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'
}

function candidatesIn(scope: ParentNode): HTMLElement[] {
  return Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isVisible)
}

const regionOf = (el: Element): string | null =>
  el.closest<HTMLElement>('[data-focus-region]')?.dataset.focusRegion ?? null

export function focusElement(el: HTMLElement): void {
  el.focus({ preventScroll: true })
  const inMain = regionOf(el) === 'main'
  el.scrollIntoView({ block: inMain ? 'center' : 'nearest', inline: 'nearest', behavior: 'smooth' })
}

export function focusFirstIn(scope: ParentNode = activeScope()): boolean {
  const preferred = scope.querySelector<HTMLElement>(`[data-autofocus]${FOCUSABLE}`)
  const target = preferred && isVisible(preferred) ? preferred : candidatesIn(scope)[0]
  if (!target) return false
  focusElement(target)
  return true
}

function findBest(from: HTMLElement, dir: Direction, candidates: HTMLElement[]): HTMLElement | null {
  const c = from.getBoundingClientRect()
  const cx = c.left + c.width / 2
  const cy = c.top + c.height / 2
  const fromRegion = regionOf(from)

  let best: HTMLElement | null = null
  let bestScore = Infinity

  for (const el of candidates) {
    if (el === from || el.contains(from) || from.contains(el)) continue
    const r = el.getBoundingClientRect()

    // Left/right stays within the current row; only a region change (e.g. into the sidebar) may leave it.
    const horizontal = dir === 'left' || dir === 'right'
    if (horizontal && (r.bottom <= c.top || r.top >= c.bottom) && regionOf(el) === fromRegion) continue

    const rx = r.left + r.width / 2
    const ry = r.top + r.height / 2

    let primary: number
    let perpendicularGap: number
    let perpendicularOffset: number

    if (horizontal) {
      // Compare against the current center so a +5% focus scale does not hide neighbors.
      if (dir === 'right' ? r.left < cx : r.right > cx) continue
      primary = dir === 'right' ? Math.max(0, r.left - c.right) : Math.max(0, c.left - r.right)
      perpendicularGap = Math.max(0, r.top - c.bottom, c.top - r.bottom)
      perpendicularOffset = Math.abs(ry - cy)
    } else {
      if (dir === 'down' ? r.top < cy : r.bottom > cy) continue
      primary = dir === 'down' ? Math.max(0, r.top - c.bottom) : Math.max(0, c.top - r.bottom)
      perpendicularGap = Math.max(0, r.left - c.right, c.left - r.right)
      perpendicularOffset = Math.abs(rx - cx)
    }

    const score = primary + perpendicularGap * 3 + perpendicularOffset * 0.05
    if (score < bestScore) {
      bestScore = score
      best = el
    }
  }
  return best
}

function shouldInputKeepKey(el: Element, dir: Direction): boolean {
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return false
  if (dir === 'up' || dir === 'down') return false
  const { selectionStart, selectionEnd, value } = el
  if (selectionStart === null || selectionStart !== selectionEnd) return true
  return dir === 'left' ? selectionStart > 0 : selectionStart < value.length
}

function move(dir: Direction): boolean {
  const scope = activeScope()
  const current = document.activeElement
  const candidates = candidatesIn(scope)

  if (!(current instanceof HTMLElement) || !candidates.includes(current)) {
    return focusFirstIn(scope)
  }

  const best = findBest(current, dir, candidates)
  if (!best) return false

  const fromRegion = regionOf(current)
  const toRegion = regionOf(best)
  if (toRegion && toRegion !== fromRegion) {
    const remembered = lastFocusedByRegion.get(toRegion)
    const fallback = document.querySelector<HTMLElement>(`[data-focus-region="${toRegion}"] [data-nav-active]`)
    const target = remembered?.isConnected && candidates.includes(remembered) ? remembered : fallback
    if (target && candidates.includes(target)) {
      focusElement(target)
      return true
    }
  }

  focusElement(best)
  return true
}

function isBackKey(e: KeyboardEvent): boolean {
  if (BACK_KEYS.has(e.key) || BACK_KEY_CODES.has(e.keyCode)) return true
  if (e.key !== 'Backspace') return false
  const el = document.activeElement
  return !(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
}

export function useSpatialNavigation(onUnhandledBack?: () => void): void {
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      if (!(e.target instanceof HTMLElement)) return
      const region = regionOf(e.target)
      if (region) lastFocusedByRegion.set(region, e.target)
    }

    const root = document.documentElement
    root.dataset.input = 'keys'
    const onPointerDown = () => {
      root.dataset.input = 'pointer'
    }

    const onKeyDown = (e: KeyboardEvent) => {
      root.dataset.input = 'keys'
      if (e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey) return

      if (isBackKey(e)) {
        e.preventDefault()
        if (!runBackHandler()) onUnhandledBack?.()
        return
      }

      // Activate explicitly: synthetic/remote-bridge key events skip native button activation.
      if (e.key === 'Enter' || e.key === 'Select') {
        const el = document.activeElement
        if (el instanceof HTMLButtonElement && el.matches(FOCUSABLE)) {
          e.preventDefault()
          if (!e.repeat) el.click()
        }
        return
      }

      const dir = KEY_DIRECTIONS[e.key]
      if (!dir) return
      if (document.activeElement && shouldInputKeepKey(document.activeElement, dir)) return
      if (move(dir)) e.preventDefault()
    }

    document.addEventListener('focusin', onFocusIn)
    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onUnhandledBack])
}

/** Remember focus before an overlay opens, and restore it when it closes. */
export function captureFocus(): () => void {
  const prev = document.activeElement
  return () => {
    if (prev instanceof HTMLElement && prev.isConnected) focusElement(prev)
    else focusFirstIn()
  }
}
