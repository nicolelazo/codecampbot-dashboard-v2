-- CDO & Legazpi — mentor training done + checklist items completed — as of Jul 16, 2026
-- Both chapters: mentor training DONE · invitation letter, event schedule,
--   DeepSurge link, and promotional materials DONE (checked in checklist).
-- CDO tasks cleared: invitation letter (CDO-t3), mentor training (CDO-t4),
--   promo/pre-pub materials (CDO-t6). Finalize 10 mentors (CDO-t5) → urgent (new top task).
-- Legazpi tasks cleared: plan training schedule (LGZ-t2), mentor training (LGZ-t5).
-- Self-contained & idempotent — safe to re-run.
-- Run in Supabase SQL Editor > New Query

-- ────────────────────────────────────────────────────────────
-- 1. Close completed tasks (they stop showing in DSU / Action Items)
-- ────────────────────────────────────────────────────────────
UPDATE chapter_tasks SET status = 'done', is_done = true, updated_at = now()
WHERE short_id IN (
  'CDO-t3',  -- Invitation Letter from HQ
  'CDO-t4',  -- Mentor training (Jul 13)
  'CDO-t6',  -- Pre-publication / promotional materials
  'LGZ-t2',  -- Plan training schedule
  'LGZ-t5'   -- Mentor training (Jul 13)
);

-- ────────────────────────────────────────────────────────────
-- 2. CDO: promote "Finalize the 10 mentors" to urgent so it is the
--    top task now that mentor training is done (mirrors Legazpi LGZ-t4).
-- ────────────────────────────────────────────────────────────
UPDATE chapter_tasks SET status = 'urgent', is_done = false, updated_at = now()
WHERE short_id = 'CDO-t5';

-- ────────────────────────────────────────────────────────────
-- 3. Checklist overrides — mark items DONE live (dashboard chapter
--    detail + Telegram read bot_settings.chapter_checklist_overrides).
--    Indices per lib/checklist-data.ts:
--      0 Invitation Letter · 1 Finalize Event Schedule
--      2 DeepSurge Link · 3 Promotional Materials
--      (Legazpi additionally 5 Plan Training Schedule — training done)
--    Merge preserves any existing overrides for other items.
-- ────────────────────────────────────────────────────────────
INSERT INTO bot_settings (key, value, updated_at)
VALUES ('chapter_checklist_overrides', '{}', now())
ON CONFLICT (key) DO NOTHING;

UPDATE bot_settings AS b SET
  value = (
    COALESCE(NULLIF(b.value, '')::jsonb, '{}'::jsonb)
    || jsonb_build_object('cdo',
         COALESCE(NULLIF(b.value, '')::jsonb -> 'cdo', '{}'::jsonb)
         || '{"0":{"activity_status":"done"},"1":{"activity_status":"done"},"2":{"activity_status":"done"},"3":{"activity_status":"done"}}'::jsonb)
    || jsonb_build_object('legazpi',
         COALESCE(NULLIF(b.value, '')::jsonb -> 'legazpi', '{}'::jsonb)
         || '{"0":{"activity_status":"done"},"1":{"activity_status":"done"},"2":{"activity_status":"done"},"3":{"activity_status":"done"},"5":{"activity_status":"done"}}'::jsonb)
  )::text,
  updated_at = now()
WHERE b.key = 'chapter_checklist_overrides';

-- Note: progress_percent left as set previously (CDO 40% · Legazpi 50%).
-- Toggling any checklist item from the dashboard will recompute it from the
-- template — see app/api/chapter-checklist/route.ts.
