// Single source of truth for all chapter submission / registration data.
// Imported by Dashboard.tsx (event discovery + bento KPIs) and dsu.ts (Telegram bot)
// so all three surfaces always show the same numbers.

export type DoneRow = {
  location: string
  date: string
  done: true
  registrations: number
  total: number       // project submissions
  share: string       // % of total submissions across done chapters
  verified: number    // valid / HQ-verified submissions
  incomplete: number  // invalid / incomplete submissions
  rate: string        // verified / registrations %
}

export type PendingRow = {
  location: string
  date: string
  done: false
}

export type SubmissionRow = DoneRow | PendingRow

export const SUBMISSION_ROWS: SubmissionRow[] = [
  { location: 'Manila',   date: 'Mar 28', done: true, registrations: 128, total: 60,  share: '16.30%', verified: 29,  incomplete: 31, rate: '22.66%' },
  { location: 'Bukidnon', date: 'May 6',  done: true, registrations: 136, total: 80,  share: '21.74%', verified: 72,  incomplete: 8,  rate: '52.94%' },
  { location: 'Iloilo',   date: 'May 16', done: true, registrations: 170, total: 169, share: '45.92%', verified: 164, incomplete: 5,  rate: '96.47%' },
  { location: 'Laguna',   date: 'May 29', done: true, registrations: 103, total: 59,  share: '16.03%', verified: 57,  incomplete: 3,  rate: '55.34%' },
  { location: 'Pampanga', date: 'Jun 24', done: false },
]

export interface SubmissionTotals {
  totalSubs: number           // 368
  totalVerified: number       // 322
  totalRegistrations: number  // 537
  totalIncomplete: number     // 47
  completionRate: string      // '59.96%'
  doneCount: number           // 4
}

export function getSubmissionTotals(): SubmissionTotals {
  const done = SUBMISSION_ROWS.filter((r): r is DoneRow => r.done)
  const totalSubs          = done.reduce((s, r) => s + r.total,         0)
  const totalVerified      = done.reduce((s, r) => s + r.verified,      0)
  const totalRegistrations = done.reduce((s, r) => s + r.registrations, 0)
  const totalIncomplete    = done.reduce((s, r) => s + r.incomplete,    0)
  const completionRate     = totalRegistrations > 0
    ? (totalVerified / totalRegistrations * 100).toFixed(2) + '%'
    : '0%'
  return { totalSubs, totalVerified, totalRegistrations, totalIncomplete, completionRate, doneCount: done.length }
}
