'use client'
import { useState } from 'react'
import PanelHeader from '@/components/ui/PanelHeader'
import Badge from '@/components/ui/Badge'
import SlideOver from '@/components/ui/SlideOver'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormField, { FieldInput, FieldSelect } from '@/components/ui/FormField'
import type { Chapter, MerchItem, BadgeVariant } from '@/lib/types'

const vipKit: { item: string; badge: BadgeVariant; label: string }[] = [
  { item: 'Custom engraved pen "BUIDL | DEVCON x Sui"', badge: 'done', label: '✓ Confirmed'    },
  { item: 'Baseus 3-in-1 retractable USB cable',        badge: 'warn', label: '⚠ Confirm rcvd' },
  { item: 'Tote bag (at Lady)',                          badge: 'done', label: '✓ At Lady'      },
  { item: 'Wireless fan (pink)',                         badge: 'warn', label: '⚠ Confirm rcvd' },
]

function itemBadge(s: string): { variant: BadgeVariant; label: string } {
  if (s === 'received' || s === 'confirmed') return { variant: 'done',    label: '✓ Received'    }
  if (s === 'confirm')                       return { variant: 'warn',    label: '⚠ Confirm rcvd' }
  return                                            { variant: 'pending', label: s               }
}

function getMerchBadge(s: string): { variant: BadgeVariant; label: string } {
  const lower = s.toLowerCase().trim()
  if (lower === 'received' || lower.includes('received by chapter')) return { variant: 'done', label: s }
  if (lower === 'in transit' || lower.includes('in transit') || lower === 'sent' || lower.includes('sent to province')) return { variant: 'warn', label: s }
  if (lower === 'pending' || lower === 'ready to ship') return { variant: 'pending', label: s }
  if (s.includes('TBC') || lower.includes('tbc')) return { variant: 'tbc',  label: s }
  if (lower === 'not sent' || lower.includes('not yet sent')) return { variant: 'risk', label: s }
  return { variant: 'warn', label: s }
}

const CARD: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: '14px',
  alignItems: 'center', padding: '18px 22px',
  background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px',
  transition: 'border-color .2s',
}

function ItemRows({ items, icon, onEdit, onDelete }: { items: MerchItem[]; icon: string; onEdit: (item: MerchItem) => void; onDelete: (id: string) => void }) {
  const [hoverId, setHoverId] = useState<string | null>(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {items.map(item => {
        const b = itemBadge(item.status)
        return (
          <div
            key={item.id}
            style={{ ...CARD, gridTemplateColumns: '28px 1fr auto auto' }}
            onMouseEnter={e => { (e.currentTarget.style.borderColor = 'rgba(6,182,212,0.3)'); setHoverId(item.id) }}
            onMouseLeave={e => { (e.currentTarget.style.borderColor = '#1e293b'); setHoverId(null) }}
          >
            <span style={{ fontSize: '14px', textAlign: 'center' }}>{icon}</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#cfd5dd', marginBottom: '2px' }}>{item.name}</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>{item.distribution} · <span style={{ color: '#06b6d4', fontWeight: 700 }}>×{item.quantity}</span></div>
            </div>
            <Badge variant={b.variant} size="sm">{b.label}</Badge>
            <div style={{ display: 'flex', gap: '4px', opacity: hoverId === item.id ? 1 : 0, transition: 'opacity .15s' }}>
              <button onClick={() => onEdit(item)}   style={{ padding: '3px 7px', borderRadius: '6px', background: 'rgba(6,182,212,0.08)',  border: '1px solid rgba(6,182,212,0.25)',  color: '#06b6d4', fontSize: '10px', cursor: 'pointer' }}>✎</button>
              <button onClick={() => onDelete(item.id)} style={{ padding: '3px 7px', borderRadius: '6px', background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.25)', color: '#e11d48', fontSize: '10px', cursor: 'pointer' }}>✕</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const BLANK = { name: '', quantity: '1', distribution: '', status: 'pending', category: 'jcr' }
const CHAPTER_MERCH_STATUSES = ['not sent', 'pending', 'in transit', 'received'] as const

export default function MerchPanel({ merch_items, chapters, onRefresh }: { merch_items: MerchItem[]; chapters: Chapter[]; onRefresh: () => Promise<void> }) {
  const [slideOpen, setSlideOpen] = useState(false)
  const [editItem, setEditItem] = useState<MerchItem | null>(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editChapter, setEditChapter] = useState<Chapter | null>(null)
  const [merchStatusSelection, setMerchStatusSelection] = useState<string>(CHAPTER_MERCH_STATUSES[0])
  const [customMerchStatus, setCustomMerchStatus] = useState('')
  const [savingMerchStatus, setSavingMerchStatus] = useState(false)
  const [hoverId, setHoverId] = useState<string | null>(null)

  const jcr    = merch_items.filter(m => m.category === 'jcr')
  const lazada = merch_items.filter(m => m.category === 'lazada')
  const shopee = merch_items.filter(m => m.category === 'shopee')

  const received = chapters.filter(c => {
    const status = c.merch_status.toLowerCase().trim()
    return status === 'received' || status.includes('received by chapter')
  }).length
  const pending  = chapters.length - received

  function openAdd(category: string) {
    setEditItem(null)
    setForm({ ...BLANK, category })
    setSlideOpen(true)
  }

  function openEdit(item: MerchItem) {
    setEditItem(item)
    setForm({ name: item.name, quantity: String(item.quantity), distribution: item.distribution, status: item.status, category: item.category })
    setSlideOpen(true)
  }

  function openEditChapter(c: Chapter) {
    setEditChapter(c)
    const status = c.merch_status.trim()
    const statusLower = status.toLowerCase()

    if (statusLower === '✓ sent' || statusLower === 'sent' || statusLower === 'sent to province' || statusLower === 'in transit to province' || statusLower === 'in transit') {
      setMerchStatusSelection('in transit')
      setCustomMerchStatus('')
      return
    }

    if (statusLower === 'ready to ship' || statusLower === 'pending') {
      setMerchStatusSelection('pending')
      setCustomMerchStatus('')
      return
    }

    if (statusLower === 'not yet sent' || statusLower === 'not sent') {
      setMerchStatusSelection('not sent')
      setCustomMerchStatus('')
      return
    }

    if (statusLower === 'received by chapter' || statusLower === 'received') {
      setMerchStatusSelection('received')
      setCustomMerchStatus('')
      return
    }

    if (CHAPTER_MERCH_STATUSES.includes(statusLower as (typeof CHAPTER_MERCH_STATUSES)[number])) {
      setMerchStatusSelection(statusLower)
      setCustomMerchStatus('')
      return
    }
    setMerchStatusSelection('other')
    setCustomMerchStatus(c.merch_status)
  }

  async function saveMerchStatus() {
    if (!editChapter) return
    const merchStatus = merchStatusSelection === 'other' ? customMerchStatus.trim() : merchStatusSelection
    if (!merchStatus) return
    setSavingMerchStatus(true)
    await fetch('/api/chapters', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editChapter.id,
        merch_status: merchStatus,
      }),
    })
    await onRefresh()
    setSavingMerchStatus(false)
    setEditChapter(null)
  }

  async function save() {
    setSaving(true)
    if (editItem) {
      await fetch('/api/merch-items', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editItem.id, ...form }) })
    } else {
      await fetch('/api/merch-items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    }
    await onRefresh()
    setSaving(false)
    setSlideOpen(false)
  }

  async function deleteItem(id: string) {
    await fetch('/api/merch-items', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    onRefresh()
  }

  const f = (field: keyof typeof BLANK) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <PanelHeader
        eyebrow="Operations"
        title="Merchandise"
        subtitle="Custodian: Lady Diane Casilang · Manila HQ"
      />

      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px' }}>
        {[
          { n: received,      lbl: 'Received by Chapter', color: '#14b8a6', bg: 'rgba(20,184,166,0.08)',  border: 'rgba(20,184,166,0.25)'  },
          { n: pending,       lbl: 'Not Received Yet',    color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)'  },
          { n: 25,            lbl: 'VIP Kits Total',    color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.25)'   },
        ].map(s => (
          <div key={s.lbl} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '20px', padding: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginTop: '8px' }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Alert */}
      <div style={{ display: 'flex', gap: '10px', padding: '12px 16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', fontSize: '12px', color: '#8899aa' }}>
        <span style={{ color: '#f59e0b', flexShrink: 0 }}>📦</span>
        <span>Iloilo merch sent. Bukidnon — <strong style={{ color: '#e11d48' }}>NOT YET SENT</strong>. Must be packed and shipped before <strong style={{ color: '#f59e0b' }}>Apr 29 (T-7)</strong>.</span>
      </div>

      {/* Chapter merch + VIP kits side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '20px' }}>
        {/* Chapter status */}
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', marginBottom: '12px' }}>Chapter Merch Status</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {chapters.map(c => {
              const m = getMerchBadge(c.merch_status)
              return (
                <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto auto', gap: '12px', alignItems: 'center', padding: '16px 20px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', transition: 'border-color .2s' }}
                  onMouseEnter={e => { (e.currentTarget.style.borderColor = 'rgba(6,182,212,0.3)'); setHoverId(c.id) }}
                  onMouseLeave={e => { (e.currentTarget.style.borderColor = '#1e293b'); setHoverId(null) }}>
                  <span style={{ fontSize: '11px', color: '#475569', fontFamily: 'monospace', fontWeight: 700 }}>{c.number}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#cfd5dd' }}>{c.name}</span>
                  <Badge variant={m.variant} size="sm">{m.label}</Badge>
                  <button onClick={() => openEditChapter(c)} style={{ padding: '3px 7px', borderRadius: '6px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)', color: '#06b6d4', fontSize: '10px', cursor: 'pointer', opacity: hoverId === c.id ? 1 : 0, transition: 'opacity .15s' }}>✎</button>
                </div>
              )
            })}
          </div>
        </div>

        {/* VIP Kits */}
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', marginBottom: '12px' }}>VIP Kits — 25 Total</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {vipKit.map(v => (
              <div key={v.item} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center', padding: '16px 20px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', transition: 'border-color .2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(6,182,212,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e293b')}>
                <span style={{ fontSize: '11px', color: '#8899aa' }}>{v.item}</span>
                <Badge variant={v.badge} size="sm">{v.label}</Badge>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '10px', padding: '10px 14px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: '10px', color: '#64748b', lineHeight: 1.8 }}>
            5 → Letran organizers · 3 → Nicole / Harrison / Raphael · 17 → community leads &amp; media
          </div>
        </div>
      </div>

      {/* JCR Orders */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', margin: 0 }}>
            JCR Order <span style={{ color: '#14b8a6', marginLeft: '6px' }}>✓ Received — Invoice #0729 · Mar 24</span>
          </p>
          <button onClick={() => openAdd('jcr')} style={{ padding: '3px 10px', borderRadius: '8px', background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', color: '#06b6d4', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>+ Add</button>
        </div>
        <ItemRows items={jcr} icon="📦" onEdit={openEdit} onDelete={id => setDeleteId(id)} />
      </div>

      {/* Lazada + Shopee */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', margin: 0 }}>Lazada Orders</p>
            <button onClick={() => openAdd('lazada')} style={{ padding: '3px 10px', borderRadius: '8px', background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', color: '#06b6d4', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>+ Add</button>
          </div>
          <ItemRows items={lazada} icon="🛒" onEdit={openEdit} onDelete={id => setDeleteId(id)} />
          <div style={{ marginTop: '8px', padding: '10px 14px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: '10px', color: '#64748b' }}>
            📝 Light pink polo (100 pcs) — CANCELLED. Replaced with SHEisDEVCON shirts.
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', margin: 0 }}>Shopee — Umbrellas</p>
            <button onClick={() => openAdd('shopee')} style={{ padding: '3px 10px', borderRadius: '8px', background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', color: '#06b6d4', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>+ Add</button>
          </div>
          <ItemRows items={shopee} icon="☂️" onEdit={openEdit} onDelete={id => setDeleteId(id)} />
          <div style={{ marginTop: '8px', padding: '12px 16px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#06b6d4', lineHeight: 1 }}>70</div>
              <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px' }}>Total Umbrellas</div>
            </div>
            <span style={{ fontSize: '10px', color: '#e11d48', fontWeight: 600 }}>⚠ Delivery pending</span>
          </div>
        </div>
      </div>

      {/* Add / Edit slide-over */}
      <SlideOver open={slideOpen} onClose={() => setSlideOpen(false)} title={editItem ? 'Edit Item' : 'Add Item'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FormField label="Name"><FieldInput placeholder="Item name" value={form.name} onChange={f('name')} /></FormField>
          <FormField label="Quantity"><FieldInput type="number" min="0" value={form.quantity} onChange={f('quantity')} /></FormField>
          <FormField label="Distribution / Notes"><FieldInput placeholder="e.g. Per chapter" value={form.distribution} onChange={f('distribution')} /></FormField>
          <FormField label="Category">
            <FieldSelect value={form.category} onChange={f('category')}>
              <option value="jcr">JCR</option>
              <option value="lazada">Lazada</option>
              <option value="shopee">Shopee</option>
            </FieldSelect>
          </FormField>
          <FormField label="Status">
            <FieldSelect value={form.status} onChange={f('status')}>
              <option value="pending">Pending</option>
              <option value="confirm">Confirm Received</option>
              <option value="confirmed">Confirmed</option>
              <option value="received">Received</option>
            </FieldSelect>
          </FormField>
          <button
            onClick={save}
            disabled={saving || !form.name.trim()}
            style={{ padding: '10px', borderRadius: '10px', background: saving || !form.name.trim() ? '#1e293b' : 'linear-gradient(135deg,#06b6d4,#14b8a6)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', marginTop: '8px' }}
          >
            {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      </SlideOver>

      {/* Edit Chapter Merch Status slide-over */}
      <SlideOver open={editChapter !== null} onClose={() => setEditChapter(null)} title={editChapter ? `Edit ${editChapter.name} Merch Status` : 'Edit Merch Status'}>
        {editChapter && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <FormField label="Merch Status">
              <FieldSelect 
                value={merchStatusSelection}
                onChange={(e) => setMerchStatusSelection(e.target.value)}
              >
                <option value="not sent">not sent</option>
                <option value="pending">pending</option>
                <option value="in transit">in transit</option>
                <option value="received">received</option>
                <option value="other">Other...</option>
              </FieldSelect>
            </FormField>
            {merchStatusSelection === 'other' && (
              <FormField label="Custom Status">
                <FieldInput
                  placeholder="Enter custom merch status"
                  value={customMerchStatus}
                  onChange={(e) => setCustomMerchStatus(e.target.value)}
                />
              </FormField>
            )}
            <button
              onClick={saveMerchStatus}
              disabled={savingMerchStatus || (merchStatusSelection === 'other' && !customMerchStatus.trim())}
              style={{ padding: '10px', borderRadius: '10px', background: savingMerchStatus ? '#1e293b' : 'linear-gradient(135deg,#06b6d4,#14b8a6)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: savingMerchStatus ? 'wait' : 'pointer', marginTop: '8px' }}
            >
              {savingMerchStatus ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </SlideOver>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteItem(deleteId)}
        message="Delete this item? This cannot be undone."
      />
    </div>
  )
}
