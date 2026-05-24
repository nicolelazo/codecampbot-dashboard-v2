'use client'
import { useState } from 'react'
import PanelHeader from '@/components/ui/PanelHeader'
import SlideOver from '@/components/ui/SlideOver'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormField, { FieldInput, FieldSelect } from '@/components/ui/FormField'
import type { Contact } from '@/lib/types'

const TEAMS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  sui_foundation: { label: 'Sui Foundation',       color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.25)'   },
  chapter_lead:   { label: 'DEVCON Chapter Leads', color: '#14b8a6', bg: 'rgba(20,184,166,0.08)',  border: 'rgba(20,184,166,0.25)'  },
  content_team:   { label: 'Content Team',         color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)' },
}

const BLANK_FORM = { name: '', role: '', handle: '', team: 'chapter_lead', chapter_number: '', emoji: '👤', note: '' }

function ContactRow({ c, accent, onEdit, onDelete }: { c: Contact; accent: string; onEdit: () => void; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto auto', gap: '16px', alignItems: 'center', padding: '18px 22px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '18px', transition: 'border-color .2s' }}
      onMouseEnter={e => { (e.currentTarget.style.borderColor = 'rgba(6,182,212,0.35)'); setHovered(true) }}
      onMouseLeave={e => { (e.currentTarget.style.borderColor = '#1e293b'); setHovered(false) }}
    >
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${accent}18`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
        {c.emoji}
      </div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#cfd5dd', marginBottom: '2px' }}>{c.name}</div>
        <div style={{ fontSize: '11px', color: '#64748b' }}>
          {c.role}{c.note ? <span style={{ color: '#475569' }}> · {c.note}</span> : null}
        </div>
      </div>
      <span style={{ fontSize: '11px', fontWeight: 600, color: accent, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{c.handle}</span>
      <div style={{ display: 'flex', gap: '5px', opacity: hovered ? 1 : 0, transition: 'opacity .15s' }}>
        <button onClick={onEdit}   style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(6,182,212,0.08)',  border: '1px solid rgba(6,182,212,0.25)',  color: '#06b6d4', fontSize: '11px', cursor: 'pointer' }}>✎</button>
        <button onClick={onDelete} style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.25)', color: '#e11d48', fontSize: '11px', cursor: 'pointer' }}>✕</button>
      </div>
    </div>
  )
}

export default function ContactsPanel({ contacts, onRefresh }: { contacts: Contact[]; onRefresh: () => Promise<void> }) {
  const [slideOpen, setSlideOpen] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const grouped = {
    sui_foundation: contacts.filter(c => c.team === 'sui_foundation'),
    chapter_lead:   contacts.filter(c => c.team === 'chapter_lead'),
    content_team:   contacts.filter(c => c.team === 'content_team'),
  }
  const teamKeys = Object.keys(grouped) as (keyof typeof grouped)[]

  function openAdd() {
    setEditContact(null)
    setForm(BLANK_FORM)
    setSlideOpen(true)
  }

  function openEdit(c: Contact) {
    setEditContact(c)
    setForm({ name: c.name, role: c.role, handle: c.handle, team: c.team, chapter_number: c.chapter_number ?? '', emoji: c.emoji, note: c.note ?? '' })
    setSlideOpen(true)
  }

  async function save() {
    setSaving(true)
    if (editContact) {
      await fetch('/api/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editContact.id, ...form }),
      })
    } else {
      await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }
    await onRefresh()
    setSaving(false)
    setSlideOpen(false)
  }

  async function deleteContact(id: string) {
    await fetch('/api/contacts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    onRefresh()
  }

  const f = (field: keyof typeof BLANK_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '42px' }}>
      <PanelHeader
        eyebrow="Team"
        title="Contacts"
        subtitle={`${contacts.length} people across ${teamKeys.filter(k => grouped[k].length > 0).length} teams`}
        right={
          <button
            onClick={openAdd}
            style={{ padding: '5px 14px', borderRadius: '999px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)', color: '#06b6d4', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            + Add Contact
          </button>
        }
      />

      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px' }}>
        {teamKeys.map(key => {
          const cfg = TEAMS[key]
          const count = grouped[key].length
          return (
            <div key={key} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '20px', padding: '28px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 800, color: cfg.color, lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginTop: '8px' }}>{cfg.label}</div>
            </div>
          )
        })}
      </div>

      {/* Per-team contact rows */}
      {teamKeys.map(key => {
        const list = grouped[key]
        if (!list.length) return null
        const cfg = TEAMS[key]
        return (
          <div key={key}>
            <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', marginBottom: '14px' }}>{cfg.label}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {list.map(c => (
                <ContactRow
                  key={c.id} c={c} accent={cfg.color}
                  onEdit={() => openEdit(c)}
                  onDelete={() => setDeleteId(c.id)}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* Add / Edit slide-over */}
      <SlideOver open={slideOpen} onClose={() => setSlideOpen(false)} title={editContact ? 'Edit Contact' : 'Add Contact'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FormField label="Emoji"><FieldInput placeholder="👤" value={form.emoji} onChange={f('emoji')} /></FormField>
          <FormField label="Name"><FieldInput placeholder="Full name" value={form.name} onChange={f('name')} /></FormField>
          <FormField label="Role"><FieldInput placeholder="Title or role" value={form.role} onChange={f('role')} /></FormField>
          <FormField label="Handle (Telegram / email)"><FieldInput placeholder="@username" value={form.handle} onChange={f('handle')} /></FormField>
          <FormField label="Team">
            <FieldSelect value={form.team} onChange={f('team')}>
              <option value="sui_foundation">Sui Foundation</option>
              <option value="chapter_lead">DEVCON Chapter Leads</option>
              <option value="content_team">Content Team</option>
            </FieldSelect>
          </FormField>
          <FormField label="Chapter #"><FieldInput placeholder="e.g. 3 (optional)" value={form.chapter_number} onChange={f('chapter_number')} /></FormField>
          <FormField label="Note"><FieldInput placeholder="Optional note" value={form.note} onChange={f('note')} /></FormField>
          <button
            onClick={save}
            disabled={saving || !form.name.trim() || !form.role.trim()}
            style={{ padding: '10px', borderRadius: '10px', background: saving || !form.name.trim() || !form.role.trim() ? '#1e293b' : 'linear-gradient(135deg,#06b6d4,#14b8a6)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', marginTop: '8px' }}
          >
            {saving ? 'Saving…' : editContact ? 'Save Changes' : 'Add Contact'}
          </button>
        </div>
      </SlideOver>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteContact(deleteId)}
        message="Remove this contact? This cannot be undone."
      />
    </div>
  )
}
