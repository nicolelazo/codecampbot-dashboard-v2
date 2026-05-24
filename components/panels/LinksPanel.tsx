'use client'
import { useState } from 'react'
import PanelHeader from '@/components/ui/PanelHeader'
import SlideOver from '@/components/ui/SlideOver'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormField, { FieldInput, FieldTextarea, FieldSelect } from '@/components/ui/FormField'
import type { Chapter, Contact, ResourceLink } from '@/lib/types'

// ── Design helpers ────────────────────────────────────────────────────────────

const iconAccent = (color: string) =>
  ({
    blue:   { text: '#06b6d4', bg: 'rgba(6,182,212,0.1)',   border: 'rgba(6,182,212,0.25)'  },
    teal:   { text: '#14b8a6', bg: 'rgba(20,184,166,0.1)',  border: 'rgba(20,184,166,0.25)' },
    yellow: { text: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
    purple: { text: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)'},
  }[color] ?? { text: '#06b6d4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.25)' })

const chapterAccent = (c: Chapter) =>
  c.color === 'teal' ? '#14b8a6' : c.color === 'yellow' ? '#f59e0b' : c.color === 'purple' ? '#a78bfa' : '#06b6d4'

const CARD: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '40px 1fr auto auto', gap: '14px',
  alignItems: 'center', padding: '18px 22px',
  background: '#0f172a', border: '1px solid #1e293b', borderRadius: '18px',
  transition: 'border-color .2s',
}

// Fixed category options
const CATEGORIES = [
  'Drive',
  'Sheets',
  'Docs',
  'Slides',
  'Forms',
  'Figma',
  'Notion',
  'GitHub',
  'Loom',
  'Slack',
  'Zoom',
  'Finance',
  'Design',
  'Merch',
  'Events',
  'Contacts',
  'General',
] as const

type CategoryOption = (typeof CATEGORIES)[number]

// Derive icon color from category
function categoryColor(category: string): ResourceLink['icon_color'] {
  const cat = category.toLowerCase()
  if (cat === 'finance')                           return 'yellow'
  if (cat === 'figma' || cat === 'design')         return 'purple'
  if (cat === 'merch' || cat === 'events')         return 'teal'
  if (cat === 'notion' || cat === 'contacts')      return 'teal'
  return 'blue'
}

// Auto-pick an icon based on the link's category or URL
function autoIcon(category: string, url: string): string {
  const cat = category.toLowerCase()
  const u   = url.toLowerCase()
  if (cat === 'drive'   || u.includes('drive.google'))  return '📁'
  if (cat === 'sheets'  || u.includes('sheet'))         return '📊'
  if (cat === 'docs'    || u.includes('docs.google'))   return '📄'
  if (cat === 'slides'  || u.includes('slides'))        return '📑'
  if (cat === 'forms'   || u.includes('forms.google'))  return '📋'
  if (cat === 'figma'   || u.includes('figma'))         return '🎨'
  if (cat === 'notion'  || u.includes('notion'))        return '📓'
  if (cat === 'github'  || u.includes('github'))        return '⚙️'
  if (cat === 'loom'    || u.includes('loom'))          return '🎬'
  if (cat === 'slack'   || u.includes('slack'))         return '💬'
  if (cat === 'zoom'    || u.includes('zoom'))          return '📹'
  if (cat === 'finance')                                return '💰'
  if (cat === 'design')                                 return '🎨'
  if (cat === 'merch')                                  return '📦'
  if (cat === 'events')                                 return '📅'
  if (cat === 'contacts')                               return '👥'
  return '🔗'
}

const BLANK_FORM = {
  name: '',
  description: '',
  url: '',
  category: 'General' as CategoryOption,
}

// ── Link card row ─────────────────────────────────────────────────────────────

function LinkRow({
  link,
  onEdit,
  onDelete,
}: {
  link: ResourceLink
  onEdit: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const a = iconAccent(link.icon_color)

  return (
    <div
      style={{ ...CARD, position: 'relative' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.35)'; setHovered(true) }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; setHovered(false) }}
    >
      {/* Icon */}
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: a.bg, border: `1px solid ${a.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
        {link.icon}
      </div>

      {/* Name + description */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#cfd5dd', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.name}</div>
        <div style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.description || link.url}</div>
      </div>

      {/* Category badge */}
      <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 10px', borderRadius: '8px', background: a.bg, color: a.text, whiteSpace: 'nowrap' }}>
        {link.category}
      </span>

      {/* Open / actions */}
      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ fontSize: '11px', fontWeight: 700, color: '#06b6d4', whiteSpace: 'nowrap', textDecoration: 'none' }}
        >
          Open →
        </a>
        <div style={{ display: 'flex', gap: '4px', opacity: hovered ? 1 : 0, transition: 'opacity .15s', marginLeft: '6px' }}>
          <button
            onClick={onEdit}
            title="Edit"
            style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)', color: '#06b6d4', fontSize: '11px', cursor: 'pointer' }}
          >
            ✎
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.25)', color: '#e11d48', fontSize: '11px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function LinksPanel({
  links,
  chapters,
  contacts,
  onShowChapter,
  setLinks,
  onRefresh,
}: {
  links: ResourceLink[]
  chapters: Chapter[]
  contacts: Contact[]
  onShowChapter: (id: string) => void
  setLinks: React.Dispatch<React.SetStateAction<ResourceLink[]>>
  onRefresh: () => Promise<void>
}) {
  const keyContacts = contacts.filter(c => c.team === 'sui_foundation')

  const [slideOpen, setSlideOpen] = useState(false)
  const [editLink, setEditLink] = useState<ResourceLink | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── Category filter ──────────────────────────────────────────────────────
  const categories = Array.from(new Set(links.map(l => l.category).filter(Boolean))).sort()
  const [filterCat, setFilterCat] = useState<string>('all')
  const visibleLinks = filterCat === 'all' ? links : links.filter(l => l.category === filterCat)

  // ── Helpers ──────────────────────────────────────────────────────────────

  function openAdd() {
    setEditLink(null)
    setForm(BLANK_FORM)
    setError(null)
    setSlideOpen(true)
  }

  function openEdit(link: ResourceLink) {
    setEditLink(link)
    setForm({
      name: link.name,
      description: link.description,
      url: link.url,
      category: (CATEGORIES.includes(link.category as CategoryOption) ? link.category : 'General') as CategoryOption,
    })
    setError(null)
    setSlideOpen(true)
  }

  function closeSlide() {
    setSlideOpen(false)
    setEditLink(null)
    setError(null)
  }

  const f =
    (field: keyof typeof BLANK_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))

  async function save() {
    if (!form.name.trim() || !form.url.trim()) return
    setSaving(true)
    setError(null)

    const method     = editLink ? 'PATCH' : 'POST'
    const icon       = autoIcon(form.category, form.url)
    const icon_color = categoryColor(form.category)
    const body = editLink
      ? { id: editLink.id, ...form, icon, icon_color }
      : { ...form, icon, icon_color }

    const res = await fetch('/api/resource-links', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Something went wrong')
      setSaving(false)
      return
    }

    await onRefresh()
    setSaving(false)
    closeSlide()
  }

  async function deleteLink(id: string) {
    setLinks(prev => prev.filter(l => l.id !== id))
    await fetch('/api/resource-links', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    onRefresh()
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '42px' }}>
      <PanelHeader
        eyebrow="Resources"
        title="Resource Links"
        subtitle={`${links.length} resources · ${chapters.length} chapter pages · ${keyContacts.length} key contacts`}
        right={
          <button
            onClick={openAdd}
            style={{ padding: '5px 14px', borderRadius: '999px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)', color: '#06b6d4', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            + Add Link
          </button>
        }
      />

      {/* Chapter quick nav */}
      <div>
        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', marginBottom: '14px' }}>Chapter Pages</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '12px' }}>
          {chapters.map(c => {
            const accent = chapterAccent(c)
            return (
              <button
                key={c.id}
                onClick={() => onShowChapter(c.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '18px', cursor: 'pointer', transition: 'all .2s', textAlign: 'left' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${accent}18`, border: `1px solid ${accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: accent, flexShrink: 0 }}>
                  {c.number}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#cfd5dd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>{c.status.replace(/_/g,' ')}</div>
                </div>
                <span style={{ marginLeft: 'auto', color: '#475569', fontSize: '12px', flexShrink: 0 }}>→</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Drive & Operations Resources */}
      <div>
        {/* Section header + category filter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', margin: 0 }}>
            Drive &amp; Operations Resources
          </p>
          {categories.length > 1 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['all', ...categories].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  style={{
                    padding: '3px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700,
                    cursor: 'pointer', transition: 'all .15s',
                    background: filterCat === cat ? 'rgba(6,182,212,0.15)' : 'transparent',
                    border: filterCat === cat ? '1px solid rgba(6,182,212,0.4)' : '1px solid #1e293b',
                    color: filterCat === cat ? '#06b6d4' : '#64748b',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {visibleLinks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569', fontSize: '13px' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔗</div>
            No links yet — click <strong style={{ color: '#06b6d4' }}>+ Add Link</strong> to get started.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {visibleLinks.map(link => (
              <LinkRow
                key={link.id}
                link={link}
                onEdit={() => openEdit(link)}
                onDelete={() => setDeleteId(link.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Key contacts */}
      {keyContacts.length > 0 && (
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', marginBottom: '14px' }}>Sui Foundation Contacts</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {keyContacts.map(c => (
              <div
                key={c.id}
                style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: '14px', alignItems: 'center', padding: '18px 22px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '18px', transition: 'border-color .2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(6,182,212,0.35)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e293b')}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  {c.emoji}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#cfd5dd', marginBottom: '2px' }}>{c.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{c.role}</div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#06b6d4', fontFamily: 'monospace' }}>{c.handle}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit slide-over */}
      <SlideOver
        open={slideOpen}
        onClose={closeSlide}
        title={editLink ? 'Edit Resource Link' : 'Add Resource Link'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)', fontSize: '12px', color: '#64748b' }}>
            <span style={{ fontSize: '20px' }}>{autoIcon(form.category, form.url)}</span>
            <span>Icon is picked automatically from the category &amp; URL.</span>
          </div>

          <FormField label="Name">
            <FieldInput placeholder="e.g. Organiser Drive" value={form.name} onChange={f('name')} />
          </FormField>

          <FormField label="Description">
            <FieldTextarea placeholder="Short description of this resource…" value={form.description} onChange={f('description')} />
          </FormField>

          <FormField label="URL">
            <FieldInput placeholder="https://…" value={form.url} onChange={f('url')} />
          </FormField>

          <FormField label="Category">
            <FieldSelect value={form.category} onChange={f('category')}>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </FieldSelect>
          </FormField>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.25)', color: '#e11d48', fontSize: '12px' }}>
              {error}
            </div>
          )}

          <button
            onClick={save}
            disabled={saving || !form.name.trim() || !form.url.trim()}
            style={{
              padding: '10px', borderRadius: '10px',
              background: saving || !form.name.trim() || !form.url.trim()
                ? '#1e293b'
                : 'linear-gradient(135deg,#06b6d4,#14b8a6)',
              border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700,
              cursor: saving ? 'wait' : 'pointer', marginTop: '8px',
            }}
          >
            {saving ? 'Saving…' : editLink ? 'Save Changes' : 'Add Link'}
          </button>
        </div>
      </SlideOver>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteLink(deleteId)}
        message="Delete this resource link? This cannot be undone."
      />
    </div>
  )
}
