-- CDO & Legazpi confirmed + progress + top-task update — as of Jul 9, 2026
-- CDO: CONFIRMED (no longer tentative) · 30% · Jul 29, 2026 · DICT Region-X
--      DEVCON+ registration link pending · DeepSurge link pending · mentor training Jul 13, 2026 7–10 PM
-- Legazpi: CONFIRMED · 40% · Jul 30, 2026 · IDS Colleges
--      registration link pending · DeepSurge link pending · mentor training Jul 13, 2026 7–10 PM
-- Self-contained & idempotent — safe to run even if earlier July scripts were not applied.
-- Run in Supabase SQL Editor > New Query

-- ────────────────────────────────────────────────────────────
-- 1. Confirm chapter records (clears "tentative"/TBC + date TBD) and set progress
-- ────────────────────────────────────────────────────────────
UPDATE chapters SET
  venue            = 'DICT Region-X',
  date_text        = 'Jul 29, 2026',
  date_iso         = '2026-07-29',
  countdown_text   = 'Jul 29',
  status           = 'in_progress',
  progress_percent = 30,
  updated_at       = now()
WHERE id = 'cdo';

UPDATE chapters SET
  venue            = 'IDS Colleges',
  date_text        = 'Jul 30, 2026',
  date_iso         = '2026-07-30',
  countdown_text   = 'Jul 30',
  status           = 'in_progress',
  progress_percent = 40,
  updated_at       = now()
WHERE id = 'legazpi';

-- ────────────────────────────────────────────────────────────
-- 2. Close obsolete tentative/pivot tasks so they stop showing as top task
--    CDO-t1: "Follow up with Kenshin — CDO details all tentative … confirm for 5th slot"
--    CDO-t2: "CDO not moving … pivot to Legazpi"
--    LGZ-t1: "coordinate with JP" (Plan C activation)
-- ────────────────────────────────────────────────────────────
UPDATE chapter_tasks SET status = 'done', is_done = true, updated_at = now()
WHERE short_id IN ('CDO-t1', 'CDO-t2', 'LGZ-t1');

-- ────────────────────────────────────────────────────────────
-- 3. CDO top tasks (order: mentor training → final 10 mentors → pre-publication materials → installation)
--    Mentor training is 'urgent' so it surfaces as CDO's top task in the DSU.
-- ────────────────────────────────────────────────────────────
INSERT INTO chapter_tasks (short_id, chapter_id, owner, description, status)
VALUES
  ('CDO-t4', 'cdo', 'Nicole', 'Mentor training — conduct mentor training on Jul 13, 2026, 7:00–10:00 PM.', 'urgent'),
  ('CDO-t5', 'cdo', 'Nicole', 'Finalize the 10 mentors — lock in the final list of mentor names.', 'pending'),
  ('CDO-t6', 'cdo', 'Nicole', 'Pre-publication materials — prepare promo/publication materials ahead of promos.', 'pending'),
  ('CDO-t7', 'cdo', 'Nicole', 'Installation — complete lab/BYOD installation setup before event day.', 'pending')
ON CONFLICT (short_id) DO UPDATE SET
  chapter_id  = EXCLUDED.chapter_id,
  owner       = EXCLUDED.owner,
  description = EXCLUDED.description,
  status      = EXCLUDED.status,
  is_done     = false,
  updated_at  = now();

-- ────────────────────────────────────────────────────────────
-- 4. Legazpi top tasks (order: final 10 mentors → mentor training → installation)
--    Finalize 10 mentors is 'urgent' so it surfaces as Legazpi's top task in the DSU.
-- ────────────────────────────────────────────────────────────
INSERT INTO chapter_tasks (short_id, chapter_id, owner, description, status)
VALUES
  ('LGZ-t4', 'legazpi', 'Nicole', 'Finalize the 10 mentors — lock in the final list of mentor names.', 'urgent'),
  ('LGZ-t5', 'legazpi', 'Nicole', 'Mentor training — conduct mentor training on Jul 13, 2026, 7:00–10:00 PM.', 'pending'),
  ('LGZ-t6', 'legazpi', 'Nicole', 'Installation — complete lab/BYOD installation setup before event day.', 'pending')
ON CONFLICT (short_id) DO UPDATE SET
  chapter_id  = EXCLUDED.chapter_id,
  owner       = EXCLUDED.owner,
  description = EXCLUDED.description,
  status      = EXCLUDED.status,
  is_done     = false,
  updated_at  = now();

-- Legazpi merch — shipped via LBC (mark done)
INSERT INTO chapter_tasks (short_id, chapter_id, owner, description, status, is_done)
VALUES
  ('LGZ-t3', 'legazpi', 'Nicole', 'Merch shipped via LBC — en route to IDS Colleges for Jul 30.', 'done', true)
ON CONFLICT (short_id) DO UPDATE SET
  chapter_id  = EXCLUDED.chapter_id,
  owner       = EXCLUDED.owner,
  description = EXCLUDED.description,
  status      = 'done',
  is_done     = true,
  updated_at  = now();

-- ────────────────────────────────────────────────────────────
-- 5. KPI sublabel — both confirmed
-- ────────────────────────────────────────────────────────────
UPDATE kpis SET
  sublabel   = 'PMP declined · Legazpi confirmed 5th slot (Jul 30, IDS Colleges) · CDO confirmed (Jul 29, DICT Region-X) · TCL applicant',
  updated_at = now()
WHERE key = 'code_camps';

-- Note: DEVCON+ registration links and DeepSurge links for both chapters remain PENDING.
-- These are tracked as checklist items (DeepSurge Link Creation) that are already 'pending'
-- in the checklist template — no DB change needed to keep them pending.
