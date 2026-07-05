-- Legazpi confirmed as 5th Code Camp — Jul 30, 2026 · IDS Colleges
-- Run in Supabase SQL Editor > New Query

-- 1. Update chapter record with confirmed date and venue
UPDATE chapters SET
  venue            = 'IDS Colleges',
  date_text        = 'Jul 30, 2026',
  date_iso         = '2026-07-30',
  countdown_text   = 'Jul 30',
  status           = 'tbc',
  updated_at       = now()
WHERE id = 'legazpi';

-- 2. Close the old "confirm details" task — details are now confirmed
UPDATE chapter_tasks SET
  status     = 'done',
  updated_at = now()
WHERE short_id = 'LGZ-t1';

-- 3. Also close the CDO pivot task — decision made, Legazpi is confirmed
UPDATE chapter_tasks SET
  status     = 'done',
  updated_at = now()
WHERE short_id = 'CDO-t2';

-- 4. Add task: Plan training schedule
INSERT INTO chapter_tasks (short_id, chapter_id, owner, description, status)
VALUES (
  'LGZ-t2',
  'legazpi',
  'Nicole',
  'Plan training schedule — finalize training agenda and timeline for participants and mentors before Jul 30 event.',
  'pending'
)
ON CONFLICT (short_id) DO UPDATE SET
  description = EXCLUDED.description,
  status      = EXCLUDED.status,
  updated_at  = now();

-- 5. Add task: Merch shipment
INSERT INTO chapter_tasks (short_id, chapter_id, owner, description, status)
VALUES (
  'LGZ-t3',
  'legazpi',
  'Nicole',
  'Merch to be shipped — arrange and ship merchandise so it arrives at IDS Colleges before Jul 30.',
  'pending'
)
ON CONFLICT (short_id) DO UPDATE SET
  description = EXCLUDED.description,
  status      = EXCLUDED.status,
  updated_at  = now();

-- 6. Update KPI sublabel to reflect confirmed Legazpi slot
UPDATE kpis SET
  sublabel   = 'PMP declined · Legazpi confirmed 5th slot (Jul 30, IDS Colleges) · CDO TBC · TCL applicant',
  updated_at = now()
WHERE key = 'code_camps';
