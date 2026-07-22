-- ===================================================================
-- Unique Index: Enforce 1 check-in per member per day in PostgreSQL
-- ===================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_member_daily_checkin
ON public.checkins (member_id, (CAST(waktu_checkin AT TIME ZONE 'Asia/Jakarta' AS date)))
WHERE member_id IS NOT NULL;
