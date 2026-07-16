-- CDO & Legazpi — progress bump + Internal Dry Run task — as of Jul 16, 2026
-- Legazpi: 50% · CDO: 40%
-- Adds "Internal Dry Run with the new steps" as a top task for both chapters.
-- "Finalize the 10 mentors" already exists (CDO-t5 / LGZ-t4) — left as is.
-- Self-contained & idempotent — safe to re-run.
-- Run in Supabase SQL Editor > New Query

-- ────────────────────────────────────────────────────────────
-- 1. Progress update (dashboard + Telegram DSU read this live)
-- ────────────────────────────────────────────────────────────
UPDATE chapters SET
  progress_percent = 50,
  updated_at       = now()
WHERE id = 'legazpi';

UPDATE chapters SET
  progress_percent = 40,
  updated_at       = now()
WHERE id = 'cdo';

-- ────────────────────────────────────────────────────────────
-- 2. Add "Internal Dry Run with the new steps" task
--    CDO-t8 / LGZ-t7 — pending (existing urgent tasks stay the top task)
-- ────────────────────────────────────────────────────────────
INSERT INTO chapter_tasks (short_id, chapter_id, owner, description, status)
VALUES
  ('CDO-t8', 'cdo',     'Nicole', 'Internal Dry Run with the new steps — run through the updated flow/steps end to end before event day.', 'pending'),
  ('LGZ-t7', 'legazpi', 'Nicole', 'Internal Dry Run with the new steps — run through the updated flow/steps end to end before event day.', 'pending')
ON CONFLICT (short_id) DO UPDATE SET
  chapter_id  = EXCLUDED.chapter_id,
  owner       = EXCLUDED.owner,
  description = EXCLUDED.description,
  status      = EXCLUDED.status,
  is_done     = false,
  updated_at  = now();
