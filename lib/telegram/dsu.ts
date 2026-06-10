import { createClient } from '@supabase/supabase-js'
import { CHECKLIST_TEMPLATE } from '@/lib/checklist-data'
import { getSubmissionTotals } from '@/lib/submission-data'

const noStoreFetch: typeof fetch = (input, init) => {
  return fetch(input, {
    ...init,
    cache: 'no-store',
    next: { revalidate: 0 },
  } as RequestInit & { next: { revalidate: 0 } })
}

export function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: { fetch: noStoreFetch },
    }
  )
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

function chapterDateForDisplay(isoDate: string | null, dateText: string): string {
  const primary = formatDateIsoForDisplay(isoDate)
  const secondary = (dateText ?? '').trim()
  if (primary && secondary && secondary !== primary) return `${primary} (${secondary})`
  if (primary) return primary
  if (secondary) return secondary
  return 'TBD'
}

export async function buildDsuMessage(): Promise<string> {
  const sb = db()

  const [
    { data: chapters },
    { data: tasks },
    { data: risks },
    { data: kpis },
  ] = await Promise.all([
    sb.from('chapters').select('name, number, status, progress_percent, date_text, date_iso').order('number'),
    sb.from('chapter_tasks').select('id, chapter_id, owner, description, status').neq('status', 'done'),
    sb.from('risks').select('code, title, owner, severity, status').eq('status', 'open').order('code'),
    sb.from('kpis').select('key, value'),
  ])

  const kpiMapRaw = Object.fromEntries((kpis ?? []).map(k => [k.key, k.value]))

  // Merge: computed submission totals override stale Supabase values for these three metrics
  const sub = getSubmissionTotals()
  const kpiMap = {
    ...kpiMapRaw,
    verified_completions:    String(sub.totalVerified),   // 322 — always from real data
    completion_rate_vs_reg:  sub.completionRate,           // 59.96% — always from real data
    form_submissions:        String(sub.totalRegistrations), // 537 — total registrations (Code Camp Attendees)
  }

  function sortChapters<T extends { status: string; date_iso: string | null }>(rows: T[]): T[] {
    const active = rows.filter(c => c.status !== 'completed' && c.status !== 'tbc' && c.status !== 'rescheduling' && c.status !== 'declined')
    const tbc = rows.filter(c => c.status === 'tbc' || c.status === 'rescheduling')
    const declined = rows.filter(c => c.status === 'declined')
    const done = rows.filter(c => c.status === 'completed')
    active.sort((a, b) => {
      if (a.date_iso && b.date_iso) return a.date_iso.localeCompare(b.date_iso)
      if (a.date_iso) return -1
      if (b.date_iso) return 1
      return 0
    })
    done.sort((a, b) => {
      if (a.date_iso && b.date_iso) return b.date_iso.localeCompare(a.date_iso)
      if (a.date_iso) return -1
      if (b.date_iso) return 1
      return 0
    })
    return [...active, ...tbc, ...done, ...declined]
  }

  const now = new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'Asia/Manila',
  })

  const kpiBlock = [
    `• Code Camps: <b>${kpiMap['code_camps'] ?? '–'}</b>`,
    `• Dev Events / Slots: <b>${kpiMap['dev_events'] ?? '–'}</b>`,
    `• Total Attendees: <b>${kpiMap['total_attendees'] ?? '–'}</b>`,
    `• Form Submissions: <b>${kpiMap['form_submissions'] ?? '–'}</b>`,
    `• Mentors Trained: <b>${kpiMap['trained_mentors'] ?? '–'}</b>`,
    `• Students Trained: <b>${kpiMap['students_trained'] ?? '–'}</b>`,
    `• Deployments: <b>${kpiMap['confirmed_deployments'] ?? '–'}</b>`,
    `• Completion Rate: <b>${kpiMap['completion_rate'] ?? '–'}</b>`,
    `• Labs Activated: <b>${kpiMap['computer_labs'] ?? '–'}</b>`,
    `• Verified Completions: <b>${kpiMap['verified_completions']}</b> (${kpiMap['completion_rate_vs_reg']} vs reg — ${sub.doneCount} chapters done)`,
  ].join('\n')

  const statusIcon: Record<string, string> = {
    completed: '✅', rescheduling: '⚠️', in_progress: '🔄',
    pencil_booked: '📌', tbc: '🟣', activating: '🟡',
  }

  const chapterBlock = sortChapters(chapters ?? [])
    .map(c => {
      const date = c.status === 'completed' ? 'Done' : chapterDateForDisplay(c.date_iso, c.date_text)
      return `${statusIcon[c.status] ?? '•'} Ch${c.number} <b>${c.name}</b> — ${date} (${c.progress_percent}%)`
    })
    .join('\n')

  // Defensive dedupe: prevent repeated DSU lines if duplicate rows exist.
  const uniqueOpenTasks = Array.from(new Map(
    (tasks ?? []).map(t => [
      `${t.chapter_id}|${t.owner.trim().toLowerCase()}|${t.description.trim().toLowerCase()}|${t.status}`,
      t,
    ])
  ).values())

  const uniqueOpenRisks = Array.from(new Map(
    (risks ?? []).map(r => [`${r.code.trim().toUpperCase()}|${r.status}`, r])
  ).values())

  const urgentTasks = uniqueOpenTasks.filter(t => t.status === 'urgent')
  const openTasks = uniqueOpenTasks

  const urgentBlock = urgentTasks.length
    ? urgentTasks.map(t => `🔴 <b>${t.owner}</b> [${t.chapter_id}]: ${t.description}`).join('\n')
    : '  None'

  const highRisks = uniqueOpenRisks.filter(r => r.severity === 'high')
  const sevIcon: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢' }

  const risksBlock = highRisks.length
    ? highRisks.map(r => `${sevIcon[r.severity]} <b>${r.code}</b>: ${r.title} — ${r.owner}`).join('\n')
    : '  No high risks'

  const pendingDeepSurge = Object.entries(CHECKLIST_TEMPLATE)
    .filter(([, items]) => items.some(i => i.tCode === 'LINK' && i.status === 'pending'))
    .map(([chapter]) => chapter.charAt(0).toUpperCase() + chapter.slice(1))

  const deepSurgeBlock = pendingDeepSurge.length
    ? `\n<b>🔗 Pending DeepSurge Links</b>\n${pendingDeepSurge.map(c => `• ${c} — TBD (request from Jianyi)`).join('\n')}`
    : ''

  return `<b>📝 DEVCON × Sui — Morning DSU</b>
<i>${now}</i>
━━━━━━━━━━━━━━━━━━━━

<b>📊 KPIs</b>
${kpiBlock}

<b>🏕 Chapter Progress</b>
${chapterBlock}

<b>✅ Urgent Tasks</b> (${urgentTasks.length} urgent · ${openTasks.length} total open)
${urgentBlock}

<b>⚠️ High Risks</b> (${uniqueOpenRisks.length} total open)
${risksBlock}

<i>Use /tasks, /risks, or /chapter [id] for details.</i>${deepSurgeBlock}`
}
