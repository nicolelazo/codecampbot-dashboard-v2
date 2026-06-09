-- ============================================================
-- June 2026 Chapter Status Update
-- Run this in Supabase SQL Editor > New Query
-- ============================================================

-- 1. Pampanga — declined due to institutional leadership change
UPDATE chapters SET
  status           = 'declined',
  date_iso         = NULL,
  date_text        = 'Declined — Jun 2026',
  countdown_text   = 'Declined',
  progress_percent = 0,
  updated_at       = now()
WHERE id = 'pampanga';

-- Add a task documenting the reason and next step
INSERT INTO chapter_tasks (short_id, chapter_id, owner, description, status)
VALUES (
  'PMP-decline',
  'pampanga',
  'Nicole',
  'PMP declined: school undergoing leadership transition (new president), compressed 4-week summer schedule — find new host school for next run',
  'pending'
)
ON CONFLICT (short_id) DO UPDATE SET
  description = EXCLUDED.description,
  status      = EXCLUDED.status,
  updated_at  = now();

-- 2. Tacloban — removed from official 5, reclassified as applicant chapter
UPDATE chapters SET
  status         = 'applicant',
  date_text      = 'Applicant Chapter — Date TBD',
  date_iso       = NULL,
  countdown_text = 'Applicant',
  updated_at     = now()
WHERE id = 'tacloban';

-- 3. CDO Jumpstart Internship Code Camp — probable 5th slot, pending Kenshin info
INSERT INTO chapters (
  id, number, name, city, region, venue, lead_name,
  date_text, date_iso, status, color,
  progress_percent, countdown_text, merch_status
)
VALUES (
  'cdo',
  '6',
  'CDO Jumpstart',
  'Cagayan de Oro',
  'Northern Mindanao',
  'TBD',
  'Kenshin',
  'TBD',
  NULL,
  'tbc',
  'blue',
  0,
  'TBD',
  'TBC'
)
ON CONFLICT (id) DO UPDATE SET
  name         = EXCLUDED.name,
  city         = EXCLUDED.city,
  lead_name    = EXCLUDED.lead_name,
  status       = EXCLUDED.status,
  updated_at   = now();

-- Add a follow-up task for CDO
INSERT INTO chapter_tasks (chapter_id, owner, description, status)
VALUES (
  'cdo',
  'Nicole',
  'Follow up with Kenshin — CDO Jumpstart Internship Code Camp details (venue, date, pax target). Probable 5th slot.',
  'urgent'
);

-- 4. Update the KPI label to reflect the change in committed code camps
-- (Optional — run if you want to update the label displayed in the bot/dashboard)
UPDATE kpis SET
  label    = 'Committed Code Camps',
  sublabel = 'PMP declined · CDO probable 5th slot · TCL applicant',
  updated_at = now()
WHERE key = 'code_camps';
