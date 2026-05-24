'use client'
import { useEffect } from 'react'

const C = {
  surface: '#0f172a', border: '#1e293b',
  text: '#cfd5dd', muted: '#64748b',
  rose: '#e11d48',
}

export default function ConfirmDialog({
  open, onClose, onConfirm, message,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  message: string
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
      style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(4px)' }} />
      <div
        onClick={e => e.stopPropagation()}
        style={{ position: 'relative', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '28px', width: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}
      >
        <div style={{ fontSize: '28px', marginBottom: '12px', textAlign: 'center' }}>⚠️</div>
        <p style={{ fontSize: '13px', color: C.text, textAlign: 'center', lineHeight: 1.6, marginBottom: '24px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '9px', borderRadius: '10px', background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            style={{ flex: 1, padding: '9px', borderRadius: '10px', background: C.rose, border: 'none', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
