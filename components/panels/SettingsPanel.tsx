'use client'

import { useState, useEffect, useCallback } from 'react'

const C = {
  bg:      '#020617',
  surface: '#0f172a',
  border:  '#1e293b',
  cyan:    '#06b6d4',
  teal:    '#14b8a6',
  rose:    '#e11d48',
  muted:   '#64748b',
  text:    '#cfd5dd',
  dim:     '#8899aa',
  green:   '#22c55e',
}

type LogEntry = { time: string; message: string; ok: boolean }

function now() {
  return new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function Card({ title, icon, badge, badgeColor, children }: {
  title: string; icon: string; badge?: string; badgeColor?: string; children: React.ReactNode
}) {
  return (
    <div style={{ background: C.surface, borderRadius: '24px', padding: '30px', border: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
            {icon}
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: C.text }}>{title}</span>
        </div>
        {badge && (
          <span style={{ fontSize: '10px', fontWeight: 700, color: badgeColor ?? C.green, background: `${badgeColor ?? C.green}18`, border: `1px solid ${badgeColor ?? C.green}40`, padding: '3px 10px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function Btn({ children, onClick, disabled, variant = 'outline', full }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean
  variant?: 'primary' | 'outline'; full?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        transition: 'all .2s', width: full ? '100%' : undefined,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        ...(variant === 'primary'
          ? { background: 'linear-gradient(135deg,#06b6d4,#14b8a6)', color: '#fff', border: 'none' }
          : { background: 'rgba(15,23,42,0.8)', color: C.dim, border: `1px solid ${C.border}` }),
      }}
    >
      {children}
    </button>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{ width: '44px', height: '24px', borderRadius: '999px', background: checked ? C.cyan : C.border, cursor: 'pointer', transition: 'background .2s', position: 'relative', flexShrink: 0 }}
    >
      <div style={{ position: 'absolute', top: '3px', left: checked ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', mono }: {
  label: string; value: string; onChange?: (v: string) => void; type?: string; mono?: boolean
}) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{label}</div>
      <input
        type={type} value={value} onChange={e => onChange?.(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: C.bg, border: `1px solid ${C.border}`, color: C.text, fontSize: '13px', outline: 'none', fontFamily: mono ? 'monospace' : "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(6,182,212,0.4)')}
        onBlur={e  => (e.currentTarget.style.borderColor = C.border)}
      />
    </div>
  )
}

function DsuPreviewModal({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div style={{ width: '560px', maxHeight: '80vh', background: C.surface, borderRadius: '20px', border: `1px solid ${C.border}`, boxShadow: '0 25px 80px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: C.text }}>DSU Preview</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, fontSize: '18px', cursor: 'pointer', padding: '4px 8px' }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '12px', color: C.dim, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{text}</pre>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPanel() {
  const [token,       setToken]       = useState('')
  const [chatId,      setChatId]      = useState('')
  const [tokenSet,    setTokenSet]    = useState(false)
  const [autoStandup, setAutoStandup] = useState(true)
  const [dsuPreview,  setDsuPreview]  = useState<string | null>(null)
  const [log,         setLog]         = useState<LogEntry[]>([])
  const [loading,     setLoading]     = useState<Record<string, boolean>>({})

  const addLog = useCallback((message: string, ok: boolean) => {
    setLog(prev => [{ time: now(), message, ok }, ...prev].slice(0, 30))
  }, [])

  function busy(key: string, v: boolean) {
    setLoading(prev => ({ ...prev, [key]: v }))
  }

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setToken(data.telegram_bot_token ?? '')
        setTokenSet(data.telegram_bot_token_set ?? false)
        setChatId(data.telegram_chat_id ?? '')
        setAutoStandup(data.auto_standup ?? true)
      })
      .catch(() => {})
  }, [])

  async function saveSettings() {
    busy('save', true)
    try {
      const body: Record<string, unknown> = { telegram_chat_id: chatId, auto_standup: autoStandup }
      if (token && !token.includes('•')) body.telegram_bot_token = token
      const r = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = await r.json()
      if (d.ok) { addLog('Settings saved successfully', true); setTokenSet(true) }
      else addLog(`Save failed: ${d.error}`, false)
    } catch { addLog('Save failed: network error', false) }
    busy('save', false)
  }

  async function previewDsu() {
    busy('preview', true)
    try {
      const r = await fetch('/api/settings/dsu')
      const d = await r.json()
      if (d.ok) setDsuPreview(d.text)
      else addLog(`Preview failed: ${d.error}`, false)
    } catch { addLog('Preview failed: network error', false) }
    busy('preview', false)
  }

  async function sendDsuNow() {
    busy('send', true)
    try {
      const r = await fetch('/api/settings/dsu', { method: 'POST' })
      const d = await r.json()
      if (d.ok) addLog('Daily standup sent to group', true)
      else addLog(`Send failed: ${d.error}`, false)
    } catch { addLog('Send failed: network error', false) }
    busy('send', false)
  }

  async function saveAutoStandup(v: boolean) {
    setAutoStandup(v)
    try {
      await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ auto_standup: v }) })
      addLog(`Auto-standup ${v ? 'enabled' : 'disabled'}`, true)
    } catch {}
  }

  const connectedBadge = tokenSet && chatId ? 'connected' : 'not set'
  const connectedColor = tokenSet && chatId ? C.green : C.muted

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ marginBottom: '36px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.muted, marginBottom: '8px' }}>Configuration</div>
        <h1 style={{ fontSize: '38px', fontWeight: 800, color: C.text, marginBottom: '8px', lineHeight: 1.1 }}>Settings</h1>
        <p style={{ fontSize: '16px', color: C.dim, lineHeight: 1.7 }}>Telegram integration and standup configuration</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '28px', alignItems: 'start' }}>

        <Card title="Telegram Bot" icon="🤖" badge={connectedBadge} badgeColor={connectedColor}>
          <Input label="Bot Token" value={token} onChange={setToken} type="password" mono />
          <Input label="Group Chat ID" value={chatId} onChange={setChatId} mono />
          <Btn variant="primary" full onClick={saveSettings} disabled={loading['save']}>
            {loading['save'] ? '⏳ Saving…' : '💾 Save Settings'}
          </Btn>
        </Card>

        <Card title="Daily Standup (DSU)" icon="📢">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '14px 16px', background: C.bg, borderRadius: '12px', border: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: C.text, marginBottom: '2px' }}>Auto-standup</div>
              <div style={{ fontSize: '11px', color: C.muted }}>Triggers via your external cron job</div>
            </div>
            <Toggle checked={autoStandup} onChange={saveAutoStandup} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <Btn onClick={previewDsu} disabled={loading['preview']}>
              {loading['preview'] ? '⏳' : '👁'} Preview
            </Btn>
            <Btn variant="primary" onClick={sendDsuNow} disabled={loading['send']}>
              {loading['send'] ? '⏳ Sending…' : '📤 Send Now'}
            </Btn>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Activity Log</span>
              {log.length > 0 && (
                <button onClick={() => setLog([])} style={{ background: 'none', border: 'none', fontSize: '11px', color: C.muted, cursor: 'pointer', padding: 0 }}>Clear</button>
              )}
            </div>
            <div style={{ background: C.bg, borderRadius: '10px', border: `1px solid ${C.border}`, padding: '12px', minHeight: '64px', maxHeight: '200px', overflowY: 'auto' }}>
              {log.length === 0 ? (
                <div style={{ fontSize: '11px', color: C.muted, fontStyle: 'italic' }}>No activity yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {log.map((entry, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '11px' }}>
                      <span style={{ color: C.muted, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{entry.time}</span>
                      <span style={{ color: entry.ok ? C.green : C.rose }}>{entry.ok ? '✓' : '✗'}</span>
                      <span style={{ color: C.dim }}>{entry.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {dsuPreview && <DsuPreviewModal text={dsuPreview} onClose={() => setDsuPreview(null)} />}
    </div>
  )
}
