-- ==============================================================================
-- AVENIDA MANAGEMENT — MIGRATION: EXTENSION DU SCHÉMA ET POLITIQUES RLS
-- ==============================================================================

-- 1. EXTEND STUDENTS TABLE
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS program_code TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS class_name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS academic_year TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS total_fee BIGINT DEFAULT 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS paid_fee BIGINT DEFAULT 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS remaining_fee BIGINT DEFAULT 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS uploaded_documents JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_gender_check;
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_boarder_status_check;
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_status_check;

-- 2. EXTEND EMPLOYEES TABLE
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS sector TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS role_title TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS cnss_number TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS contract_duration TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS contract_end_date DATE;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS highest_degree TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 0;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS cv_summary TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS uploaded_documents JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_status_check;

-- 3. EXTEND HOTEL_CUSTOMERS TABLE
ALTER TABLE public.hotel_customers ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.hotel_customers ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.hotel_customers ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.hotel_customers ADD COLUMN IF NOT EXISTS total_stays INT DEFAULT 0;
ALTER TABLE public.hotel_customers ADD COLUMN IF NOT EXISTS total_spent BIGINT DEFAULT 0;
ALTER TABLE public.hotel_customers ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;

-- 4. EXTEND RESERVATIONS TABLE
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS booking_ref TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS customer_id_card TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS customer_nationality TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS room_number TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS room_type TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS check_in TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS check_out TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS nights_count INT DEFAULT 1;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS nightly_rate BIGINT DEFAULT 0;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS deposit_paid BIGINT DEFAULT 0;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'en_attente';
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS cashier_name TEXT;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

-- 5. EXTEND EXPENSES / FINANCES TABLE
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'depense';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS recorded_by TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS receipt_number TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS receipt_document_url TEXT;

-- 6. EXTEND ROOMS TABLE
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS room_type TEXT;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS price_per_night BIGINT DEFAULT 25000;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS current_guest TEXT;
ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_status_check;

-- 7. EXTEND FEE_PAYMENTS TABLE
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS student_matricule TEXT;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS class_name TEXT;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS total_due BIGINT DEFAULT 0;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS remaining_due BIGINT DEFAULT 0;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS depositor_phone TEXT;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS cashier_name TEXT;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS payment_date DATE DEFAULT CURRENT_DATE;

-- 8. INDEXES UNICITÉ POUR UPSERT
CREATE UNIQUE INDEX IF NOT EXISTS expenses_reference_idx ON public.expenses(reference);
CREATE UNIQUE INDEX IF NOT EXISTS reservations_booking_ref_idx ON public.reservations(booking_ref);
CREATE UNIQUE INDEX IF NOT EXISTS hotel_customers_code_idx ON public.hotel_customers(code);
CREATE UNIQUE INDEX IF NOT EXISTS hotel_customers_phone_idx ON public.hotel_customers(phone);

-- 9. POLITIQUES RLS PERMISSIVES POUR APPLICATION
DO $$ 
DECLARE
  tbl TEXT;
  tables_list TEXT[] := ARRAY[
    'students', 'employees', 'hotel_customers', 'reservations', 
    'expenses', 'rooms', 'fee_payments', 'user_invitations', 
    'classes', 'academic_years', 'programs', 'room_types',
    'employee_departments', 'profiles', 'salary_records',
    'grades', 'report_cards', 'system_settings'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_list LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "public_full_access" ON public.%I;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "allow_all" ON public.%I;', tbl);
    EXECUTE format('CREATE POLICY "public_full_access" ON public.%I FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);', tbl);
  END LOOP;
END $$;
