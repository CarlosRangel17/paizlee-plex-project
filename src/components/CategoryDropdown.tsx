import { useEffect, useId, useRef, useState } from 'react'
import { CheckIcon, ChevronDownIcon } from '@/components/Icons'
import { useBackHandler } from '@/navigation/backStack'
import { focusElement, focusFirstIn } from '@/navigation/useSpatialNavigation'

export interface DropdownOption {
  id: string
  label: string
  hint?: string
}

export interface DropdownGroup {
  label: string
  options: DropdownOption[]
}

interface CategoryDropdownProps {
  label: string
  groups: DropdownGroup[]
  value: string
  onChange: (id: string) => void
}

export function CategoryDropdown({ label, groups, value, onChange }: CategoryDropdownProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const selected = groups.flatMap((g) => g.options).find((o) => o.id === value)

  const close = () => {
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current && focusElement(triggerRef.current))
  }

  useBackHandler(open, close)

  useEffect(() => {
    if (open && panelRef.current) focusFirstIn(panelRef.current)
  }, [open])

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        data-focusable
        data-autofocus
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className="tv-focus flex min-w-80 items-center gap-4 rounded-xl border border-plum/60 bg-surface px-5 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[10px] tracking-[0.18em] text-ink-dim">{label.toUpperCase()}</span>
          <span className="block truncate text-xl font-semibold">{selected?.label ?? 'Choose'}</span>
        </span>
        <ChevronDownIcon className={`size-6 text-plum transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} aria-hidden />
          <div
            ref={panelRef}
            id={listId}
            role="listbox"
            data-focus-scope
            className="pz-fadein absolute top-full right-0 z-50 mt-3 max-h-[65vh] w-[26rem] overflow-y-auto rounded-2xl border border-plum/50 bg-surface-raised p-3 shadow-2xl shadow-black/70"
          >
            {groups.map((group) => (
              <div key={group.label} className="mb-2 last:mb-0">
                <div className="px-3 pt-3 pb-2 font-mono text-[11px] tracking-[0.18em] text-plum">
                  {group.label.toUpperCase()}
                </div>
                {group.options.map((opt) => {
                  const isSelected = opt.id === value
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      data-focusable
                      data-autofocus={isSelected || undefined}
                      onClick={() => {
                        onChange(opt.id)
                        close()
                      }}
                      className={`tv-focus mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-lg ${
                        isSelected ? 'bg-violet text-ink' : 'text-ink-muted'
                      }`}
                    >
                      <span className="flex-1 truncate">{opt.label}</span>
                      {opt.hint && <span className="font-mono text-xs text-ink-dim">{opt.hint}</span>}
                      {isSelected && <CheckIcon className="size-5 text-gold" />}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
