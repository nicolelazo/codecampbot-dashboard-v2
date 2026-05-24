'use client'
import { PAX_ROWS } from '@/lib/data'
import KpiTile from '@/components/ui/KpiTile'
import PanelHeader from '@/components/ui/PanelHeader'
import Badge from '@/components/ui/Badge'
import { liveCountdown } from '@/lib/utils'
import type { Chapter, Kpi, BadgeVariant } from '@/lib/types'

const statusBadge: Record<string, { variant: BadgeVariant; label: string }> = {
  completed:     { variant: 'done',    label: 'Done'            },
  rescheduling:  { variant: 'warn',    label: 'Rescheduling'    },
  in_progress:   { variant: 'pending', label: 'Active'          },
  pencil_booked: { variant: 'warn',    label: 'Pencil Booked'   },
  tbc:           { variant: 'tbc',     label: 'TBC'             },
  activating:    { variant: 'warn',    label: 'Activating'      },
}

const accentOf = (c: Chapter) =>
  c.color === 'teal' ? '#14b8a6' : c.color === 'yellow' ? '#f59e0b' : c.color === 'purple' ? '#a78bfa' : '#06b6d4'

const CARD: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '28px 1fr auto auto', gap: '14px',
  alignItems: 'center', padding: '20px 22px',
  background: '#0f172a', border: '1px solid #1e293b', borderRadius: '18px',
  transition: 'border-color .2s',
}

export default function KpiPanel({ kpis, chapters, setKpis }: { kpis: Kpi[]; chapters: Chapter[]; setKpis: React.Dispatch<React.SetStateAction<Kpi[]>> }) {

  async function saveKpi(id: string, value: string) {
    setKpis(prev => prev.map(k => k.id === id ? { ...k, value } : k))
    await fetch('/api/kpis', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, value }),
    })
  }
  const done    = chapters.filter(c => c.status === 'completed').length
  const active  = chapters.filter(c => ['in_progress','activating','pencil_booked'].includes(c.status)).length
  const atRisk  = chapters.filter(c => ['rescheduling','tbc'].includes(c.status)).length

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <PanelHeader eyebrow="Q2 2026" title="KPI Dashboard" subtitle="Key performance indicators and chapter schedule." />

      {/* KPI metric tiles */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {kpis.map(k => (
          <KpiTile key={k.id} id={k.id} value={k.value} label={k.label} sublabel={['confirmed_deployments', 'completion_rate'].includes(k.key) ? 'Activated to date' : undefined} color={k.color} onSave={saveKpi} />
        ))}
      </div>

      {/* Pax tracker */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '22px', padding: '34px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', marginBottom: '16px' }}>
          National Pax — MOU Target: 500
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '60px', fontWeight: 800, color: '#06b6d4', lineHeight: 1 }}>0</span>
            <span style={{ fontSize: '22px', fontWeight: 600, color: '#1e293b', marginLeft: '6px' }}>/ 600</span>
          </div>
          <div style={{ display: 'flex', gap: '28px' }}>
            {[
              { val: String(done),   lbl: 'Done',       color: '#14b8a6' },
              { val: String(active), lbl: 'Active',     color: '#f59e0b' },
              { val: String(atRisk), lbl: 'At Risk',    color: '#e11d48' },
              { val: '1',            lbl: 'Q3 Pending', color: '#a78bfa' },
            ].map(s => (
              <div key={s.lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'MOU Minimum', target: 500, color: '#06b6d4' },
            { label: 'Full Target',  target: 600, color: '#14b8a6' },
          ].map(bar => (
            <div key={bar.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <span>{bar.label}</span><span style={{ color: bar.color, fontWeight: 700 }}>0 / {bar.target}</span>
              </div>
              <div style={{ height: '7px', background: '#1e293b', borderRadius: '999px' }}>
                <div style={{ height: '100%', borderRadius: '4px', background: `linear-gradient(90deg, ${bar.color}, ${bar.color}88)`, width: '0%' }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', padding: '10px 14px', background: 'rgba(225,29,72,0.06)', border: '1px solid rgba(225,29,72,0.18)', borderRadius: '10px', fontSize: '11px', color: '#8899aa' }}>
          <span style={{ color: '#e11d48', flexShrink: 0 }}>⚠</span>
          <span><strong style={{ color: '#e11d48' }}>Action:</strong> Log Manila actual pax count. All chapters report within T+3 days of event.</span>
        </div>
      </div>

      {/* Chapter schedule — card rows */}
      <div>
        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', marginBottom: '14px' }}>Chapter Schedule</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {chapters.map(c => {
            const b      = statusBadge[c.status]
            const accent = accentOf(c)
            const pax    = PAX_ROWS.find(p => p.chapter_name.toLowerCase().includes(c.city.toLowerCase()))
            return (
              <div key={c.id} style={{ ...CARD, borderLeft: `3px solid ${accent}` }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(6,182,212,0.35)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e293b')}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569', fontFamily: 'monospace' }}>{c.number}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#cfd5dd', marginBottom: '2px' }}>{c.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{c.venue.split(',')[0]} · {c.lead_name.split('&')[0].trim()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: accent }}>{c.pax_target ?? 'TBC'}</div>
                  <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>target pax</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <Badge variant={b.variant} size="sm">{b.label}</Badge>
                  <span style={{ fontSize: '9px', color: '#475569' }}>{liveCountdown(c.date_iso)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
