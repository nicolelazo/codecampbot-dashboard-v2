-- CDO confirmed — Jul 29, 2026 · DICT Region-X
-- Run in Supabase SQL Editor > New Query

-- 1. Update chapter record with confirmed date and venue
UPDATE chapters SET
  venue            = 'DICT Region-X',
  date_text        = 'Jul 29, 2026',
  date_iso         = '2026-07-29',
  countdown_text   = 'Jul 29',
  status           = 'tbc',
  updated_at       = now()
WHERE id = 'cdo';

-- 2. Close the old "confirm details" task — date and venue are now confirmed
UPDATE chapter_tasks SET
  status     = 'done',
  updated_at = now()
WHERE short_id = 'CDO-t1';

-- 3. Add task: Invitation letter
INSERT INTO chapter_tasks (short_id, chapter_id, owner, description, status)
VALUES (
  'CDO-t3',
  'cdo',
  'Nicole',
  'Invitation Letter from HQ — request/send official invitation for Chapter and Code Camp Lead; secure partner confirmations for DICT Region-X before Jul 29 event.',
  'pending'
)
ON CONFLICT (short_id) DO UPDATE SET
  description = EXCLUDED.description,
  status      = EXCLUDED.status,
  updated_at  = now();

-- 4. Update KPI sublabel to reflect confirmed CDO slot
UPDATE kpis SET
  sublabel   = 'PMP declined · Legazpi 5th slot (Jul 30, IDS Colleges) · CDO confirmed (Jul 29, DICT Region-X) · TCL applicant',
  updated_at = now()
WHERE key = 'code_camps';
