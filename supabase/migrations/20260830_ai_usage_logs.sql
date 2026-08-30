-- ==============================================================================
-- Migrasi: Tabel Monitoring Penggunaan AI (ai_usage_logs) & Quota Profiles
-- Deskripsi: Mencatat riwayat pemanggilan Claude AI per user, feature, model,
--            token, dan estimasi biaya USD secara terpusat untuk KAP Zaidan Jauhari.
-- ==============================================================================

-- 1. Buat tabel ai_usage_logs
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_email TEXT,
    user_name TEXT,
    feature TEXT NOT NULL,          -- 'tax-mapping', 'tax-findings', 'honorarium-disambiguation', 'sp2dk-response', 'keyword-scanner', dll.
    model TEXT NOT NULL,            -- 'claude-haiku-4-5-20251001', 'claude-sonnet-5', dll.
    tier TEXT NOT NULL,             -- 'haiku' | 'sonnet'
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    estimated_cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
    client_name TEXT,               -- Nama PT/Klien yang sedang dianalisis
    tax_year TEXT,                  -- Tahun Pajak yang sedang diproses
    status TEXT DEFAULT 'SUCCESS',   -- 'SUCCESS' | 'RATE_LIMITED' | 'QUOTA_EXCEEDED' | 'ERROR'
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Indeks untuk optimasi query dashboard & filtering
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_date ON public.ai_usage_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON public.ai_usage_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_feature ON public.ai_usage_logs (feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_tier ON public.ai_usage_logs (tier);

-- 3. Tambahkan kolom kuota bulanan di tabel profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS monthly_token_quota INTEGER DEFAULT 1000000,
ADD COLUMN IF NOT EXISTS monthly_cost_limit_usd NUMERIC(8, 2) DEFAULT 10.00;

-- 4. Aktifkan Row Level Security (RLS)
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policy 1: User biasa hanya dapat membaca riwayat penggunaan miliknya sendiri
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_usage_logs' AND policyname = 'Users can view own usage logs'
    ) THEN
        CREATE POLICY "Users can view own usage logs" ON public.ai_usage_logs
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Policy 2: Admin dan Partner dapat membaca semua riwayat penggunaan
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_usage_logs' AND policyname = 'Admins and Partners can view all usage logs'
    ) THEN
        CREATE POLICY "Admins and Partners can view all usage logs" ON public.ai_usage_logs
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'partner')
                )
            );
    END IF;
END
$$;

-- Policy 3: Service role dapat insert log tanpa batasan
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_usage_logs' AND policyname = 'Service role can insert usage logs'
    ) THEN
        CREATE POLICY "Service role can insert usage logs" ON public.ai_usage_logs
            FOR INSERT WITH CHECK (true);
    END IF;
END
$$;

