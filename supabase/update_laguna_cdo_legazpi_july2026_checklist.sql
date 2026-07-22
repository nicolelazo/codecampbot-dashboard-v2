-- Laguna · CDO · Legazpi — checklist + progress + risk sync — as of Jul 22, 2026
-- Laguna:  Post-Code Camp Report DONE ✓ (liquidation still pending).
-- CDO   → 50%: Whitelist ✓ · Slides Prep ✓ · Merch Shipment ✓ · First Dry Run ✓.
--          Mentors 10+ NOT done (only 5 mentors) → check removed.
-- Legazpi→ 70%: Whitelist ✓ · Slides Prep ✓ · First Dry Run ✓.
-- New CDO key risk: low internal mentor-training participation + only 5 mentors + low registrants.
--
-- ⚠ DEPLOY THE CODE FIRST (or together): this adds a "Merch Shipment" item to CDO's
--   CHECKLIST_TEMPLATE at index 10, shifting First/Second Dry Run to 11/12. The override
--   indices below assume the NEW (post-deploy) template. Run this SQL after deploying.
-- Self-contained & idempotent — safe to re-run.
-- Run in Supabase SQL Editor > New Query

-- ────────────────────────────────────────────────────────────
-- 1. Progress update (dashboard + Telegram DSU read this live)
-- ────────────────────────────────────────────────────────────
UPDATE chapters SET progress_percent = 50, updated_at = now() WHERE id = 'cdo';
UPDATE chapters SET progress_percent = 70, updated_at = now() WHERE id = 'legazpi';
-- Laguna progress unchanged (post-report was already tracked done).

-- ────────────────────────────────────────────────────────────
-- 2. Close completed CDO tasks so they drop out of DSU / Action Items
--    (whitelist / slides / dry run 1 / merch — if these tasks exist)
-- ────────────────────────────────────────────────────────────
UPDATE chapter_tasks SET status = 'done', is_done = true, updated_at = now()
WHERE chapter_id = 'cdo'
  AND (
    description ILIKE '%whitelist%'
    OR description ILIKE '%slides%'
    OR description ILIKE '%first dry run%'
    OR description ILIKE '%merch%'
  )
  AND is_done = false;

-- ────────────────────────────────────────────────────────────
-- 3. Checklist overrides — mark items DONE live (dashboard chapter
--    detail + Telegram read bot_settings.chapter_checklist_overrides).
--    Indices per lib/checklist-data.ts (POST-DEPLOY template):
--      Laguna  → 14 Post-Code Camp Report
--      CDO     → 6 Whitelist · 8 Slides · 9 Mentors(pending) · 10 Merch · 11 First Dry Run
--      Legazpi → 6 Whitelist · 8 Slides · 11 First Dry Run
--    Merge preserves existing overrides for other items (0,1,2,3,5 already done).
-- ────────────────────────────────────────────────────────────
INSERT INTO bot_settings (key, value, updated_at)
VALUES ('chapter_checklist_overrides', '{}', now())
ON CONFLICT (key) DO NOTHING;

UPDATE bot_settings AS b SET
  value = (
    COALESCE(NULLIF(b.value, '')::jsonb, '{}'::jsonb)
    || jsonb_build_object('laguna',
         COALESCE(NULLIF(b.value, '')::jsonb -> 'laguna', '{}'::jsonb)
         || '{"14":{"activity_status":"done"}}'::jsonb)
    || jsonb_build_object('cdo',
         COALESCE(NULLIF(b.value, '')::jsonb -> 'cdo', '{}'::jsonb)
         || '{"6":{"activity_status":"done"},"8":{"activity_status":"done"},"9":{"activity_status":"pending"},"10":{"activity_status":"done"},"11":{"activity_status":"done"}}'::jsonb)
    || jsonb_build_object('legazpi',
         COALESCE(NULLIF(b.value, '')::jsonb -> 'legazpi', '{}'::jsonb)
         || '{"6":{"activity_status":"done"},"8":{"activity_status":"done"},"11":{"activity_status":"done"}}'::jsonb)
  )::text,
  updated_at = now()
WHERE b.key = 'chapter_checklist_overrides';

-- ────────────────────────────────────────────────────────────
-- 4. CDO key risk — low internal mentor-training participation,
--    only 5 mentors (need 10), and low registrant count.
-- ────────────────────────────────────────────────────────────
INSERT INTO risks (code, title, description, owner, chapter_tag, severity, status)
SELECT
  'CDO-R1',
  'Low mentor readiness + low registrations',
  'CDO had low participation in the internal mentor training, so mentors may struggle to assist during the actual Code Camp. They currently have only 5 mentors (need 10) and a low registrant count. Push mentor recruitment/upskilling and registration drive before Jul 29.',
  'Nicole',
  'CDO',
  'high',
  'open'
WHERE NOT EXISTS (
  SELECT 1 FROM risks WHERE upper(trim(code)) = 'CDO-R1'
);

UPDATE risks SET
  title       = 'Low mentor readiness + low registrations',
  description = 'CDO had low participation in the internal mentor training, so mentors may struggle to assist during the actual Code Camp. They currently have only 5 mentors (need 10) and a low registrant count. Push mentor recruitment/upskilling and registration drive before Jul 29.',
  severity    = 'high',
  status      = 'open',
  updated_at  = now()
WHERE upper(trim(code)) = 'CDO-R1';

-- Note: progress_percent is manually set above. Toggling any checklist item from the
-- dashboard recomputes it from the template (app/api/chapter-checklist/route.ts).
