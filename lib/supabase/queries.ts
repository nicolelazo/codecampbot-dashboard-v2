import { createClient } from '@/lib/supabase/client'
import type { Chapter, ChapterTask, Kpi, Risk, Contact, MerchItem, ResourceLink } from '@/lib/types'

export async function fetchChapters(): Promise<Chapter[]> {
  const supabase = createClient()
  const [chaptersRes, tasksRes] = await Promise.all([
    supabase.from('chapters').select('*').order('number'),
    supabase.from('chapter_tasks').select('*'),
  ])
  const chapters = chaptersRes.data ?? []
  const tasks: ChapterTask[] = tasksRes.data ?? []
  return chapters.map(c => ({
    ...c,
    todos: tasks.filter(t => t.chapter_id === c.id),
  }))
}

export async function fetchKpis(): Promise<Kpi[]> {
  const supabase = createClient()
  const { data } = await supabase.from('kpis').select('*')
  return data ?? []
}

export async function fetchRisks(): Promise<Risk[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('risks')
    .select('*')
    .order('created_at', { ascending: false })

  const dedupedByCode = new Map<string, Risk>()
  for (const risk of data ?? []) {
    // Keep the newest row for each risk code to guard against duplicate seed inserts.
    if (!dedupedByCode.has(risk.code)) dedupedByCode.set(risk.code, risk)
  }

  return Array.from(dedupedByCode.values()).sort((a, b) => {
    const aNum = Number.parseInt(a.code.replace(/^R/i, ''), 10)
    const bNum = Number.parseInt(b.code.replace(/^R/i, ''), 10)
    if (Number.isNaN(aNum) || Number.isNaN(bNum)) return a.code.localeCompare(b.code)
    return aNum - bNum
  })
}

export async function fetchContacts(): Promise<Contact[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  const dedupedByIdentity = new Map<string, Contact>()
  for (const contact of data ?? []) {
    const key = [
      contact.name.trim().toLowerCase(),
      contact.role.trim().toLowerCase(),
      contact.handle.trim().toLowerCase(),
      contact.team,
      (contact.chapter_number ?? '').trim(),
    ].join('::')
    if (!dedupedByIdentity.has(key)) dedupedByIdentity.set(key, contact)
  }

  return Array.from(dedupedByIdentity.values()).sort((a, b) => {
    const teamCmp = a.team.localeCompare(b.team)
    if (teamCmp !== 0) return teamCmp
    return a.name.localeCompare(b.name)
  })
}

export async function fetchMerchItems(): Promise<MerchItem[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('merch_items')
    .select('*')
    .order('created_at', { ascending: false })

  const dedupedByNameAndCategory = new Map<string, MerchItem>()
  for (const item of data ?? []) {
    // Keep the newest row for each category+name pair if seed data was inserted multiple times.
    const key = `${item.category.toLowerCase()}::${item.name.trim().toLowerCase()}`
    if (!dedupedByNameAndCategory.has(key)) dedupedByNameAndCategory.set(key, item)
  }

  return Array.from(dedupedByNameAndCategory.values()).sort((a, b) => {
    const categoryCmp = a.category.localeCompare(b.category)
    if (categoryCmp !== 0) return categoryCmp
    return a.name.localeCompare(b.name)
  })
}

export async function fetchLinks(): Promise<ResourceLink[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('resource_links')
    .select('*')
    .order('created_at', { ascending: false })

  const dedupedByIdentity = new Map<string, ResourceLink>()
  for (const link of data ?? []) {
    const key = [
      link.name.trim().toLowerCase(),
      link.url.trim().toLowerCase(),
      link.category.trim().toLowerCase(),
    ].join('::')
    if (!dedupedByIdentity.has(key)) dedupedByIdentity.set(key, link)
  }

  return Array.from(dedupedByIdentity.values()).sort((a, b) => a.name.localeCompare(b.name))
}
