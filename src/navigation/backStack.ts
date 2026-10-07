import { useEffect, useRef } from 'react'

type BackHandler = () => void

const stack: { current: BackHandler }[] = []

/** While `active`, the remote's Back key invokes `handler` (most recently activated wins). */
export function useBackHandler(active: boolean, handler: BackHandler): void {
  const ref = useRef(handler)
  useEffect(() => {
    ref.current = handler
  })

  useEffect(() => {
    if (!active) return
    const entry = { get current() { return ref.current } }
    stack.push(entry)
    return () => {
      const i = stack.lastIndexOf(entry)
      if (i !== -1) stack.splice(i, 1)
    }
  }, [active])
}

export function runBackHandler(): boolean {
  const top = stack[stack.length - 1]
  if (!top) return false
  top.current()
  return true
}
