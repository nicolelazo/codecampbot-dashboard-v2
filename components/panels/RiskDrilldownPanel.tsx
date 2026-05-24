'use client'
import { useState, useEffect, useMemo } from 'react'
import type { Risk } from '@/lib/types'

// ── Design tokens — exact spec colours ───────────────────────────────────────
const C = {
  bg:      '#0D1117',
  surface: '#0D1117',
  card:    '#161B22',
  border:  '#21262D',
  teal:    '#2DD4BF',
  rose:    '#e11d48',
  muted:   '#64748b',
  text:    '#cfd5dd',
  dim:     '#8899aa',
}

// Severity — spec colours
const SEV: Record<string, { color: string; bg: string; border: string; label: string; order: number }> = {
  high:   { color: '#F87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)',  label: 'High',   order: 0 },
  medium: { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)',   label: 'Medium', order: 1 },
  low:    { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.25)', label: 'Low',    order: 2 },
}

// Status chips — spec colours
const STATUS: Record<string, { color: string; bg: string; border: string; label: string }> = {
  open:        { color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)',  label: 'Open'        },
  in_progress: { color: '#2DD4BF', bg: 'rgba(45,212,191,0.1)',   border: 'rgba(45,212,191,0.3)',   label: 'In Progress' },
  blocked:     { color: '#F87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.3)',  label: 'Blocked'     },
}

// Risk type pill colours
const TYPE_COLOR: Record<string, string> = {
  Logistical: '#60a5fa',
  Technical:  '#a78bfa',
  Financial:  '#34d399',
  People:     '#f9a8d4',
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SevBadge({ sev }: { sev: string }) {
  const m = SEV[sev] ?? SEV.low
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '999px', fontSize: '10px',
      fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: m.color }} />
      {m.label}
    </span>
  )
}

function StatusChip({ status }: { status: string }) {
  const m = STATUS[status] ?? STATUS.open
  return (
    <span style={{
      display: 'inline-flex', padding: '2px 8px', borderRadius: '999px',
      fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em',
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {m.label}
    </span>
  )
}

function TypePill({ type }: { type: string }) {
  const color = TYPE_COLOR[type] ?? '#94A3B8'
  return (
    <span style={{
      display: 'inline-flex', padding: '2px 8px', borderRadius: '999px',
      fontSize: '10px', fontWeight: 600,
      background: `${color}18`, color, border: `1px solid ${color}30`,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {type}
    </span>
  )
}

// ── Risk row ──────────────────────────────────────────────────────────────────
function RiskRow({ risk, onResolve }: { risk: Risk; onResolve: (id: string) => Promise<void> }) {
  const [expanded,  setExpanded]  = useState(false)
  const [hovered,   setHovered]   = useState(false)
  const [resolving, setResolving] = useState(false)

  const sev = SEV[risk.severity] ?? SEV.low

  async function handleResolve(e: React.MouseEvent) {
    e.stopPropagation()
    setResolving(true)
    await onResolve(risk.id)
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(22,27,34,0.95)' : C.card,
        borderTop: `1px solid ${hovered ? 'rgba(45,212,191,0.2)' : C.border}`,
        borderRight: `1px solid ${hovered ? 'rgba(45,212,191,0.2)' : C.border}`,
        borderBottom: `1px solid ${hovered ? 'rgba(45,212,191,0.2)' : C.border}`,
        borderLeft: `3px solid ${sev.color}`,
        borderRadius: '12px',
        transition: 'all .18s ease-out',
        overflow: 'hidden',
      }}
    >
      {/* Clickable header row */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ padding: '14px 16px', cursor: 'pointer' }}
      >
        {/* Top line: code + title + expand chevron */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: C.muted, fontFamily: 'monospace', flexShrink: 0 }}>
              {risk.code}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: C.text, lineHeight: 1.35 }}>
              {risk.title}
            </span>
          </div>
          <span style={{
            color: C.muted, fontSize: '11px', flexShrink: 0,
            transition: 'transform .18s', display: 'inline-block',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>▾</span>
        </div>

        {/* Meta row: type · severity · status · chapter · owner · ETA */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <TypePill type={risk.risk_type ?? 'Logistical'} />
          <SevBadge sev={risk.severity} />
          <StatusChip status={risk.status} />

          {risk.chapter_tag && (
            <span style={{
              fontSize: '10px', color: C.dim,
              background: 'rgba(100,116,139,0.08)', border: `1px solid ${C.border}`,
              borderRadius: '999px', padding: '2px 8px', whiteSpace: 'nowrap',
            }}>
              📍 {risk.chapter_tag}
            </span>
          )}

          {risk.owner && (
            <span style={{ fontSize: '10px', color: C.dim, whiteSpace: 'nowrap' }}>
              👤 {risk.owner}
            </span>
          )}

          {risk.eta && (
            <span style={{
              fontSize: '10px', color: '#FBBF24',
              background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
              borderRadius: '999px', padding: '2px 8px', whiteSpace: 'nowrap',
            }}>
              ⏱ {risk.eta}
            </span>
          )}
        </div>

        {/* Resolve button — visible on hover */}
        {hovered && (
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleResolve}
              disabled={resolving}
              style={{
                padding: '5px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                background: resolving ? 'rgba(45,212,191,0.05)' : 'rgba(45,212,191,0.1)',
                border: '1px solid rgba(45,212,191,0.3)', color: C.teal,
                cursor: resolving ? 'wait' : 'pointer', transition: 'all .15s',
              }}
            >
              {resolving ? 'Resolving…' : '✓ Mark Resolved'}
            </button>
          </div>
        )}
      </div>

      {/* Expanded notes */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 16px 14px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, marginBottom: '6px' }}>
            Notes
          </div>
          <div style={{ fontSize: '12px', color: C.dim, lineHeight: 1.75 }}>
            {risk.description?.trim()
              ? risk.description
              : <span style={{ fontStyle: 'italic', opacity: 0.45 }}>No notes added.</span>
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ── Filter select ─────────────────────────────────────────────────────────────
function FilterSelect({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <label style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: '#161B22', border: `1px solid ${C.border}`, borderRadius: '8px',
          color: C.text, fontSize: '12px', padding: '6px 10px', cursor: 'pointer',
          outline: 'none',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
interface Props {
  open: boolean
  risks: Risk[]
  onClose: () => void
  onResolve: (id: string) => Promise<void>
}

export default function RiskDrilldownPanel({ open, risks, onClose, onResolve }: Props) {
  const [filterSev,     setFilterSev]     = useState('all')
  const [filterChapter, setFilterChapter] = useState('all')
  const [filterStatus,  setFilterStatus]  = useState('all')

  // ESC to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Active (non-resolved) risks only
  const activeRisks = useMemo(
    () => risks.filter(r => r.status !== 'resolved'),
    [risks],
  )

  // Unique chapter options from live data
  const chapterOptions = useMemo(() => {
    const tags = Array.from(new Set(activeRisks.map(r => r.chapter_tag).filter(Boolean)))
    return [{ value: 'all', label: 'All Chapters' }, ...tags.map(t => ({ value: t, label: t }))]
  }, [activeRisks])

  // Filtered + sorted list
  const filtered = useMemo(() => {
    return activeRisks
      .filter(r => filterSev     === 'all' || r.severity    === filterSev)
      .filter(r => filterChapter === 'all' || r.chapter_tag === filterChapter)
      .filter(r => filterStatus  === 'all' || r.status      === filterStatus)
      .sort((a, b) => (SEV[a.severity]?.order ?? 99) - (SEV[b.severity]?.order ?? 99))
  }, [activeRisks, filterSev, filterChapter, filterStatus])

  // Count header numbers
  const openCount       = activeRisks.filter(r => r.status === 'open').length
  const inProgressCount = activeRisks.filter(r => r.status === 'in_progress').length
  const blockedCount    = activeRisks.filter(r => r.status === 'blocked').length

  if (!open) return null

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', justifyContent: 'flex-end' }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,6,23,0.78)', backdropFilter: 'blur(5px)' }} />

      {/* Drawer */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(580px, 100vw)',
          height: '100%',
          background: C.bg,
          borderLeft: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-24px 0 80px rgba(0,0,0,0.8)',
          animation: 'riskSlideIn .22s ease-out',
        }}
      >
        {/* ── Header ── */}
        <div style={{ padding: '22px 24px 16px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.muted, marginBottom: '4px' }}>
                Risk Register
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>
                Open Risks
              </h2>

              {/* Count header */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', fontSize: '12px', color: C.dim }}>
                {activeRisks.length === 0 ? (
                  <span style={{ color: C.teal, fontWeight: 700 }}>All clear — 0 open risks ✓</span>
                ) : (
                  <>
                    {openCount > 0 && (
                      <span><span style={{ color: '#F87171', fontWeight: 700 }}>{openCount}</span> open</span>
                    )}
                    {inProgressCount > 0 && (
                      <span>· <span style={{ color: C.teal, fontWeight: 700 }}>{inProgressCount}</span> in progress</span>
                    )}
                    {blockedCount > 0 && (
                      <span>· <span style={{ color: '#F87171', fontWeight: 700 }}>{blockedCount}</span> blocked</span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'none', border: 'none', color: C.muted,
                fontSize: '20px', cursor: 'pointer', padding: '4px 8px',
                borderRadius: '6px', lineHeight: 1, flexShrink: 0,
                transition: 'color .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = C.text)}
              onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
            >
              ✕
            </button>
          </div>

          {/* Filter bar */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
            <FilterSelect
              label="Severity"
              value={filterSev}
              onChange={setFilterSev}
              options={[
                { value: 'all',    label: 'All Severities' },
                { value: 'high',   label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low',    label: 'Low' },
              ]}
            />
            <FilterSelect
              label="Chapter"
              value={filterChapter}
              onChange={setFilterChapter}
              options={chapterOptions}
            />
            <FilterSelect
              label="Status"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all',         label: 'All Statuses' },
                { value: 'open',        label: 'Open' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'blocked',     label: 'Blocked' },
              ]}
            />
          </div>
        </div>

        {/* ── Risk list ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {activeRisks.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', paddingBottom: '80px' }}>
              <div style={{ fontSize: '60px', lineHeight: 1 }}>🎉</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '17px', fontWeight: 700, color: C.teal, marginBottom: '6px' }}>0 open risks</div>
                <div style={{ fontSize: '13px', color: C.muted }}>All risks have been resolved. Great work!</div>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '60px', color: C.muted, fontSize: '13px' }}>
              No risks match the current filters.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map(risk => (
                <RiskRow key={risk.id} risk={risk} onResolve={onResolve} />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '10px 20px', borderTop: `1px solid ${C.border}`, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '10px', color: C.muted }}>Click a row to expand notes · ESC to close</span>
          <span style={{ fontSize: '10px', color: C.muted }}>{filtered.length} shown</span>
        </div>
      </div>

      <style>{`
        @keyframes riskSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
