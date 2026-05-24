import type { PaxRow } from './types'

export const PAX_ROWS: PaxRow[] = [
  { chapter_name: 'Manila – Letran', date_text: '28 Mar 2026 · ✓ Executed', target: 150, actual: null, note: '⚠ Pax count TBC — update post-event', note_color: '#FFB547' },
  { chapter_name: 'Tacloban – LNU', date_text: 'New sched TBD · EV', target: 100, actual: null, note: 'Waiting for new LNU schedule', note_color: '#FFB547' },
  { chapter_name: 'Iloilo – WVSU/CPU', date_text: '18 Apr (dev event) + May 16', target: 120, actual: null, note: 'Apr 18 = Sui Dev Event (not code camp)', note_color: '#7A8BA8' },
  { chapter_name: 'Bukidnon – BSU', date_text: '6 May 2026 · Mindanao', target: 100, actual: null, note: '✓ Financial issue resolved (Cash Advance)', note_color: '#00D4AA' },
  { chapter_name: 'Pampanga – CCA', date_text: '24 Jun 2026', target: 130, actual: null, note: 'Activating — mentor recruitment in progress', note_color: '#7A8BA8' },
  { chapter_name: 'Laguna', date_text: 'TBC — slot unconfirmed', target: null, actual: null, note: 'Waiting June confirmation or slot cancelled', note_color: '#A78BFA' },
]

type MilestoneCell = { type: string; text: string }

export const MILESTONE_ROWS: { label: string; months: Record<string, MilestoneCell> }[] = [
  {
    label: 'Partnership Media & Community Launch',
    months: {
      'Mar \'26': { type: 'done', text: '✅ Kickoff (Mar 26 · Bayleaf)' },
    }
  },
  {
    label: 'DEVCON Kids Micro:bit Donation & Hour of AI',
    months: {
      'Dec \'25': { type: 'done', text: '✅ 25 pcs + Hour of AI' },
    }
  },
  {
    label: 'Code Camp Mentor Training',
    months: {
      'Feb \'26': { type: 'done', text: '✅ Phase 1' },
      'Mar \'26': { type: 'done', text: '✅ Phase 2' },
      'Apr \'26': { type: 'active', text: '🔄 Phase 3' },
    }
  },
  {
    label: 'Campus DEVCON & SHEisDEVCON Series',
    months: {
      'Mar \'26': { type: 'done', text: '✅ Event 1' },
      'Apr \'26': { type: 'active', text: '🔄 Events 2 & 3' },
      'May \'26': { type: 'upcoming', text: 'Event 4' },
      'Jun \'26': { type: 'upcoming', text: 'Event 5' },
    }
  },
  {
    label: 'Code Camp Pilot Execution (Q2)',
    months: {
      'Mar \'26': { type: 'done', text: '✅ Manila Pilot' },
      'Apr \'26': { type: 'active', text: '🔄 Iloilo Dev Event' },
      'May \'26': { type: 'upcoming', text: 'Iloilo CC + BSU' },
      'Jun \'26': { type: 'upcoming', text: 'Pampanga' },
    }
  },
  {
    label: 'DEVCON Studios Content Coverage',
    months: {
      'Jan \'26': { type: 'done', text: '✅ Feature 1' },
      'Mar \'26': { type: 'done', text: '✅ Feature 2' },
      'Apr \'26': { type: 'active', text: '🔄 Feature 3' },
      'Jun \'26': { type: 'upcoming', text: 'Feature 4' },
      'Jul \'26': { type: 'upcoming', text: 'Feature 5' },
    }
  },
  {
    label: 'Quarterly Report',
    months: {
      'Mar \'26': { type: 'done', text: '✅ Q1 Report' },
      'Jun \'26': { type: 'upcoming', text: 'Q2 Report' },
      'Sep \'26': { type: 'upcoming', text: 'Q3 Report' },
      'Nov \'26': { type: 'upcoming', text: 'Q4 Final' },
    }
  },
]

export const MONTHS = ["Dec '25","Jan '26","Feb '26","Mar '26","Apr '26","May '26","Jun '26","Jul '26","Aug '26","Sep '26","Oct '26","Nov '26"]
export const CURRENT_MONTH = "Apr '26"
