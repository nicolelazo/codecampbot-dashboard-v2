'use client'
import { useState } from 'react'
import PanelHeader from '@/components/ui/PanelHeader'
import Badge from '@/components/ui/Badge'
import SlideOver from '@/components/ui/SlideOver'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormField, { FieldInput, FieldTextarea, FieldSelect } from '@/components/ui/FormField'
import type { Risk } from '@/lib/types'

const SEV: Record<string, { color: string; bg: string; border: string; label: string }> = {
  high:   { color: '#e11d48', bg: 'rgba(225,29,72,0.1)',  border: 'rgba(225,29,72,0.3)',  label: 'HIGH'   },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: 'MED'    },
  low:    { color: '#14b8a6', bg: 'rgba(20,184,166,0.1)', border: 'rgba(20,184,166,0.3)', label: 'LOW'    },
}

const SEV_CYCLE: Record<string, string> = { high: 'medium', medium: 'low', low: 'high' }

const tagVariant: Record<string, 'warn' | 'risk' | 'pending' | 'tbc' | 'done'> = {
  'Tacloban': 'risk', 'Laguna': 'tbc', 'Iloilo': 'warn',
  'Pampanga': 'warn', 'All Chapters': 'warn', 'All': 'warn', 'HQ': 'pending',
}

interface Props {
  risks: Risk[]
  setRisks: React.Dispatch<React.SetStateAction<Risk[]>>
  onRefresh: () => Promise<void>
  isMobile?: boolean
}

export default function RisksPanel({ risks, setRisks, onRefresh }: Props) {
  const [showResolved, setShowResolved] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [addLoading, setAddLoading] = useState(false)

  const [form, setForm] = useState({ title: '', description: '', owner: '', chapter_tag: 'All', severity: 'medium' })

  const visible = showResolved ? risks : risks.filter(r => r.status === 'open')
  const high   = risks.filter(r => r.severity === 'high'   && r.status === 'open').length
  const medium = risks.filter(r => r.severity === 'medium' && r.status === 'open').length
  const low    = risks.filter(r => r.severity === 'low'    && r.status === 'open').length
  const open   = risks.filter(r => r.status === 'open').length

  async function addRisk() {
    if (!form.title.trim()) return
    setAddLoading(true)
    try {
      const res = await fetch('/api/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        await onRefresh()
        setForm({ title: '', description: '', owner: '', chapter_tag: 'All', severity: 'medium' })
        setAddOpen(false)
      } else {
        const body = await res.json().catch(() => ({}))
        alert(body.error ?? `Failed to add risk (${res.status})`)
      }
    } catch (err) {
      alert('Network error — could not add risk.')
    } finally {
      setAddLoading(false)
    }
  }

  async function cycleSeverity(risk: Risk) {
    const next = SEV_CYCLE[risk.severity] as Risk['severity']
    setRisks(prev => prev.map(r => r.id === risk.id ? { ...r, severity: next } : r))
    const res = await fetch('/api/risks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: risk.id, severity: next }),
    })
    if (!res.ok) onRefresh()
  }

  async function resolveRisk(risk: Risk) {
    setRisks(prev => prev.map(r => r.id === risk.id ? { ...r, status: 'resolved' } : r))
    const res = await fetch('/api/risks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: risk.id, status: 'resolved' }),
    })
    if (!res.ok) onRefresh()
  }

  async function deleteRisk(id: string) {
    setRisks(prev => prev.filter(r => r.id !== id))
    await fetch('/api/risks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    onRefresh()
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <PanelHeader
        eyebrow="Operations"
        title="Risk Register"
        subtitle="Active risks and blockers across all chapters."
        right={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#e11d48', background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.25)', borderRadius: '999px', padding: '5px 14px' }}>
              {open} open
            </span>
            <button
              onClick={() => setAddOpen(true)}
              style={{ padding: '5px 14px', borderRadius: '999px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)', color: '#06b6d4', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              + Add Risk
            </button>
          </div>
        }
      />

      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px' }}>
        {[
          { n: high,   lbl: 'High Severity',   ...SEV.high   },
          { n: medium, lbl: 'Medium Severity',  ...SEV.medium },
          { n: low,    lbl: 'Low Severity',     ...SEV.low    },
        ].map(s => (
          <div key={s.lbl} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '20px', padding: '30px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.n}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color }} />
              <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>{s.lbl}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Risk card rows */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', margin: 0 }}>
            {showResolved ? 'All Risks' : 'Active Risk Register'}
          </p>
          <button
            onClick={() => setShowResolved(v => !v)}
            style={{ padding: '4px 10px', borderRadius: '8px', background: 'transparent', border: '1px solid #1e293b', color: '#475569', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
          >
            {showResolved ? 'Hide resolved' : 'Show resolved'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {visible.map(risk => {
            const sev = SEV[risk.severity] ?? SEV.low
            const tv  = tagVariant[risk.chapter_tag] ?? 'pending'
            const resolved = risk.status === 'resolved'
            return (
              <div
                key={risk.id}
                onMouseEnter={() => setHoverId(risk.id)}
                onMouseLeave={() => setHoverId(null)}
                style={{
                  display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: '14px',
                  alignItems: 'flex-start', padding: '20px 22px',
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderLeft: `3px solid ${resolved ? '#334155' : sev.color}`,
                  borderRadius: '18px', transition: 'border-color .2s',
                  opacity: resolved ? 0.5 : 1,
                }}
                onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(6,182,212,0.35)')}
                onMouseOut={e  => (e.currentTarget.style.borderColor = '#1e293b')}
              >
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569', fontFamily: 'monospace', paddingTop: '1px' }}>{risk.code}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: resolved ? '#475569' : '#cfd5dd', marginBottom: '4px', textDecoration: resolved ? 'line-through' : 'none' }}>{risk.title}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.6, marginBottom: '8px' }}>{risk.description}</div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Badge variant={tv} size="sm">{risk.chapter_tag}</Badge>
                    {resolved && <span style={{ fontSize: '9px', color: '#14b8a6', fontWeight: 700 }}>✓ RESOLVED</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '8px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>
                    {sev.label}
                  </span>
                  {/* action buttons */}
                  <div style={{ display: 'flex', gap: '4px', opacity: hoverId === risk.id ? 1 : 0, transition: 'opacity .15s' }}>
                    {!resolved && (
                      <>
                        <button
                          onClick={() => cycleSeverity(risk)}
                          title="Cycle severity"
                          style={{ padding: '3px 7px', borderRadius: '6px', background: `${sev.color}18`, border: `1px solid ${sev.color}40`, color: sev.color, fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          ↻
                        </button>
                        <button
                          onClick={() => resolveRisk(risk)}
                          title="Mark resolved"
                          style={{ padding: '3px 7px', borderRadius: '6px', background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.3)', color: '#14b8a6', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          ✓
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setDeleteId(risk.id)}
                      title="Delete"
                      style={{ padding: '3px 7px', borderRadius: '6px', background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.25)', color: '#e11d48', fontSize: '10px', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Risk slide-over */}
      <SlideOver open={addOpen} onClose={() => setAddOpen(false)} title="Add Risk">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Title">
            <FieldInput
              placeholder="Short risk description"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </FormField>
          <FormField label="Details">
            <FieldTextarea
              placeholder="Context, impact, mitigation…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </FormField>
          <FormField label="Owner">
            <FieldInput
              placeholder="e.g. HQ / Jedd"
              value={form.owner}
              onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
            />
          </FormField>
          <FormField label="Chapter Tag">
            <FieldInput
              placeholder="e.g. Iloilo / All"
              value={form.chapter_tag}
              onChange={e => setForm(f => ({ ...f, chapter_tag: e.target.value }))}
            />
          </FormField>
          <FormField label="Severity">
            <FieldSelect
              value={form.severity}
              onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </FieldSelect>
          </FormField>
          <button
            onClick={addRisk}
            disabled={addLoading || !form.title.trim()}
            style={{ padding: '10px', borderRadius: '10px', background: addLoading || !form.title.trim() ? '#1e293b' : 'linear-gradient(135deg,#06b6d4,#14b8a6)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: addLoading ? 'wait' : 'pointer' }}
          >
            {addLoading ? 'Adding…' : 'Add Risk'}
          </button>
        </div>
      </SlideOver>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteRisk(deleteId)}
        message="Delete this risk? This cannot be undone."
      />
    </div>
  )
}
