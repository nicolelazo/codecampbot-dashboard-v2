'use client'
import KpiTile from '@/components/ui/KpiTile'
import SectionTitle from '@/components/ui/SectionTitle'
import ProgressBar from '@/components/ui/ProgressBar'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { liveCountdown } from '@/lib/utils'
import type { Chapter, Kpi, BadgeVariant } from '@/lib/types'

const statusBadge: Record<string, { variant: BadgeVariant; label: string }> = {
  completed:     { variant: 'done',    label: 'Done'             },
  rescheduling:  { variant: 'warn',    label: 'Rescheduling'     },
  in_progress:   { variant: 'pending', label: 'Active'           },
  pencil_booked: { variant: 'warn',    label: 'Pencil Booked'    },
  tbc:           { variant: 'tbc',     label: 'TBC'              },
  activating:    { variant: 'warn',    label: 'Activating'       },
}

const dotColor: Record<string, string> = {
  completed:     '#14b8a6',
  in_progress:   '#06b6d4',
  rescheduling:  '#f59e0b',
  pencil_booked: '#14b8a6',
  tbc:           '#a78bfa',
  activating:    '#f59e0b',
}

const chapterDateColor: Record<string, string> = {
  completed:     '#14b8a6',
  in_progress:   '#06b6d4',
  rescheduling:  '#f59e0b',
  pencil_booked: '#14b8a6',
  tbc:           '#a78bfa',
}

interface Props { chapters: Chapter[]; kpis: Kpi[]; onShowChapter: (id: string) => void }

export default function DsuPanel({ chapters, kpis, onShowChapter }: Props) {
  const campChapters    = chapters.filter(c => c.number !== '6')
  const upcomingChapters = chapters.filter(c => c.id !== 'manila')
  const chaptersWithTodos = chapters.filter(c => c.todos.length > 0)

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* DSU Header */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-[#06b6d4] via-[#14b8a6] to-[#06b6d4]" />
        <div className="flex items-start justify-between flex-wrap gap-4 p-8">
          <div>
            <div className="text-[9px] text-[#06b6d4] tracking-[0.15em] uppercase mb-1.5 font-bold">📝 DEVCON Ops — Monday Morning DSU</div>
            <div className="text-[20px] font-extrabold text-[#cfd5dd]">Monday, April 13, 2026</div>
            <div className="text-[11px] text-[#64748b] mt-0.5">Sui Build Beyond DEVCON PH · Q2 · 78 days remaining</div>
          </div>
          <div className="text-[10px] text-[#14b8a6] bg-[rgba(20,184,166,0.1)] border border-[rgba(20,184,166,0.25)] px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 self-start">
            <span className="animate-[pulse_2s_infinite]">●</span> Live Tracker
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div>
        <SectionTitle>📊 KPI Summary</SectionTitle>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
          {kpis.map(k => (
            <KpiTile key={k.id} value={k.value} label={k.label} sublabel={k.sublabel} color={k.color} />
          ))}
        </div>
      </div>

      {/* Program Progress */}
      <div>
        <SectionTitle>🏕 Program Progress</SectionTitle>
        <div className="grid grid-cols-2 gap-6 max-[640px]:grid-cols-1">

          {/* Code Camps */}
          <div className="bg-[#0f172a] border border-[rgba(6,182,212,0.25)] rounded-3xl p-7 relative overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 w-[3px] rounded-l-2xl bg-[#06b6d4]" />
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#06b6d4] mb-3">🏕 Sui Code Camps</div>
            <div className="flex items-baseline gap-1.5 mb-3">
              <span className="text-[38px] font-extrabold text-[#06b6d4] leading-none">1</span>
              <span className="text-[18px] font-extrabold text-[#64748b]">/ 5</span>
              <span className="text-[11px] text-[#64748b] ml-1">done</span>
            </div>
            <ProgressBar percent={20} />
            <div className="flex flex-col gap-1.5 mt-3">
              {campChapters.map(c => (
                <div key={c.id} className="flex items-center gap-2 text-[11px]">
                  <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: dotColor[c.status] }} />
                  <span className="text-[#8899aa]">
                    {c.name.replace('– NCR','– Letran').replace('– WV','– CPU Jaro').replace('– EV','– LNU')}{' '}
                    <em style={{ color: dotColor[c.status] }}>
                      {c.status === 'completed' ? '✓ Done' : c.date_text === 'TBD' ? 'TBD' : c.date_text.split(',')[0]}
                    </em>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dev Events */}
          <div className="bg-[#0f172a] border border-[rgba(245,158,11,0.25)] rounded-3xl p-7 relative overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 w-[3px] rounded-l-2xl bg-[#f59e0b]" />
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#f59e0b] mb-3">⚡ Sui Developer Events</div>
            <div className="flex items-baseline gap-1.5 mb-3">
              <span className="text-[38px] font-extrabold text-[#f59e0b] leading-none">2</span>
              <span className="text-[18px] font-extrabold text-[#64748b]">/ 5</span>
              <span className="text-[11px] text-[#64748b] ml-1">done</span>
            </div>
            <ProgressBar percent={40} color="yellow" />
            <div className="flex flex-col gap-1.5 mt-3 text-[11px] text-[#8899aa]">
              <div className="flex items-center gap-2"><span className="w-[7px] h-[7px] rounded-full bg-[#14b8a6] flex-shrink-0" />Bayleaf Intramuros National Kickoff <em className="text-[#14b8a6]">✓ Done</em></div>
              <div className="flex items-center gap-2"><span className="w-[7px] h-[7px] rounded-full bg-[#14b8a6] flex-shrink-0" />SHEisDEVCON Manila <em className="text-[#14b8a6]">✓ Done</em></div>
              <div className="flex items-center gap-2"><span className="w-[7px] h-[7px] rounded-full bg-[#f59e0b] flex-shrink-0" />SHEisDEVCON Iloilo <em className="text-[#f59e0b]">Apr 18</em></div>
              <div className="flex items-center gap-2"><span className="w-[7px] h-[7px] rounded-full bg-[#06b6d4] flex-shrink-0" />SHEisDEVCON Event 4 <em className="text-[#06b6d4]">May</em></div>
              <div className="flex items-center gap-2"><span className="w-[7px] h-[7px] rounded-full bg-[#14b8a6] flex-shrink-0" />SHEisDEVCON Event 5 <em className="text-[#14b8a6]">Jun</em></div>
            </div>
          </div>
        </div>
      </div>

      {/* Camp Schedule */}
      <div>
        <SectionTitle>📅 Camp Schedule & Countdown</SectionTitle>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
          {upcomingChapters.map(chapter => {
            const b = statusBadge[chapter.status]
            const accentColor = chapter.color === 'teal' ? '#14b8a6' : chapter.color === 'yellow' ? '#f59e0b' : chapter.color === 'purple' ? '#a78bfa' : '#06b6d4'
            return (
              <div key={chapter.id} className="bg-[#0f172a] border border-[#1e293b] rounded-3xl p-6" style={{ borderLeft: `3px solid ${accentColor}` }}>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div>
                    <div className="text-[13px] font-extrabold text-[#cfd5dd]">{chapter.city}</div>
                    <div className="text-[10px] text-[#64748b] mt-0.5">{chapter.venue.split(',')[0]} · Lead: {chapter.lead_name.split('&')[0].trim()}</div>
                  </div>
                  <Badge variant={b.variant} size="sm">{b.label}</Badge>
                </div>
                <div className="text-[11px] font-semibold mb-1.5" style={{ color: chapterDateColor[chapter.status] }}>{chapter.date_text}</div>
                <ProgressBar percent={chapter.progress_percent} color={chapter.color === 'yellow' ? 'yellow' : chapter.color === 'teal' ? 'teal' : chapter.color === 'purple' ? 'purple' : 'default'} />
                <div className="text-[10px] text-[#64748b] mt-1.5 mb-3">{liveCountdown(chapter.date_iso)}</div>
                <div className="border-t border-[#1e293b] pt-3 flex flex-col gap-1.5">
                  {chapter.todos.slice(0, 3).map(t => (
                    <div key={t.id} className="flex items-start gap-2 text-[11px]">
                      <span className={`flex-shrink-0 mt-0.5 font-bold ${t.status === 'urgent' ? 'text-[#e11d48]' : 'text-[#f59e0b]'}`}>→</span>
                      <span className="text-[#8899aa]"><strong className="text-[#cfd5dd]">{t.owner}:</strong> {t.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* High Risks */}
      <div>
        <SectionTitle>⚠️ High Risks & Blockers</SectionTitle>
        <div className="flex flex-col gap-4">
          {[
            { icon: '🔴', title: 'Tacloban Rescheduling', color: '#e11d48', border: 'rgba(225,29,72,0.25)', bg: 'rgba(225,29,72,0.06)', body: 'Date still TBC. Rolf to confirm by end of week. Must lock before May 1 to stay within Q2 window.', owner: 'OWNER: Rolf · DEADLINE: End of this week' },
            { icon: '🟣', title: 'Laguna — No Confirmed Slot', color: '#a78bfa', border: 'rgba(167,139,250,0.25)', bg: 'rgba(167,139,250,0.06)', body: 'Lead assigned: John Danmel. Awaiting June go/no-go from Dom. Risk of cancellation.', owner: 'OWNER: Dom / John Danmel · ACTION: Confirm slot or cancel' },
            { icon: '🟡', title: 'Ocular Readiness — Bukidnon & Iloilo', color: '#f59e0b', border: 'rgba(245,158,11,0.25)', bg: 'rgba(245,158,11,0.06)', body: 'Both chapters in T-30 window. Ocular reports due immediately. Delay in ocular = delay in installation.', owner: 'OWNER: Zhi (BSU) · Ted / Marica (CPU + WVSU) · Schedule this week' },
          ].map(r => (
            <div key={r.title} className="flex gap-4 items-start p-6 rounded-3xl" style={{ background: r.bg, border: `1px solid ${r.border}` }}>
              <span className="text-[18px] leading-snug flex-shrink-0 mt-0.5">{r.icon}</span>
              <div>
                <div className="text-[13px] font-bold mb-1" style={{ color: r.color }}>{r.title}</div>
                <div className="text-[12px] text-[#8899aa] leading-relaxed">{r.body}</div>
                <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: r.color }}>{r.owner}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* To-Do Per Camp */}
      <div>
        <SectionTitle>✅ To-Do List Per Camp</SectionTitle>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
          {chaptersWithTodos.map(chapter => {
            const accentColor = chapter.color === 'teal' ? '#14b8a6' : chapter.color === 'yellow' ? '#f59e0b' : chapter.color === 'purple' ? '#a78bfa' : '#06b6d4'
            return (
              <Card key={chapter.id}>
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] mb-3" style={{ color: accentColor }}>📍 {chapter.name}</div>
                {chapter.todos.map(t => (
                  <div key={t.id} className="flex items-start gap-2 text-[12px] py-0.5">
                    <span className="flex-shrink-0 mt-0.5 font-bold" style={{ color: accentColor }}>→</span>
                    <span className="text-[#8899aa]"><strong className="text-[#cfd5dd]">{t.owner}:</strong> {t.description}</span>
                  </div>
                ))}
              </Card>
            )
          })}
          <Card>
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] mb-3 text-[#64748b]">📍 General / Backlog</div>
            <div className="flex items-start gap-2 text-[12px]">
              <span className="text-[#06b6d4] font-bold flex-shrink-0">→</span>
              <span className="text-[#8899aa]"><strong className="text-[#cfd5dd]">Dom:</strong> Draft Q2 narrative report outline for Sui Foundation</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Chapter Nav */}
      <div className="p-7 bg-[#0f172a] border border-[#1e293b] rounded-3xl">
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#64748b] mb-3">Jump to Chapter</div>
        <div className="flex gap-2 flex-wrap">
          {chapters.map(c => {
            const accentColor = c.color === 'teal' ? '#14b8a6' : c.color === 'yellow' ? '#f59e0b' : c.color === 'purple' ? '#a78bfa' : '#06b6d4'
            const icon = c.status === 'completed' ? ' ✓' : c.status === 'rescheduling' ? ' ⚠' : c.status === 'in_progress' ? ' 🔄' : c.status === 'tbc' ? ' TBC' : ''
            return (
              <button key={c.id} onClick={() => onShowChapter(c.id)}
                className="px-3.5 py-2 rounded-xl text-[11px] font-bold border transition-all hover:opacity-80 hover:-translate-y-px"
                style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}44`, color: accentColor }}
              >
                Ch{c.number} {c.city}{icon}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
