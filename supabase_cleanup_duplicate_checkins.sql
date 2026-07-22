-- Remove duplicate checkins for the same member on the same day
DELETE FROM public.checkins c1
USING public.checkins c2
WHERE c1.member_id IS NOT NULL
  AND c1.member_id = c2.member_id
  AND (CAST(c1.waktu_checkin AT TIME ZONE 'Asia/Jakarta' AS date)) = (CAST(c2.waktu_checkin AT TIME ZONE 'Asia/Jakarta' AS date))
  AND c1.waktu_checkin > c2.waktu_checkin;

-- Enforce 1 check-in per member per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_member_daily_checkin
ON public.checkins (member_id, (CAST(waktu_checkin AT TIME ZONE 'Asia/Jakarta' AS date)))
WHERE member_id IS NOT NULL;
