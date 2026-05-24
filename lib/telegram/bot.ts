import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { CHECKLIST_TEMPLATE } from '@/lib/checklist-data'
import type { ChecklistTemplateItem } from '@/lib/checklist-data'

async function generateChapterStatusSummary(data: {
  chapterName: string
  status: string
  progressPercent: number
  overdueItems: { task: string; date: string }[]
  risks: { title: string; severity: string }[]
  checklistDone: number
  checklistPending: number
  topTask: string | null
  daysLate: number
}): Promise<string> {
  try {
    const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const contextLines: string[] = [
      `Chapter: ${data.chapterName}`,
      `Status: ${data.status} (${data.progressPercent}% progress)`,
      `Checklist: ${data.checklistDone} done, ${data.checklistPending} pending`,
    ]
    if (data.topTask) contextLines.push(`Top open task: ${data.topTask}${data.daysLate > 0 ? ` (${data.daysLate}d behind)` : ''}`)
    if (data.overdueItems.length > 0) contextLines.push(`Overdue checklist items: ${data.overdueItems.map(e => `${e.task} (was due ${e.date})`).join('; ')}`)
    if (data.risks.length > 0) contextLines.push(`Open risks: ${data.risks.map(r => `[${r.severity}] ${r.title}`).join('; ')}`)

    const msg = await ai.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 60,
      messages: [{
        role: 'user',
        content: `You are a program coordinator writing a daily status update. Based on the data below, write exactly 1 short sentence (max 20 words) summarizing what's at risk or what needs action. Be specific — name actual tasks or risks. No bullet points, no preamble.\n\n${contextLines.join('\n')}`,
      }],
    })
    const text = msg.content.find(b => b.type === 'text')
    return text?.type === 'text' ? text.text.trim() : 'Status unavailable.'
  } catch {
    return data.overdueItems.length > 0 || data.risks.length > 0
      ? `${data.overdueItems.length} overdue item(s), ${data.risks.length} open risk(s) — needs attention.`
      : `On track · ${data.checklistPending} checklist items pending.`
  }
}

const noStoreFetch: typeof fetch = (input, init) => {
  return fetch(input, {
    ...init,
    cache: 'no-store',
    next: { revalidate: 0 },
  } as RequestInit & { next: { revalidate: 0 } })
}

// Service-role client — bypasses RLS for server-side writes
function db() {
  return createAdminClient(noStoreFetch)
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!

type InlineKeyboardButton = { text: string; callback_data: string }
type InlineKeyboardMarkup = { inline_keyboard: InlineKeyboardButton[][] }
type ChecklistOverrideEntry = { date_status?: string; activity_status?: string }
type ChecklistOverrides = Record<string, Record<string, ChecklistOverrideEntry>>

type PageView = 'status' | 'tasks' | 'risks' | 'kpis' | 'contacts' | 'merch'
type DsuCallbackPayload =
  | { kind: 'overview' }
  | { kind: 'chapter'; chapterId: string }

type TgMessage = {
  message_id: number
  text?: string
  chat: { id: number }
}

type TgCallbackQuery = {
  id: string
  data?: string
  message?: TgMessage
}

type TgUpdate = {
  message?: TgMessage
  edited_message?: TgMessage
  callback_query?: TgCallbackQuery
}

function normalizeBotError(err: unknown): string {
  const message = err instanceof Error ? err.message : 'Unexpected error'
  if (/row-level security policy/i.test(message) && /chapter[-_]tasks/i.test(message)) {
    return `${message}\n\nCheck server env: SUPABASE_SERVICE_ROLE_KEY must be set to the service_role key (not anon).`
  }
  return message
}

const PAGE_SIZE = 5

async function send(chatId: number, text: string, replyMarkup?: InlineKeyboardMarkup) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  })
}

async function editMessage(chatId: number, messageId: number, text: string, replyMarkup?: InlineKeyboardMarkup) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  })
}

async function answerCallbackQuery(callbackQueryId: string) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId }),
  })
}

function encodeFilter(filter?: string) {
  if (!filter) return '-'
  return filter.toLowerCase().slice(0, 20).replace(/[|]/g, '') || '-'
}

function decodeFilter(filter: string) {
  return filter === '-' ? '' : filter
}

function callbackPayload(view: PageView, page: number, filter?: string) {
  return `pg|${view}|${encodeFilter(filter)}|${page}`
}

function dsuOverviewCallbackPayload() {
  return 'dsu|overview'
}

function dsuChapterCallbackPayload(chapterId: string) {
  return `dsu|chapter|${chapterId.toLowerCase()}`
}

function formatDateIsoForDisplay(isoDate: string | null): string {
  if (!isoDate) return ''
  const date = new Date(`${isoDate}T00:00:00Z`)
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function chapterDateForDisplay(isoDate: string | null, dateText: string | null): string {
  const primary = formatDateIsoForDisplay(isoDate)
  const secondary = (dateText ?? '').trim()

  if (primary && secondary && secondary !== primary) {
    return `${primary} (${secondary})`
  }

  if (primary) return primary
  if (secondary) return secondary
  return 'TBD'
}

function parseChecklistOverrides(raw: string | null | undefined): ChecklistOverrides {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as ChecklistOverrides
  } catch {
    return {}
  }
}


function addBusinessDaysUtc(startUtc: Date, amount: number): Date {
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

function formatChecklistDateUtc(dateUtc: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dateUtc)
}

function autoChecklistDateForOverview(eventIso: string | null, tCode: string, fallback: string): string {
  if (!eventIso) return fallback

  const base = new Date(`${eventIso}T00:00:00Z`)
  const normalizedTCode = tCode.replace('☻', '').trim()
  const match = normalizedTCode.match(/T\s*([+-])\s*(\d+)/i)

  if (!match) {
    if (/^T\s*-\s*0$/i.test(normalizedTCode) || /^T\s*0$/i.test(normalizedTCode)) {
      return formatChecklistDateUtc(base)
    }
    return fallback
  }

  const sign = match[1] === '-' ? -1 : 1
  const days = Number(match[2])
  if (!Number.isFinite(days)) return fallback

  const computed = addBusinessDaysUtc(base, sign * days)
  return formatChecklistDateUtc(computed)
}

function defaultChecklistActivityStatus(templateStatus: string): string {
  const status = templateStatus.trim().toLowerCase()
  if (status === 'done' || status === 'executed') return 'done'
  if (status === 'in_progress') return 'in_progress'
  return 'pending'
}

function inferChecklistDateStatus(dateText: string, activityStatus: string): string {
  if (activityStatus === 'done') return ''

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

function parseCallbackPayload(data: string): { view: PageView; page: number; filter: string } | null {
  const parts = data.split('|')
  if (parts.length !== 4 || parts[0] !== 'pg') return null

  const view = parts[1] as PageView
  if (!['status', 'tasks', 'risks', 'kpis', 'contacts', 'merch'].includes(view)) return null

  const page = Number.parseInt(parts[3], 10)
  if (!Number.isFinite(page) || page < 0) return null

  return {
    view,
    page,
    filter: decodeFilter(parts[2]),
  }
}

function parseDsuCallbackPayload(data: string): DsuCallbackPayload | null {
  const parts = data.split('|')
  if (parts.length < 2 || parts[0] !== 'dsu') return null

  if (parts[1] === 'overview') {
    return { kind: 'overview' }
  }

  if (parts.length === 3 && parts[1] === 'chapter') {
    const chapterId = parts[2].trim().toLowerCase()
    if (!chapterId) return null
    return { kind: 'chapter', chapterId }
  }

  return null
}

function chapterShortcut(chapterId: string, chapterName: string): string {
  const known = CHAPTER_CODES[chapterId.toLowerCase()]
  if (known) return known
  const compact = chapterName
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 4)
  return compact || chapterId.slice(0, 3).toUpperCase()
}

function chapterStatusLabel(status: string): string {
  return status.replace(/_/g, ' ')
}

function chapterDateIsLocked(isoDate: string | null, dateText: string | null): boolean {
  if (isoDate) return true
  const normalized = (dateText ?? '').trim().toLowerCase()
  if (!normalized) return false
  if (normalized.includes('tbd') || normalized.includes('tbc')) return false
  return true
}

function operationalCheckLabel(isDone: boolean, label: string, pendingDetail?: string) {
  if (isDone) return `✅ ${label}: done`
  if (pendingDetail) return `⚠️ ${label}: pending (${pendingDetail})`
  return `⚠️ ${label}: pending`
}

function pagerMarkup(view: PageView, page: number, totalPages: number, filter?: string): InlineKeyboardMarkup | undefined {
  if (totalPages <= 1) return undefined

  const prevPage = Math.max(0, page - 1)
  const nextPage = Math.min(totalPages - 1, page + 1)

  return {
    inline_keyboard: [[
      { text: '⬅️ Prev', callback_data: callbackPayload(view, prevPage, filter) },
      { text: `${page + 1}/${totalPages}`, callback_data: callbackPayload(view, page, filter) },
      { text: 'Next ➡️', callback_data: callbackPayload(view, nextPage, filter) },
    ]],
  }
}

function paginateLines(lines: string[], page: number) {
  const totalPages = Math.max(1, Math.ceil(lines.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(page, 0), totalPages - 1)
  const start = safePage * PAGE_SIZE
  const end = start + PAGE_SIZE

  return {
    page: safePage,
    totalPages,
    lines: lines.slice(start, end),
  }
}

async function sendOrEdit(
  chatId: number,
  text: string,
  replyMarkup: InlineKeyboardMarkup | undefined,
  editTarget?: { messageId: number }
) {
  if (editTarget) {
    await editMessage(chatId, editTarget.messageId, text, replyMarkup)
    return
  }

  await send(chatId, text, replyMarkup)
}

function sortChaptersForDsu<T extends { status: string; date_iso: string | null }>(rows: T[]): T[] {
  const active = rows.filter(c => c.status !== 'completed' && c.status !== 'tbc' && c.status !== 'rescheduling')
  const tbc = rows.filter(c => c.status === 'tbc' || c.status === 'rescheduling')
  const done = rows.filter(c => c.status === 'completed')
  active.sort((a, b) => {
    if (a.date_iso && b.date_iso) return a.date_iso.localeCompare(b.date_iso)
    if (a.date_iso) return -1
    if (b.date_iso) return 1
    return 0
  })
  done.sort((a, b) => {
    if (a.date_iso && b.date_iso) return a.date_iso.localeCompare(b.date_iso)
    if (a.date_iso) return -1
    if (b.date_iso) return 1
    return 0
  })
  return [...active, ...tbc, ...done]
}

function buildDsuChaptersKeyboard(chapters: { id: string; name: string }[]): InlineKeyboardMarkup {
  const buttons = chapters.map(ch => ({
    text: chapterShortcut(ch.id, ch.name),
    callback_data: dsuChapterCallbackPayload(ch.id),
  }))

  const rows: InlineKeyboardButton[][] = []
  for (let i = 0; i < buttons.length; i += 3) {
    rows.push(buttons.slice(i, i + 3))
  }

  return { inline_keyboard: rows }
}

export async function buildDsuOverview() {
  const sb = db()
  const [{ data: chapters }, { data: tasks }, { data: kpis }, { data: checklistRow }, { data: risksData }] = await Promise.all([
    sb.from('chapters').select('id, name, number, status, progress_percent, date_iso, date_text, pax_actual').order('number'),
    sb.from('chapter_tasks').select('chapter_id, owner, description, status').neq('status', 'done'),
    sb.from('kpis').select('key, value'),
    sb.from('bot_settings').select('value').eq('key', 'chapter_checklist_overrides').maybeSingle(),
    sb.from('risks').select('code, title, severity, status, chapter_tag').eq('status', 'open').order('code'),
  ])

  const chapterRows = sortChaptersForDsu(chapters ?? [])
  const openTasks = tasks ?? []
  const allRisks = risksData ?? []
  const urgentTasks = openTasks.filter(t => t.status === 'urgent')
  const kpiMap = Object.fromEntries((kpis ?? []).map(k => [k.key, k.value]))
  const checklistOverrides = parseChecklistOverrides(checklistRow?.value)

  function readKpi(candidates: string[], fallback = '–') {
    for (const key of candidates) {
      const value = kpiMap[key]
      if (value != null && String(value).trim() !== '') return String(value)
    }
    return fallback
  }

  function weeksToGoLabel(isoDate: string | null, dateText: string) {
    const hasDate = Boolean(isoDate) || chapterDateIsLocked(isoDate, dateText)
    if (!hasDate || !isoDate) return 'date TBD'

    const now = new Date()
    const localNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
    const eventDate = new Date(`${isoDate}T00:00:00+08:00`)
    const diffMs = eventDate.getTime() - localNow.getTime()

    if (diffMs <= 0) {
    const daysPast = Math.ceil(-diffMs / (1000 * 60 * 60 * 24))
    return `${daysPast} ${daysPast === 1 ? "day" : "days"} ago`
  }

    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} to go`
  }

  const now = new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'Asia/Manila',
  })

  const statusIcon: Record<string, string> = {
    completed: '✅',
    rescheduling: '⚠️',
    in_progress: '🔄',
    pencil_booked: '📌',
    tbc: '🟣',
    activating: '🟡',
  }

  const chapterTaskMap = openTasks.reduce<Record<string, typeof openTasks>>((acc, task) => {
    const key = task.chapter_id.toLowerCase()
    if (!acc[key]) acc[key] = []
    acc[key].push(task)
    return acc
  }, {})

  const chapterProgress = chapterRows.length
    ? (await Promise.all(chapterRows
        .map(async ch => {
          const shortcut = chapterShortcut(ch.id, ch.name)
          const displayStatusKey = ch.status === 'tbc' && chapterDateIsLocked(ch.date_iso, ch.date_text)
            ? 'pencil_booked'
            : ch.status
          const status = chapterStatusLabel(displayStatusKey)
          const weeks = ` (${weeksToGoLabel(ch.date_iso, ch.date_text)})`
          const chapterTasks = chapterTaskMap[ch.id.toLowerCase()] ?? []
          const topTask = chapterTasks.find(t => t.status === 'urgent') ?? chapterTasks[0]

          const chapterId = ch.id.toLowerCase()
          const checklistTemplate = CHECKLIST_TEMPLATE[chapterId] ?? []
          const checklistOverrideMap = checklistOverrides[chapterId] ?? {}

          const templateDerived = checklistTemplate.map((item, index) => {
            const key = String(index)
            const override = checklistOverrideMap[key] ?? {}
            const activityStatus = (override.activity_status ?? defaultChecklistActivityStatus(item.status)).toLowerCase().trim()
            const computedDate = autoChecklistDateForOverview(ch.date_iso, item.tCode, item.date)
            const inferredDateStatus = inferChecklistDateStatus(computedDate, activityStatus)
            const dateStatus = (override.date_status ?? inferredDateStatus).toLowerCase().trim()
            return { task: item.task, date: computedDate, activity_status: activityStatus, date_status: dateStatus }
          })

          // Include override-only entries so manual updates are never ignored.
          const overrideOnly = Object.entries(checklistOverrideMap)
            .filter(([index]) => {
              const n = Number.parseInt(index, 10)
              return !Number.isFinite(n) || n < 0 || n >= checklistTemplate.length
            })
            .map(([, override]) => ({
              task: 'Manual checklist item',
              date: 'TBD',
              activity_status: (override.activity_status ?? 'pending').toLowerCase().trim(),
              date_status: (override.date_status ?? '').toLowerCase().trim(),
            }))

          const checklistEntries = [...templateDerived, ...overrideOnly]
          const checklistCounts = checklistEntries.reduce(
            (acc, entry) => {
              const status = entry.activity_status ?? 'pending'
              if (status === 'done') acc.done += 1
              else acc.pending += 1
              return acc
            },
            { done: 0, pending: 0 }
          )

          const checklistSummary = checklistEntries.length
            ? `done ${checklistCounts.done} · pending ${checklistCounts.pending}`
            : 'no checklist updates yet'

          const upcomingChecklistItems = checklistEntries
            .filter(entry => entry.date_status === 'upcoming' && entry.activity_status !== 'done')
            .sort((a, b) => {
              const ta = Date.parse(a.date)
              const tb = Date.parse(b.date)
              if (Number.isNaN(ta) && Number.isNaN(tb)) return 0
              if (Number.isNaN(ta)) return 1
              if (Number.isNaN(tb)) return -1
              return ta - tb
            })

          const upcomingChecklistSummary = upcomingChecklistItems.length
            ? `${upcomingChecklistItems[0].task} (${upcomingChecklistItems[0].date})`
            : 'none'

          // Overdue and confirm checklist entries for delay/confirmation indicators
          const overdueEntries = checklistEntries.filter(e => e.date_status === 'overdue' && e.activity_status !== 'done')
          const confirmEntries = checklistEntries.filter(e => e.date_status === 'confirm' && e.activity_status !== 'done')

          let topTaskSuffix = ''
          if (overdueEntries.length > 0) {
            let maxDaysLate = 0
            for (const entry of overdueEntries) {
              const parsed = Date.parse(entry.date)
              if (!Number.isNaN(parsed)) {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const daysLate = Math.ceil((today.getTime() - parsed) / (1000 * 60 * 60 * 24))
                if (daysLate > maxDaysLate) maxDaysLate = daysLate
              }
            }
            if (maxDaysLate > 0) topTaskSuffix = ` — behind by ${maxDaysLate} day${maxDaysLate === 1 ? '' : 's'}`
          } else if (confirmEntries.length > 0) {
            topTaskSuffix = ' — pending confirmation'
          }

          // Next 2 notable checklist items (overdue first, then confirm, then remaining upcoming/pending)
          const firstUpcoming = upcomingChecklistItems[0]
          const extraItems = [
            ...overdueEntries,
            ...confirmEntries,
            ...upcomingChecklistItems.slice(1),
            ...checklistEntries.filter(e => e.date_status === 'pending' && e.activity_status !== 'done'),
          ].filter(e => e !== firstUpcoming).filter((e, i, arr) => arr.findIndex(x => x.task === e.task) === i).slice(0, 2)

          const extraItemLines = extraItems.map(e => {
            const dateTag = e.date && e.date !== 'TBD' ? ` (${e.date})` : ''
            const flag = e.date_status === 'overdue' ? ' ⚠️' : e.date_status === 'confirm' ? ' ⏳' : ''
            return `• ${e.task}${dateTag}${flag}`
          })

          // Chapter-specific risks
          const chId = ch.id.toLowerCase()
          const chName = ch.name.toLowerCase()
          const chapterRisks = allRisks.filter(r => {
            const tag = (r.chapter_tag ?? '').toLowerCase()
            return tag.includes(chId) || tag.includes(chName)
          })
          const statusSummary = await generateChapterStatusSummary({
            chapterName: ch.name,
            status: chapterStatusLabel(ch.status),
            progressPercent: ch.progress_percent,
            overdueItems: overdueEntries.map(e => ({ task: e.task, date: e.date })),
            risks: chapterRisks.map(r => ({ title: r.title, severity: r.severity })),
            checklistDone: checklistCounts.done,
            checklistPending: checklistCounts.pending,
            topTask: topTask ? `${topTask.owner}: ${topTask.description}` : null,
            daysLate: (() => {
              let max = 0
              for (const e of overdueEntries) {
                const p = Date.parse(e.date)
                if (!Number.isNaN(p)) {
                  const d = Math.ceil((Date.now() - p) / 86400000)
                  if (d > max) max = d
                }
              }
              return max
            })(),
          })

          const bullets = [
            `• Upcoming Checklist Tasks: ${upcomingChecklistSummary}`,
            topTask
              ? `• Top Task: ${topTask.owner}: ${topTask.description}${topTaskSuffix}`
              : '• Top Task: none open',
            ...extraItemLines,
            `• Checklist Progress: ${checklistSummary}`,
            `• Status: ${statusSummary}`,
          ].join('\n')

          const displayedProgress = ch.progress_percent === 100 && chapterTasks.length > 0 ? 90 : ch.progress_percent
          return `${statusIcon[displayStatusKey] ?? '•'} <b>${shortcut}</b> ${displayedProgress}% · ${status}${weeks}\n${bullets}`
        })
      )).join('\n\n')
    : 'No chapters found.'

  const urgentBlock = urgentTasks.length
    ? urgentTasks
        .slice(0, 6)
        .map(t => {
          const chapter = chapterRows.find(ch => ch.id.toLowerCase() === t.chapter_id.toLowerCase())
          const chapterCode = chapter ? chapterShortcut(chapter.id, chapter.name) : t.chapter_id.toUpperCase()
          return `🔴 <b>${chapterCode}</b> · <b>${t.owner}</b>: ${t.description}`
        })
        .join('\n')
    : 'None'

  const nextSteps = openTasks
    .slice()
    .sort((a, b) => {
      const aw = a.status === 'urgent' ? 0 : 1
      const bw = b.status === 'urgent' ? 0 : 1
      return aw - bw
    })
    .slice(0, 3)
    .map(t => {
      const chapter = chapterRows.find(ch => ch.id.toLowerCase() === t.chapter_id.toLowerCase())
      const chapterCode = chapter ? chapterShortcut(chapter.id, chapter.name) : t.chapter_id.toUpperCase()
      return `${chapterCode} · ${t.owner}: ${t.description}`
    })

  const nextStepsBlock = nextSteps.length ? nextSteps.join('\n') : 'No open tasks.'

  const attendeesFromChapters = chapterRows.reduce((sum, ch) => sum + (Number.isFinite(ch.pax_actual) ? Number(ch.pax_actual) : 0), 0)

  const text = `<b>Sui Build Beyond Weekly Report Recap</b>
<i>${now}</i>
━━━━━━━━━━━━━━━━━━━━

<b>📊 KPI Snapshot</b>
• 5 Committed Code Camps: <b>${readKpi(['code_camps'])}</b>
• Dev Events or Secondary Code Camp Slots : <b>${readKpi(['dev_events', 'dev_events_secondary_slots', 'dev_events_slots'])}</b>
• Total Attendees: <b>${readKpi(['total_attendees', 'attendees_total'], attendeesFromChapters > 0 ? String(attendeesFromChapters) : '–')}</b>
• Completion Form Submissions: <b>${readKpi(['form_submissions'])}</b>
• Mentors Trained and Deployed: <b>${readKpi(['trained_mentors'])}</b>
• Students Trained and Deployed: <b>${readKpi(['trained_students', 'students_trained', 'students_trained_deployed'])}</b>
• Verified Vercel and Mainnet Deployments: <b>${readKpi(['confirmed_deployments', 'verified_deployments'])}</b>
• Completion Rate: <b>${readKpi(['completion_rate'])}</b>
• Labs Installed and Activated: <b>${readKpi(['computer_labs', 'labs_installed'])}</b>

<b>🏕 Chapter Progress</b>
${chapterProgress}

<b>✅ Urgent Tasks</b> (${urgentTasks.length} urgent · ${openTasks.length} total open)
${urgentBlock}

<b>KEY NEXT STEPS FOR HQ & COHORT 4:</b>
${nextStepsBlock}

<i>Tap a chapter shortcut below for detailed chapter status.</i>
<b>🌐 Full Dashboard:</b>
<a href="https://codecampbot-dashboard-v2.vercel.app/">Dashboard</a>`

  const keyboard = buildDsuChaptersKeyboard(chapterRows)
  return { text, keyboard }
}

async function buildChapterDetailStatus(chapterId: string) {
  const sb = db()
  const [{ data: chapter }, { data: openTasks }, { data: risks }] = await Promise.all([
    sb.from('chapters').select('id, number, name, status, progress_percent, date_iso, date_text, venue, lead_name').eq('id', chapterId).single(),
    sb.from('chapter_tasks').select('short_id, owner, description, status').eq('chapter_id', chapterId).neq('status', 'done').order('status', { ascending: false }),
    sb.from('risks').select('code, title, severity, status, chapter_tag').eq('status', 'open').order('code'),
  ])

  if (!chapter) {
    return {
      text: `Chapter <code>${chapterId}</code> not found.`,
      keyboard: {
        inline_keyboard: [[{ text: '⬅️ DSU Overview', callback_data: dsuOverviewCallbackPayload() }]],
      } as InlineKeyboardMarkup,
    }
  }

  const pendingTasks = openTasks ?? []
  const chapterRisks = (risks ?? []).filter(r => {
    const tag = (r.chapter_tag ?? '').toLowerCase()
    return tag.includes(chapter.id.toLowerCase()) || tag.includes(chapter.name.toLowerCase())
  })

  const dateLabel = chapterDateForDisplay(chapter.date_iso, chapter.date_text)
  const isDateLocked = chapterDateIsLocked(chapter.date_iso, chapter.date_text)
  const statusLabel = chapterStatusLabel(chapter.status)

  const installationTask = pendingTasks.find(t => /(install|lab)/i.test(t.description))
  const trainingTask = pendingTasks.find(t => /(train|dry run|mentor)/i.test(t.description))

  const installationDone = chapter.status === 'completed' || !installationTask
  const trainingDone = chapter.status === 'completed' || !trainingTask

  const checksBlock = [
    operationalCheckLabel(isDateLocked, 'Date Lock', isDateLocked ? undefined : 'event date still TBD'),
    operationalCheckLabel(installationDone, 'Installation', installationTask?.description),
    operationalCheckLabel(trainingDone, 'Training/Dry Run', trainingTask?.description),
  ].join('\n')

  const taskLines = pendingTasks.length
    ? pendingTasks
        .slice(0, 6)
        .map(t => {
          const icon = t.status === 'urgent' ? '🔴' : '🟡'
          const label = t.short_id ?? 'task'
          return `${icon} <code>${label}</code> · <b>${t.owner}</b>: ${t.description} <i>(${t.status})</i>`
        })
        .join('\n')
    : '✅ No open tasks'

  const sevIcon: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' }
  const riskLines = chapterRisks.length
    ? chapterRisks
        .slice(0, 4)
        .map(r => `${sevIcon[r.severity] ?? '•'} <b>${r.code}</b>: ${r.title}`)
        .join('\n')
    : '✅ No open risks'

  const shortcut = chapterShortcut(chapter.id, chapter.name)
  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [{ text: '⬅️ DSU Overview', callback_data: dsuOverviewCallbackPayload() }],
    ],
  }

  const text = `<b>🏕 ${shortcut} · Ch${chapter.number} ${chapter.name}</b>
Status: <b>${statusLabel}</b> · Progress: <b>${chapter.progress_percent}%</b>
Date: <b>${dateLabel}</b>
Venue: ${chapter.venue || 'TBD'}
Lead: ${chapter.lead_name || 'TBD'}

<b>Operational Checks</b>
${checksBlock}

<b>Open Tasks</b> (${pendingTasks.length})
${taskLines}

<b>Open Risks</b> (${chapterRisks.length})
${riskLines}`

  return { text, keyboard }
}

// ─── Entry point ────────────────────────────────────────────────────────────

export async function handleUpdate(update: unknown) {
  const tgUpdate = (update ?? {}) as TgUpdate
  const cb = tgUpdate.callback_query
  if (cb?.data && cb?.id && cb?.message?.chat?.id && cb?.message?.message_id) {
    await handleCallbackQuery(cb)
    return
  }

  const msg = tgUpdate.message ?? tgUpdate.edited_message
  if (!msg?.text) return

  const chatId: number = msg.chat.id
  const raw: string = msg.text.trim()

  // Parse /command[@BotUsername] rest
  const m = raw.match(/^\/([a-z_]+)(?:@\S+)?(?:\s+([\s\S]*))?$/i)
  if (!m) return

  const cmd = m[1].toLowerCase()
  const rest = (m[2] ?? '').trim()

  try {
    switch (cmd) {
      case 'start':
      case 'help':      return await cmdHelp(chatId)
      case 'status':    return await cmdStatus(chatId)
      case 'tasks':     return await cmdTasks(chatId, rest)
      case 'risks':     return await cmdRisks(chatId, rest)
      case 'chapter':   return await cmdChapter(chatId, rest)
      case 'kpis':      return await cmdKpis(chatId)
      case 'addtask':      return await cmdAddTask(chatId, rest)
      case 'done':         return await cmdDoneTask(chatId, rest)
      case 'urgent':       return await cmdUrgentTask(chatId, rest)
      case 'pendingtask':  return await cmdPendingTask(chatId, rest)
      case 'deletetask':   return await cmdDeleteTask(chatId, rest)
      case 'addrisk':      return await cmdAddRisk(chatId, rest)
      case 'resolve':      return await cmdResolveRisk(chatId, rest)
      case 'deleterisk':   return await cmdDeleteRisk(chatId, rest)
      case 'severity':
      case 'setriskseverity':
        return await cmdSetSeverity(chatId, rest)
      case 'setriskowner':
      case 'addownerrisk': return await cmdSetRiskOwner(chatId, rest)
      case 'setkpi':       return await cmdSetKpi(chatId, rest)
      case 'setchapter':   return await cmdSetChapter(chatId, rest)
      case 'setcheck':     return await cmdSetChecklistActivity(chatId, rest)
      case 'contacts':     return await cmdContacts(chatId, rest)
      case 'addcontact':   return await cmdAddContact(chatId, rest)
      case 'deletecontact':return await cmdDeleteContact(chatId, rest)
      case 'merch':        return await cmdMerch(chatId, rest)
      case 'setmerch':     return await cmdSetMerch(chatId, rest)
      case 'links':        return await cmdLinks(chatId, rest)
      case 'addlink':      return await cmdAddLink(chatId, rest)
      case 'editlink':     return await cmdEditLink(chatId, rest)
      default:             return await send(chatId, 'Unknown command. Use /help.')
    }
  } catch (err) {
    console.error('[TelegramBot]', err)
    await send(chatId, `⚠️ ${normalizeBotError(err)}`)
  }
}

async function handleCallbackQuery(cb: TgCallbackQuery) {
  if (!cb.data || !cb.message) {
    await answerCallbackQuery(cb.id)
    return
  }

  const chatId: number = cb.message.chat.id
  const messageId: number = cb.message.message_id

  try {
    const dsuPayload = parseDsuCallbackPayload(cb.data)
    if (dsuPayload) {
      if (dsuPayload.kind === 'overview') {
        const overview = await buildDsuOverview()
        await sendOrEdit(chatId, overview.text, overview.keyboard, { messageId })
      } else {
        const detail = await buildChapterDetailStatus(dsuPayload.chapterId)
        await sendOrEdit(chatId, detail.text, detail.keyboard, { messageId })
      }
      return
    }

    const payload = parseCallbackPayload(cb.data)
    if (!payload) return

    switch (payload.view) {
      case 'status':
        await cmdStatusDashboard(chatId, payload.page, { messageId })
        break
      case 'tasks':
        await cmdTasks(chatId, payload.filter, payload.page, { messageId })
        break
      case 'risks':
        await cmdRisks(chatId, payload.filter, payload.page, { messageId })
        break
      case 'kpis':
        await cmdKpis(chatId, payload.page, { messageId })
        break
      case 'contacts':
        await cmdContacts(chatId, payload.filter, payload.page, { messageId })
        break
      case 'merch':
        await cmdMerch(chatId, payload.filter, payload.page, { messageId })
        break
      default:
        break
    }
  } catch (err) {
    console.error('[TelegramBot] callback error:', err)
    try { await send(chatId, `⚠️ ${normalizeBotError(err)}`) } catch {}
  } finally {
    await answerCallbackQuery(cb.id)
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Find a task by short_id (case-insensitive), e.g. "MNL-t1" or "mnl-t1". */
async function findTaskByShortId(
  rows: { id: string; short_id: string | null; owner: string; description: string }[],
  input: string
): Promise<{ result: typeof rows[number] } | { error: string }> {
  const needle = input.toUpperCase()
  const matches = rows.filter(r => r.short_id?.toUpperCase() === needle)
  if (matches.length === 1) return { result: matches[0] }

  // Fall back to UUID prefix for backwards compatibility
  const uuidMatches = rows.filter(r => r.id.startsWith(input.toLowerCase()))
  if (uuidMatches.length === 1) return { result: uuidMatches[0] }
  if (uuidMatches.length > 1) {
    const list = uuidMatches.map(r => `<code>${r.short_id ?? r.id.slice(0, 8)}</code>`).join(', ')
    return { error: `Multiple matches: ${list} — be more specific` }
  }

  return { error: `No task found for <code>${input}</code>.\nUse /tasks to see IDs (e.g. <code>MNL-t1</code>)` }
}

/** Find a risk by code (case-insensitive), e.g. "R1" or "r1". */
async function findRiskByCode(
  rows: { id: string; code: string; title: string }[],
  input: string
): Promise<{ result: typeof rows[number] } | { error: string }> {
  const needle = input.toUpperCase()
  const match = rows.find(r => r.code.toUpperCase() === needle)
  if (match) return { result: match }

  // Fall back to UUID prefix
  const uuidMatches = rows.filter(r => r.id.startsWith(input.toLowerCase()))
  if (uuidMatches.length === 1) return { result: uuidMatches[0] }
  if (uuidMatches.length > 1) {
    const list = uuidMatches.map(r => `<code>${r.code}</code>`).join(', ')
    return { error: `Multiple matches: ${list} — be more specific` }
  }

  return { error: `No risk found for <code>${input}</code>.\nUse /risks to see codes (e.g. <code>R1</code>)` }
}

/** Find a contact or merch item by UUID prefix (case-insensitive). */
async function findByPrefix<T extends { id: string }>(
  rows: T[],
  prefix: string
): Promise<{ result: T } | { error: string }> {
  const matches = rows.filter(r => r.id.startsWith(prefix.toLowerCase()))
  if (matches.length === 0) return { error: `No match for ID <code>${prefix}</code>` }
  if (matches.length > 1) {
    const list = matches.map(r => `<code>${r.id.slice(0, 8)}</code>`).join(', ')
    return { error: `Multiple matches: ${list} — use more characters` }
  }
  return { result: matches[0] }
}

// ─── /help ──────────────────────────────────────────────────────────────────

async function cmdHelp(chatId: number) {
  await send(chatId, `<b>📋 DEVCON × Sui Tracker Bot</b>

<b>📊 View</b>
/status — today's DSU
/tasks [chapter?] — open tasks
/risks [high|med|low?] — risk register
/chapter [chapter] — chapter detail
/kpis — KPI values
/contacts [team?] — team contacts
/merch [jcr|lazada|shopee?] — merch items
/links [category?] — resource links

<b>✅ Tasks</b>  <i>(IDs like MNL-t1, TCL-t2)</i>
/addtask [chapter] [owner] [desc]
/done [id] · /urgent [id] · /pendingtask [id]
/deletetask [id] — remove task

<b>⚠️ Risks</b>  <i>(IDs like R1, R2)</i>
/addrisk [severity] [chapter] [title] | [description]
/resolve [code] — mark resolved
/setriskseverity [code] [high|medium|low]
/setriskowner [code] [owner]
/deleterisk [code] — remove risk

<b>📈 KPIs</b>
/setkpi [key] [value]
  <i>e.g.</i> <code>/setkpi code_camps 2</code>

<b>🏕 Chapters</b>
/setchapter [chapter] status [value]
/setchapter [chapter] venue [text]
/setchapter [chapter] lead [name]
/setchapter [chapter] pax [number]
/setchapter [chapter] pax_target [number|clear]
/setchapter [chapter] merch [not_sent|pending|received|in_transit|other &lt;text&gt;]
/setchapter [chapter] progress [0-100]
/setchapter [chapter] date [YYYY-MM-DD|clear]
/setchapter [chapter] display_date [text|clear]
/setcheck [chapter] [item-index] [done|pending|in_progress]
  <i>e.g.</i> <code>/setchapter manila status completed</code>

<b>👥 Contacts</b>
/addcontact [team] [name] | [role] | [handle]
  teams: <code>sui_foundation</code> · <code>chapter_lead</code> · <code>content_team</code>
/deletecontact [id]

<b>📦 Merch</b>
/setmerch [id] [received|confirmed|confirm|pending]

<b>🔗 Resource Links</b>
/links [category?] — list links
/addlink [category] [name] | [url] | [description?]
/editlink [id] [field] [value] — edit name · url · description · category

Categories: <code>Drive</code> · <code>Sheets</code> · <code>Docs</code> · <code>Slides</code> · <code>Forms</code> · <code>Figma</code> · <code>Notion</code> · <code>GitHub</code> · <code>Loom</code> · <code>Slack</code> · <code>Zoom</code> · <code>Finance</code> · <code>Design</code> · <code>Merch</code> · <code>Events</code> · <code>Contacts</code> · <code>General</code>
<i>Icon &amp; colour are set automatically from category.</i>

<i>Task IDs: MNL-t1, TCL-t2 etc. Risk codes: R1, R2 etc. Contact/merch/link: first 6 chars of UUID.</i>`)
}

// ─── /status ────────────────────────────────────────────────────────────────

async function cmdStatus(chatId: number) {
  const overview = await buildDsuOverview()
  await send(chatId, overview.text, overview.keyboard)
}

// Legacy compact dashboard renderer retained for callback paging compatibility.
// ─── internal status dashboard ───────────────────────────────────────────────

async function cmdStatusDashboard(chatId: number, page = 0, editTarget?: { messageId: number }) {
  const sb = db()
  const [{ data: chapters }, { data: tasks }, { data: risks }, { data: kpis }] = await Promise.all([
    sb.from('chapters').select('name, number, status, progress_percent').order('number'),
    sb.from('chapter_tasks').select('status'),
    sb.from('risks').select('severity, status'),
    sb.from('kpis').select('key, value').in('key', ['code_camps', 'form_submissions', 'completion_rate']),
  ])

  const openTasks   = tasks?.filter(t => t.status !== 'done').length ?? 0
  const urgentTasks = tasks?.filter(t => t.status === 'urgent').length ?? 0
  const openRisks   = risks?.filter(r => r.status === 'open').length ?? 0
  const highRisks   = risks?.filter(r => r.status === 'open' && r.severity === 'high').length ?? 0
  const kpiMap      = Object.fromEntries((kpis ?? []).map(k => [k.key, k.value]))

  const statusIcon: Record<string, string> = {
    completed: '✅', rescheduling: '⚠️', in_progress: '🔄',
    pencil_booked: '📌', tbc: '🟣', activating: '🟡',
  }

  const chapterLines = (chapters ?? [])
    .map(c => `${statusIcon[c.status] ?? '•'} Ch${c.number} <b>${c.name}</b> — ${c.progress_percent}%`)
  const paged = paginateLines(chapterLines, page)
  const chapterBlock = paged.lines.join('\n')
  const keyboard = pagerMarkup('status', paged.page, paged.totalPages)

  await sendOrEdit(chatId, `<b>🏕 Sui × DEVCON · Live Status</b>

<b>KPIs</b>
• Code Camps: <code>${kpiMap['code_camps'] ?? '–'}</code>
• Form Submissions: <code>${kpiMap['form_submissions'] ?? '–'}</code>
• Completion Rate: <code>${kpiMap['completion_rate'] ?? '–'}</code>

<b>Tasks</b>  Open: <b>${openTasks}</b>${urgentTasks > 0 ? `   🔴 Urgent: <b>${urgentTasks}</b>` : ''}
<b>Risks</b>  Open: <b>${openRisks}</b>${highRisks > 0 ? `   🔴 High: <b>${highRisks}</b>` : ''}

<b>Chapters</b> ${paged.totalPages > 1 ? `(Page ${paged.page + 1}/${paged.totalPages})` : ''}
${chapterBlock || 'No chapters found.'}`,
  keyboard,
  editTarget)
}

// ─── /tasks ─────────────────────────────────────────────────────────────────

async function cmdTasks(chatId: number, filter: string, page = 0, editTarget?: { messageId: number }) {
  const sb = db()
  let query = sb
    .from('chapter_tasks')
    .select('id, short_id, chapter_id, owner, description, status')
    .neq('status', 'done')

  if (filter) query = query.eq('chapter_id', filter.toLowerCase())

  const { data: tasks } = await query.order('status', { ascending: false })

  if (!tasks?.length) {
    await send(chatId, filter ? `No open tasks for <b>${filter}</b>.` : '✅ No open tasks!')
    return
  }

  const lines = tasks.map(t => {
    const icon  = t.status === 'urgent' ? '🔴' : '🟡'
    const label = t.short_id ?? t.id.slice(0, 8)
    return `${icon} <b>${t.owner}</b>: ${t.description}\n   <code>${label}</code> · ${t.chapter_id}`
  })

  const paged = paginateLines(lines, page)
  const keyboard = pagerMarkup('tasks', paged.page, paged.totalPages, filter)

  await sendOrEdit(
    chatId,
    `<b>📋 Open Tasks${filter ? ` · ${filter}` : ''}</b> (${tasks.length}) ${paged.totalPages > 1 ? `· Page ${paged.page + 1}/${paged.totalPages}` : ''}\n\n${paged.lines.join('\n\n')}`,
    keyboard,
    editTarget
  )
}

// ─── /risks ─────────────────────────────────────────────────────────────────

async function cmdRisks(chatId: number, filter: string, page = 0, editTarget?: { messageId: number }) {
  const sb = db()
  let query = sb
    .from('risks')
    .select('id, code, title, owner, chapter_tag, severity, status')
    .eq('status', 'open')
    .order('code')

  const sev = filter.toLowerCase()
  if (['high', 'medium', 'low'].includes(sev)) query = query.eq('severity', sev)

  const { data: risks } = await query

  if (!risks?.length) {
    await send(chatId, '✅ No open risks!')
    return
  }

  const sevIcon: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' }
  const lines = risks.map(r =>
    `${sevIcon[r.severity]} <b>${r.code}: ${r.title}</b>\n   ${r.chapter_tag} · ${r.owner}`
  )

  const paged = paginateLines(lines, page)
  const keyboard = pagerMarkup('risks', paged.page, paged.totalPages, sev)

  await sendOrEdit(
    chatId,
    `<b>⚠️ Open Risks${filter ? ` · ${filter}` : ''}</b> (${risks.length}) ${paged.totalPages > 1 ? `· Page ${paged.page + 1}/${paged.totalPages}` : ''}\n\n${paged.lines.join('\n\n')}`,
    keyboard,
    editTarget
  )
}

// ─── /chapter ───────────────────────────────────────────────────────────────

async function cmdChapter(chatId: number, id: string) {
  if (!id) {
    await send(chatId, 'Usage: /chapter [chapter]\nValid chapters: manila · tacloban · iloilo · bukidnon · pampanga · laguna')
    return
  }

  const sb = db()
  const [{ data: chapter }, { data: tasks }] = await Promise.all([
    sb.from('chapters').select('*').eq('id', id.toLowerCase()).single(),
    sb.from('chapter_tasks').select('id, short_id, owner, description, status')
      .eq('chapter_id', id.toLowerCase())
      .neq('status', 'done'),
  ])

  if (!chapter) {
    await send(chatId, `Chapter <code>${id}</code> not found.`)
    return
  }

  const dateDisplay = chapterDateForDisplay(chapter.date_iso, chapter.date_text)

  const taskLines = tasks?.length
    ? tasks.map(t => {
        const label = t.short_id ?? t.id.slice(0, 8)
        return `  ${t.status === 'urgent' ? '🔴' : '→'} <b>${t.owner}</b>: ${t.description}\n     <code>${label}</code>`
      }).join('\n')
    : '  ✅ No open tasks'

  await send(chatId, `<b>Chapter ${chapter.number}: ${chapter.name}</b>
Status: ${chapter.status.replace(/_/g, ' ')}
Date: ${dateDisplay}
Venue: ${chapter.venue}
Lead: ${chapter.lead_name}
Progress: ${chapter.progress_percent}%
Merch: ${chapter.merch_status}

<b>Open Tasks:</b>
${taskLines}`)
}

// ─── /kpis ──────────────────────────────────────────────────────────────────

async function cmdKpis(chatId: number, page = 0, editTarget?: { messageId: number }) {
  const { data: kpis } = await db().from('kpis').select('key, label, value, sublabel')

  if (!kpis?.length) { await send(chatId, 'No KPIs found.'); return }

  const lines = kpis.map(k => `• <b>${k.label}</b>: <code>${k.value}</code>\n  <i>${k.sublabel}</i>`)
  const paged = paginateLines(lines, page)
  const keyboard = pagerMarkup('kpis', paged.page, paged.totalPages)

  await sendOrEdit(
    chatId,
    `<b>📊 KPIs</b> ${paged.totalPages > 1 ? `· Page ${paged.page + 1}/${paged.totalPages}` : ''}\n\n${paged.lines.join('\n\n')}`,
    keyboard,
    editTarget
  )
}

// ─── /addtask ───────────────────────────────────────────────────────────────

const CHAPTER_CODES: Record<string, string> = {
  manila: 'MNL', tacloban: 'TCL', iloilo: 'ILO',
  bukidnon: 'BKD', pampanga: 'PMP', laguna: 'LGN',
}

async function generateShortId(sb: ReturnType<typeof db>, chapter_id: string): Promise<string> {
  const code = CHAPTER_CODES[chapter_id.toLowerCase()] ?? chapter_id.slice(0, 3).toUpperCase()
  const { count } = await sb
    .from('chapter_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('chapter_id', chapter_id.toLowerCase())
  return `${code}-t${(count ?? 0) + 1}`
}

async function cmdAddTask(chatId: number, args: string) {
  const parts = args.split(/\s+/)
  if (parts.length < 3) {
    await send(chatId, `Usage: /addtask [chapter] [owner] [description]\n<i>e.g.</i> <code>/addtask bukidnon Zhi Confirm lab setup date</code>`)
    return
  }

  const [chapter_id_raw, owner, ...rest] = parts
  const chapter_id  = chapter_id_raw.toLowerCase()
  const description = rest.join(' ')
  const sb = db()

  const { data: chapter } = await sb.from('chapters').select('id, name').eq('id', chapter_id).single()
  if (!chapter) {
    await send(chatId, `Chapter <code>${chapter_id}</code> not found.\nValid chapters: manila · tacloban · iloilo · bukidnon · pampanga · laguna`)
    return
  }

  const short_id = await generateShortId(sb, chapter_id)
  const { data: task, error } = await sb
    .from('chapter_tasks')
    .insert({ chapter_id, owner, description, status: 'pending', short_id })
    .select('id, short_id')
    .single()

  if (error) { await send(chatId, `❌ ${error.message}`); return }

  await send(chatId, `✅ Task added to <b>${chapter.name}</b>\n<b>${owner}</b>: ${description}\nID: <code>${task.short_id ?? task.id.slice(0, 8)}</code>`)
}

// ─── /done ──────────────────────────────────────────────────────────────────

async function cmdDoneTask(chatId: number, prefix: string) {
  if (!prefix) { await send(chatId, 'Usage: /done [task-id]  e.g. <code>MNL-t1</code>'); return }

  const sb = db()
  const { data: all } = await sb.from('chapter_tasks').select('id, short_id, owner, description, chapter_id')
  const found = await findTaskByShortId(all ?? [], prefix)

  if ('error' in found) { await send(chatId, found.error); return }

  await sb.from('chapter_tasks').update({ status: 'done' }).eq('id', found.result.id)
  await send(chatId, `✅ Done: <b>${found.result.owner}</b>: ${found.result.description}`)
}

// ─── /urgent ────────────────────────────────────────────────────────────────

async function cmdUrgentTask(chatId: number, prefix: string) {
  if (!prefix) { await send(chatId, 'Usage: /urgent [task-id]  e.g. <code>MNL-t1</code>'); return }

  const sb = db()
  const { data: all } = await sb.from('chapter_tasks').select('id, short_id, owner, description, chapter_id')
  const found = await findTaskByShortId(all ?? [], prefix)

  if ('error' in found) { await send(chatId, found.error); return }

  await sb.from('chapter_tasks').update({ status: 'urgent' }).eq('id', found.result.id)
  await send(chatId, `🔴 Urgent: <b>${found.result.owner}</b>: ${found.result.description}`)
}

// ─── /addrisk ───────────────────────────────────────────────────────────────

async function cmdAddRisk(chatId: number, args: string) {
  // Format: [severity] [chapter_tag] [title] | [description]
  const [titlePart, descPart] = args.split('|').map(s => s.trim())
  const parts = titlePart.split(/\s+/)

  if (parts.length < 3) {
    await send(chatId, `Usage: /addrisk [severity] [chapter] [title] | [description]\n<i>e.g.</i>\n<code>/addrisk high Bukidnon BSU lab not confirmed | Formal confirmation from BSU still needed</code>\n\nSeverity: <code>high</code> · <code>medium</code> · <code>low</code>`)
    return
  }

  const [severity, chapter_tag, ...titleParts] = parts

  if (!['high', 'medium', 'low'].includes(severity.toLowerCase())) {
    await send(chatId, `Severity must be <code>high</code>, <code>medium</code>, or <code>low</code>.`)
    return
  }

  const sb = db()
  const { count } = await sb.from('risks').select('id', { count: 'exact', head: true })
  const code = `R${(count ?? 0) + 1}`
  const title = titleParts.join(' ')

  const { data: risk, error } = await sb
    .from('risks')
    .insert({
      code,
      title,
      description: descPart ?? title,
      owner: 'TBD',
      chapter_tag,
      severity: severity.toLowerCase(),
      status: 'open',
    })
    .select('id, code, title')
    .single()

  if (error) { await send(chatId, `❌ ${error.message}`); return }

  const icon = severity.toLowerCase() === 'high' ? '🔴' : severity.toLowerCase() === 'medium' ? '🟡' : '🟢'
  await send(chatId, `${icon} Risk added: <b>${risk.code}: ${risk.title}</b>\nChapter: ${chapter_tag} · Severity: ${severity}\n\nTip: set owner with /setriskowner ${risk.code} [name]`)
}

// ─── /resolve ───────────────────────────────────────────────────────────────

async function cmdResolveRisk(chatId: number, prefix: string) {
  if (!prefix) { await send(chatId, 'Usage: /resolve [risk-code]  e.g. <code>R1</code>'); return }

  const sb = db()
  const { data: all } = await sb.from('risks').select('id, code, title')
  const found = await findRiskByCode(all ?? [], prefix)

  if ('error' in found) { await send(chatId, found.error); return }

  await sb.from('risks').update({ status: 'resolved' }).eq('id', found.result.id)
  await send(chatId, `✅ Resolved: <b>${found.result.code}: ${found.result.title}</b>`)
}

// ─── /pendingtask ───────────────────────────────────────────────────────────

async function cmdPendingTask(chatId: number, prefix: string) {
  if (!prefix) { await send(chatId, 'Usage: /pendingtask [task-id]  e.g. <code>MNL-t1</code>'); return }

  const sb = db()
  const { data: all } = await sb.from('chapter_tasks').select('id, short_id, owner, description')
  const found = await findTaskByShortId(all ?? [], prefix)

  if ('error' in found) { await send(chatId, found.error); return }

  await sb.from('chapter_tasks').update({ status: 'pending' }).eq('id', found.result.id)
  await send(chatId, `🔄 Reset to pending: <b>${found.result.owner}</b>: ${found.result.description}`)
}

// ─── /deletetask ─────────────────────────────────────────────────────────────

async function cmdDeleteTask(chatId: number, prefix: string) {
  if (!prefix) { await send(chatId, 'Usage: /deletetask [task-id]  e.g. <code>MNL-t1</code>'); return }

  const sb = db()
  const { data: all } = await sb.from('chapter_tasks').select('id, short_id, owner, description')
  const found = await findTaskByShortId(all ?? [], prefix)

  if ('error' in found) { await send(chatId, found.error); return }

  await sb.from('chapter_tasks').delete().eq('id', found.result.id)
  await send(chatId, `🗑 Deleted task: <b>${found.result.owner}</b>: ${found.result.description}`)
}

// ─── /deleterisk ─────────────────────────────────────────────────────────────

async function cmdDeleteRisk(chatId: number, prefix: string) {
  if (!prefix) { await send(chatId, 'Usage: /deleterisk [risk-code]  e.g. <code>R1</code>'); return }

  const sb = db()
  const { data: all } = await sb.from('risks').select('id, code, title')
  const found = await findRiskByCode(all ?? [], prefix)

  if ('error' in found) { await send(chatId, found.error); return }

  await sb.from('risks').delete().eq('id', found.result.id)
  await send(chatId, `🗑 Deleted risk: <b>${found.result.code}: ${found.result.title}</b>`)
}

// ─── /severity ───────────────────────────────────────────────────────────────

async function cmdSetSeverity(chatId: number, args: string) {
  const parts = args.split(/\s+/)
  if (parts.length < 2) {
    await send(chatId, 'Usage: /severity [risk-code] [high|medium|low]  e.g. <code>/severity R1 high</code>')
    return
  }

  const [prefix, sev] = parts
  if (!['high', 'medium', 'low'].includes(sev.toLowerCase())) {
    await send(chatId, 'Severity must be <code>high</code>, <code>medium</code>, or <code>low</code>.')
    return
  }

  const sb = db()
  const { data: all } = await sb.from('risks').select('id, code, title')
  const found = await findRiskByCode(all ?? [], prefix)

  if ('error' in found) { await send(chatId, found.error); return }

  await sb.from('risks').update({ severity: sev.toLowerCase() }).eq('id', found.result.id)
  const icon = sev === 'high' ? '🔴' : sev === 'medium' ? '🟡' : '🟢'
  await send(chatId, `${icon} Severity updated: <b>${found.result.code}: ${found.result.title}</b> → ${sev.toUpperCase()}`)
}

// ─── /setriskowner ──────────────────────────────────────────────────────────

async function cmdSetRiskOwner(chatId: number, args: string) {
  const spaceIdx = args.indexOf(' ')
  if (spaceIdx === -1) {
    await send(chatId, 'Usage: /setriskowner [risk-code] [owner name]  e.g. <code>/setriskowner R1 Dale</code>')
    return
  }

  const prefix = args.slice(0, spaceIdx).trim()
  const owner  = args.slice(spaceIdx + 1).trim()

  const sb = db()
  const { data: all } = await sb.from('risks').select('id, code, title')
  const found = await findRiskByCode(all ?? [], prefix)

  if ('error' in found) { await send(chatId, found.error); return }

  await sb.from('risks').update({ owner }).eq('id', found.result.id)
  await send(chatId, `✅ Owner updated: <b>${found.result.code}: ${found.result.title}</b>\nOwner → <b>${owner}</b>`)
}

// ─── /setkpi ────────────────────────────────────────────────────────────────

async function cmdSetKpi(chatId: number, args: string) {
  const spaceIdx = args.indexOf(' ')
  if (spaceIdx === -1) {
    await send(chatId, `Usage: /setkpi [key] [value]\n<i>e.g.</i> <code>/setkpi code_camps 2/5</code>\n\nKeys: <code>code_camps</code> · <code>dev_events</code> · <code>total_attendees</code> · <code>form_submissions</code> · <code>trained_mentors</code> · <code>students_trained</code> · <code>confirmed_deployments</code> · <code>completion_rate</code> · <code>computer_labs</code>`)
    return
  }

  const key   = args.slice(0, spaceIdx).trim()
  const value = args.slice(spaceIdx + 1).trim()
  const sb    = db()

  const { data: kpi, error } = await sb
    .from('kpis')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)
    .select('label, value')
    .single()

  if (error || !kpi) {
    await send(chatId, `❌ Key <code>${key}</code> not found.\nValid keys: code_camps · form_submissions · trained_mentors · confirmed_deployments · completion_rate · computer_labs`)
    return
  }

  await send(chatId, `✅ <b>${kpi.label}</b> updated → <code>${kpi.value}</code>`)
}

// ─── /setchapter ────────────────────────────────────────────────────────────

const VALID_CHAPTER_STATUSES = ['completed', 'rescheduling', 'in_progress', 'activating', 'pencil_booked', 'tbc']
const CHAPTER_MERCH_STATUS_PRESETS: Record<string, string> = {
  not_sent: 'not sent',
  'not sent': 'not sent',
  pending: 'pending',
  ready: 'pending',
  transit: 'in transit',
  in_transit: 'in transit',
  'in transit': 'in transit',
  sent: 'in transit',
  received: 'received',
  'received by chapter': 'received',
}

async function cmdSetChapter(chatId: number, args: string) {
  const parts = args.split(/\s+/)
  if (parts.length < 3) {
    await send(chatId, `Usage: /setchapter [chapter] [field] [value]

Fields:
  <code>status</code> — completed · rescheduling · in_progress · activating · pencil_booked · tbc
  <code>venue</code> — venue text
  <code>lead</code> — lead name
  <code>pax</code>    — actual attendance number
  <code>pax_target</code> — target attendance number (or clear)
  <code>merch</code> — not_sent · pending · in_transit · received · other [custom text]
  <code>progress</code> — 0–100
  <code>date</code> — YYYY-MM-DD or clear
  <code>display_date</code> — optional text label (or clear)

<i>e.g.</i> <code>/setchapter manila status completed</code>
<i>e.g.</i> <code>/setchapter manila venue Colegio de San Juan de Letran, Intramuros</code>
<i>e.g.</i> <code>/setchapter manila lead Lady Diane Casilang</code>
<i>e.g.</i> <code>/setchapter bukidnon pax 87</code>
<i>e.g.</i> <code>/setchapter iloilo pax_target 120</code>
<i>e.g.</i> <code>/setchapter bukidnon merch pending</code>
<i>e.g.</i> <code>/setchapter bukidnon merch in_transit</code>
<i>e.g.</i> <code>/setchapter bukidnon merch received</code>
<i>e.g.</i> <code>/setchapter bukidnon merch other Packed and ready for pickup</code>
<i>e.g.</i> <code>/setchapter iloilo progress 60</code>
<i>e.g.</i> <code>/setchapter manila date 2026-03-28</code>
<i>e.g.</i> <code>/setchapter iloilo display_date Apr 18 (Dev Event) + May 16</code>`)
    return
  }

  const [chapterId, field, ...rest] = parts
  const value = rest.join(' ')
  const sb = db()

  const { data: chapter } = await sb.from('chapters').select('id, name, number, date_iso, date_text').eq('id', chapterId.toLowerCase()).single()
  if (!chapter) {
    await send(chatId, `Chapter <code>${chapterId}</code> not found.\nValid chapters: manila · tacloban · iloilo · bukidnon · pampanga · laguna`)
    return
  }

  const update: Record<string, unknown> = {}
  switch (field.toLowerCase()) {
    case 'status':
      if (!VALID_CHAPTER_STATUSES.includes(value)) {
        await send(chatId, `Invalid status. Valid: ${VALID_CHAPTER_STATUSES.map(s => `<code>${s}</code>`).join(' · ')}`)
        return
      }
      update.status = value
      break
    case 'venue': {
      const text = value.trim()
      if (!text) { await send(chatId, 'Venue cannot be empty.'); return }
      update.venue = text
      break
    }
    case 'lead':
    case 'lead_name': {
      const text = value.trim()
      if (!text) { await send(chatId, 'Lead name cannot be empty.'); return }
      update.lead_name = text
      break
    }
    case 'pax':
    case 'pax_actual': {
      const n = parseInt(value)
      if (isNaN(n) || n < 0) { await send(chatId, 'Pax must be a non-negative number.'); return }
      update.pax_actual = n
      break
    }
    case 'target':
    case 'pax_target': {
      const text = value.trim().toLowerCase()
      if (text === 'clear' || text === 'none') {
        update.pax_target = null
      } else {
        const n = parseInt(value)
        if (isNaN(n) || n < 0) { await send(chatId, 'Pax target must be a non-negative number or <code>clear</code>.'); return }
        update.pax_target = n
      }
      break
    }
    case 'merch':
    case 'merch_status': {
      const text = value.trim()
      if (!text) {
        await send(chatId, 'Merch status cannot be empty. Use <code>not_sent</code>, <code>pending</code>, <code>in_transit</code>, <code>received</code>, or <code>other [custom text]</code>.')
        return
      }

      const lower = text.toLowerCase()
      if (lower === 'other') {
        await send(chatId, 'Please add custom text: <code>/setchapter [chapter] merch other [custom text]</code>')
        return
      }

      if (lower.startsWith('other ')) {
        const custom = text.slice(6).trim()
        if (!custom) {
          await send(chatId, 'Custom merch status cannot be empty.')
          return
        }
        update.merch_status = custom
        break
      }

      const mapped = CHAPTER_MERCH_STATUS_PRESETS[lower]
      if (mapped) {
        update.merch_status = mapped
        break
      }

      await send(chatId, 'Invalid merch status. Use <code>not_sent</code>, <code>pending</code>, <code>in_transit</code>, <code>received</code>, or <code>other [custom text]</code>.')
      return
      break
    }
    case 'progress': {
      await send(chatId, '⚠️ Progress is now auto-calculated from checklist items.\nUse <code>/setcheck [chapter] [index] done</code> to mark items complete.')
      return
    }
    case 'event_date':
    case 'date':
    case 'date_iso': {
      const v = value.trim().toLowerCase()
      if (v === 'clear' || v === 'none') {
        update.date_iso = null
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
        update.date_iso = value.trim()
      } else {
        await send(chatId, 'Event date must be <code>YYYY-MM-DD</code> or <code>clear</code>.')
        return
      }
      break
    }
    case 'display_date':
    case 'date_text': {
      const raw = value.trim()
      if (!raw || raw.toLowerCase() === 'clear' || raw.toLowerCase() === 'none') {
        update.date_text = ''
      } else {
        update.date_text = raw
      }
      break
    }
    default:
      await send(chatId, `Unknown field <code>${field}</code>. Use: status · venue · lead · pax · pax_target · merch · date · display_date`)
      return
  }

  const { error } = await sb.from('chapters').update(update).eq('id', chapter.id)
  if (error) { await send(chatId, `❌ ${error.message}`); return }

  const normalizedField = field.toLowerCase()
  if (['event_date', 'date', 'date_iso', 'display_date', 'date_text'].includes(normalizedField)) {
    const nextIso = (update.date_iso !== undefined ? update.date_iso : chapter.date_iso) as string | null
    const nextText = (update.date_text !== undefined ? update.date_text : chapter.date_text) as string
    const dateLabel = chapterDateForDisplay(nextIso, nextText)
    await send(chatId, `✅ <b>Ch${chapter.number} ${chapter.name}</b>\nDate → <code>${dateLabel}</code>`)
    return
  }

  const fieldLabel = field === 'pax' || field === 'pax_actual' ? 'pax_actual' : field.toLowerCase()
  const nextValue = fieldLabel === 'merch' || fieldLabel === 'merch_status'
    ? String(update.merch_status ?? value)
    : value
  await send(chatId, `✅ <b>Ch${chapter.number} ${chapter.name}</b>\n${fieldLabel} → <code>${nextValue}</code>`)
}

// ─── /setcheck ─────────────────────────────────────────────────────────────

async function cmdSetChecklistActivity(chatId: number, args: string) {
  const parts = args.split(/\s+/)
  if (parts.length < 3) {
    await send(chatId, `Usage: /setcheck [chapter] [item-index] [done|pending|in_progress]\n<i>e.g.</i> <code>/setcheck manila 0 done</code>`)
    return
  }

  const [chapterIdRaw, itemKeyRaw, activityRaw] = parts
  const chapterId = chapterIdRaw.toLowerCase()
  const itemKey = itemKeyRaw.trim()
  const activityStatus = activityRaw.toLowerCase().trim()

  if (!['done', 'pending', 'in_progress'].includes(activityStatus)) {
    await send(chatId, 'Activity status must be <code>done</code>, <code>pending</code>, or <code>in_progress</code>.')
    return
  }

  const sb = db()
  const { data: chapter } = await sb.from('chapters').select('id, number, name').eq('id', chapterId).single()
  if (!chapter) {
    await send(chatId, `Chapter <code>${chapterId}</code> not found.\nValid chapters: manila · tacloban · iloilo · bukidnon · pampanga · laguna`)
    return
  }

  const SETTINGS_KEY = 'chapter_checklist_overrides'
  const { data: existingRow, error: getError } = await sb
    .from('bot_settings')
    .select('value')
    .eq('key', SETTINGS_KEY)
    .maybeSingle()

  if (getError) {
    await send(chatId, `❌ ${getError.message}`)
    return
  }

  const overrides = parseChecklistOverrides(existingRow?.value)
  const chapterOverrides = overrides[chapterId] ?? {}
  const prevEntry = chapterOverrides[itemKey] ?? {}
  chapterOverrides[itemKey] = {
    ...prevEntry,
    activity_status: activityStatus,
  }
  overrides[chapterId] = chapterOverrides

  const { error: upsertError } = await sb
    .from('bot_settings')
    .upsert([
      {
        key: SETTINGS_KEY,
        value: JSON.stringify(overrides),
        updated_at: new Date().toISOString(),
      },
    ], { onConflict: 'key' })

  if (upsertError) {
    await send(chatId, `❌ ${upsertError.message}`)
    return
  }

  await send(chatId, `✅ <b>Ch${chapter.number} ${chapter.name}</b>\nChecklist item <code>${itemKey}</code> activity → <code>${activityStatus}</code>`)
}

// ─── /contacts ──────────────────────────────────────────────────────────────

const TEAM_LABELS: Record<string, string> = {
  sui_foundation: 'Sui Foundation',
  chapter_lead:   'Chapter Leads',
  content_team:   'Content Team',
}

async function cmdContacts(chatId: number, filter = '', page = 0, editTarget?: { messageId: number }) {
  const sb = db()
  let query = sb.from('contacts').select('id, name, role, handle, team').order('name')

  const teamFilter = filter.toLowerCase().replace(/[-\s]/g, '_')
  if (['sui_foundation', 'chapter_lead', 'content_team'].includes(teamFilter)) {
    query = query.eq('team', teamFilter)
  }

  const { data: contacts } = await query

  if (!contacts?.length) {
    await send(chatId, filter ? `No contacts for team <b>${filter}</b>.` : 'No contacts found.')
    return
  }

  const lines = contacts.map(c =>
    `👤 <b>${c.name}</b> — ${c.role}\n   ${c.handle || '—'} · <i>${TEAM_LABELS[c.team] ?? c.team}</i>\n   <code>${c.id.slice(0, 8)}</code>`
  )

  const paged    = paginateLines(lines, page)
  const keyboard = pagerMarkup('contacts', paged.page, paged.totalPages, filter)

  await sendOrEdit(
    chatId,
    `<b>👥 Contacts${filter ? ` · ${TEAM_LABELS[teamFilter] ?? filter}` : ''}</b> (${contacts.length}) ${paged.totalPages > 1 ? `· Page ${paged.page + 1}/${paged.totalPages}` : ''}\n\n${paged.lines.join('\n\n')}`,
    keyboard,
    editTarget
  )
}

// ─── /addcontact ────────────────────────────────────────────────────────────

async function cmdAddContact(chatId: number, args: string) {
  // Format: [team] [name] | [role] | [handle?]
  const pipeIdx = args.indexOf('|')
  if (pipeIdx === -1) {
    await send(chatId, `Usage: /addcontact [team] [name] | [role] | [handle]

Teams: <code>sui_foundation</code> · <code>chapter_lead</code> · <code>content_team</code>

<i>e.g.</i> <code>/addcontact chapter_lead Maria Santos | Chapter Lead Iloilo | @mariasantos</code>`)
    return
  }

  const beforePipe = args.slice(0, pipeIdx).trim()
  const afterPipe  = args.slice(pipeIdx + 1).trim()
  const [team, ...nameParts] = beforePipe.split(/\s+/)
  const name = nameParts.join(' ').trim()
  const pipeParts = afterPipe.split('|').map(s => s.trim())
  const role   = pipeParts[0] ?? ''
  const handle = pipeParts[1] ?? ''

  if (!name || !role) {
    await send(chatId, '❌ Name and role are required.\nFormat: /addcontact [team] [name] | [role] | [handle?]')
    return
  }

  const validTeams = ['sui_foundation', 'chapter_lead', 'content_team']
  if (!validTeams.includes(team.toLowerCase())) {
    await send(chatId, `Invalid team. Use: ${validTeams.map(t => `<code>${t}</code>`).join(' · ')}`)
    return
  }

  const sb = db()
  const { data: contact, error } = await sb
    .from('contacts')
    .insert({ name, role, handle, team: team.toLowerCase(), emoji: '👤' })
    .select('id, name, role')
    .single()

  if (error) { await send(chatId, `❌ ${error.message}`); return }

  await send(chatId, `✅ Contact added: <b>${contact.name}</b> — ${contact.role}\nID: <code>${contact.id.slice(0, 8)}</code>`)
}

// ─── /deletecontact ─────────────────────────────────────────────────────────

async function cmdDeleteContact(chatId: number, prefix: string) {
  if (!prefix) { await send(chatId, 'Usage: /deletecontact [contact-id]  (get IDs from /contacts)'); return }

  const sb = db()
  const { data: all } = await sb.from('contacts').select('id, name, role')
  const found = await findByPrefix(all ?? [], prefix)

  if ('error' in found) { await send(chatId, found.error); return }

  await sb.from('contacts').delete().eq('id', found.result.id)
  await send(chatId, `🗑 Removed contact: <b>${found.result.name}</b> — ${found.result.role}`)
}

// ─── /merch ─────────────────────────────────────────────────────────────────

const MERCH_ICONS: Record<string, string> = { jcr: '📦', lazada: '🛒', shopee: '☂️' }

async function cmdMerch(chatId: number, filter = '', page = 0, editTarget?: { messageId: number }) {
  const sb = db()
  let query = sb.from('merch_items').select('id, name, quantity, distribution, status, category').order('category')

  const cat = filter.toLowerCase()
  if (['jcr', 'lazada', 'shopee'].includes(cat)) {
    query = query.eq('category', cat)
  }

  const { data: items } = await query

  if (!items?.length) {
    await send(chatId, filter ? `No merch items for category <b>${filter}</b>.` : 'No merch items found.')
    return
  }

  const lines = items.map(item => {
    const icon = MERCH_ICONS[item.category] ?? '📦'
    return `${icon} <b>${item.name}</b> ×${item.quantity}\n   ${item.distribution || '—'} · <code>${item.status}</code>\n   <code>${item.id.slice(0, 8)}</code>`
  })

  const paged    = paginateLines(lines, page)
  const keyboard = pagerMarkup('merch', paged.page, paged.totalPages, filter)

  await sendOrEdit(
    chatId,
    `<b>📦 Merch Items${filter ? ` · ${filter.toUpperCase()}` : ''}</b> (${items.length}) ${paged.totalPages > 1 ? `· Page ${paged.page + 1}/${paged.totalPages}` : ''}\n\n${paged.lines.join('\n\n')}`,
    keyboard,
    editTarget
  )
}

// ─── /setmerch ──────────────────────────────────────────────────────────────

async function cmdSetMerch(chatId: number, args: string) {
  const parts = args.split(/\s+/)
  if (parts.length < 2) {
    await send(chatId, `Usage: /setmerch [id] [status]

Statuses: <code>received</code> · <code>confirmed</code> · <code>confirm</code> · <code>pending</code>

<i>e.g.</i> <code>/setmerch abc12345 received</code>`)
    return
  }

  const [prefix, status] = parts
  const validStatuses = ['received', 'confirmed', 'confirm', 'pending']

  if (!validStatuses.includes(status.toLowerCase())) {
    await send(chatId, `Invalid status. Use: ${validStatuses.map(s => `<code>${s}</code>`).join(' · ')}`)
    return
  }

  const sb = db()
  const { data: all } = await sb.from('merch_items').select('id, name, category')
  const found = await findByPrefix(all ?? [], prefix)

  if ('error' in found) { await send(chatId, found.error); return }

  await sb.from('merch_items').update({ status: status.toLowerCase() }).eq('id', found.result.id)
  const icon = MERCH_ICONS[found.result.category] ?? '📦'
  await send(chatId, `${icon} <b>${found.result.name}</b> → <code>${status}</code>`)
}

// ─── /links ─────────────────────────────────────────────────────────────────

const VALID_LINK_CATEGORIES = [
  'Drive', 'Sheets', 'Docs', 'Slides', 'Forms', 'Figma', 'Notion',
  'GitHub', 'Loom', 'Slack', 'Zoom', 'Finance', 'Design', 'Merch',
  'Events', 'Contacts', 'General',
] as const

function linkAutoIcon(category: string, url: string): string {
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

function linkCategoryColor(category: string): string {
  const cat = category.toLowerCase()
  if (cat === 'finance')                         return 'yellow'
  if (cat === 'figma' || cat === 'design')       return 'purple'
  if (cat === 'merch'    || cat === 'events' ||
      cat === 'notion'   || cat === 'contacts')  return 'teal'
  return 'blue'
}

async function cmdLinks(chatId: number, filter = '') {
  const sb = db()
  let query = sb
    .from('resource_links')
    .select('id, name, description, url, icon, category')
    .order('name')

  const trimmedFilter = filter.trim()
  if (trimmedFilter) {
    // Match exact category (case-insensitive) using the fixed list
    const matched = VALID_LINK_CATEGORIES.find(
      c => c.toLowerCase() === trimmedFilter.toLowerCase()
    )
    if (!matched) {
      const catList = VALID_LINK_CATEGORIES.map(c => `<code>${c}</code>`).join(' · ')
      await send(chatId, `Unknown category <code>${trimmedFilter}</code>.\n\nValid categories:\n${catList}`)
      return
    }
    query = query.eq('category', matched)
  }

  const { data: links } = await query

  if (!links?.length) {
    await send(
      chatId,
      trimmedFilter
        ? `No links found in category <b>${trimmedFilter}</b>.`
        : '🔗 No resource links yet. Use /addlink to add one.'
    )
    return
  }

  const lines = links.map(l =>
    `${l.icon || '🔗'} <b>${l.name}</b>${l.description ? `\n   <i>${l.description}</i>` : ''}\n   <a href="${l.url}">${l.url.length > 50 ? l.url.slice(0, 47) + '…' : l.url}</a> · <code>${l.category}</code>\n   ID: <code>${l.id.slice(0, 8)}</code>`
  )

  const total = lines.length
  const PAGE = 5
  const chunked = lines.slice(0, PAGE)

  await send(
    chatId,
    `<b>🔗 Resource Links${trimmedFilter ? ` · ${trimmedFilter}` : ''}</b> (${total})\n\n${chunked.join('\n\n')}${
      total > PAGE ? `\n\n<i>Showing first ${PAGE}. Filter by category: /links [category]</i>` : ''
    }`
  )
}

// ─── /addlink ────────────────────────────────────────────────────────────────

async function cmdAddLink(chatId: number, args: string) {
  // Format: [category] [name] | [url] | [description?]
  const catList = VALID_LINK_CATEGORIES.map(c => `<code>${c}</code>`).join(' · ')

  const pipeIdx = args.indexOf('|')
  if (pipeIdx === -1) {
    await send(chatId, `Usage: /addlink [category] [name] | [url] | [description?]

<i>e.g.</i>
<code>/addlink Drive Organiser Drive | https://drive.google.com/xyz | Main folder for all files</code>
<code>/addlink Finance Budget Sheet | https://docs.google.com/xyz</code>

Categories: ${catList}
<i>Icon &amp; colour are assigned automatically.</i>`)
    return
  }

  const beforePipe = args.slice(0, pipeIdx).trim()
  const afterPipe  = args.slice(pipeIdx + 1).trim()

  const spaceIdx = beforePipe.indexOf(' ')
  if (spaceIdx === -1) {
    await send(chatId, '❌ Missing name. Format: /addlink [category] [name] | [url] | [description?]')
    return
  }

  const rawCategory = beforePipe.slice(0, spaceIdx).trim()
  const name        = beforePipe.slice(spaceIdx + 1).trim()
  const pipeParts   = afterPipe.split('|').map(s => s.trim())
  const url         = pipeParts[0] ?? ''
  const description = pipeParts[1] ?? ''

  // Validate category against fixed list
  const category = VALID_LINK_CATEGORIES.find(
    c => c.toLowerCase() === rawCategory.toLowerCase()
  )
  if (!category) {
    await send(chatId, `❌ Unknown category <code>${rawCategory}</code>.\n\nValid categories:\n${catList}`)
    return
  }

  if (!name || !url) {
    await send(chatId, '❌ Name and URL are required.\nFormat: /addlink [category] [name] | [url] | [description?]')
    return
  }

  if (!url.startsWith('http')) {
    await send(chatId, '❌ URL must start with http:// or https://')
    return
  }

  const icon       = linkAutoIcon(category, url)
  const icon_color = linkCategoryColor(category)

  const sb = db()
  const { data: link, error } = await sb
    .from('resource_links')
    .insert({ name, description, url, icon, icon_color, category })
    .select('id, name, category')
    .single()

  if (error) { await send(chatId, `❌ ${error.message}`); return }

  await send(
    chatId,
    `✅ Link added: ${icon} <b>${link.name}</b>\nCategory: <code>${link.category}</code>\nID: <code>${link.id.slice(0, 8)}</code>\n\nEdit with: /editlink ${link.id.slice(0, 8)} name [new name]`
  )
}

// ─── /editlink ────────────────────────────────────────────────────────────────

async function cmdEditLink(chatId: number, args: string) {
  const catList = VALID_LINK_CATEGORIES.map(c => `<code>${c}</code>`).join(' · ')

  const parts = args.split(/\s+/)
  if (parts.length < 3) {
    await send(chatId, `Usage: /editlink [id] [field] [value]

Fields: <code>name</code> · <code>url</code> · <code>description</code> · <code>category</code>

<i>e.g.</i>
<code>/editlink abc12345 name Updated Drive Name</code>
<code>/editlink abc12345 url https://drive.google.com/new</code>
<code>/editlink abc12345 category Finance</code>

Categories: ${catList}
<i>Icon &amp; colour update automatically when category or URL changes.</i>
Get IDs from /links.`)
    return
  }

  const [prefix, field, ...rest] = parts
  const value = rest.join(' ').trim()

  if (!value) {
    await send(chatId, '❌ Value cannot be empty.')
    return
  }

  const VALID_FIELDS = ['name', 'url', 'description', 'category']
  const normalizedField = field.toLowerCase()

  if (!VALID_FIELDS.includes(normalizedField)) {
    await send(chatId, `Unknown field <code>${field}</code>. Valid: name · url · description · category\n<i>Note: icon &amp; colour are set automatically.</i>`)
    return
  }

  // Validate category against fixed list
  let resolvedCategory: string | undefined
  if (normalizedField === 'category') {
    resolvedCategory = VALID_LINK_CATEGORIES.find(
      c => c.toLowerCase() === value.toLowerCase()
    )
    if (!resolvedCategory) {
      await send(chatId, `❌ Unknown category <code>${value}</code>.\n\nValid categories:\n${catList}`)
      return
    }
  }

  if (normalizedField === 'url' && !value.startsWith('http')) {
    await send(chatId, '❌ URL must start with http:// or https://')
    return
  }

  const sb = db()
  const { data: all } = await sb.from('resource_links').select('id, name, url, category')
  const found = await findByPrefix(all ?? [], prefix)

  if ('error' in found) { await send(chatId, found.error); return }

  // Use resolved (canonical-cased) category if editing category field
  const patchValue = normalizedField === 'category' ? (resolvedCategory ?? value) : value
  const patch: Record<string, string> = { [normalizedField]: patchValue }

  // Re-derive icon and icon_color when category or url changes
  const newCategory = normalizedField === 'category' ? patchValue : found.result.category
  const newUrl      = normalizedField === 'url'      ? value       : found.result.url
  patch.icon       = linkAutoIcon(newCategory, newUrl)
  patch.icon_color = linkCategoryColor(newCategory)

  const { error } = await sb.from('resource_links').update(patch).eq('id', found.result.id)
  if (error) { await send(chatId, `❌ ${error.message}`); return }

  await send(
    chatId,
    `✅ <b>${found.result.name}</b>\n${normalizedField} → <code>${patchValue}</code>${patch.icon !== '🔗' ? `  ${patch.icon}` : ''}`
  )
}
