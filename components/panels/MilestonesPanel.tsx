import { MILESTONE_ROWS, MONTHS, CURRENT_MONTH } from '@/lib/data'

const Q1_ITEMS = [
  'Partnership Media Kickoff — Mar 26 · Bayleaf Intramuros (20–30 pax)',
  'DEVCON Kids Micro:bit — 25 pcs donations + Hour of AI support',
  'Code Camp Mentor Training Phase 1 (Feb) + Phase 2 (Mar)',
  'SHEisDEVCON Chapter Event 1 — Mar',
  'Manila Pilot Code Camp — Mar 28, Letran',
  'DEVCON Studios Feature 1 (Jan) + Feature 2 (Mar)',
  'Q1 Report submitted',
]

const Q2_ITEMS = [
  { text: 'Code Camp Mentor Training Phase 3 — Online (Apr)',           color: '#f59e0b', icon: '🔄' },
  { text: 'SHEisDEVCON Events 2 & 3 — Apr (Iloilo + TBD)',             color: '#f59e0b', icon: '🔄' },
  { text: 'Iloilo Sui-Supported Developer Event — Apr 18',              color: '#f59e0b', icon: '🔄' },
  { text: 'Tacloban Code Camp — new schedule TBD (LNU rescheduling)',   color: '#f59e0b', icon: '🔄' },
  { text: 'Bukidnon Code Camp — May 6 (finance resolved ✓)',            color: '#f59e0b', icon: '🔄' },
  { text: 'DEVCON Studios Feature 3 — Active',                          color: '#f59e0b', icon: '🔄' },
  { text: 'Q2 Narrative Report → Sui Foundation · Due Jun 30',          color: '#e11d48', icon: '—'  },
]

// per-cell styles
function cellStyle(type: string | undefined, isCurrent: boolean) {
  if (type === 'done') return {
    background: 'rgba(20,184,166,0.1)',
    color: '#14b8a6',
    borderLeft: '2px solid rgba(20,184,166,0.35)',
  }
  if (type === 'active') return {
    background: isCurrent ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.07)',
    color: '#f59e0b',
  }
  // upcoming
  return {
    background: isCurrent ? 'rgba(245,158,11,0.03)' : 'transparent',
    color: '#475569',
  }
}

const TH: React.CSSProperties = {
  padding: '10px 9px', textAlign: 'center', fontSize: '9px', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  borderBottom: '1px solid #1e293b', borderRight: '1px solid #1e293b',
  whiteSpace: 'nowrap', background: '#0f172a', color: '#64748b',
}

export default function MilestonesPanel() {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '34px' }}>

      {/* Info banner */}
      <div style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.18)', borderRadius: '18px', padding: '18px 22px', fontSize: '14px', color: '#8899aa', lineHeight: 1.8 }}>
        <strong style={{ color: '#06b6d4' }}>Partnership KPI Timeline</strong> — Dec '25 (Q4) → Nov '26 (Q4). Currently in{' '}
        <strong style={{ color: '#f59e0b' }}>April '26 (Q2)</strong>.
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {[
          { color: '#14b8a6', bg: 'rgba(20,184,166,0.1)',  border: 'rgba(20,184,166,0.3)',  label: '✅ Completed' },
          { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  label: '🔄 Active / In Progress' },
          { color: '#475569', bg: 'rgba(100,116,139,0.06)',border: 'rgba(100,116,139,0.2)', label: '— Not Yet Started' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '999px', background: item.bg, border: `1px solid ${item.border}` }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: item.color }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar / timeline table */}
      <div style={{ overflowX: 'auto', borderRadius: '20px', border: '1px solid #1e293b' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: 920, width: '100%', fontSize: '11px' }}>
          <thead>
            <tr>
              <th style={{ ...TH, textAlign: 'left', minWidth: '190px', padding: '10px 14px', color: '#64748b' }}>
                Milestone
              </th>
              {MONTHS.map(m => {
                const isCurrent = m === CURRENT_MONTH
                return (
                  <th key={m} style={{
                    ...TH,
                    background: isCurrent ? 'rgba(245,158,11,0.08)' : '#0f172a',
                    color: isCurrent ? '#f59e0b' : '#64748b',
                    borderLeft: isCurrent ? '1px solid rgba(245,158,11,0.35)' : undefined,
                    borderRight: isCurrent ? '1px solid rgba(245,158,11,0.35)' : '1px solid #1e293b',
                  }}>
                    {m}
                    {isCurrent && <div style={{ fontSize: '7px', opacity: 0.7, marginTop: '2px' }}>◄ NOW</div>}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {MILESTONE_ROWS.map((row, ri) => (
              <tr key={ri}>
                <td style={{ padding: '11px 14px', borderBottom: '1px solid #1e293b', borderRight: '1px solid #1e293b', fontWeight: 600, color: '#cfd5dd', fontSize: '12px', background: 'rgba(15,23,42,0.6)', whiteSpace: 'nowrap' }}>
                  {row.label}
                </td>
                {MONTHS.map(m => {
                  const cell    = row.months[m]
                  const isCurrent = m === CURRENT_MONTH
                  const cs      = cellStyle(cell?.type, isCurrent)
                  return (
                    <td key={m} style={{
                      padding: '9px 8px',
                      borderBottom: '1px solid #1e293b',
                      borderRight: isCurrent ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(30,41,59,0.6)',
                      borderLeft: cs.borderLeft ?? (isCurrent ? '1px solid rgba(245,158,11,0.2)' : undefined),
                      textAlign: 'center',
                      fontSize: '10px',
                      fontWeight: cell ? 600 : 400,
                      background: cs.background,
                      color: cs.color,
                      transition: 'background .2s',
                    }}>
                      {cell ? cell.text : <span style={{ opacity: 0.35 }}>—</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Q1 Completed + Q2 Active */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '20px' }}>

        {/* Q1 */}
        <div style={{ background: '#0f172a', borderRadius: '20px', padding: '28px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#14b8a6' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#14b8a6' }}>Q1 Completed</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {Q1_ITEMS.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#8899aa', lineHeight: 1.5 }}>
                <span style={{ color: '#14b8a6', flexShrink: 0, marginTop: '1px' }}>✅</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Q2 */}
        <div style={{ background: '#0f172a', borderRadius: '20px', padding: '28px', border: '1px solid rgba(245,158,11,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#f59e0b' }}>Q2 Active — Now</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {Q2_ITEMS.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#8899aa', lineHeight: 1.5 }}>
                <span style={{ color: item.color, flexShrink: 0, marginTop: '1px' }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
