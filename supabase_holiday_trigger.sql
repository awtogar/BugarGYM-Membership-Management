-- Automatically extend active members' due dates when a holiday is added
CREATE OR REPLACE FUNCTION apply_holiday_compensation()
RETURNS TRIGGER AS $$
DECLARE
    holiday_days INTEGER;
BEGIN
    holiday_days := (NEW.end_date - NEW.start_date + 1);

    UPDATE public.members
    SET 
        tanggal_jatuh_tempo = tanggal_jatuh_tempo + holiday_days,
        extended_days = extended_days + holiday_days,
        updated_at = NOW()
    WHERE status = 'aktif';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute compensation on new holiday inserts
DROP TRIGGER IF EXISTS trigger_apply_holiday_compensation ON public.holidays;

CREATE TRIGGER trigger_apply_holiday_compensation
AFTER INSERT ON public.holidays
FOR EACH ROW
EXECUTE FUNCTION apply_holiday_compensation();
