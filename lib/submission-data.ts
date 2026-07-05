// Single source of truth for all chapter submission / registration data.
// Imported by Dashboard.tsx (event discovery + bento KPIs) and dsu.ts (Telegram bot)
// so all three surfaces always show the same numbers.

// Total participants who successfully deployed a smart contract to Sui Mainnet
// (includes verified + those still pending public Vercel link review)
export const MAINNET_DEPLOYMENTS = 321

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
  { location: 'Manila',   date: 'Mar 28', done: true, registrations: 128, total: 60,  share: '16.57%', verified: 29,  incomplete: 31, rate: '22.66%' },
  { location: 'Bukidnon', date: 'May 6',  done: true, registrations: 136, total: 80,  share: '22.10%', verified: 73,  incomplete: 7,  rate: '53.68%' },
  { location: 'Iloilo',   date: 'May 16', done: true, registrations: 164, total: 162, share: '44.75%', verified: 144, incomplete: 18, rate: '87.80%' },
  { location: 'Laguna',   date: 'May 29', done: true, registrations: 80,  total: 60,  share: '16.57%', verified: 56,  incomplete: 4,  rate: '70.00%' },
  { location: 'Legazpi', date: 'Jul 30, 2026', done: false },
  { location: 'CDO', date: 'Jul 4 (tentative)', done: false },
  { location: 'Pampanga', date: 'Declined', done: false },
]

export interface SubmissionTotals {
  totalSubs: number           // 362
  totalVerified: number       // 302
  totalRegistrations: number  // 508
  totalIncomplete: number     // 60
  completionRate: string      // '59.45%'
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
