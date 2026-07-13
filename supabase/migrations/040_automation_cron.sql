-- ============================================================
-- 040_automation_cron.sql
-- pg_cron job to drain automation_pending_executions every 5 min.
-- Requires: pg_cron + pg_net extensions (enabled in Supabase).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS http;

SELECT cron.schedule(
  'drain-automation-pending',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url=>'https://zynex-crm-eosin.vercel.app/api/automations/cron',
    headers=>'{"x-cron-secret": "1E@s5aWvpJ>jVHutk>Zw]VP:I46zBJ?n"}'
  );
  $$
);
