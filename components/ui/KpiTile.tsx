'use client'
import { useState, useRef, useEffect } from 'react'

const colorMap = {
  blue:   { num: '#06b6d4', border: 'rgba(6,182,212,0.3)',   bg: 'rgba(6,182,212,0.06)'  },
  teal:   { num: '#14b8a6', border: 'rgba(20,184,166,0.35)', bg: 'rgba(20,184,166,0.06)' },
  green:  { num: '#14b8a6', border: 'rgba(20,184,166,0.5)',  bg: 'rgba(20,184,166,0.08)' },
  yellow: { num: '#f59e0b', border: 'rgba(245,158,11,0.3)',  bg: 'rgba(245,158,11,0.06)' },
  red:    { num: '#e11d48', border: 'rgba(225,29,72,0.3)',   bg: 'rgba(225,29,72,0.06)'  },
}

export default function KpiTile({
  id, value, label, sublabel, color = 'blue', onSave,
}: {
  id?: string
  value: string
  label: string
  sublabel?: string
  color?: keyof typeof colorMap
  onSave?: (id: string, value: string) => Promise<void>
}) {
  const c = colorMap[color]
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value)
  const [saving, setSaving]   = useState(false)
  const [hovered, setHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])
  useEffect(() => { setDraft(value) }, [value])

  async function save() {
    if (!id || !onSave) { setEditing(false); return }
    setSaving(true)
    await onSave(id, draft)
    setSaving(false)
    setEditing(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') { setDraft(value); setEditing(false) }
  }

  return (
    <div
      className="rounded-[22px] px-5 py-4 text-center"
      style={{
        border: `1px solid ${c.border}`,
        background: `radial-gradient(120% 90% at 50% -10%, ${c.bg}, transparent 65%), linear-gradient(160deg, rgba(2,6,23,0.96), rgba(15,23,42,0.86))`,
        position: 'relative',
        cursor: onSave ? 'pointer' : 'default',
        minHeight: '118px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: hovered ? `0 14px 30px -22px ${c.num}99, inset 0 1px 0 rgba(255,255,255,0.06)` : `0 10px 24px -24px ${c.num}80, inset 0 1px 0 rgba(255,255,255,0.05)`,
        transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
        transform: hovered && !editing ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => { if (onSave && !editing) setEditing(true) }}
    >
      <div
        style={{
          position: 'absolute',
          left: 14,
          right: 14,
          top: 10,
          height: 1,
          borderRadius: 999,
          background: `linear-gradient(90deg, transparent, ${c.num}90, transparent)`,
          opacity: hovered ? 0.9 : 0.45,
          pointerEvents: 'none',
        }}
      />

      {onSave && hovered && !editing && (
        <span
          style={{
            position: 'absolute',
            top: '10px',
            right: '12px',
            fontSize: '9px',
            color: c.num,
            opacity: 0.78,
            border: `1px solid ${c.border}`,
            borderRadius: '999px',
            padding: '2px 7px',
            letterSpacing: '0.08em',
            fontWeight: 700,
          }}
        >
          EDIT
        </span>
      )}

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={save}
            style={{
              width: '100%', textAlign: 'center', background: 'transparent',
              border: 'none', borderBottom: `2px solid ${c.num}`,
              color: c.num, fontSize: 34, fontWeight: 800, lineHeight: 1,
              marginBottom: '2px', outline: 'none', fontFamily: 'inherit',
            }}
            disabled={saving}
          />
        ) : (
          <div
            className="font-extrabold leading-none"
            style={{
              fontSize: 38,
              color: c.num,
              letterSpacing: '-0.04em',
              textShadow: `0 0 18px ${c.num}2e`,
            }}
          >
            {value}
          </div>
        )}

        <div className="text-[13px] font-extrabold uppercase tracking-widest" style={{ color: c.num, lineHeight: 1.05 }}>
          {label}
        </div>
        {sublabel && <div className="text-[10px] text-[#7f8da4]" style={{ lineHeight: 1.2 }}>{sublabel}</div>}
      </div>
    </div>
  )
}
