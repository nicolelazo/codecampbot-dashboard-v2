'use client'
import { useEffect } from 'react'

const C = {
  bg: '#020617', surface: '#0f172a', border: '#1e293b',
  cyan: '#06b6d4', text: '#cfd5dd', muted: '#64748b', dim: '#8899aa',
}

export default function SlideOver({
  open, onClose, title, children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', justifyContent: 'flex-end' }}
      onClick={onClose}
    >
      {/* backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,6,23,0.7)', backdropFilter: 'blur(4px)' }} />

      {/* drawer */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', width: '420px', height: '100%',
          background: C.surface, borderLeft: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
          animation: 'slideInRight .25s ease-out',
        }}
      >
        {/* header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: C.text }}>{title}</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: C.muted, fontSize: '18px', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
