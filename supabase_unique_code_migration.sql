-- Add unique_code column to members
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS unique_code TEXT UNIQUE;

-- Function to generate a random 6-character alphanumeric code
CREATE OR REPLACE FUNCTION generate_unique_member_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    IF NEW.unique_code IS NULL OR NEW.unique_code = '' THEN
        LOOP
            new_code := upper(substring(md5(random()::text) from 1 for 6));
            
            SELECT EXISTS (
                SELECT 1 FROM public.members WHERE unique_code = new_code
            ) INTO code_exists;
            
            EXIT WHEN NOT code_exists;
        END LOOP;
        
        NEW.unique_code := new_code;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate code before inserting new members
DROP TRIGGER IF EXISTS trigger_generate_member_code ON public.members;

CREATE TRIGGER trigger_generate_member_code
BEFORE INSERT ON public.members
FOR EACH ROW
EXECUTE FUNCTION generate_unique_member_code();

-- Backfill existing members without unique_code
UPDATE public.members
SET unique_code = upper(substring(md5(id::text || random()::text) from 1 for 6))
WHERE unique_code IS NULL OR unique_code = '';
