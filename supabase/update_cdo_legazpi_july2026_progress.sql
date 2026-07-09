-- CDO & Legazpi progress + top-task update — as of Jul 9, 2026
-- CDO: 30% · DEVCON+ registration link pending · DeepSurge link pending · mentor training Jul 13, 2026 7–10 PM
-- Legazpi: 40% · registration link pending · DeepSurge link pending · mentor training Jul 13, 2026 7–10 PM
-- Run in Supabase SQL Editor > New Query

-- 1. Progress percentages
UPDATE chapters SET progress_percent = 30, updated_at = now() WHERE id = 'cdo';
UPDATE chapters SET progress_percent = 40, updated_at = now() WHERE id = 'legazpi';

-- ────────────────────────────────────────────────────────────
-- 2. CDO top tasks (order: mentor training → final 10 mentors → pre-publication materials → installation)
-- ────────────────────────────────────────────────────────────
INSERT INTO chapter_tasks (short_id, chapter_id, owner, description, status)
VALUES
  ('CDO-t4', 'cdo', 'Nicole', 'Mentor training — conduct mentor training on Jul 13, 2026, 7:00–10:00 PM.', 'urgent'),
  ('CDO-t5', 'cdo', 'Nicole', 'Finalize the 10 mentors — lock in the final list of mentor names.', 'pending'),
  ('CDO-t6', 'cdo', 'Nicole', 'Pre-publication materials — prepare promo/publication materials ahead of promos.', 'pending'),
  ('CDO-t7', 'cdo', 'Nicole', 'Installation — complete lab/BYOD installation setup before event day.', 'pending')
ON CONFLICT (short_id) DO UPDATE SET
  owner       = EXCLUDED.owner,
  description = EXCLUDED.description,
  status      = EXCLUDED.status,
  updated_at  = now();

-- ────────────────────────────────────────────────────────────
-- 3. Legazpi top tasks (order: final 10 mentors → mentor training → installation)
-- ────────────────────────────────────────────────────────────
INSERT INTO chapter_tasks (short_id, chapter_id, owner, description, status)
VALUES
  ('LGZ-t4', 'legazpi', 'Nicole', 'Finalize the 10 mentors — lock in the final list of mentor names.', 'urgent'),
  ('LGZ-t5', 'legazpi', 'Nicole', 'Mentor training — conduct mentor training on Jul 13, 2026, 7:00–10:00 PM.', 'pending'),
  ('LGZ-t6', 'legazpi', 'Nicole', 'Installation — complete lab/BYOD installation setup before event day.', 'pending')
ON CONFLICT (short_id) DO UPDATE SET
  owner       = EXCLUDED.owner,
  description = EXCLUDED.description,
  status      = EXCLUDED.status,
  updated_at  = now();

-- Note: DEVCON+ registration links and DeepSurge links for both chapters remain PENDING.
-- These are tracked as checklist items (DeepSurge Link Creation) and are already 'pending'
-- in the checklist template — no DB change needed to keep them pending.
