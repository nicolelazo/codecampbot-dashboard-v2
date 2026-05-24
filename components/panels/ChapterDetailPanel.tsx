'use client'
import { useState, useEffect } from 'react'
import Badge from '@/components/ui/Badge'
import ProgressBar from '@/components/ui/ProgressBar'
import SlideOver from '@/components/ui/SlideOver'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FormField, { FieldInput, FieldSelect, FieldTextarea } from '@/components/ui/FormField'
import type { Chapter, ChapterTask, BadgeVariant } from '@/lib/types'
import { CHECKLIST_TEMPLATE as CHECKLIST } from '@/lib/checklist-data'

/* ── accent colours ─────────────────────────────────────────────────────── */
const accentOf = (c: Chapter) =>
  c.color === 'teal' ? '#14b8a6' : c.color === 'yellow' ? '#f59e0b' : c.color === 'purple' ? '#a78bfa' : '#06b6d4'

const statusBadge: Record<string, { variant: BadgeVariant; label: string }> = {
  completed:     { variant: 'done',    label: 'Completed'       },
  rescheduling:  { variant: 'warn',    label: 'Rescheduling'    },
  in_progress:   { variant: 'pending', label: 'Active'          },
  pencil_booked: { variant: 'warn',    label: 'Pencil Booked'   },
  tbc:           { variant: 'tbc',     label: 'TBC / AT RISK'   },
  activating:    { variant: 'warn',    label: 'Activating'      },
}

/* ── countdown checklist data ───────────────────────────────────────────── */
type CheckStatus = 'done' | 'executed' | 'overdue' | 'confirm' | 'in_progress' | 'pending' | 'upcoming'

interface CheckItem {
  tCode: string
  task: string
  date: string
  status: string
  activity_status?: string
  isEvent?: boolean
}

interface ChecklistOverrideEntry {
  date_status?: string
  activity_status?: string
}

const DATE_STATUS_OPTIONS = ['upcoming', 'overdue', 'pending']
const ACTIVITY_STATUS_OPTIONS = ['done', 'pending', 'in_progress']


const PILOT_NOTES = [
  { ok: true,  text: 'Manila = benchmark. Do ocular **1 month before**, resolve roadblocks **3 weeks before**.' },
  { ok: true,  text: 'Offline USB install strategy for restricted school WiFi — works.' },
  { ok: true,  text: '4-hour dry run format validated.' },
  { ok: false, text: 'Updated installation guide being prepared by Mike + Lady — wait for final version before proceeding.' },
  { ok: false, text: 'Per-chapter qty allocation must be confirmed in tracker before packing begins.' },
]

/* ── status pills for checklist ─────────────────────────────────────────── */
const CHECK_BADGE: Record<CheckStatus, { color: string; bg: string; border: string; label: string }> = {
  done:        { color: '#14b8a6', bg: 'rgba(20,184,166,0.12)',  border: 'rgba(20,184,166,0.3)',  label: '✓ DONE'        },
  executed:    { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.3)',   label: '✓ EXECUTED'    },
  overdue:     { color: '#e11d48', bg: 'rgba(225,29,72,0.12)',   border: 'rgba(225,29,72,0.3)',   label: '⚠ OVERDUE'    },
  confirm:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  label: '⚠ CONFIRM'    },
  in_progress: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)', label: '⚠ IN PROGRESS' },
  pending:     { color: '#475569', bg: 'rgba(71,85,105,0.12)',   border: 'rgba(71,85,105,0.3)',   label: '— PENDING'    },
  upcoming:    { color: '#334155', bg: 'rgba(51,65,85,0.12)',    border: 'rgba(51,65,85,0.25)',   label: '· UPCOMING'   },
}

function normalizeStatusLabel(raw: string): string {
  return raw.replace(/_/g, ' ').trim().toUpperCase()
}

function statusOptionLabel(raw: string): string {
  return raw
    .replace(/_/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function checklistBadge(rawStatus: string) {
  const status = rawStatus.trim().toLowerCase() as CheckStatus
  const known = CHECK_BADGE[status]
  if (known) return known
  return {
    color: '#94a3b8',
    bg: 'rgba(71,85,105,0.12)',
    border: 'rgba(71,85,105,0.35)',
    label: normalizeStatusLabel(rawStatus || 'unknown'),
  }
}

function defaultActivityStatus(item: CheckItem): string {
  if (item.activity_status?.trim()) return item.activity_status
  const timeline = item.status.trim().toLowerCase()
  if (timeline === 'done' || timeline === 'executed') return 'done'
  if (timeline === 'in_progress') return 'in_progress'
  if (timeline === 'pending') return 'pending'
  return 'pending'
}

function toActivityStatusChoice(raw: string): string {
  const normalized = raw.trim().toLowerCase()
  return ACTIVITY_STATUS_OPTIONS.includes(normalized) ? normalized : 'pending'
}

function scheduleStatusFromDate(dateText: string, activityStatus: string): string | null {
  if (activityStatus === 'done') return null

  const normalized = dateText.trim().toLowerCase()
  if (!normalized || normalized === 'tbd' || normalized.includes('pending') || normalized.includes('in progress') || normalized.includes('urgent')) {
    return 'pending'
  }

  const parsed = Date.parse(dateText)
  if (Number.isNaN(parsed)) return 'pending'

  const itemDate = new Date(parsed)
  const today = new Date()
  itemDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  return itemDate < today ? 'overdue' : 'upcoming'
}

/* ── relative time helper ────────────────────────────────────────────────── */
function relativeDay(isoDate: string | null): string {
  if (!isoDate) return 'TBD'
  const diff = Math.round((new Date(isoDate).getTime() - Date.now()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff > 0)  return `In ${diff} day${diff !== 1 ? 's' : ''}`
  return `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} ago`
}

function addBusinessDays(startUtc: Date, amount: number): Date {
  if (amount === 0) return new Date(startUtc)

  const result = new Date(startUtc)
  const step = amount > 0 ? 1 : -1
  let remaining = Math.abs(amount)

  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + step)
    const day = result.getUTCDay()
    if (day !== 0 && day !== 6) remaining -= 1
  }

  return result
}

function formatChecklistDate(dateUtc: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dateUtc)
}

function formatEventDateIso(isoDate: string | null): string {
  if (!isoDate) return ''
  const date = new Date(`${isoDate}T00:00:00Z`)
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function autoChecklistDate(eventIso: string | null, tCode: string, fallback: string): string {
  if (!eventIso) return fallback

  const base = new Date(`${eventIso}T00:00:00Z`)
  const match = tCode.match(/T\s*([+-])\s*(\d+)/i)
  if (!match) {
    if (/^T\s*-\s*0/i.test(tCode) || /^T\s*0/i.test(tCode)) {
      return formatChecklistDate(base)
    }
    return fallback
  }

  const sign = match[1] === '-' ? -1 : 1
  const days = Number(match[2])
  if (!Number.isFinite(days)) return fallback

  const computed = addBusinessDays(base, sign * days)
  return formatChecklistDate(computed)
}

/* ── Checklist row ───────────────────────────────────────────────────────── */
function CheckRow({ item, onEdit }: { item: CheckItem; onEdit: () => void }) {
  const activityStatusValue = toActivityStatusChoice(defaultActivityStatus(item))
  const dateStatusValue = scheduleStatusFromDate(item.date, activityStatusValue)
  const dateStatus = dateStatusValue ? checklistBadge(dateStatusValue) : null
  const activityStatus = checklistBadge(activityStatusValue)

  return (
    <div
      style={{
        display: 'grid', gridTemplateColumns: dateStatus ? '52px 1fr auto auto auto' : '52px 1fr auto auto', gap: '10px',
        alignItems: 'center', padding: '13px 18px',
        background: item.isEvent ? 'rgba(6,182,212,0.04)' : '#0f172a',
        border: `1px solid ${item.isEvent ? 'rgba(6,182,212,0.2)' : '#1e293b'}`,
        borderRadius: '12px', transition: 'border-color .2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(6,182,212,0.35)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = item.isEvent ? 'rgba(6,182,212,0.2)' : '#1e293b')}
    >
      {/* T-code */}
      <span style={{ fontSize: '9px', fontWeight: 800, fontFamily: 'monospace', color: item.isEvent ? '#06b6d4' : '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {item.tCode}
      </span>
      {/* Task + date */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: item.isEvent ? '#cfd5dd' : '#cbd5e1', marginBottom: '2px' }}>{item.task}</div>
        <div style={{ fontSize: '10px', color: '#475569' }}>{item.date}</div>
      </div>
      {/* Status pill */}
      {dateStatus && (
        <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '8px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', background: dateStatus.bg, color: dateStatus.color, border: `1px solid ${dateStatus.border}` }}>
          {dateStatus.label}
        </span>
      )}
      <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '8px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', background: activityStatus.bg, color: activityStatus.color, border: `1px solid ${activityStatus.border}` }}>
        {activityStatus.label}
      </span>
      <button
        onClick={onEdit}
        style={{
          padding: '4px 10px',
          borderRadius: '8px',
          background: 'rgba(6,182,212,0.12)',
          border: '1px solid rgba(6,182,212,0.35)',
          color: '#06b6d4',
          fontSize: '9px',
          fontWeight: 800,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Edit Status
      </button>
    </div>
  )
}

const TASK_STATUS_CYCLE: Record<string, string> = {
  pending: 'done', done: 'urgent', urgent: 'pending',
}
const TASK_STATUS_LABEL: Record<string, string> = {
  pending: '→ Pending', done: '✓ Done', urgent: '🔴 Urgent',
}
const TASK_STATUS_COLOR: Record<string, string> = {
  pending: '#475569', done: '#14b8a6', urgent: '#e11d48',
}

/* ── Main component ──────────────────────────────────────────────────────── */
interface Props { chapterId: string; chapters: Chapter[]; onBack: () => void; onRefresh?: () => Promise<void> }

export default function ChapterDetailPanel({ chapterId, chapters, onBack, onRefresh }: Props) {
  const chapter = chapters.find(c => c.id === chapterId)

  const [todos, setTodos] = useState<ChapterTask[]>(() => chapter?.todos ?? [])
  const [addOpen, setAddOpen] = useState(false)
  const [addOwner, setAddOwner] = useState('')
  const [addDesc, setAddDesc] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [metricsOpen, setMetricsOpen] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [scheduleSaving, setScheduleSaving] = useState(false)
  const [metricsSaving, setMetricsSaving] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: '',
    city: '',
    region: '',
    venue: '',
    lead_name: '',
    status: 'in_progress',
  })
  const [scheduleForm, setScheduleForm] = useState({
    date_text: '',
    date_iso: '',
  })
  const [metricsForm, setMetricsForm] = useState({
    pax_target: '',
    pax_actual: '',
    merch_status: '',
  })
  const [editTask, setEditTask] = useState<ChapterTask | null>(null)
  const [taskOwner, setTaskOwner] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskSaving, setTaskSaving] = useState(false)
  const [checklistOverrides, setChecklistOverrides] = useState<Record<string, ChecklistOverrideEntry>>({})
  const [checkEdit, setCheckEdit] = useState<{ index: number; activity_status: string } | null>(null)
  const [checkEditSaving, setCheckEditSaving] = useState(false)

  // Sync todos when parent refreshes
  useEffect(() => {
    if (chapter) setTodos(chapter.todos)
  }, [chapter?.todos])

  useEffect(() => {
    let cancelled = false

    async function loadChecklistOverrides() {
      const res = await fetch(`/api/chapter-checklist?chapter_id=${chapterId}`, { cache: 'no-store' })
      if (!res.ok) return
      const payload = await res.json()
      if (!cancelled && payload.ok) {
        setChecklistOverrides(payload.data ?? {})
      }
    }

    loadChecklistOverrides()
    return () => {
      cancelled = true
    }
  }, [chapterId])

  if (!chapter) return null

  const accent  = accentOf(chapter)
  const sb      = statusBadge[chapter.status]
  const checklist = (CHECKLIST[chapterId] ?? []).map((item, index) => {
    const override = checklistOverrides[String(index)]
    const baseItem = {
      ...item,
      date: autoChecklistDate(chapter.date_iso, item.tCode, item.date),
    }
    if (!override) return baseItem
    return {
      ...baseItem,
      activity_status: override.activity_status?.trim() || undefined,
    }
  })
  const relDay  = relativeDay(chapter.date_iso)

  async function addTask() {
    if (!addOwner.trim() || !addDesc.trim()) return
    setAddLoading(true)
    const res = await fetch('/api/chapter-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapter_id: chapterId, owner: addOwner.trim(), description: addDesc.trim() }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setTodos(prev => [...prev, data])
      setAddOwner(''); setAddDesc(''); setAddOpen(false)
      onRefresh?.()
    }
    setAddLoading(false)
  }

  async function cycleStatus(task: ChapterTask) {
    const next = TASK_STATUS_CYCLE[task.status] ?? 'pending'
    setTodos(prev => prev.map(t => t.id === task.id ? { ...t, status: next as ChapterTask['status'] } : t))
    const res = await fetch('/api/chapter-tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, status: next }),
    })
    if (!res.ok) { setTodos(prev => prev.map(t => t.id === task.id ? task : t)); onRefresh?.() }
  }

  async function deleteTask(id: string) {
    setTodos(prev => prev.filter(t => t.id !== id))
    await fetch('/api/chapter-tasks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    onRefresh?.()
  }

  function openProfileEditor() {
    if (!chapter) return
    setProfileForm({
      name: chapter.name,
      city: chapter.city,
      region: chapter.region,
      venue: chapter.venue,
      lead_name: chapter.lead_name,
      status: chapter.status,
    })
    setProfileOpen(true)
  }

  function openScheduleEditor() {
    if (!chapter) return
    setScheduleForm({
      date_text: chapter.date_text,
      date_iso: chapter.date_iso ?? '',
    })
    setScheduleOpen(true)
  }

  function openMetricsEditor() {
    if (!chapter) return
    setMetricsForm({
      pax_target: chapter.pax_target === null ? '' : String(chapter.pax_target),
      pax_actual: chapter.pax_actual === null ? '' : String(chapter.pax_actual),
      merch_status: chapter.merch_status,
    })
    setMetricsOpen(true)
  }

  async function saveProfileDetails() {
    if (!chapter) return
    setProfileSaving(true)
    const body = {
      id: chapter.id,
      name: profileForm.name.trim(),
      city: profileForm.city.trim(),
      region: profileForm.region.trim(),
      venue: profileForm.venue.trim(),
      lead_name: profileForm.lead_name.trim(),
      status: profileForm.status,
    }
    const res = await fetch('/api/chapters', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      await onRefresh?.()
      setProfileOpen(false)
    }
    setProfileSaving(false)
  }

  async function saveScheduleDetails() {
    if (!chapter) return
    setScheduleSaving(true)
    const res = await fetch('/api/chapters', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: chapter.id,
        date_text: scheduleForm.date_text.trim(),
        date_iso: scheduleForm.date_iso.trim() || null,
      }),
    })
    if (res.ok) {
      await onRefresh?.()
      setScheduleOpen(false)
    }
    setScheduleSaving(false)
  }

  async function saveMetricsDetails() {
    if (!chapter) return
    setMetricsSaving(true)
    const res = await fetch('/api/chapters', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: chapter.id,
        pax_target: metricsForm.pax_target.trim() === '' ? null : Number(metricsForm.pax_target),
        pax_actual: metricsForm.pax_actual.trim() === '' ? null : Number(metricsForm.pax_actual),
        merch_status: metricsForm.merch_status.trim(),
      }),
    })
    if (res.ok) {
      await onRefresh?.()
      setMetricsOpen(false)
    }
    setMetricsSaving(false)
  }

  function openTaskEditor(task: ChapterTask) {
    setEditTask(task)
    setTaskOwner(task.owner)
    setTaskDesc(task.description)
  }

  async function saveTaskEdit() {
    if (!editTask || !taskOwner.trim() || !taskDesc.trim()) return
    setTaskSaving(true)
    const res = await fetch('/api/chapter-tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editTask.id,
        owner: taskOwner.trim(),
        description: taskDesc.trim(),
      }),
    })
    if (res.ok) {
      setTodos(prev => prev.map(t => t.id === editTask.id ? { ...t, owner: taskOwner.trim(), description: taskDesc.trim() } : t))
      await onRefresh?.()
      setEditTask(null)
    }
    setTaskSaving(false)
  }

  function openChecklistEditor(index: number, item: CheckItem) {
    const activityStatus = toActivityStatusChoice(defaultActivityStatus(item))
    setCheckEdit({
      index,
      activity_status: activityStatus,
    })
  }

  async function saveChecklistStatuses() {
    if (!checkEdit) return

    const idx = String(checkEdit.index)
    const payload = {
      chapter_id: chapterId,
      item_index: checkEdit.index,
      activity_status: toActivityStatusChoice(checkEdit.activity_status),
    }
    if (!payload.activity_status) return

    const prev = checklistOverrides[idx]
    setCheckEditSaving(true)
    setChecklistOverrides(current => ({
      ...current,
      [idx]: {
        activity_status: payload.activity_status,
      },
    }))

    const res = await fetch('/api/chapter-checklist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      setChecklistOverrides(current => {
        const restored = { ...current }
        if (prev === undefined) delete restored[idx]
        else restored[idx] = prev
        return restored
      })
    } else {
      setCheckEdit(null)
      onRefresh?.()
    }

    setCheckEditSaving(false)
  }

  /* Liquidation status — infer from checklist or todos */
  const liqItem = checklist.find(i => i.tCode === 'T+7')
  const liqStatus = liqItem?.status ?? (chapter.status === 'completed' ? 'confirm' : 'upcoming')
  const liqLabel  = liqStatus === 'done' ? '✓ Settled' : liqStatus === 'confirm' ? '⚠ Confirm' : liqStatus === 'overdue' ? '⚠ Overdue' : '— TBD'
  const liqColor  = liqStatus === 'done' ? '#14b8a6' : liqStatus === 'overdue' ? '#e11d48' : liqStatus === 'confirm' ? '#f59e0b' : '#475569'

  const isoEventDate = formatEventDateIso(chapter.date_iso)
  const displayDateText = chapter.date_text.trim()
  const eventDatePrimary = isoEventDate || displayDateText || 'TBD'
  const eventDateSecondary = displayDateText && displayDateText !== eventDatePrimary ? displayDateText : ''

  /* Stat tiles */
  const statTiles = [
    { label: 'Event Date',  value: eventDatePrimary,                                                 color: accent           },
    { label: 'Countdown',   value: relDay,                                                            color: '#8899aa'        },
    { label: 'Pax Target',  value: chapter.pax_target ? String(chapter.pax_target) : 'TBD',         color: accent           },
    { label: 'Actual Pax',  value: chapter.pax_actual ? String(chapter.pax_actual) : 'TBC ⚠',       color: chapter.pax_actual ? '#14b8a6' : '#f59e0b' },
    { label: 'Merch',       value: chapter.merch_status,                                              color: chapter.merch_status.startsWith('✓') ? '#14b8a6' : '#f59e0b' },
    { label: 'Liquidation', value: liqLabel,                                                          color: liqColor         },
  ]

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '34px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <button
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: '11px', fontWeight: 700, color: '#64748b', cursor: 'pointer', transition: 'all .2s', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.4)'; e.currentTarget.style.color = '#cfd5dd' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.color = '#64748b' }}
        >
          ← All Chapters
        </button>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', overflowX: 'auto' }}>
          <button
            onClick={openProfileEditor}
            style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.26)', color: '#06b6d4', fontSize: '11px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
          >
            Edit Profile
          </button>
          <button
            onClick={openScheduleEditor}
            style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.26)', color: '#14b8a6', fontSize: '11px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
          >
            Edit Schedule
          </button>
          <button
            onClick={openMetricsEditor}
            style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.26)', color: '#f59e0b', fontSize: '11px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
          >
            Edit Metrics
          </button>
        </div>
      </div>

      {/* ── Hero card ────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px', padding: '34px', overflow: 'hidden' }}>
        {/* Top accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${accent}, transparent)` }} />
        {/* Faded chapter number */}
        <div style={{ position: 'absolute', top: '10px', right: '24px', fontFamily: 'monospace', fontWeight: 900, fontSize: '80px', lineHeight: 1, color: `${accent}12`, userSelect: 'none', pointerEvents: 'none' }}>
          {chapter.number.padStart(2, '0')}
        </div>

        {/* Badge row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <Badge variant={sb.variant} size="sm">{sb.label}</Badge>
          <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 10px', borderRadius: '8px', background: `${accent}14`, border: `1px solid ${accent}35`, color: accent }}>
            CHAPTER {chapter.number} · {chapter.region}
          </span>
        </div>

        {/* Chapter name */}
        <h2 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 900, color: '#cfd5dd', lineHeight: 1.1, margin: '0 0 8px' }}>
          {chapter.name}
        </h2>

        {/* Date / venue / lead */}
        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 2 }}>
          {eventDatePrimary}{eventDateSecondary ? ` · ${eventDateSecondary}` : ''}{chapter.venue ? ` · ${chapter.venue}` : ''}<br />
          <span style={{ color: '#475569' }}>Lead: {chapter.lead_name}</span>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            <span>Progress</span>
            <span style={{ color: accent, fontWeight: 700 }}>{chapter.progress_percent}%</span>
          </div>
          <ProgressBar
            percent={chapter.progress_percent}
            color={chapter.color === 'yellow' ? 'yellow' : chapter.color === 'teal' ? 'teal' : chapter.color === 'purple' ? 'purple' : 'default'}
          />
        </div>
      </div>

      {/* ── Stat tiles ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '12px' }}>
        {statTiles.map(t => (
          <div key={t.label} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '18px', padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', marginBottom: '8px' }}>{t.label}</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: t.color, lineHeight: 1.2 }}>{t.value}</div>
          </div>
        ))}
      </div>

      {/* ── Content update alert ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '10px', padding: '16px 20px', background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '16px', fontSize: '13px', color: '#8899aa', lineHeight: 1.7 }}>
        <span style={{ fontSize: '13px', flexShrink: 0 }}>📋</span>
        <span>
          <strong style={{ color: '#06b6d4' }}>Content Update:</strong> Mike and Lady are updating the code camp content, installation guide, and installation procedures based on learnings from the Letran pilot. All subsequent chapters will use the updated version.
        </span>
      </div>

      {/* ── Countdown Checklist ──────────────────────────────────────────── */}
      {checklist.length > 0 && (
        <div>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', margin: 0 }}>
              Event Countdown Checklist
              {eventDatePrimary && (
                <span style={{ color: '#334155', marginLeft: '10px' }}>
                  · {eventDatePrimary}{eventDateSecondary ? ` · ${eventDateSecondary}` : ''}{chapter.venue ? ' · ' + chapter.venue.split(',')[0] : ''}
                </span>
              )}
            </p>
          </div>

          {/* How to read strip */}
          <div style={{ marginBottom: '14px', padding: '10px 14px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px' }}>
            <div style={{ fontSize: '10px', color: '#475569', marginBottom: '8px', fontWeight: 600 }}>🗓 How to read this checklist — counting down to event day:</div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { code: 'PRE', hint: 'Done before countdown started', color: '#475569' },
                { code: 'T-35', hint: '35 days before', color: '#64748b' },
                { code: 'T-30', hint: 'Ocular visit', color: '#64748b' },
                { code: 'T-21', hint: '21 days before', color: '#64748b' },
                { code: 'T-14', hint: 'Verified & ready', color: '#64748b' },
                { code: 'T-7',  hint: 'Dry run', color: '#64748b' },
                { code: 'T-3',  hint: 'Final prep', color: '#64748b' },
                { code: 'T-0 ☻', hint: 'Event day', color: '#06b6d4' },
                { code: 'T+3 / T+7', hint: 'Wrap-ups: pax, receipts, report', color: '#8899aa' },
              ].map(p => (
                <span key={p.code} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '8px', fontWeight: 800, fontFamily: 'monospace', padding: '2px 6px', borderRadius: '4px', background: 'rgba(71,85,105,0.15)', border: '1px solid #1e293b', color: p.color, whiteSpace: 'nowrap' }}>{p.code}</span>
                  <span style={{ fontSize: '9px', color: '#334155', whiteSpace: 'nowrap' }}>{p.hint}</span>
                  <span style={{ color: '#1e293b', margin: '0 2px' }}>·</span>
                </span>
              ))}
            </div>
          </div>

          {/* Checklist rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {checklist.map((item, i) => {
              return (
                <CheckRow
                  key={`${item.tCode}-${i}`}
                  item={item}
                  onEdit={() => openChecklistEditor(i, item)}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* ── Open Tasks (from DB todos) ───────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', margin: 0 }}>
            Open Tasks <span style={{ color: '#334155', marginLeft: '6px' }}>({todos.length})</span>
          </p>
          <button
            onClick={() => setAddOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '8px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)', color: '#06b6d4', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
          >
            + Add Task
          </button>
        </div>
        {todos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#334155', fontSize: '12px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}>
            No tasks yet. Click + Add Task to create one.
          </div>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {todos.map(t => {
              const statusColor = TASK_STATUS_COLOR[t.status] ?? '#475569'
              return (
                <div
                  key={t.id}
                  onMouseEnter={() => setHoverId(t.id)}
                  onMouseLeave={() => setHoverId(null)}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px',
                    alignItems: 'center', padding: '12px 14px',
                    background: t.status === 'urgent' ? 'rgba(225,29,72,0.05)' : '#0f172a',
                    border: `1px solid ${t.status === 'urgent' ? 'rgba(225,29,72,0.25)' : '#1e293b'}`,
                    borderRadius: '12px', transition: 'border-color .2s',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#cfd5dd', marginBottom: '2px' }}>
                      <span style={{ color: accent }}>{t.owner}:</span> {t.description}
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {TASK_STATUS_LABEL[t.status]}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', opacity: hoverId === t.id ? 1 : 0, transition: 'opacity .15s' }}>
                    <button
                      onClick={() => openTaskEditor(t)}
                      title="Edit task"
                      style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)', color: '#06b6d4', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => cycleStatus(t)}
                      title={`Cycle status (currently ${t.status})`}
                      style={{ padding: '4px 8px', borderRadius: '6px', background: `${statusColor}18`, border: `1px solid ${statusColor}40`, color: statusColor, fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      ↻
                    </button>
                    <button
                      onClick={() => setDeleteId(t.id)}
                      style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.25)', color: '#e11d48', fontSize: '10px', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add task slide-over */}
      <SlideOver open={addOpen} onClose={() => setAddOpen(false)} title="Add Task">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Owner">
            <FieldInput
              placeholder="e.g. Jedd"
              value={addOwner}
              onChange={e => setAddOwner(e.target.value)}
            />
          </FormField>
          <FormField label="Description">
            <FieldTextarea
              placeholder="What needs to be done?"
              value={addDesc}
              onChange={e => setAddDesc(e.target.value)}
            />
          </FormField>
          <button
            onClick={addTask}
            disabled={addLoading || !addOwner.trim() || !addDesc.trim()}
            style={{ padding: '10px', borderRadius: '10px', background: addLoading || !addOwner.trim() || !addDesc.trim() ? '#1e293b' : 'linear-gradient(135deg,#06b6d4,#14b8a6)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: addLoading ? 'wait' : 'pointer' }}
          >
            {addLoading ? 'Adding…' : 'Add Task'}
          </button>
        </div>
      </SlideOver>

      {/* Edit profile slide-over */}
      <SlideOver open={profileOpen} onClose={() => setProfileOpen(false)} title="Edit Chapter Profile">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FormField label="Chapter Name">
            <FieldInput value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
          </FormField>
          <FormField label="City">
            <FieldInput value={profileForm.city} onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))} />
          </FormField>
          <FormField label="Region">
            <FieldInput value={profileForm.region} onChange={e => setProfileForm(f => ({ ...f, region: e.target.value }))} />
          </FormField>
          <FormField label="Venue">
            <FieldTextarea value={profileForm.venue} onChange={e => setProfileForm(f => ({ ...f, venue: e.target.value }))} />
          </FormField>
          <FormField label="Lead Name">
            <FieldInput value={profileForm.lead_name} onChange={e => setProfileForm(f => ({ ...f, lead_name: e.target.value }))} />
          </FormField>
          <FormField label="Status">
            <FieldSelect value={profileForm.status} onChange={e => setProfileForm(f => ({ ...f, status: e.target.value }))}>
              <option value="in_progress">In Progress</option>
              <option value="activating">Activating</option>
              <option value="pencil_booked">Pencil-booked</option>
              <option value="tbc">TBC</option>
              <option value="rescheduling">Rescheduling</option>
              <option value="completed">Completed</option>
            </FieldSelect>
          </FormField>
          <button
            onClick={saveProfileDetails}
            disabled={profileSaving || !profileForm.name.trim() || !profileForm.city.trim() || !profileForm.region.trim() || !profileForm.venue.trim() || !profileForm.lead_name.trim()}
            style={{ padding: '10px', borderRadius: '10px', background: profileSaving ? '#1e293b' : 'linear-gradient(135deg,#06b6d4,#14b8a6)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: profileSaving ? 'wait' : 'pointer' }}
          >
            {profileSaving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </SlideOver>

      {/* Edit schedule slide-over */}
      <SlideOver open={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Edit Schedule">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FormField label="Display Text (Optional)">
            <FieldInput
              placeholder="e.g. Apr 18 (Dev Event) + May 16"
              value={scheduleForm.date_text}
              onChange={e => setScheduleForm(f => ({ ...f, date_text: e.target.value }))}
            />
          </FormField>
          <FormField label="Event Date">
            <FieldInput
              type="date"
              value={scheduleForm.date_iso}
              onChange={e => setScheduleForm(f => ({ ...f, date_iso: e.target.value }))}
            />
          </FormField>
          <button
            onClick={saveScheduleDetails}
            disabled={scheduleSaving}
            style={{ padding: '10px', borderRadius: '10px', background: scheduleSaving ? '#1e293b' : 'linear-gradient(135deg,#06b6d4,#14b8a6)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: scheduleSaving ? 'wait' : 'pointer' }}
          >
            {scheduleSaving ? 'Saving…' : 'Save Schedule'}
          </button>
        </div>
      </SlideOver>

      {/* Edit metrics slide-over */}
      <SlideOver open={metricsOpen} onClose={() => setMetricsOpen(false)} title="Edit Metrics">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FormField label="Pax Target">
            <FieldInput type="number" min="0" value={metricsForm.pax_target} onChange={e => setMetricsForm(f => ({ ...f, pax_target: e.target.value }))} />
          </FormField>
          <FormField label="Actual Pax">
            <FieldInput type="number" min="0" value={metricsForm.pax_actual} onChange={e => setMetricsForm(f => ({ ...f, pax_actual: e.target.value }))} />
          </FormField>
          <FormField label="Merch Status">
            <FieldInput value={metricsForm.merch_status} onChange={e => setMetricsForm(f => ({ ...f, merch_status: e.target.value }))} />
          </FormField>
          <button
            onClick={saveMetricsDetails}
            disabled={metricsSaving}
            style={{ padding: '10px', borderRadius: '10px', background: metricsSaving ? '#1e293b' : 'linear-gradient(135deg,#06b6d4,#14b8a6)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: metricsSaving ? 'wait' : 'pointer' }}
          >
            {metricsSaving ? 'Saving…' : 'Save Metrics'}
          </button>
        </div>
      </SlideOver>

      {/* Edit task slide-over */}
      <SlideOver open={editTask !== null} onClose={() => setEditTask(null)} title="Edit Task">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Owner">
            <FieldInput value={taskOwner} onChange={e => setTaskOwner(e.target.value)} />
          </FormField>
          <FormField label="Description">
            <FieldTextarea value={taskDesc} onChange={e => setTaskDesc(e.target.value)} />
          </FormField>
          <button
            onClick={saveTaskEdit}
            disabled={taskSaving || !taskOwner.trim() || !taskDesc.trim()}
            style={{ padding: '10px', borderRadius: '10px', background: taskSaving ? '#1e293b' : 'linear-gradient(135deg,#06b6d4,#14b8a6)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: taskSaving ? 'wait' : 'pointer' }}
          >
            {taskSaving ? 'Saving…' : 'Save Task'}
          </button>
        </div>
      </SlideOver>

      {/* Edit checklist statuses */}
      <SlideOver open={checkEdit !== null} onClose={() => setCheckEdit(null)} title="Edit Checklist Status">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Activity Status">
            <FieldSelect
              value={checkEdit?.activity_status ?? ''}
              onChange={e => setCheckEdit(prev => prev ? { ...prev, activity_status: e.target.value } : prev)}
            >
              {ACTIVITY_STATUS_OPTIONS.map(option => (
                <option key={option} value={option}>{statusOptionLabel(option)}</option>
              ))}
            </FieldSelect>
          </FormField>
          <button
            onClick={saveChecklistStatuses}
            disabled={checkEditSaving || !checkEdit?.activity_status}
            style={{ padding: '10px', borderRadius: '10px', background: checkEditSaving ? '#1e293b' : 'linear-gradient(135deg,#06b6d4,#14b8a6)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: checkEditSaving ? 'wait' : 'pointer' }}
          >
            {checkEditSaving ? 'Saving…' : 'Save Checklist Status'}
          </button>
        </div>
      </SlideOver>

      {/* Confirm delete */}
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteTask(deleteId)}
        message="Delete this task? This cannot be undone."
      />

      {/* ── Pilot Notes ──────────────────────────────────────────────────── */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '18px', padding: '26px 28px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#06b6d4', marginBottom: '14px' }}>
          Pilot Notes — for all chapters
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
          {PILOT_NOTES.map((n, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '12px', color: '#8899aa', lineHeight: 1.6 }}>
              <span style={{ flexShrink: 0, marginTop: '2px', width: '6px', height: '6px', borderRadius: '50%', background: n.ok ? '#14b8a6' : '#f59e0b', display: 'inline-block' }} />
              <span dangerouslySetInnerHTML={{ __html: n.text.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#cfd5dd">$1</strong>') }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Post-event template (completed chapters only) ─────────────────── */}
      {chapter.status === 'completed' && (
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748b', marginBottom: '14px' }}>Post-Event SITREP Template</p>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '18px', padding: '24px' }}>
            <pre style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.9, whiteSpace: 'pre-wrap', margin: 0 }}>{`EVENT SITREP — ${chapter.name}
Date:         ${eventDatePrimary}${eventDateSecondary ? ` (${eventDateSecondary})` : ''}
Lead:         ${chapter.lead_name}
Actual pax:   [number] (target: ${chapter.pax_target ?? 'TBC'})
Session:      [Part 1 only / Part 1 + Dinner]
Key outcomes: [projects, moments]
BIR invoices: [collected / pending]
Liquidation:  [submitted / pending by date]
Issues:       [list or NONE]`}</pre>
          </div>
        </div>
      )}

    </div>
  )
}
