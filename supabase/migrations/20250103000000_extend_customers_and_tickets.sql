-- ==============================================================================
-- AVENIDA MANAGEMENT — MIGRATION: EXTENSION CLIENTS HOTEL, CHAMBRES & BILLETS ASSIDUITE
-- ==============================================================================

-- 1. EXTEND HOTEL_CUSTOMERS TABLE
ALTER TABLE public.hotel_customers 
ADD COLUMN IF NOT EXISTS uploaded_documents JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS stay_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS balance BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_room_number TEXT,
ADD COLUMN IF NOT EXISTS active_reservation_id TEXT;

-- 2. EXTEND ROOMS TABLE
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS guest_phone TEXT,
ADD COLUMN IF NOT EXISTS guest_id_card TEXT,
ADD COLUMN IF NOT EXISTS check_in_date TEXT,
ADD COLUMN IF NOT EXISTS check_out_date TEXT,
ADD COLUMN IF NOT EXISTS reservation_id TEXT,
ADD COLUMN IF NOT EXISTS paid_amount BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount BIGINT DEFAULT 0;

-- 3. EXTEND STUDENT_ABSENCES TABLE
ALTER TABLE public.student_absences 
ADD COLUMN IF NOT EXISTS ticket_type TEXT DEFAULT 'absence',
ADD COLUMN IF NOT EXISTS parent_justified BOOLEAN DEFAULT false;

-- 4. EXTEND STUDENT_LATES TABLE
ALTER TABLE public.student_lates 
ADD COLUMN IF NOT EXISTS destination TEXT DEFAULT 'classe',
ADD COLUMN IF NOT EXISTS visa_vie_scolaire BOOLEAN DEFAULT true;
