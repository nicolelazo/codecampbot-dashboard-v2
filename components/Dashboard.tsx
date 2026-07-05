'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { SUBMISSION_ROWS, getSubmissionTotals } from '@/lib/submission-data'
import { fetchChapters, fetchKpis, fetchRisks, fetchContacts, fetchMerchItems, fetchLinks } from '@/lib/supabase/queries'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import type { Chapter, Kpi, Risk, Contact, MerchItem, ResourceLink } from '@/lib/types'
import KpiPanel from '@/components/panels/KpiPanel'
import ChaptersPanel from '@/components/panels/ChaptersPanel'
import ChapterDetailPanel from '@/components/panels/ChapterDetailPanel'
import MilestonesPanel from '@/components/panels/MilestonesPanel'
import RisksPanel from '@/components/panels/RisksPanel'
import RiskDrilldownPanel from '@/components/panels/RiskDrilldownPanel'
import MerchPanel from '@/components/panels/MerchPanel'
import LinksPanel from '@/components/panels/LinksPanel'
import ContactsPanel from '@/components/panels/ContactsPanel'
import ContentPanel from '@/components/panels/ContentPanel'
import SettingsPanel from '@/components/panels/SettingsPanel'
import InsightsPanel from '@/components/panels/InsightsPanel'

type TabId = 'overview' | 'kpi' | 'milestones' | 'insights' | 'chapters' | 'risks' | 'merch' | 'links' | 'contacts' | 'content' | 'settings'

const TAB_IDS: TabId[] = ['overview', 'kpi', 'milestones', 'insights', 'chapters', 'risks', 'merch', 'links', 'contacts', 'content', 'settings']

function getTabFromQuery(tab: string | null): TabId {
  return TAB_IDS.includes((tab ?? '') as TabId) ? (tab as TabId) : 'overview'
}

const C = {
  bg: '#020617',
  surface: '#0f172a',
  border: '#1e293b',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  rose: '#e11d48',
  muted: '#64748b',
  text: '#cfd5dd',
  dim: '#8899aa',
}

const CHAPTER_GRADIENTS = [
  'linear-gradient(135deg,#0c4a6e 0%,#065f46 100%)',
  'linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)',
  'linear-gradient(135deg,#4c0519 0%,#9f1239 100%)',
  'linear-gradient(135deg,#14532d 0%,#15803d 100%)',
  'linear-gradient(135deg,#1c1917 0%,#44403c 100%)',
  'linear-gradient(135deg,#172554 0%,#164e63 100%)',
]

const AVATAR_COLORS = ['#06b6d4','#14b8a6','#e11d48','#f59e0b','#8b5cf6','#ec4899']

function getCat(num: string | number) {
  const n = parseInt(String(num))
  if (n <= 2) return { label: 'Academic', color: C.cyan,  bg: 'rgba(6,182,212,0.15)' }
  if (n <= 4) return { label: 'Cultural', color: C.rose,  bg: 'rgba(225,29,72,0.15)' }
  return            { label: 'Startup',  color: C.teal,  bg: 'rgba(20,184,166,0.15)' }
}

// Normalise legacy "Angeles" DB value → display as "Pampanga" everywhere.
// Remove once the chapters DB record has city = 'Pampanga'.
function displayCity(city: string): string {
  return city.toLowerCase() === 'angeles' ? 'Pampanga' : city
}

function formatChapterStatus(status: string) {
  return status
    .split('_')
    .filter(Boolean)
    .map(token => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ')
}

function getChapterStatusBadge(status: string) {
  const key = status.toLowerCase()

  if (key === 'completed') {
    return {
      label: 'Completed',
      color: '#14b8a6',
      bg: 'rgba(20,184,166,0.16)',
      border: 'rgba(20,184,166,0.4)',
      glow: '0 0 16px rgba(20,184,166,0.2)',
    }
  }

  if (key === 'rescheduling' || key === 'tbc') {
    return {
      label: formatChapterStatus(status),
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.16)',
      border: 'rgba(245,158,11,0.38)',
      glow: '0 0 16px rgba(245,158,11,0.16)',
    }
  }

  if (key === 'in_progress' || key === 'activating' || key === 'pencil_booked') {
    return {
      label: formatChapterStatus(status),
      color: '#06b6d4',
      bg: 'rgba(6,182,212,0.16)',
      border: 'rgba(6,182,212,0.38)',
      glow: '0 0 16px rgba(6,182,212,0.18)',
    }
  }

  return {
    label: formatChapterStatus(status),
    color: C.dim,
    bg: 'rgba(15,23,42,0.78)',
    border: 'rgba(100,116,139,0.35)',
    glow: 'none',
  }
}

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { id: 'overview'   as TabId, label: 'Event Discovery', icon: '◈' },
      { id: 'kpi'        as TabId, label: 'KPI Dashboard',   icon: '◉' },
      { id: 'milestones' as TabId, label: 'Partnership KPIs',  icon: '◎' },
      { id: 'insights'   as TabId, label: 'Code Camp Insights', icon: '◑' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'chapters' as TabId, label: 'All Chapters',  icon: '⊞' },
      { id: 'risks'    as TabId, label: 'Risk Register', icon: '⚠' },
      { id: 'merch'    as TabId, label: 'Merchandise',   icon: '⊠' },
    ],
  },
  {
    label: 'Resources',
    items: [
      { id: 'links'    as TabId, label: 'Resource Links', icon: '⊗' },
      { id: 'contacts' as TabId, label: 'Contacts',       icon: '⊕' },
      { id: 'content'  as TabId, label: 'Content Hub',    icon: '⊘' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'settings' as TabId, label: 'Settings',       icon: '⚙' },
    ],
  },
]

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_NAMES   = ['Su','Mo','Tu','We','Th','Fr','Sa']
const DAY_FULL    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

// Q2 report deadline — Sui Foundation
const Q2_DEADLINE = new Date('2026-06-30T23:59:59')

function CalendarModal({ chapters, onClose, isMobile }: { chapters: Chapter[]; onClose: () => void; isMobile: boolean }) {
  const now = new Date()
  const [ym, setYm]         = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [selected, setSelected] = useState<number | null>(now.getDate())

  const daysInMonth = new Date(ym.year, ym.month + 1, 0).getDate()
  const firstDay    = new Date(ym.year, ym.month, 1).getDay()

  const eventsByDay: Record<number, Chapter[]> = {}
  chapters.forEach(c => {
    if (!c.date_iso) return
    const d = new Date(c.date_iso)
    if (d.getFullYear() === ym.year && d.getMonth() === ym.month) {
      const day = d.getDate()
      ;(eventsByDay[day] ??= []).push(c)
    }
  })

  const selectedEvents = selected ? (eventsByDay[selected] ?? []) : []

  const chevron: React.CSSProperties = {
    background: 'none', border: 'none', color: C.dim,
    cursor: 'pointer', fontSize: '20px', padding: '4px 10px',
    borderRadius: '8px', lineHeight: 1,
  }

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding: isMobile ? '16px' : '24px 24px 24px 304px', background:'rgba(2,6,23,0.8)', backdropFilter:'blur(6px)' }}
      onClick={onClose}
    >
      <div
        style={{ width: isMobile ? '100%' : 'min(980px, calc(100vw - 360px))', maxHeight:'calc(100vh - 80px)', background:C.border, borderRadius: isMobile ? '16px' : '24px', boxShadow:'0 25px 80px rgba(0,0,0,0.9)', display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(300px,340px) 1fr', overflowY:'auto', overflowX:'hidden', animation:'slideDown .3s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Left — date selector */}
        <div style={{ padding:'24px', borderRight:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
            <button style={chevron} onClick={() => setYm(p => p.month === 0 ? { year:p.year-1, month:11 } : { ...p, month:p.month-1 })}>‹</button>
            <span style={{ color:C.text, fontWeight:700, fontSize:'15px' }}>{MONTH_NAMES[ym.month]} {ym.year}</span>
            <button style={chevron} onClick={() => setYm(p => p.month === 11 ? { year:p.year+1, month:0 } : { ...p, month:p.month+1 })}>›</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:'8px' }}>
            {DAY_NAMES.map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:'10px', fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.05em', padding:'4px 0' }}>{d}</div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px' }}>
            {Array.from({ length: firstDay }).map((_,i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_,i) => i + 1).map(day => {
              const isSelected = day === selected
              const isToday = day === now.getDate() && ym.year === now.getFullYear() && ym.month === now.getMonth()
              const cats = (eventsByDay[day] ?? []).map(c => getCat(c.number))
              return (
                <div
                  key={day}
                  onClick={() => setSelected(day === selected ? null : day)}
                  style={{ minHeight:'34px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'6px 2px', borderRadius:'8px', cursor:'pointer', textAlign:'center', background:isSelected ? 'linear-gradient(135deg,#06b6d4,#14b8a6)' : 'transparent', boxShadow:isSelected ? '0 4px 12px rgba(6,182,212,0.4)' : undefined, transition:'all .2s', outline: isToday && !isSelected ? '1px solid rgba(6,182,212,0.5)' : undefined }}
                >
                  <div style={{ fontSize:'12px', fontWeight:isSelected || isToday ? 700 : 400, color:isSelected ? '#fff' : isToday ? C.cyan : C.dim }}>{day}</div>
                  {cats.length > 0 && (
                    <div style={{ display:'flex', justifyContent:'center', gap:'2px', marginTop:'2px' }}>
                      {cats.slice(0,3).map((cat,i) => (
                        <div key={i} style={{ width:'4px', height:'4px', borderRadius:'50%', background:cat.color }} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right — schedule view */}
        <div style={{ background:'rgba(15,23,42,0.6)', padding:'24px', overflowY:'auto' }}>
          <div style={{ fontSize:'10px', fontWeight:700, color:C.cyan, textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:'16px' }}>
            Schedule for {selected ? `${MONTH_NAMES[ym.month]} ${selected}` : 'Select a Day'}
          </div>

          {selectedEvents.length === 0 ? (
            <div style={{ textAlign:'center', paddingTop:'60px', opacity:0.4 }}>
              <div style={{ fontSize:'40px', marginBottom:'12px' }}>📅</div>
              <div style={{ color:C.dim, fontSize:'13px' }}>{selected ? 'No events scheduled' : 'Click a date to view events'}</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {selectedEvents.map(c => {
                const cat  = getCat(c.number)
                const grad = CHAPTER_GRADIENTS[(parseInt(c.number) - 1) % CHAPTER_GRADIENTS.length]
                return (
                  <div key={c.id} style={{ display:'flex', gap:'12px', alignItems:'center', background:'rgba(30,41,59,0.8)', borderRadius:'12px', padding:'12px', border:`1px solid ${C.border}` }}>
                    <div style={{ width:'48px', height:'48px', borderRadius:'10px', background:grad, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>🎓</div>
                    <div>
                      <div style={{ fontSize:'10px', fontWeight:700, color:cat.color, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'3px' }}>{cat.label}</div>
                      <div style={{ fontSize:'13px', fontWeight:600, color:C.text }}>{c.id !== 'cdo' ? `Ch${c.number} — ` : ''}{c.name}</div>
                      <div style={{ fontSize:'11px', color:C.muted, marginTop:'2px' }}>📍 {c.venue || c.city} · {c.date_text}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EventCard({ chapter, onSelect }: { chapter: Chapter; onSelect: (id: string) => void }) {
  const [hovered, setHovered] = useState(false)
  const cat     = getCat(chapter.number)
  const grad    = CHAPTER_GRADIENTS[(parseInt(chapter.number) - 1) % CHAPTER_GRADIENTS.length]
  const avatarN = Math.min(3, Math.max(1, Math.floor(chapter.progress_percent / 30)))
  const statusBadge = getChapterStatusBadge(chapter.status)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(chapter.id)}
      style={{
        background: C.surface,
        borderRadius: '28px',
        border: `1px solid ${hovered ? 'rgba(6,182,212,0.3)' : C.border}`,
        boxShadow: hovered ? '0 0 20px rgba(6,182,212,0.1)' : 'none',
        cursor: 'pointer',
        transition: 'all .3s ease-out',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'auto',
      }}
    >
      {/* Image / gradient area */}
      <div style={{ height:'180px', position:'relative', overflow:'hidden', background:grad, flexShrink:0 }}>
        <div style={{ position:'absolute', inset:0, background:'rgba(2,6,23,0.5)' }} />
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', transform:hovered ? 'scale(1.05)' : 'scale(1)', transition:'transform .5s ease-out' }}>
          <span style={{ fontSize:'68px', fontWeight:800, color:'rgba(255,255,255,0.12)', letterSpacing:'-0.05em' }}>{chapter.id !== 'cdo' ? `CH${chapter.number}` : chapter.name.toUpperCase()}</span>
        </div>
        {/* Category badge */}
        <div style={{ position:'absolute', top:'12px', left:'12px', background:cat.bg, color:cat.color, padding:'3px 10px', borderRadius:'999px', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', backdropFilter:'blur(8px)' }}>
          {cat.label}
        </div>
        {/* Status badge */}
        <div style={{ position:'absolute', top:'12px', right:'12px', display:'inline-flex', alignItems:'center', gap:'6px', background:statusBadge.bg, border:`1px solid ${statusBadge.border}`, boxShadow:statusBadge.glow, color:statusBadge.color, padding:'5px 11px', borderRadius:'999px', fontSize:'10px', fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase', backdropFilter:'blur(10px)' }}>
          <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:statusBadge.color, boxShadow:`0 0 8px ${statusBadge.color}` }} />
          {statusBadge.label}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:'24px', display:'flex', flexDirection:'column', flex:1 }}>
        <h3 style={{ fontSize:'19px', fontWeight:700, color:hovered ? C.cyan : C.text, marginBottom:'12px', transition:'color .3s ease-out', lineHeight:1.3 }}>
          {chapter.id !== 'cdo' ? `Ch${chapter.number} — ` : ''}{chapter.name}
        </h3>

        <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', fontWeight:600, color:C.muted }}>
            <span>🕐</span><span>{chapter.date_text}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', fontWeight:600, color:C.muted }}>
            <span>📍</span><span>{chapter.venue || chapter.city}{chapter.region ? `, ${chapter.region}` : ''}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom:'20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
            <span style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:C.muted }}>Progress</span>
            <span style={{ fontSize:'10px', fontWeight:700, color:C.cyan }}>{chapter.progress_percent}%</span>
          </div>
          <div style={{ height:'6px', background:'rgba(255,255,255,0.06)', borderRadius:'999px', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:'4px', background:'linear-gradient(90deg,#06b6d4,#14b8a6)', width:`${chapter.progress_percent}%`, transition:'width .5s ease-out' }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto' }}>
          {/* Avatar stack */}
          <div style={{ display:'flex', alignItems:'center' }}>
            {Array.from({ length: avatarN }, (_,i) => (
              <div key={i} style={{ width:'28px', height:'28px', borderRadius:'50%', background:`linear-gradient(135deg,${AVATAR_COLORS[i % AVATAR_COLORS.length]},${AVATAR_COLORS[(i+1) % AVATAR_COLORS.length]})`, border:`2px solid ${C.surface}`, marginLeft:i > 0 ? '-8px' : '0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:700, color:'#fff', zIndex:avatarN - i }}>
                {chapter.lead_name?.charAt(0) ?? '?'}
              </div>
            ))}
          </div>

          {/* Action button */}
          <button style={{ background:chapter.status === 'completed' ? 'rgba(20,184,166,0.12)' : 'linear-gradient(135deg,#06b6d4,#14b8a6)', color:chapter.status === 'completed' ? C.teal : '#fff', border:chapter.status === 'completed' ? `1px solid rgba(20,184,166,0.3)` : 'none', padding:'6px 16px', borderRadius:'999px', fontSize:'11px', fontWeight:700, cursor:'pointer', transition:'all .3s ease-out' }}>
            {chapter.status === 'completed' ? 'Completed ✓' : 'View Details →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── FW Status per Chapter ─────────────────────────────────────────────────────
// ── Upcoming Key Milestones ───────────────────────────────────────────────────
function UpcomingMilestonesSection({ chapters }: { chapters: Chapter[] }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const MILESTONES = [
    // Laguna — install days flagged as risk (only 1–3 days before the event)
    { date: new Date('2026-05-26'), label: 'Laguna — Onsite install visit (Day 1)', chapter: 'Laguna', type: 'risk' as const },
    { date: new Date('2026-05-27'), label: 'Laguna — Onsite install visit (Day 2)', chapter: 'Laguna', type: 'risk' as const },
    { date: new Date('2026-05-28'), label: 'Laguna — Onsite install visit (Day 3) + ICT dept comms', chapter: 'Laguna', type: 'risk' as const },
    { date: new Date('2026-05-29'), label: 'Laguna Code Camp — PUP Biñan CITE Campus', chapter: 'Laguna', type: 'event' as const },
    // Program
    { date: new Date('2026-06-30'), label: 'Q2 Report due → Sui Foundation', chapter: 'Program', type: 'deadline' as const },
  ]

  const TYPE_STYLE = {
    event:    { color: '#2DD4BF', bg: 'rgba(45,212,191,0.1)',   border: 'rgba(45,212,191,0.3)',   icon: '🎓' },
    prep:     { color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.2)',    icon: '🔧' },
    deadline: { color: '#FBBF24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)',  icon: '⏰' },
    risk:     { color: '#F87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.35)', icon: '⚠️' },
  }

  const CHAPTER_COLOR: Record<string, string> = {
    Laguna:   '#06b6d4',
    Pampanga: '#a78bfa',
    Program:  '#f59e0b',
  }

  const upcoming = MILESTONES
    .map(m => {
      const diff = Math.ceil((m.date.getTime() - today.getTime()) / 86_400_000)
      return { ...m, diff }
    })
    .filter(m => m.diff >= 0)
    .slice(0, 8)

  if (upcoming.length === 0) return null

  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.muted, marginBottom: '14px' }}>
        📅 Upcoming Key Milestones
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '8px' }}>
        {upcoming.map((m, i) => {
          const ts = TYPE_STYLE[m.type]
          const chColor = CHAPTER_COLOR[m.chapter] ?? C.muted
          const isToday   = m.diff === 0
          const isTomorrow = m.diff === 1
          const isUrgent  = m.diff <= 3
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: C.surface,
              border: `1px solid ${isUrgent ? ts.border : C.border}`,
              borderLeft: `3px solid ${ts.color}`,
              borderRadius: '12px', padding: '10px 14px',
              transition: 'border-color .2s',
            }}>
              {/* Date badge */}
              <div style={{ flexShrink: 0, textAlign: 'center', minWidth: '42px' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: isUrgent ? ts.color : C.text, lineHeight: 1 }}>
                  {isToday ? 'TODAY' : isTomorrow ? 'TMR' : `${m.diff}d`}
                </div>
                <div style={{ fontSize: '8px', color: C.muted, marginTop: '2px' }}>
                  {m.date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              {/* Divider */}
              <div style={{ width: '1px', height: '32px', background: C.border, flexShrink: 0 }} />
              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: isUrgent ? C.text : C.dim, lineHeight: 1.4 }}>
                  {ts.icon} {m.label}
                </div>
                <div style={{ marginTop: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: chColor,
                    background: `${chColor}15`, border: `1px solid ${chColor}30`,
                    borderRadius: '999px', padding: '1px 6px' }}>
                    {m.chapter}
                  </span>
                  <span style={{ fontSize: '9px', color: ts.color, fontWeight: 600,
                    background: ts.bg, border: `1px solid ${ts.border}`,
                    borderRadius: '999px', padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {m.type}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Submission Summary ────────────────────────────────────────────────────────
function SubmissionSummarySection({ isMobile }: { isMobile?: boolean }) {
  const sub = getSubmissionTotals()
  const SUB = {
    total: sub.totalSubs,
    share: '100.00%',
    verified: sub.totalVerified,
    incomplete: sub.totalIncomplete,
    rate: sub.completionRate,
  }
  const p = isMobile ? '6px 10px' : '8px 14px'
  const thStyle = { fontSize: '8px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: C.muted, padding: p, textAlign: 'left' as const, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' as const }
  const tdStyle = { fontSize: '11px', padding: p, color: C.text, borderBottom: `1px solid rgba(255,255,255,0.04)` }
  const rateColor = (r: string) => parseFloat(r) >= 80 ? C.teal : '#FBBF24'
  const bd = (isLast: boolean) => isLast ? 'none' : `1px solid rgba(255,255,255,0.04)`
  return (
    <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: `1px solid ${C.border}` }}>
      <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.muted, marginBottom: '10px' }}>📊 Submission Summary</div>
      <div style={{ borderRadius: '12px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', minWidth: '560px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={thStyle}>Chapter</th>
                <th style={{ ...thStyle, textAlign: 'right' as const }}>Reg.</th>
                <th style={{ ...thStyle, textAlign: 'right' as const }}>Submissions</th>
                <th style={{ ...thStyle, textAlign: 'right' as const }}>Share %</th>
                <th style={{ ...thStyle, textAlign: 'right' as const }}>Verified (HQ)</th>
                <th style={{ ...thStyle, textAlign: 'right' as const }}>Incomplete</th>
                <th style={{ ...thStyle, textAlign: 'right' as const }}>Rate % vs Reg.</th>
              </tr>
            </thead>
            <tbody>
              {SUBMISSION_ROWS.map((r, i) => {
                const isLast = i === SUBMISSION_ROWS.length - 1
                return (
                  <tr key={r.location} style={{ opacity: r.done ? 1 : 0.45 }}>
                    <td style={{ ...tdStyle, fontWeight: 700, borderBottom: bd(isLast) }}>
                      {!r.done && <span style={{ fontSize: '8px', color: C.muted, marginRight: '4px' }}>⏳</span>}
                      {r.location}
                      {isMobile && <div style={{ fontSize: '9px', color: C.muted, fontWeight: 400 }}>{r.date}</div>}
                      {!isMobile && <span style={{ fontSize: '9px', color: C.muted, fontWeight: 400, marginLeft: '6px' }}>{r.date}</span>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' as const, color: r.done ? C.text : C.muted, borderBottom: bd(isLast) }}>{r.done ? r.registrations : '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' as const, color: r.done ? C.cyan : C.muted, fontWeight: r.done ? 600 : 400, borderBottom: bd(isLast) }}>{r.done ? r.total : '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' as const, color: C.muted, borderBottom: bd(isLast) }}>{r.done ? r.share : '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' as const, color: r.done ? C.teal : C.muted, fontWeight: r.done ? 700 : 400, borderBottom: bd(isLast) }}>{r.done ? r.verified : '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' as const, color: r.done ? '#F87171' : C.muted, borderBottom: bd(isLast) }}>{r.done ? r.incomplete : '—'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' as const, fontWeight: r.done ? 700 : 400, color: r.done ? rateColor(r.rate) : C.muted, borderBottom: bd(isLast) }}>{r.done ? r.rate : '—'}</td>
                  </tr>
                )
              })}
              <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                <td style={{ ...tdStyle, fontWeight: 800, fontSize: '10px', borderTop: `1px solid ${C.border}`, borderBottom: 'none' }}>
                  SUBTOTAL <span style={{ fontSize: '8px', fontWeight: 400, color: C.muted }}>{sub.doneCount} done</span>
                </td>
                <td style={{ ...tdStyle, borderTop: `1px solid ${C.border}`, borderBottom: 'none', color: C.muted }}>—</td>
                <td style={{ ...tdStyle, textAlign: 'right' as const, fontWeight: 800, color: C.cyan, borderTop: `1px solid ${C.border}`, borderBottom: 'none' }}>{SUB.total}</td>
                <td style={{ ...tdStyle, textAlign: 'right' as const, fontWeight: 800, borderTop: `1px solid ${C.border}`, borderBottom: 'none' }}>{SUB.share}</td>
                <td style={{ ...tdStyle, textAlign: 'right' as const, fontWeight: 800, color: C.teal, borderTop: `1px solid ${C.border}`, borderBottom: 'none' }}>{SUB.verified}</td>
                <td style={{ ...tdStyle, textAlign: 'right' as const, fontWeight: 800, color: '#F87171', borderTop: `1px solid ${C.border}`, borderBottom: 'none' }}>{SUB.incomplete}</td>
                <td style={{ ...tdStyle, textAlign: 'right' as const, fontWeight: 800, color: C.teal, borderTop: `1px solid ${C.border}`, borderBottom: 'none' }}>{SUB.rate}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Full 15-item FW checklist per chapter (standardized template)
// Order: Bukidnon (May 6 ✓) → Iloilo (May 16 ✓) → Laguna (May 29 ✓) → Pampanga (declined) → Legazpi (Jul 30, IDS Colleges) → CDO → Tacloban (applicant, last)
const FW_CHECKLIST: Record<string, { done: boolean; label: string; note?: string }[]> = {
  bukidnon: [
    { done: true,  label: 'Invitation Letter' },
    { done: true,  label: 'Event Schedule' },
    { done: true,  label: 'DeepSurge Link' },
    { done: true,  label: 'Promo Materials' },
    { done: true,  label: 'Volunteers 2+' },
    { done: true,  label: 'Whitelist' },
    { done: true,  label: 'Seed Fund' },
    { done: true,  label: 'Slides Prep' },
    { done: true,  label: 'Mentors 10+' },
    { done: true,  label: 'Dry Run 1' },
    { done: true,  label: 'Dry Run 2' },
    { done: true,  label: 'Final Promo Push' },
    { done: true,  label: 'Post-Event Post' },
    { done: true,  label: 'Post-Report' },
    { done: true,  label: 'Liquidation' },
  ],
  iloilo: [
    { done: true,  label: 'Invitation Letter' },
    { done: true,  label: 'Event Schedule' },
    { done: true,  label: 'DeepSurge Link' },
    { done: true,  label: 'Promo Materials' },
    { done: true,  label: 'Volunteers 2+' },
    { done: true,  label: 'Whitelist' },
    { done: true,  label: 'Seed Fund' },
    { done: true,  label: 'Slides Prep' },
    { done: true,  label: 'Mentors 10+' },
    { done: true,  label: 'Dry Run 1' },
    { done: true,  label: 'Dry Run 2' },
    { done: true,  label: 'Final Promo Push' },
    { done: true,  label: 'Post-Event Post' },
    { done: true,  label: 'Post-Report' },
    { done: false, label: 'Liquidation',      note: 'Pending — submit liquidation report' },
  ],
  // Laguna — May 29 ✓ COMPLETED · 103 reg · 59 submitted · 57 verified
  laguna: [
    { done: true,  label: 'Invitation Letter' },
    { done: true,  label: 'Event Schedule' },
    { done: true,  label: 'DeepSurge Link' },
    { done: true,  label: 'Promo Materials' },
    { done: true,  label: 'Volunteers 2+' },
    { done: true,  label: 'Whitelist',        note: 'Done ✓' },
    { done: true,  label: 'Seed Fund',        note: 'Received ✓' },
    { done: true,  label: 'Slides Prep',      note: 'Done ✓' },
    { done: true,  label: 'Mentors 10+',      note: 'Finalized ✓' },
    { done: true,  label: 'Dry Run 1',        note: 'Completed ✓' },
    { done: true,  label: 'Dry Run 2',        note: 'Completed ✓' },
    { done: true,  label: 'Final Promo Push', note: 'Done ✓' },
    { done: true,  label: 'Post-Event Post',  note: 'Published ✓' },
    { done: false, label: 'Post-Report',      note: 'In progress — due Jun 3' },
    { done: false, label: 'Liquidation',      note: 'Upcoming — due Jun 5' },
  ],
  // Pampanga — Jun 24 · venue confirmed · mentors in training · pending dry runs
  pampanga: [
    { done: false, label: 'Invitation Letter', note: 'Prepare before promos' },
    { done: true,  label: 'Event Schedule',    note: 'Venue confirmed ✓' },
    { done: false, label: 'DeepSurge Link',    note: 'Before promos' },
    { done: false, label: 'Promo Materials',   note: 'Canva + branding guidelines' },
    { done: false, label: 'Volunteers 2+',     note: 'Photos/videos + publication' },
    { done: false, label: 'Whitelist',         note: 'sui.io, github, vercel, youtube…' },
    { done: false, label: 'Seed Fund',         note: 'Submit 1–2 wks before Jun 24' },
    { done: false, label: 'Slides Prep',       note: 'Before training' },
    { done: false, label: 'Mentors 10+',       note: 'Trained ×2 but not yet 10 — recruit more' },
    { done: false, label: 'Dry Run 1',         note: 'Jun 8' },
    { done: false, label: 'Dry Run 2',         note: 'Pending — after Dry Run 1' },
    { done: false, label: 'Final Promo Push',  note: 'In progress' },
    { done: false, label: 'Post-Event Post',   note: 'After event' },
    { done: false, label: 'Post-Report',       note: 'EOD after event' },
    { done: false, label: 'Liquidation',       note: 'After event' },
  ],
  // Tacloban — CANDIDATE CHAPTER · under cancellation discussion · no date · no reply
  tacloban: [
    { done: false, label: 'Invitation Letter', note: '⛔ Cancellation discussion — no date' },
    { done: false, label: 'Event Schedule',    note: '⛔ No reply from venue' },
    { done: false, label: 'DeepSurge Link',    note: 'Blocked — candidate only' },
    { done: false, label: 'Promo Materials',   note: 'Blocked' },
    { done: false, label: 'Volunteers 2+',     note: 'Blocked' },
    { done: false, label: 'Whitelist',         note: 'Blocked' },
    { done: false, label: 'Seed Fund',         note: 'Blocked' },
    { done: false, label: 'Slides Prep',       note: 'Blocked' },
    { done: false, label: 'Mentors 10+',       note: 'Blocked' },
    { done: false, label: 'Dry Run 1',         note: 'Blocked' },
    { done: false, label: 'Dry Run 2',         note: 'Blocked' },
    { done: false, label: 'Final Promo Push',  note: 'Blocked' },
    { done: false, label: 'Post-Event Post',   note: 'Blocked' },
    { done: false, label: 'Post-Report',       note: 'Blocked' },
    { done: false, label: 'Liquidation',       note: 'Blocked' },
  ],
  // CDO — NOT moving · can't close a classroom venue
  cdo: [
    { done: false, label: 'Invitation Letter', note: 'Pending — decision by Mon Jun 30' },
    { done: false, label: 'Event Schedule',    note: 'Not moving · cannot close a classroom venue · decision pending Mon Jun 30' },
    { done: false, label: 'DeepSurge Link',    note: 'Blocked — venue not confirmed' },
    { done: false, label: 'Promo Materials',   note: 'Blocked' },
    { done: false, label: 'Volunteers 2+',     note: 'Blocked' },
    { done: false, label: 'Whitelist',         note: 'Blocked' },
    { done: false, label: 'Seed Fund',         note: 'Blocked' },
    { done: false, label: 'Slides Prep',       note: 'Blocked' },
    { done: false, label: 'Mentors 10+',       note: 'Blocked' },
    { done: false, label: 'Dry Run 1',         note: 'Blocked' },
    { done: false, label: 'Dry Run 2',         note: 'Blocked' },
    { done: false, label: 'Final Promo Push',  note: 'Blocked' },
    { done: false, label: 'Post-Event Post',   note: 'Blocked' },
    { done: false, label: 'Post-Report',       note: 'Blocked' },
    { done: false, label: 'Liquidation',       note: 'If CDO drops: ask CDO to ship merch' },
  ],
  // Legazpi — Jul 30, 2026 · IDS Colleges · 5th Code Camp
  legazpi: [
    { done: false, label: 'Invitation Letter' },
    { done: false, label: 'Event Schedule' },
    { done: false, label: 'DeepSurge Link' },
    { done: false, label: 'Promo Materials' },
    { done: false, label: 'Volunteers 2+' },
    { done: false, label: 'Training Schedule' },
    { done: false, label: 'Whitelist' },
    { done: false, label: 'Seed Fund' },
    { done: false, label: 'Slides Prep' },
    { done: false, label: 'Mentors 10+' },
    { done: false, label: 'Merch Shipment' },
    { done: false, label: 'Dry Run 1' },
    { done: false, label: 'Dry Run 2' },
    { done: false, label: 'Final Promo Push' },
    { done: false, label: 'Post-Event Post' },
    { done: false, label: 'Post-Report' },
    { done: false, label: 'Liquidation' },
  ],
}

// Sort order: active/completed by date → declined → tbc/no-date → Tacloban (applicant) always last
function sortChaptersForFw(chapters: Chapter[]): Chapter[] {
  function tier(c: Chapter): number {
    if (c.city.toLowerCase().includes('tacloban') || c.status === 'applicant') return 3
    if (c.status === 'declined') return 2
    return 1
  }
  return [...chapters].sort((a, b) => {
    const ta = tier(a), tb = tier(b)
    if (ta !== tb) return ta - tb
    const aDate = a.date_iso ? new Date(a.date_iso).getTime() : Infinity
    const bDate = b.date_iso ? new Date(b.date_iso).getTime() : Infinity
    return aDate - bDate
  })
}

function FwStatusSection({ chapters, onShowChapter, isMobile }: { chapters: Chapter[]; onShowChapter: (id: string) => void; isMobile: boolean }) {
  if (chapters.length === 0) return null
  const sorted = sortChaptersForFw(chapters)
  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.muted }}>FW Status · All Chapters</div>
        <div style={{ fontSize: '10px', color: C.muted }}>Sorted by event date · Click to view details</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sorted.map(c => {
          const badge      = getChapterStatusBadge(c.status)
          const pct        = c.progress_percent ?? 0
          const rawCityKey = c.city.toLowerCase()
          // Normalise legacy 'angeles' DB value → 'pampanga' key
          const cityKey    = rawCityKey === 'angeles' ? 'pampanga' : rawCityKey === 'cagayan de oro' ? 'cdo' : rawCityKey
          const isTacloban = cityKey.includes('tacloban')
          const fwItems    = FW_CHECKLIST[cityKey] ?? []
          const fwDone     = fwItems.filter(i => i.done).length
          const fwPct      = fwItems.length > 0 ? Math.round((fwDone / fwItems.length) * 100) : 0
          return (
            <div key={c.id} onClick={() => onShowChapter(c.id)}
              style={{ background: C.surface, border: `1px solid ${isTacloban ? 'rgba(248,113,113,0.35)' : C.border}`, borderRadius: '14px', padding: '14px 18px', cursor: 'pointer', transition: 'border-color .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = isTacloban ? 'rgba(248,113,113,0.65)' : 'rgba(6,182,212,0.3)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = isTacloban ? 'rgba(248,113,113,0.35)' : C.border }}
            >
              {/* Top row */}
              {isMobile ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                      {isTacloban && <span style={{ fontSize: '12px', flexShrink: 0 }}>⚠️</span>}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.id !== 'cdo' && c.id !== 'legazpi' ? `Ch${c.number} · ` : ''}{displayCity(c.city)}</div>
                        {isTacloban
                          ? <div style={{ fontSize: '9px', color: '#FBBF24', fontWeight: 700, marginTop: '1px' }}>🔴 Cancellation · No date · No reply</div>
                          : c.date_text ? <div style={{ fontSize: '9px', color: C.muted, marginTop: '1px' }}>{c.date_text}</div> : null}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, padding: '2px 8px', borderRadius: '999px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: badge.color, flexShrink: 0 }} />{badge.label}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: isTacloban ? '#F87171' : pct >= 80 ? C.teal : pct >= 40 ? C.cyan : C.muted }}>{pct}%</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '999px', width: `${pct}%`, transition: 'width .5s ease-out',
                      background: isTacloban ? 'linear-gradient(90deg,#F87171,#f59e0b)' : pct >= 80 ? 'linear-gradient(90deg,#14b8a6,#2DD4BF)' : pct >= 40 ? 'linear-gradient(90deg,#06b6d4,#14b8a6)' : 'linear-gradient(90deg,#475569,#64748b)' }} />
                  </div>
                </>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 80px 130px', alignItems: 'center', gap: '16px' }}>
                  {/* Name + date/risk */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    {isTacloban && <span style={{ fontSize: '13px', flexShrink: 0 }}>⚠️</span>}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.id !== 'cdo' && c.id !== 'legazpi' ? `Ch${c.number} · ` : ''}{displayCity(c.city)}</div>
                      {isTacloban
                        ? <div style={{ fontSize: '9px', color: '#FBBF24', fontWeight: 700, marginTop: '1px' }}>🔴 CANCELLATION DISCUSSION · Candidate · No date · No reply</div>
                        : c.date_text ? <div style={{ fontSize: '9px', color: C.muted, marginTop: '1px' }}>{c.date_text}</div> : null}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '999px', width: `${pct}%`, transition: 'width .5s ease-out',
                        background: isTacloban ? 'linear-gradient(90deg,#F87171,#f59e0b)' : pct >= 80 ? 'linear-gradient(90deg,#14b8a6,#2DD4BF)' : pct >= 40 ? 'linear-gradient(90deg,#06b6d4,#14b8a6)' : 'linear-gradient(90deg,#475569,#64748b)' }} />
                    </div>
                  </div>
                  {/* % */}
                  <div style={{ fontSize: '13px', fontWeight: 800, textAlign: 'right', color: isTacloban ? '#F87171' : pct >= 80 ? C.teal : pct >= 40 ? C.cyan : C.muted }}>{pct}%</div>
                  {/* Status badge */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color, padding: '3px 10px', borderRadius: '999px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: badge.color, flexShrink: 0 }} />{badge.label}
                    </span>
                  </div>
                </div>
              )}

              {/* FW checklist pills */}
              {fwItems.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center' }}>
                  <span style={{ fontSize: '9px', color: fwPct === 100 ? C.teal : fwPct >= 90 ? '#FBBF24' : C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '4px' }}>
                    FW {fwDone}/{fwItems.length} {fwPct === 100 ? '✓' : `(${fwPct}%)`}
                  </span>
                  {(isMobile ? fwItems.slice(0, 8) : fwItems).map((item, idx) => (
                    <span key={idx}
                      title={item.note ?? ''}
                      style={{ fontSize: '9px', fontWeight: 600, padding: '2px 7px', borderRadius: '999px',
                        background: item.done ? 'rgba(20,184,166,0.12)' : isTacloban ? 'rgba(248,113,113,0.08)' : 'rgba(100,116,139,0.08)',
                        color: item.done ? '#2DD4BF' : isTacloban ? '#F87171' : C.muted,
                        border: `1px solid ${item.done ? 'rgba(45,212,191,0.25)' : isTacloban ? 'rgba(248,113,113,0.2)' : 'rgba(100,116,139,0.15)'}`,
                        cursor: item.note ? 'help' : 'default',
                      }}>
                      {item.done ? '✓ ' : ''}{item.label}
                    </span>
                  ))}
                  {isMobile && fwItems.length > 8 && (
                    <span style={{ fontSize: '9px', color: C.muted, padding: '2px 7px', borderRadius: '999px', background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.15)' }}>
                      +{fwItems.length - 8} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Program Summary ───────────────────────────────────────────────────────────
function ProgramSummarySection({ kpis, risks, chapters, onSwitch, onOpenRisks, isMobile }: {
  kpis: Kpi[]
  risks: Risk[]
  chapters: Chapter[]
  onSwitch: (t: TabId) => void
  onOpenRisks: () => void
  isMobile: boolean
}) {
  const kpiMap = Object.fromEntries(kpis.map(k => [k.key, k]))
  const avgPct = chapters.length > 0
    ? Math.round(chapters.reduce((sum, c) => sum + (c.progress_percent ?? 0), 0) / chapters.length)
    : 0
  const completionRateVal = kpiMap['completion_rate']?.value ?? `${avgPct}%`
  const openRisks = risks.filter(r => r.status !== 'resolved')
  const highRisks = openRisks.filter(r => r.severity === 'high')

  const KEY_ACHIEVEMENTS = [
    { icon: '🎓', text: `${chapters.filter(c => c.status === 'completed').length} chapter(s) completed` },
    { icon: '👥', text: `${kpiMap['total_attendees']?.value ?? '276~'} total attendees reached` },
    { icon: '🧑‍💻', text: `${kpiMap['students_trained']?.value ?? '–'} students trained` },
    { icon: '🚀', text: `${kpiMap['confirmed_deployments']?.value ?? '–'} confirmed Sui deployments` },
    { icon: '📍', text: 'Manila — 128 registered, 60 submitted, 29 verified (Letran, Mar 28)' },
    { icon: '📍', text: 'Bukidnon — 136 registered, 80 submitted, 72 verified (BSU, May 6)' },
    { icon: '🆕', text: 'Bukidnon — first-ever BYOD format + Pre-Installation Day (commitment filter)' },
    { icon: '📍', text: 'Iloilo — 170 registered, 169 submitted, 164 verified (CPU, May 16)' },
    { icon: '✅', text: 'Laguna — PUP Biñan CITE Campus, May 29 ✓ · 103 registered · 59 submitted · 57 verified (55.34% rate)' },
    { icon: '📊', text: '4 chapters completed · 368 total submissions · 322 verified across all done chapters' },
    { icon: '📣', text: 'Laguna — post-event report in progress · liquidation due Jun 5' },
  ]

  const KEY_RISKS = [
    { text: 'Legazpi — confirmed 5th Code Camp · Jul 30, 2026 · IDS Colleges · training schedule and merch shipment still pending', urgent: true, high: true  },
    { text: 'Laguna — EOD/post-report done ✓ · liquidation still pending', urgent: false, high: true  },
    ...highRisks.filter(r => !(r.chapter_tag ?? '').toLowerCase().includes('tacloban') && !(r.chapter_tag ?? '').toLowerCase().includes('cdo') && !(r.chapter_tag ?? '').toLowerCase().includes('laguna')).slice(0, 2)
      .map(r => ({ text: `${r.chapter_tag ? r.chapter_tag + ' — ' : ''}${r.title}`, urgent: false, high: true })),
    ...openRisks.filter(r => r.severity === 'medium').slice(0, 2)
      .map(r => ({ text: `${r.chapter_tag ? r.chapter_tag + ' — ' : ''}${r.title}`, urgent: false, high: false })),
    { text: 'Iloilo — 19 submissions flagged (17 private Vercel links, follow-up needed)', urgent: false, high: false },
    { text: 'Tacloban — under cancellation discussion · candidate chapter · no date · no reply', urgent: true,  high: true  },
  ]

  const KEY_NEXT_STEPS = [
    { urgent: true,  text: 'Legazpi — confirmed Jul 30, 2026 · IDS Colleges · plan training schedule and arrange merch shipment' },
    { urgent: false, text: 'Laguna — liquidation still pending · ensure completion' },
    { urgent: true,  text: 'Tacloban — cancellation discussion · decide to activate or formally remove' },
    { urgent: false, text: 'Iloilo — submit liquidation report (pending)' },
    { urgent: false, text: 'Iloilo — resolve 19 flagged submissions (17 private Vercel links)' },
    { urgent: false, text: 'All chapters — whitelist: sui.io, suiscan.xyz, github.com, vercel.app, youtube.com' },
    { urgent: false, text: 'Q2 report — finalize all data for Sui Foundation (due Jun 30)' },
  ]

  return (
    <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '190px 1fr 1fr 1fr', gap: '16px', alignItems: 'stretch' }}>

      {/* Program % donut */}
      <div style={{ background: C.surface, borderRadius: '20px', padding: '22px 18px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.muted, textAlign: 'center' }}>Program Progress</div>
        <div style={{ position: 'relative', width: '88px', height: '88px', margin: '6px 0' }}>
          <svg width="88" height="88" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="44" cy="44" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle cx="44" cy="44" r="34" fill="none" stroke="url(#pg2)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - avgPct / 100)}`}
              style={{ transition: 'stroke-dashoffset .8s ease-out' }} />
            <defs>
              <linearGradient id="pg2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '17px', fontWeight: 800, color: C.cyan }}>{avgPct}%</span>
          </div>
        </div>
        <div style={{ fontSize: '10px', color: C.dim, textAlign: 'center' }}>avg chapter progress</div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: C.teal, textAlign: 'center' }}>{completionRateVal} completion</div>
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
          {[...chapters].sort((a, b) => {
            if (b.progress_percent !== a.progress_percent) return b.progress_percent - a.progress_percent
            const isCdo = (c: Chapter) => c.city.toLowerCase().includes('cagayan') || c.id === 'cdo'
            if (isCdo(a) && !isCdo(b)) return -1
            if (isCdo(b) && !isCdo(a)) return 1
            return 0
          }).map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '8px', color: C.muted, width: '46px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayCity(c.city)}</span>
              <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${c.progress_percent}%`, borderRadius: '999px',
                  background: c.city.toLowerCase().includes('tacloban') ? '#F87171' : 'linear-gradient(90deg,#06b6d4,#14b8a6)' }} />
              </div>
              <span style={{ fontSize: '8px', color: C.muted, width: '22px', textAlign: 'right', flexShrink: 0 }}>{c.progress_percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Achievements */}
      <div style={{ background: C.surface, borderRadius: '20px', padding: '20px', border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.muted, marginBottom: '12px' }}>🏆 Key Achievements</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {KEY_ACHIEVEMENTS.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
              <span style={{ fontSize: '11px', flexShrink: 0, marginTop: '1px' }}>{a.icon}</span>
              <span style={{ fontSize: '11px', color: C.text, lineHeight: 1.5 }}>{a.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Risks */}
      <div onClick={onOpenRisks}
        style={{ background: C.surface, borderRadius: '20px', padding: '20px', border: '1px solid rgba(248,113,113,0.25)', cursor: 'pointer', transition: 'border-color .2s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(248,113,113,0.5)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(248,113,113,0.25)' }}
      >
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#F87171', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          ⚠ Key Risks <span style={{ fontSize: '9px', opacity: 0.55 }}>↗</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {KEY_RISKS.slice(0, 7).map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
              <span style={{ fontSize: '10px', flexShrink: 0, marginTop: '2px', color: r.urgent ? '#F87171' : r.high ? '#FBBF24' : C.muted }}>
                {r.urgent ? '🔴' : r.high ? '🟡' : '○'}
              </span>
              <span style={{ fontSize: '11px', lineHeight: 1.5, color: r.urgent ? '#fca5a5' : r.high ? '#fde68a' : C.dim }}>{r.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Next Steps */}
      <div style={{ background: C.surface, borderRadius: '20px', padding: '20px', border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.muted, marginBottom: '12px' }}>🎯 Key Next Steps</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {KEY_NEXT_STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
              <span style={{ fontSize: '9px', fontWeight: 800, flexShrink: 0, marginTop: '3px', minWidth: '14px', color: s.urgent ? '#F87171' : C.cyan }}>
                {s.urgent ? '!' : `${i + 1}`}
              </span>
              <span style={{ fontSize: '11px', lineHeight: 1.5, color: s.urgent ? '#fca5a5' : C.text, fontWeight: s.urgent ? 600 : 400 }}>{s.text}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// ── Bento Section ─────────────────────────────────────────────────────────────
function BentoSection({ kpis, risks, chapters, onSwitch, onOpenRisks, isMobile }: { kpis: Kpi[]; risks: Risk[]; chapters: Chapter[]; onSwitch: (t: TabId) => void; onOpenRisks: () => void; isMobile: boolean }) {
  const kpiMap       = Object.fromEntries(kpis.map(k => [k.key, k]))
  const openRisks    = risks.filter(r => r.status === 'open').length
  const completedCnt = chapters.filter(c => c.status === 'completed').length

  // Calculate days left in Q2 2026 (ends June 30, 2026)
  const q2End = new Date(2026, 5, 30) // Month is 0-indexed, so 5 = June
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  q2End.setHours(0, 0, 0, 0)
  const daysLeftQ2 = Math.ceil((q2End.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const daysLeftStr = daysLeftQ2 > 0 ? `${daysLeftQ2}d` : '0d'

  // Computed from SUBMISSION_ROWS — synced with event discovery table
  const sub = getSubmissionTotals()

  const skillItems = [
    { icon:'📊', label:'Code Camps',           value:kpiMap['code_camps']?.value           ?? '–',  color:C.cyan },
    { icon:'📋', label:'Code Camp Attendees',  value: String(sub.totalRegistrations),              color:C.teal },
    { icon:'🧑‍💻', label:'Mentors Trained',   value:kpiMap['trained_mentors']?.value      ?? '–',  color:C.cyan },
    { icon:'🚀', label:'Mainnet Deployments and Form Submissions', value: String(sub.totalSubs), color:C.teal },
    { icon:'✅', label:'Verified Completion (Public Vercel + Object ID Provided)', value: String(sub.totalVerified), color:'#2DD4BF' },
    { icon:'📈', label:'Completion vs Reg.',   value: sub.completionRate,                           color:'#a78bfa' },
  ]

  return (
    <div style={{ marginTop:'40px' }}>

      {/* Program KPIs — full width */}
      <div style={{ background:C.surface, borderRadius:'28px', padding:'34px', border:`1px solid ${C.border}` }}>
        <div style={{ marginBottom:'26px' }}>
          <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.15em', color:C.muted, marginBottom:'6px' }}>Program KPIs</div>
          <h3 style={{ fontSize:'24px', fontWeight:800, color:C.text }}>Build Beyond DEVCON <span style={{ color:C.cyan }}>× Sui</span></h3>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap:'14px' }}>
          {skillItems.map(item => (
            <div key={item.label} style={{ background:C.bg, borderRadius:'16px', padding:'20px', border:`1px solid ${C.border}`, display:'flex', alignItems:'flex-start', gap:'14px', minHeight:'110px' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'12px', flexShrink:0, background:`linear-gradient(135deg,${item.color}33,${item.color}11)`, border:`1px solid ${item.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>
                {item.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight:800, color:item.color, lineHeight:1 }}>{item.value}</div>
                <div style={{ fontSize:'9px', fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginTop:'7px', lineHeight:1.3 }}>{item.label}</div>
              </div>
            </div>
          ))}
        </div>
        <SubmissionSummarySection isMobile={isMobile} />
      </div>

    </div>
  )
}

// ── Mobile Bottom Nav ─────────────────────────────────────────────────────────
function MobileBottomNav({ activeTab, onSwitch }: { activeTab: TabId; onSwitch: (t: TabId) => void }) {
  const items: { id: TabId; icon: string; label: string }[] = [
    { id: 'overview',  icon: '◈', label: 'Overview'  },
    { id: 'kpi',       icon: '◉', label: 'KPI'       },
    { id: 'chapters',  icon: '⊞', label: 'Chapters'  },
    { id: 'risks',     icon: '⚠', label: 'Risks'     },
    { id: 'settings',  icon: '⚙', label: 'Settings'  },
  ]
  return (
    <nav style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:195, height:'60px', background:'rgba(15,23,42,0.98)', backdropFilter:'blur(16px)', borderTop:'1px solid #1e293b', display:'flex', alignItems:'center' }}>
      {items.map(item => {
        const isActive = activeTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => onSwitch(item.id)}
            style={{ flex:1, height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'3px', background:'none', border:'none', cursor:'pointer', color: isActive ? C.cyan : C.muted, transition:'color .2s' }}
          >
            <span style={{ fontSize:'16px', lineHeight:1 }}>{item.icon}</span>
            <span style={{ fontSize:'9px', fontWeight: isActive ? 700 : 400, textTransform:'uppercase', letterSpacing:'0.05em' }}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ activeTab, activeChapterId, chapters, onSwitch, onShowChapter, onLogout, isMobile, isOpen, onClose }: {
  activeTab: TabId
  activeChapterId: string | null
  chapters: Chapter[]
  onSwitch: (t: TabId) => void
  onShowChapter: (id: string) => void
  onLogout: () => void
  isMobile: boolean
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <aside style={{ position:'fixed', left: isMobile && !isOpen ? '-280px' : 0, top:0, bottom:0, width:'280px', background:C.surface, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', zIndex:200, overflowY:'auto', transition:'left .3s ease-out' }}>

      {/* Logo */}
      <div style={{ padding:'24px 20px', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'44px', height:'44px', borderRadius:'50%', overflow:'hidden', flexShrink:0, boxShadow:'0 0 0 2px rgba(139,92,246,0.4)' }}>
            <Image src="/devcon-logo.jpg" alt="DEVCON logo" width={44} height={44} unoptimized style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
          <div>
            <div style={{ fontSize:'15px', fontWeight:700, color:C.text, lineHeight:1.2 }}>CodeCamp HQ</div>
            <div style={{ fontSize:'11px', color:C.muted, marginTop:'2px' }}>Sui × DEVCON</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex:1, padding:'16px 12px', overflowY:'auto' }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.label} style={{ marginBottom:'24px' }}>
            <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.15em', color:'#475569', padding:'0 8px', marginBottom:'6px' }}>
              {section.label}
            </div>
            {section.items.map(item => {
              const isActive = activeTab === item.id && !activeChapterId
              return (
                <button
                  key={item.id}
                  onClick={() => { onSwitch(item.id); if (isMobile) onClose() }}
                  style={{ display:'flex', alignItems:'center', gap:'10px', width:'100%', padding:'9px 10px', borderRadius:'10px', background:isActive ? 'rgba(6,182,212,0.1)' : 'transparent', border:'none', cursor:'pointer', color:isActive ? C.cyan : C.dim, fontSize:'13px', fontWeight:isActive ? 600 : 400, transition:'all .2s', textAlign:'left', marginBottom:'2px' }}
                >
                  <span style={{ fontSize:'14px', flexShrink:0 }}>{item.icon}</span>
                  {item.label}
                </button>
              )
            })}
          </div>
        ))}

        {/* Chapter items */}
        {chapters.length > 0 && (
          <div>
            <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.15em', color:'#475569', padding:'0 8px', marginBottom:'6px' }}>Chapters</div>
            {chapters.map(c => {
              const cat      = getCat(c.number)
              const isActive = activeChapterId === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => { onShowChapter(c.id); if (isMobile) onClose() }}
                  style={{ display:'flex', alignItems:'center', gap:'8px', width:'100%', padding:'8px 10px', borderRadius:'10px', background:isActive ? 'rgba(6,182,212,0.1)' : 'transparent', border:'none', cursor:'pointer', color:isActive ? C.cyan : C.dim, fontSize:'12px', fontWeight:isActive ? 600 : 400, transition:'all .2s', textAlign:'left', marginBottom:'2px' }}
                >
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:cat.color, flexShrink:0 }} />
                  {c.id !== 'cdo' ? `Ch${c.number} ` : ''}{displayCity(c.city)}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div style={{ padding:'16px', borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
        <button
          onClick={onLogout}
          style={{ width:'100%', display:'inline-flex', alignItems:'center', justifyContent:'center', background:'rgba(225,29,72,0.08)', border:'1px solid rgba(225,29,72,0.25)', borderRadius:'10px', padding:'9px 12px', color:'#e11d48', fontSize:'12px', fontWeight:700, cursor:'pointer', transition:'all .2s' }}
        >
          Logout
        </button>
      </div>
    </aside>
  )
}

// ── Top Header ────────────────────────────────────────────────────────────────
function TopHeader({ calendarOpen, onToggleCalendar, isMobile, onToggleSidebar }: { calendarOpen: boolean; onToggleCalendar: () => void; isMobile: boolean; onToggleSidebar: () => void }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const q2DaysLeft = now ? Math.ceil((Q2_DEADLINE.getTime() - now.getTime()) / 86_400_000) : null
  const q2Label = q2DaysLeft === null
    ? 'Syncing...'
    : q2DaysLeft > 0
      ? `${q2DaysLeft}d to Q2 End`
      : q2DaysLeft === 0
        ? 'Q2 Ends Today'
        : 'Q2 Complete'

  const hh = now ? String(now.getHours()).padStart(2, '0') : '--'
  const mm = now ? String(now.getMinutes()).padStart(2, '0') : '--'
  const ss = now ? String(now.getSeconds()).padStart(2, '0') : '--'
  const dayLabel = now
    ? `${DAY_FULL[now.getDay()].slice(0,3).toUpperCase()} ${now.getDate()} ${MONTH_SHORT[now.getMonth()]}`
    : '--- -- ---'
  const yearLabel = now ? String(now.getFullYear()) : '----'

  if (isMobile) {
    return (
      <header style={{ position:'sticky', top:0, zIndex:190, height:'56px', background:'rgba(2,6,23,0.97)', backdropFilter:'blur(16px)', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', flexShrink:0 }}>
        <button onClick={onToggleSidebar} style={{ background:'none', border:'none', color:C.dim, fontSize:'20px', cursor:'pointer', padding:'4px 6px', lineHeight:1, display:'flex', alignItems:'center' }}>☰</button>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'linear-gradient(135deg,#06b6d4,#14b8a6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:800, color:'#fff' }}>D</div>
          <span style={{ fontSize:'13px', fontWeight:700, color:C.text }}>CodeCamp HQ</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(6,182,212,0.08)', border:'1px solid rgba(6,182,212,0.2)', borderRadius:'999px', padding:'4px 10px' }}>
          <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:C.cyan, animation:'pulse 2s infinite' }} />
          <span style={{ fontSize:'10px', fontWeight:700, color:C.cyan }}>{q2Label}</span>
        </div>
      </header>
    )
  }

  return (
    <header style={{ position:'sticky', top:0, zIndex:90, height:'80px', background:'rgba(2,6,23,0.95)', backdropFilter:'blur(16px)', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', flexShrink:0 }}>

      {/* Profile trigger */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'linear-gradient(135deg,#06b6d4,#14b8a6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:800, color:'#fff', flexShrink:0 }}>D</div>
        <div>
          <div style={{ fontSize:'11px', color:C.muted }}>DEVCON</div>
        </div>
      </div>

      {/* Live badge */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(6,182,212,0.08)', border:'1px solid rgba(6,182,212,0.2)', borderRadius:'999px', padding:'6px 14px' }}>
        <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:C.cyan, animation:'pulse 2s infinite' }} />
        <span style={{ fontSize:'11px', fontWeight:700, color:C.cyan, textTransform:'uppercase', letterSpacing:'0.1em' }}>
          Live · Q2 · {q2Label}
        </span>
      </div>

      {/* Right controls */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        {/* Calendar trigger */}
        <button
          onClick={onToggleCalendar}
          style={{ display:'flex', alignItems:'center', gap:'10px', background:calendarOpen ? 'rgba(6,182,212,0.12)' : 'rgba(15,23,42,0.8)', border:`1px solid ${calendarOpen ? 'rgba(6,182,212,0.4)' : C.border}`, borderRadius:'12px', padding:'9px 14px', cursor:'pointer', transition:'all .3s ease-out', minWidth:'200px' }}
        >
          <div style={{ lineHeight:1.3 }}>
            <div style={{ fontSize:'14px', fontWeight:700, color:C.teal, textTransform:'uppercase', letterSpacing:'0.06em' }}>
              {dayLabel}
            </div>
            <div style={{ fontSize:'10px', color:C.muted, fontFamily:'monospace', letterSpacing:'0.05em', marginTop:'1px' }}>
              {hh}:{mm}:{ss} · {yearLabel}
            </div>
          </div>
          <div style={{ marginLeft:'auto', width:'32px', height:'32px', borderRadius:'8px', background:'rgba(6,182,212,0.1)', border:'1px solid rgba(6,182,212,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px' }}>
            📅
          </div>
        </button>
      </div>
    </header>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
interface DashboardProps {
  initialChapterId?: string
}

export default function Dashboard({ initialChapterId }: DashboardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [calendarOpen, setCalendarOpen] = useState(false)
  const [riskPanelOpen, setRiskPanelOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const activeTab = getTabFromQuery(searchParams.get('tab'))

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const [chapters,   setChapters]   = useState<Chapter[]>([])
  const [kpis,       setKpis]       = useState<Kpi[]>([])
  const [risks,      setRisks]      = useState<Risk[]>([])
  const [contacts,   setContacts]   = useState<Contact[]>([])
  const [merchItems, setMerchItems] = useState<MerchItem[]>([])
  const [links,      setLinks]      = useState<ResourceLink[]>([])

  const refresh = useCallback(() => {
    return Promise.all([
      fetchChapters(), fetchKpis(), fetchRisks(),
      fetchContacts(), fetchMerchItems(), fetchLinks(),
    ]).then(([c, k, r, co, m, l]) => {
      setChapters(c); setKpis(k);    setRisks(r)
      setContacts(co); setMerchItems(m); setLinks(l)
    })
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // Poll for stats updates every 30 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      refresh()
    }, 30000) // 30 seconds

    return () => clearInterval(pollInterval)
  }, [refresh])

  const updateTabUrl = useCallback((tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'overview') params.delete('tab')
    else params.set('tab', tab)

    const query = params.toString()
    const basePath = pathname === '/' ? '/' : pathname
    router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false })
  }, [pathname, router, searchParams])

  function showChapter(id: string) {
    router.push('/chapters/' + id)
  }

  async function logout() {
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
    router.replace('/auth/login')
    router.refresh()
  }

  function switchTab(tab: TabId) {
    if (initialChapterId) {
      router.push(tab === 'overview' ? '/' : `/?tab=${tab}`)
      return
    }
    updateTabUrl(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function resolveRisk(id: string) {
    setRisks(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved' as const } : r))
    const res = await fetch('/api/risks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'resolved' }),
    })
    if (!res.ok) refresh()
  }

  const activeChapterId = initialChapterId ?? null

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:C.bg, fontFamily:"'Plus Jakarta Sans', sans-serif" }}>

      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:199 }} />
      )}

      <Sidebar
        activeTab={activeTab}
        activeChapterId={activeChapterId}
        chapters={chapters}
        onSwitch={switchTab}
        onShowChapter={showChapter}
        onLogout={logout}
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div style={{ flex:1, marginLeft: isMobile ? 0 : '280px', display:'flex', flexDirection:'column', minHeight:'100vh' }}>

        <TopHeader calendarOpen={calendarOpen} onToggleCalendar={() => setCalendarOpen(v => !v)} isMobile={isMobile} onToggleSidebar={() => setSidebarOpen(v => !v)} />

        <main style={{ flex:1, padding: isMobile ? '20px 16px 80px' : '46px 48px 54px', overflowX:'hidden' }}>
          {initialChapterId ? (
            chapters.length === 0 ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'400px', color:'#475569', fontSize:'13px' }}>
                Loading chapter…
              </div>
            ) : (
              <ChapterDetailPanel
                chapterId={initialChapterId}
                chapters={chapters}
                onBack={() => router.push('/')}
                onRefresh={refresh}
              />
            )

          ) : activeTab === 'overview' ? (
            <>
              {/* Hero section header */}
              <div style={{ marginBottom:'34px', maxWidth:'980px' }}>
                <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.15em', color:C.muted, marginBottom:'8px' }}>Event Discovery</div>
                <h1 style={{ fontSize: isMobile ? '26px' : '40px', fontWeight:800, color:C.text, marginBottom:'10px', lineHeight:1.1 }}>
                  Build Beyond DEVCON <span style={{ color:C.cyan }}>× Sui</span>
                </h1>
                <p style={{ fontSize:'16px', color:C.dim, lineHeight:1.7 }}>6 chapters across the Philippines · Q2 2026</p>
              </div>

              {/* Bento widgets — stats first */}
              <BentoSection kpis={kpis} risks={risks} chapters={chapters} onSwitch={switchTab} onOpenRisks={() => setRiskPanelOpen(true)} isMobile={isMobile} />

              {/* FW Status per Chapter */}
              <FwStatusSection chapters={chapters} onShowChapter={showChapter} isMobile={isMobile} />

              {/* Program Summary — KPI %, Achievements, Risks, Next Steps */}
              <ProgramSummarySection kpis={kpis} risks={risks} chapters={chapters} onSwitch={switchTab} onOpenRisks={() => setRiskPanelOpen(true)} isMobile={isMobile} />

              {/* Upcoming Key Milestones */}
              <UpcomingMilestonesSection chapters={chapters} />

              {/* 3-column event grid */}
              <div style={{ marginTop:'54px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
                  <div>
                    <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.15em', color:C.muted, marginBottom:'4px' }}>All Chapters</div>
                    <h2 style={{ fontSize:'28px', fontWeight:800, color:C.text }}>Event Directory</h2>
                  </div>
                  <div style={{ fontSize:'12px', color:C.muted }}>{chapters.length} events · Q2 2026</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit,minmax(320px,1fr))', gap: isMobile ? '16px' : '24px' }}>
                  {chapters.length > 0
                    ? chapters.map(c => <EventCard key={c.id} chapter={c} onSelect={showChapter} />)
                    : Array.from({ length: 6 }).map((_,i) => (
                        <div key={i} style={{ height:'430px', background:C.surface, borderRadius:'28px', border:`1px solid ${C.border}`, animation:'pulse 1.5s infinite', opacity:0.5 }} />
                      ))
                  }
                </div>
              </div>
            </>

          ) : (
            <div className="animate-fade-in">
              {activeTab === 'kpi'        && <KpiPanel kpis={kpis} chapters={chapters} setKpis={setKpis} isMobile={isMobile} />}
              {activeTab === 'milestones' && <MilestonesPanel />}
              {activeTab === 'insights'   && <InsightsPanel />}
              {activeTab === 'chapters'   && <ChaptersPanel chapters={chapters} onShowChapter={showChapter} onRefresh={refresh} isMobile={isMobile} />}
              {activeTab === 'risks'      && <RisksPanel risks={risks} setRisks={setRisks} onRefresh={refresh} isMobile={isMobile} />}
              {activeTab === 'merch'      && <MerchPanel merch_items={merchItems} chapters={chapters} onRefresh={refresh} isMobile={isMobile} />}
              {activeTab === 'links'      && <LinksPanel links={links} chapters={chapters} contacts={contacts} onShowChapter={showChapter} setLinks={setLinks} onRefresh={refresh} isMobile={isMobile} />}
              {activeTab === 'contacts'   && <ContactsPanel contacts={contacts} onRefresh={refresh} isMobile={isMobile} />}
              {activeTab === 'content'    && <ContentPanel />}
              {activeTab === 'settings'   && <SettingsPanel />}
            </div>
          )}
        </main>

        <footer style={{ textAlign:'center', fontSize:'11px', color:C.muted, padding:'24px 32px', borderTop:`1px solid ${C.border}` }}>
          CodeCamp HQ · Build Beyond DEVCON PH · Q2 2026 · Report Due{' '}
          <span style={{ color:'#f59e0b' }}>June 30, 2026</span> → Sui Foundation
        </footer>
      </div>

      {isMobile && <MobileBottomNav activeTab={activeTab} onSwitch={switchTab} />}

      {calendarOpen && <CalendarModal chapters={chapters} onClose={() => setCalendarOpen(false)} isMobile={isMobile} />}

      <RiskDrilldownPanel
        open={riskPanelOpen}
        risks={risks}
        onClose={() => setRiskPanelOpen(false)}
        onResolve={resolveRisk}
      />
    </div>
  )
}
