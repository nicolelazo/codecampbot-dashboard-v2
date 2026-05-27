export interface ChecklistTemplateItem {
  tCode: string
  task: string
  date: string
  status: string
  isEvent?: boolean
}

export const CHECKLIST_TEMPLATE: Record<string, ChecklistTemplateItem[]> = {
  manila: [
    { tCode: 'T-35',   task: 'Ocular visit — Letran Intramuros',                                              date: 'Feb 09, 2026', status: 'done'        },
    { tCode: 'T-28',   task: 'Software installation begins (3–5 hrs per lab)',                                 date: 'Mar 7, 2026',  status: 'done'        },
    { tCode: 'T-21',   task: 'Create DeepSurge URL · Sui Team Jianyi',                                        date: 'Mar 7, 2026',  status: 'done'        },
    { tCode: 'T-14',   task: 'Installation verified · roadblocks resolved',                                    date: 'Mar 14, 2026', status: 'done'        },
    { tCode: 'T-7',    task: 'Dry run — full 4-hour rehearsal · all mentors present',                         date: 'Mar 21, 2026', status: 'done'        },
    { tCode: 'T-3',    task: 'Final logistics: passes, pax confirmation, merch packed',                       date: 'Mar 25, 2026', status: 'done'        },
    { tCode: 'T-0 ☻', task: 'EVENT DAY — Manila Pilot · Letran Intramuros',                                  date: 'Mar 28, 2026', status: 'executed',  isEvent: true },
    { tCode: 'T+3',    task: 'Log pax count · BIR receipts to Jedd · SITREP submitted',                      date: 'Mar 31, 2026', status: 'overdue'     },
    { tCode: 'T+7',    task: 'Jedd confirms Liquidation · HQ Finance updated',                                date: 'Apr 4, 2026',  status: 'confirm'     },
    { tCode: 'OPEN',   task: 'Post-pilot content update — Mike + Lady documenting learnings for all chapters', date: 'In progress',  status: 'in_progress' },
  ],
  tacloban: [
    { tCode: 'OPEN',     task: 'Lock new event date with LNU — June TBD (subject to slot removal if not ready)',                                             date: 'Urgent',       status: 'overdue'     },
    { tCode: 'OPEN',     task: 'Formal ocular at LNU once date is confirmed',                                                                                 date: 'TBD',          status: 'pending'     },
    { tCode: 'DRY RUN',  task: 'Internal Dry Run attended — Sir Mike (WSL New Process)',                                                                      date: 'Apr 24, 2026', status: 'done'        },
    { tCode: 'DRY RUN',  task: 'Internal Dry Run attended — Laguna leads',                                                                                   date: 'May 4, 2026',  status: 'in_progress' },
    { tCode: 'DRY RUN',  task: 'Final Internal Dry Run conducted — Audience: Pampanga leads (date TBD/not final; subject to slot removal)',                  date: 'May 11, 2026', status: 'upcoming'    },
    { tCode: 'T-35',     task: 'Ocular visit & lab check',                                                                                                   date: 'TBD',          status: 'upcoming'    },
    { tCode: 'T-28',     task: 'Software installation begins',                                                                                               date: 'TBD',          status: 'upcoming'    },
    { tCode: 'T-21',     task: 'Create DeepSurge URL · Sui Team Jianyi',                                                                                    date: 'TBD',          status: 'upcoming'    },
    { tCode: 'LINK',     task: 'DeepSurge registration link — TBD (request from Jianyi at T-21)',                                                          date: 'TBD',          status: 'pending'     },
    { tCode: 'T-14',     task: 'Installation verified · roadblocks resolved',                                                                                date: 'TBD',          status: 'upcoming'    },
    { tCode: 'T-7',      task: 'Dry run — full 4-hour rehearsal',                                                                                           date: 'TBD',          status: 'upcoming'    },
    { tCode: 'T-0 ☻',   task: 'EVENT DAY — Tacloban Code Camp',                                                                                            date: 'TBD',          status: 'upcoming',  isEvent: true },
  ],
  iloilo: [
    { tCode: 'T-30',   task: 'Ocular at CPU Jaro — Ted to visit',                                             date: 'Apr 16, 2026', status: 'confirm'    },
    { tCode: 'PRE',    task: 'Sui-Supported Developer Event at WVSU BINHI TBI (not a code camp)',              date: 'Apr 18, 2026', status: 'executed',  isEvent: true },
    { tCode: 'T-28',   task: 'Software installation at CPU Jaro',                                              date: 'Apr 18, 2026', status: 'upcoming'   },
    { tCode: 'DRY RUN', task: 'Internal Dry Run attended — Sir Mike (WSL New Process)',                        date: 'Apr 24, 2026', status: 'done'        },
    { tCode: 'T-21',   task: 'Create DeepSurge URL · Sui Team Jianyi',                                        date: 'Apr 25, 2026', status: 'upcoming'   },
    { tCode: 'T-14',   task: 'Installation verified · roadblocks resolved',                                    date: 'May 2, 2026',  status: 'upcoming'   },
    { tCode: 'T-7',    task: 'Dry run — full 4-hour rehearsal',                                                date: 'May 9, 2026',  status: 'upcoming'   },
    { tCode: 'T-3',    task: 'Final logistics: passes, pax confirmation, merch packed',                        date: 'May 13, 2026', status: 'upcoming'   },
    { tCode: 'T-0 ☻', task: 'EVENT DAY — Iloilo Code Camp · CPU Jaro',                                       date: 'May 16, 2026', status: 'upcoming',  isEvent: true },
    { tCode: 'T+7',    task: 'Liquidation · HQ Finance updated',                                               date: 'May 23, 2026', status: 'upcoming'   },
  ],
  bukidnon: [
    { tCode: 'PRE',    task: 'Cash Advance approved · merch must ship before Apr 29',                          date: 'Apr 18, 2026', status: 'confirm'    },
    { tCode: 'T-21',   task: 'Create DeepSurge URL · Sui Team Jianyi',                                        date: 'Apr 15, 2026', status: 'upcoming'   },
    { tCode: 'DRY RUN', task: 'Internal Dry Run attended — Sir Mike (WSL New Process)',                        date: 'Apr 24, 2026', status: 'done'        },
    { tCode: 'T-7',    task: 'Merch packed and shipped to Bukidnon',                                           date: 'Apr 29, 2026', status: 'upcoming'   },
    { tCode: 'T-3',    task: 'Final logistics: passes, pax confirmation, lab check',                           date: 'May 3, 2026',  status: 'upcoming'   },
    { tCode: 'T-0 ☻', task: 'EVENT DAY — Bukidnon Code Camp · BSU',                                          date: 'May 6, 2026',  status: 'upcoming',  isEvent: true },
    { tCode: 'T+3',    task: 'Log pax count · BIR receipts · SITREP submitted',                                date: 'May 9, 2026',  status: 'upcoming'   },
    { tCode: 'T+7',    task: 'Liquidation · HQ Finance updated',                                               date: 'May 13, 2026', status: 'upcoming'   },
  ],
  pampanga: [
    { tCode: 'PRE',    task: 'Formal Sui Foundation slot confirmation from Joash',                              date: 'Pending',      status: 'confirm'    },
    { tCode: 'T-35',   task: 'Ocular at CCA · formal venue visit from Joash',                                  date: 'May 20, 2026', status: 'upcoming'   },
    { tCode: 'T-28',   task: 'Software installation at CCA labs',                                              date: 'May 27, 2026', status: 'upcoming'   },
    { tCode: 'DRY RUN', task: 'Internal Dry Run attended — Laguna leads',                                      date: 'May 4, 2026',  status: 'in_progress' },
    { tCode: 'DRY RUN', task: 'Internal Dry Run attended — Tacloban leads',                                    date: 'May 11, 2026', status: 'upcoming'   },
    { tCode: 'T-21',   task: 'Create DeepSurge URL · Sui Team Jianyi',                                        date: 'Jun 3, 2026',  status: 'upcoming'   },
    { tCode: 'LINK',   task: 'DeepSurge registration link — TBD (request from Jianyi at T-21)',               date: 'TBD',          status: 'pending'    },
    { tCode: 'DRY RUN', task: 'Internal Dry Run conducted by Pampanga leads and mentors',                      date: 'Jun 1, 2026',  status: 'upcoming'   },
    { tCode: 'T-0 ☻', task: 'EVENT DAY — Pampanga Code Camp · CCA',                                          date: 'Jun 24, 2026', status: 'upcoming',  isEvent: true },
  ],
  laguna: [
    { tCode: 'DRY RUN', task: 'Internal Dry Run attended — Sir Mike (WSL New Process)',                        date: 'Apr 24, 2026', status: 'done'        },
    { tCode: 'PRE',    task: 'May 29 slot pencil-booked (TBC: no guaranteed slot; subject to readiness and compliance)', date: 'May 4, 2026', status: 'done' },
    { tCode: 'DRY RUN', task: 'Internal Dry Run conducted — Audience: Tacloban + Pampanga leads',              date: 'May 4, 2026',  status: 'in_progress' },
    { tCode: 'PRE',    task: 'Venue scouting by John Danmel',                                                   date: 'TBD',          status: 'pending'    },
    { tCode: 'T-35',   task: 'Ocular at confirmed venue',                                                       date: 'Apr 24, 2026', status: 'overdue'    },
    { tCode: 'T-21',   task: 'Create DeepSurge URL · Sui Team Jianyi',                                        date: 'May 8, 2026',  status: 'confirm'    },
    { tCode: 'T-0 ☻', task: 'EVENT DAY — Laguna Code Camp',                                                   date: 'May 29, 2026', status: 'upcoming',  isEvent: true },
    { tCode: 'PRE',    task: 'Finalize 10 mentors · confirm attendance and roles',                              date: 'May 28, 2026', status: 'done'       },
    { tCode: 'PRE',    task: 'Prepare promo materials · Canva + branding guidelines',                           date: 'May 28, 2026', status: 'upcoming'   },
    { tCode: 'T+7',    task: 'Liquidation · HQ Finance updated',                                               date: 'Jun 5, 2026',  status: 'upcoming'   },
    { tCode: 'T+3',    task: 'Post report · SITREP submitted · pax count logged',                              date: 'Jun 1, 2026',  status: 'upcoming'   },
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
