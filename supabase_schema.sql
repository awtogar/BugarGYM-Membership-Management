-- ========================================================
-- Gym Management System - Initial Database Schema & RLS
-- ========================================================

-- 1. ENUM TYPES
CREATE TYPE tipe_tarif_enum AS ENUM ('pelajar', 'karyawan');
CREATE TYPE status_member_enum AS ENUM ('aktif', 'akan_habis', 'expired', 'suspend');
CREATE TYPE tipe_pengunjung_enum AS ENUM ('member', 'non-member');
CREATE TYPE status_bayar_enum AS ENUM ('lunas', 'belum_bayar');
CREATE TYPE metode_bayar_enum AS ENUM ('qris', 'tunai');

-- 2. TABLES

-- Table: members
CREATE TABLE public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    no_hp TEXT,
    email TEXT,
    tipe_tarif tipe_tarif_enum NOT NULL DEFAULT 'pelajar',
    tanggal_daftar DATE NOT NULL DEFAULT CURRENT_DATE,
    tanggal_bayar_terakhir DATE NOT NULL DEFAULT CURRENT_DATE,
    tanggal_jatuh_tempo DATE NOT NULL,
    extended_days INTEGER NOT NULL DEFAULT 0,
    status status_member_enum NOT NULL DEFAULT 'aktif',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: checkins
CREATE TABLE public.checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    tipe tipe_pengunjung_enum NOT NULL,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    tanda_tangan_url TEXT,
    waktu_checkin TIMESTAMPTZ DEFAULT NOW(),
    status_bayar status_bayar_enum NOT NULL DEFAULT 'lunas',
    jumlah_bayar NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: payments
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    tanggal_bayar DATE NOT NULL DEFAULT CURRENT_DATE,
    jumlah NUMERIC NOT NULL DEFAULT 0,
    metode metode_bayar_enum NOT NULL DEFAULT 'tunai',
    periode_berlaku_sampai DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: holidays
CREATE TABLE public.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admin users full access to all tables
CREATE POLICY "Admin full access on members" ON public.members
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on checkins" ON public.checkins
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on payments" ON public.payments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on holidays" ON public.holidays
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. STORAGE BUCKET FOR SIGNATURES
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admin signatures upload policy" ON storage.objects
    FOR ALL TO authenticated USING (bucket_id = 'signatures') WITH CHECK (bucket_id = 'signatures');
