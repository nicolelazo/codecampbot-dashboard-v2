export interface ChecklistTemplateItem {
  tCode: string
  task: string
  date: string
  status: string
  isEvent?: boolean
}

export const CHECKLIST_TEMPLATE: Record<string, ChecklistTemplateItem[]> = {
  manila: [
    // 4 Weeks Before
    { tCode: 'W-4',    task: 'Invitation Letter from HQ — request/send official invitation for Chapter and Code Camp Lead; secure partner school confirmations', date: 'Feb 28, 2026', status: 'done' },
    { tCode: 'W-4',    task: 'Finalize Event Schedule — include date, time, venue/location, partner schools/organizations',                                       date: 'Feb 28, 2026', status: 'done' },
    { tCode: 'W-3',    task: 'DeepSurge Link Creation — create and finalize registration/event links before promotions begin; test registration flow',           date: 'Mar 7, 2026',  status: 'done' },
    { tCode: 'W-4',    task: 'Promotional Materials — create publication materials/posters using Canva; follow branding guidelines; prepare captions/schedule',  date: 'Feb 28, 2026', status: 'done' },
    { tCode: 'W-4',    task: 'Volunteer Requirements — recruit at least 2 volunteers for photos/videos; invite school publication; assign documentation roles',   date: 'Feb 28, 2026', status: 'done' },
    { tCode: 'W-4',    task: 'Whitelist Required Websites — sui.io, suiscan.xyz, github.com, vercel.app, youtube.com, docs.google.com',                         date: 'Mar 14, 2026', status: 'done' },
    // 2 Weeks Before
    { tCode: 'W-2',    task: 'Seed Fund Request — submit request 1–2 weeks before the Code Camp; follow up approval/status if needed',                           date: 'Mar 14, 2026', status: 'done' },
    { tCode: 'W-2',    task: 'Slides Preparation — prepare and finalize all presentation slides; ensure all links and embedded materials are working; test demos', date: 'Mar 14, 2026', status: 'done' },
    { tCode: 'W-2',    task: 'Mentor Requirements — minimum 10 mentors; attend required mentor training; submit Sui smart contract as proof of learning',        date: 'Mar 14, 2026', status: 'done' },
    { tCode: 'W-2',    task: 'First Dry Run — check overall flow and technical issues; test internet stability, audio/visual setup, and facilitator coordination', date: 'Mar 14, 2026', status: 'done' },
    { tCode: 'W-1',    task: 'Second Dry Run — final timing check; speaker transitions; participant support flow; final technical validation',                    date: 'Mar 21, 2026', status: 'done' },
    { tCode: 'W-1',    task: 'Final Promotions Push — release final promotional materials; remind participants to register; coordinate confirmations',             date: 'Mar 21, 2026', status: 'done' },
    // Event Day
    { tCode: 'T-0 ☻', task: 'EVENT DAY — Manila Code Camp · Letran Intramuros',                                                                                 date: 'Mar 28, 2026', status: 'executed', isEvent: true },
    // After Event
    { tCode: 'T+2',    task: 'Post-Event Promotional Materials — create and publish posts; upload photos/videos and participant highlights; coordinate with partner schools', date: 'Mar 30, 2026', status: 'done' },
    { tCode: 'T+5',    task: 'Post-Code Camp Report (EOD) — include participant profile, attendees count, projects submitted, highlights, photos/videos, social media posts', date: 'Apr 2, 2026',  status: 'done' },
    { tCode: 'T+7',    task: 'Liquidation — collect and organize all receipts; submit complete liquidation report; ensure all supporting documents are complete', date: 'Apr 4, 2026',  status: 'in_progress' },
  ],
  tacloban: [
    // 4 Weeks Before
    { tCode: 'W-4',    task: 'Invitation Letter from HQ — request/send official invitation for Chapter and Code Camp Lead; secure partner school confirmations', date: 'TBD',          status: 'pending' },
    { tCode: 'W-4',    task: 'Finalize Event Schedule — include date, time, venue/location, partner schools/organizations',                                       date: 'TBD',          status: 'pending' },
    { tCode: 'W-3',    task: 'DeepSurge Link Creation — create and finalize registration/event links before promotions begin; test registration flow',           date: 'TBD',          status: 'pending' },
    { tCode: 'W-4',    task: 'Promotional Materials — create publication materials/posters using Canva; follow branding guidelines; prepare captions/schedule',  date: 'TBD',          status: 'pending' },
    { tCode: 'W-4',    task: 'Volunteer Requirements — recruit at least 2 volunteers for photos/videos; invite school publication; assign documentation roles',   date: 'TBD',          status: 'pending' },
    { tCode: 'W-4',    task: 'Whitelist Required Websites — sui.io, suiscan.xyz, github.com, vercel.app, youtube.com, docs.google.com',                         date: 'TBD',          status: 'pending' },
    // 2 Weeks Before
    { tCode: 'W-2',    task: 'Seed Fund Request — submit request 1–2 weeks before the Code Camp; follow up approval/status if needed',                           date: 'TBD',          status: 'pending' },
    { tCode: 'W-2',    task: 'Slides Preparation — prepare and finalize all presentation slides; ensure all links and embedded materials are working; test demos', date: 'TBD',          status: 'pending' },
    { tCode: 'W-2',    task: 'Mentor Requirements — minimum 10 mentors; attend required mentor training; submit Sui smart contract as proof of learning',        date: 'TBD',          status: 'pending' },
    { tCode: 'W-2',    task: 'First Dry Run — check overall flow and technical issues; test internet stability, audio/visual setup, and facilitator coordination', date: 'TBD',          status: 'pending' },
    { tCode: 'W-1',    task: 'Second Dry Run — final timing check; speaker transitions; participant support flow; final technical validation',                    date: 'TBD',          status: 'pending' },
    { tCode: 'W-1',    task: 'Final Promotions Push — release final promotional materials; remind participants to register; coordinate confirmations',             date: 'TBD',          status: 'pending' },
    // Event Day
    { tCode: 'T-0 ☻', task: 'EVENT DAY — Tacloban Code Camp · TBD',                                                                                            date: 'TBD',          status: 'upcoming', isEvent: true },
    // After Event
    { tCode: 'T+2',    task: 'Post-Event Promotional Materials — create and publish posts; upload photos/videos and participant highlights; coordinate with partner schools', date: 'TBD', status: 'pending' },
    { tCode: 'T+5',    task: 'Post-Code Camp Report (EOD) — include participant profile, attendees count, projects submitted, highlights, photos/videos, social media posts', date: 'TBD', status: 'pending' },
    { tCode: 'T+7',    task: 'Liquidation — collect and organize all receipts; submit complete liquidation report; ensure all supporting documents are complete', date: 'TBD',          status: 'pending' },
  ],
  iloilo: [
    // 4 Weeks Before
    { tCode: 'W-4',    task: 'Invitation Letter from HQ — request/send official invitation for Chapter and Code Camp Lead; secure partner school confirmations', date: 'Apr 18, 2026', status: 'done' },
    { tCode: 'W-4',    task: 'Finalize Event Schedule — include date, time, venue/location, partner schools/organizations',                                       date: 'Apr 18, 2026', status: 'done' },
    { tCode: 'W-3',    task: 'DeepSurge Link Creation — create and finalize registration/event links before promotions begin; test registration flow',           date: 'Apr 25, 2026', status: 'done' },
    { tCode: 'W-4',    task: 'Promotional Materials — create publication materials/posters using Canva; follow branding guidelines; prepare captions/schedule',  date: 'Apr 18, 2026', status: 'done' },
    { tCode: 'W-4',    task: 'Volunteer Requirements — recruit at least 2 volunteers for photos/videos; invite school publication; assign documentation roles',   date: 'Apr 18, 2026', status: 'done' },
    { tCode: 'W-2',    task: 'Whitelist Required Websites — sui.io, suiscan.xyz, github.com, vercel.app, youtube.com, docs.google.com',                         date: 'May 2, 2026',  status: 'done' },
    // 2 Weeks Before
    { tCode: 'W-2',    task: 'Seed Fund Request — submit request 1–2 weeks before the Code Camp; follow up approval/status if needed',                           date: 'May 2, 2026',  status: 'done' },
    { tCode: 'W-2',    task: 'Slides Preparation — prepare and finalize all presentation slides; ensure all links and embedded materials are working; test demos', date: 'May 2, 2026',  status: 'done' },
    { tCode: 'W-2',    task: 'Mentor Requirements — minimum 10 mentors; attend required mentor training; submit Sui smart contract as proof of learning',        date: 'May 2, 2026',  status: 'done' },
    { tCode: 'W-2',    task: 'First Dry Run — check overall flow and technical issues; test internet stability, audio/visual setup, and facilitator coordination', date: 'May 2, 2026',  status: 'done' },
    { tCode: 'W-1',    task: 'Second Dry Run — final timing check; speaker transitions; participant support flow; final technical validation',                    date: 'May 9, 2026',  status: 'done' },
    { tCode: 'W-1',    task: 'Final Promotions Push — release final promotional materials; remind participants to register; coordinate confirmations',             date: 'May 9, 2026',  status: 'done' },
    // Event Day
    { tCode: 'T-0 ☻', task: 'EVENT DAY — Iloilo Code Camp · CPU Jaro',                                                                                         date: 'May 16, 2026', status: 'executed', isEvent: true },
    // After Event
    { tCode: 'T+2',    task: 'Post-Event Promotional Materials — create and publish posts; upload photos/videos and participant highlights; coordinate with partner schools', date: 'May 18, 2026', status: 'done' },
    { tCode: 'T+5',    task: 'Post-Code Camp Report (EOD) — include participant profile, attendees count, projects submitted, highlights, photos/videos, social media posts', date: 'May 21, 2026', status: 'in_progress' },
    { tCode: 'T+7',    task: 'Liquidation — collect and organize all receipts; submit complete liquidation report; ensure all supporting documents are complete', date: 'May 23, 2026', status: 'pending' },
  ],
  bukidnon: [
    // 4 Weeks Before
    { tCode: 'W-4',    task: 'Invitation Letter from HQ — request/send official invitation for Chapter and Code Camp Lead; secure partner school confirmations', date: 'Apr 8, 2026',  status: 'done' },
    { tCode: 'W-4',    task: 'Finalize Event Schedule — include date, time, venue/location, partner schools/organizations',                                       date: 'Apr 8, 2026',  status: 'done' },
    { tCode: 'W-3',    task: 'DeepSurge Link Creation — create and finalize registration/event links before promotions begin; test registration flow',           date: 'Apr 15, 2026', status: 'done' },
    { tCode: 'W-4',    task: 'Promotional Materials — create publication materials/posters using Canva; follow branding guidelines; prepare captions/schedule',  date: 'Apr 8, 2026',  status: 'done' },
    { tCode: 'W-4',    task: 'Volunteer Requirements — recruit at least 2 volunteers for photos/videos; invite school publication; assign documentation roles',   date: 'Apr 8, 2026',  status: 'done' },
    { tCode: 'W-2',    task: 'Whitelist Required Websites — sui.io, suiscan.xyz, github.com, vercel.app, youtube.com, docs.google.com',                         date: 'Apr 22, 2026', status: 'done' },
    // 2 Weeks Before
    { tCode: 'W-2',    task: 'Seed Fund Request — submit request 1–2 weeks before the Code Camp; follow up approval/status if needed',                           date: 'Apr 22, 2026', status: 'done' },
    { tCode: 'W-2',    task: 'Slides Preparation — prepare and finalize all presentation slides; ensure all links and embedded materials are working; test demos', date: 'Apr 22, 2026', status: 'done' },
    { tCode: 'W-2',    task: 'Mentor Requirements — minimum 10 mentors; attend required mentor training; submit Sui smart contract as proof of learning',        date: 'Apr 22, 2026', status: 'done' },
    { tCode: 'W-2',    task: 'First Dry Run — check overall flow and technical issues; test internet stability, audio/visual setup, and facilitator coordination', date: 'Apr 22, 2026', status: 'done' },
    { tCode: 'W-1',    task: 'Second Dry Run — final timing check; speaker transitions; participant support flow; final technical validation',                    date: 'Apr 29, 2026', status: 'done' },
    { tCode: 'W-1',    task: 'Final Promotions Push — release final promotional materials; remind participants to register; coordinate confirmations',             date: 'Apr 29, 2026', status: 'done' },
    // Event Day
    { tCode: 'T-0 ☻', task: 'EVENT DAY — Bukidnon Code Camp · BSU',                                                                                            date: 'May 6, 2026',  status: 'executed', isEvent: true },
    // After Event
    { tCode: 'T+2',    task: 'Post-Event Promotional Materials — create and publish posts; upload photos/videos and participant highlights; coordinate with partner schools', date: 'May 8, 2026',  status: 'done' },
    { tCode: 'T+5',    task: 'Post-Code Camp Report (EOD) — include participant profile, attendees count, projects submitted, highlights, photos/videos, social media posts', date: 'May 11, 2026', status: 'done' },
    { tCode: 'T+7',    task: 'Liquidation — collect and organize all receipts; submit complete liquidation report; ensure all supporting documents are complete', date: 'May 13, 2026', status: 'upcoming' },
  ],
  pampanga: [
    // 4 Weeks Before
    { tCode: 'W-4',    task: 'Invitation Letter from HQ — request/send official invitation for Chapter and Code Camp Lead; secure partner school confirmations', date: 'May 27, 2026', status: 'upcoming' },
    { tCode: 'W-4',    task: 'Finalize Event Schedule — include date, time, venue/location, partner schools/organizations',                                       date: 'May 27, 2026', status: 'done' },
    { tCode: 'W-3',    task: 'DeepSurge Link Creation — create and finalize registration/event links before promotions begin; test registration flow',           date: 'Jun 3, 2026',  status: 'upcoming' },
    { tCode: 'W-4',    task: 'Promotional Materials — create publication materials/posters using Canva; follow branding guidelines; prepare captions/schedule',  date: 'May 27, 2026', status: 'upcoming' },
    { tCode: 'W-4',    task: 'Volunteer Requirements — recruit at least 2 volunteers for photos/videos; invite school publication; assign documentation roles',   date: 'May 27, 2026', status: 'upcoming' },
    { tCode: 'W-2',    task: 'Whitelist Required Websites — sui.io, suiscan.xyz, github.com, vercel.app, youtube.com, docs.google.com',                         date: 'Jun 10, 2026', status: 'upcoming' },
    // 2 Weeks Before
    { tCode: 'W-2',    task: 'Seed Fund Request — submit request 1–2 weeks before the Code Camp; follow up approval/status if needed',                           date: 'Jun 10, 2026', status: 'upcoming' },
    { tCode: 'W-2',    task: 'Slides Preparation — prepare and finalize all presentation slides; ensure all links and embedded materials are working; test demos', date: 'Jun 10, 2026', status: 'upcoming' },
    { tCode: 'W-2',    task: 'Mentor Requirements — minimum 10 mentors; attend required mentor training; submit Sui smart contract as proof of learning',        date: 'Jun 10, 2026', status: 'upcoming' },
    { tCode: 'W-2',    task: 'First Dry Run — check overall flow and technical issues; test internet stability, audio/visual setup, and facilitator coordination', date: 'Jun 10, 2026', status: 'upcoming' },
    { tCode: 'W-1',    task: 'Second Dry Run — final timing check; speaker transitions; participant support flow; final technical validation',                    date: 'Jun 17, 2026', status: 'upcoming' },
    { tCode: 'W-1',    task: 'Final Promotions Push — release final promotional materials; remind participants to register; coordinate confirmations',             date: 'Jun 17, 2026', status: 'upcoming' },
    // Event Day
    { tCode: 'T-0 ☻', task: 'EVENT DAY — Pampanga Code Camp · CCA',                                                                                            date: 'Jun 24, 2026', status: 'upcoming', isEvent: true },
    // After Event
    { tCode: 'T+2',    task: 'Post-Event Promotional Materials — create and publish posts; upload photos/videos and participant highlights; coordinate with partner schools', date: 'Jun 26, 2026', status: 'upcoming' },
    { tCode: 'T+5',    task: 'Post-Code Camp Report (EOD) — include participant profile, attendees count, projects submitted, highlights, photos/videos, social media posts', date: 'Jun 29, 2026', status: 'upcoming' },
    { tCode: 'T+7',    task: 'Liquidation — collect and organize all receipts; submit complete liquidation report; ensure all supporting documents are complete', date: 'Jul 1, 2026',  status: 'upcoming' },
  ],
  laguna: [
    // 4 Weeks Before
    { tCode: 'W-4',    task: 'Invitation Letter from HQ — request/send official invitation for Chapter and Code Camp Lead; secure partner school confirmations', date: 'May 1, 2026',  status: 'done' },
    { tCode: 'W-4',    task: 'Finalize Event Schedule — include date, time, venue/location, partner schools/organizations',                                       date: 'May 1, 2026',  status: 'done' },
    { tCode: 'W-3',    task: 'DeepSurge Link Creation — create and finalize registration/event links before promotions begin; test registration flow',           date: 'May 8, 2026',  status: 'done' },
    { tCode: 'W-4',    task: 'Promotional Materials — create publication materials/posters using Canva; follow branding guidelines; prepare captions/schedule',  date: 'May 1, 2026',  status: 'done' },
    { tCode: 'W-4',    task: 'Volunteer Requirements — recruit at least 2 volunteers for photos/videos; invite school publication; assign documentation roles',   date: 'May 1, 2026',  status: 'done' },
    { tCode: 'W-2',    task: 'Whitelist Required Websites — sui.io, suiscan.xyz, github.com, vercel.app, youtube.com, docs.google.com',                         date: 'May 15, 2026', status: 'upcoming' },
    // 2 Weeks Before
    { tCode: 'W-2',    task: 'Seed Fund Request — submit request 1–2 weeks before the Code Camp; follow up approval/status if needed',                           date: 'May 15, 2026', status: 'done' },
    { tCode: 'W-2',    task: 'Slides Preparation — prepare and finalize all presentation slides; ensure all links and embedded materials are working; test demos', date: 'May 15, 2026', status: 'upcoming' },
    { tCode: 'W-2',    task: 'Mentor Requirements — minimum 10 mentors; attend required mentor training; submit Sui smart contract as proof of learning',        date: 'May 15, 2026', status: 'done' },
    { tCode: 'W-2',    task: 'First Dry Run — check overall flow and technical issues; test internet stability, audio/visual setup, and facilitator coordination', date: 'May 15, 2026', status: 'done' },
    { tCode: 'W-1',    task: 'Second Dry Run — final timing check; speaker transitions; participant support flow; final technical validation',                    date: 'May 22, 2026', status: 'done' },
    { tCode: 'W-1',    task: 'Final Promotions Push — release final promotional materials; remind participants to register; coordinate confirmations',             date: 'May 22, 2026', status: 'in_progress' },
    // Event Day
    { tCode: 'T-0 ☻', task: 'EVENT DAY — Laguna Code Camp · PUP Biñan CITE Campus',                                                                            date: 'May 29, 2026', status: 'upcoming', isEvent: true },
    // After Event
    { tCode: 'T+2',    task: 'Post-Event Promotional Materials — create and publish posts; upload photos/videos and participant highlights; coordinate with partner schools', date: 'May 31, 2026', status: 'upcoming' },
    { tCode: 'T+5',    task: 'Post-Code Camp Report (EOD) — include participant profile, attendees count, projects submitted, highlights, photos/videos, social media posts', date: 'Jun 3, 2026',  status: 'upcoming' },
    { tCode: 'T+7',    task: 'Liquidation — collect and organize all receipts; submit complete liquidation report; ensure all supporting documents are complete', date: 'Jun 5, 2026',  status: 'upcoming' },
  ],
}

export function resolvedActivityStatus(item: ChecklistTemplateItem, override?: string): string {
  if (override?.trim()) return override.trim()
  const s = item.status.trim().toLowerCase()
  if (s === 'done' || s === 'executed') return 'done'
  if (s === 'in_progress') return 'in_progress'
  return 'pending'
}

export function calculateProgressPercent(
  chapterId: string,
  overrides: Record<string, { activity_status?: string }>
): number {
  const items = CHECKLIST_TEMPLATE[chapterId.toLowerCase()] ?? []
  if (!items.length) return 0
  const done = items.filter((item, i) =>
    resolvedActivityStatus(item, overrides[String(i)]?.activity_status) === 'done'
  ).length
  return Math.round((done / items.length) * 100)
}
