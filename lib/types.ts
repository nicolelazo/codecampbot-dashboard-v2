export type ChapterStatus =
  | 'completed'
  | 'rescheduling'
  | 'in_progress'
  | 'activating'
  | 'pencil_booked'
  | 'tbc'

export type TaskStatus = 'pending' | 'done' | 'urgent'
export type RiskSeverity = 'high' | 'medium' | 'low'
export type BadgeVariant = 'done' | 'warn' | 'risk' | 'pending' | 'tbc' | 'cancelled'

export interface Chapter {
  id: string
  number: string
  name: string
  city: string
  region: string
  venue: string
  lead_name: string
  date_text: string
  date_iso: string | null
  status: ChapterStatus
  color: 'blue' | 'teal' | 'yellow' | 'purple'
  pax_target: number | null
  pax_actual: number | null
  merch_status: string
  progress_percent: number
  countdown_text: string
  todos: ChapterTask[]
}

export interface ChapterTask {
  id: string
  short_id: string | null
  chapter_id: string
  owner: string
  description: string
  status: TaskStatus
  created_at: string
}

export interface Kpi {
  id: string
  key: string
  label: string
  sublabel: string
  value: string
  color: 'blue' | 'teal' | 'green' | 'yellow' | 'red'
}

export interface Risk {
  id: string
  code: string
  title: string
  description: string
  owner: string
  chapter_tag: string
  severity: RiskSeverity
  status: 'open' | 'resolved'
}

export interface Contact {
  id: string
  name: string
  role: string
  handle: string
  team: 'sui_foundation' | 'chapter_lead' | 'content_team'
  chapter_number: string | null
  emoji: string
  note: string | null
}

export interface MerchItem {
  id: string
  name: string
  quantity: number
  distribution: string
  status: string
  category: string
}

export interface ResourceLink {
  id: string
  name: string
  description: string
  url: string
  icon: string
  icon_color: 'blue' | 'teal' | 'yellow' | 'purple'
  category: string
}

export interface PaxRow {
  chapter_name: string
  date_text: string
  target: number | null
  actual: number | null
  note: string
  note_color: string
}
