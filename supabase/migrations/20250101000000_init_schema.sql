-- ==============================================================================
-- AVENIDA MANAGEMENT — INITIAL SUPABASE DATABASE SCHEMA
-- Conforme aux spécifications docs/DATABASE.md & docs/SECURITY.md
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. FONCTION UTILITAIRE : MISE À JOUR AUTOMATIQUE DU TIMESTAMP updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- DOMAINE 1 : SYSTÈME, AUTH & RBAC (ROLES & PERMISSIONS)
-- ==============================================================================

-- Tables des Rôles
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Permissions système
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Liaison Rôles <-> Permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Profils utilisateurs étendus (liés à auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Attribution des Rôles aux Utilisateurs
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, role_id)
);

-- Journal d'audit immuable
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Paramètres généraux de l'établissement
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- DOMAINE 2 : ÉCOLE & FORMATION ACADÉMIQUE
-- ==============================================================================

-- Années Scolaires
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- ex: '2024-2025'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Départements pédagogiques
CREATE TABLE IF NOT EXISTS public.school_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Programmes & Filières (CFA, CAP, BEP, BT, BTS, etc.)
CREATE TABLE IF NOT EXISTS public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES public.school_departments(id),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    duration_years INT DEFAULT 1 NOT NULL,
    min_entry_level TEXT,
    annual_tuition BIGINT DEFAULT 0 NOT NULL,
    registration_fee BIGINT DEFAULT 0 NOT NULL,
    supplies_fee BIGINT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Classes
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    room_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Matières
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Matières par classe (coefficients, volumes horaires)
CREATE TABLE IF NOT EXISTS public.class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    coefficient INT DEFAULT 1 NOT NULL,
    hourly_volume INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enseignants
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    matricule TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    specialty TEXT,
    diploma TEXT,
    phone TEXT,
    contract_type TEXT,
    hourly_rate BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Assignation des professeurs aux cours
CREATE TABLE IF NOT EXISTS public.teacher_classes (
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    PRIMARY KEY (teacher_id, class_id, subject_id)
);

-- ==============================================================================
-- DOMAINE 3 : ÉLÈVES, TUTEURS & DOSSIERS
-- ==============================================================================

-- Élèves
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number TEXT UNIQUE NOT NULL, -- ex: '814AVN-24'
    student_number TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('M', 'F')),
    birth_date DATE,
    birth_place TEXT,
    nationality TEXT DEFAULT 'Togolaise',
    residence_neighborhood TEXT,
    phone TEXT,
    email TEXT,
    boarder_status TEXT DEFAULT 'externe' CHECK (boarder_status IN ('interne', 'externe')),
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    current_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    photo_url TEXT,
    status TEXT DEFAULT 'actif' CHECK (status IN ('actif', 'abandon', 'diplômé', 'exclu')),
    is_archived BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tuteurs / Parents
CREATE TABLE IF NOT EXISTS public.guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    relationship TEXT, -- Père, Mère, Tuteur légal
    profession TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    id_card_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Liaison Élèves <-> Tuteurs
CREATE TABLE IF NOT EXISTS public.student_guardians (
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    guardian_id UUID REFERENCES public.guardians(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (student_id, guardian_id)
);

-- ==============================================================================
-- DOMAINE 4 : VIE SCOLAIRE & CARNET DE CORRESPONDANCE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.student_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'retard', 'dispense')),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.student_absences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    reason TEXT,
    is_justified BOOLEAN DEFAULT FALSE,
    visa_vie_scolaire BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.student_lates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    duration_minutes INT DEFAULT 15,
    reason TEXT,
    orientation TEXT CHECK (orientation IN ('classe', 'permanence')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- DOMAINE 5 : ÉVALUATIONS, NOTES & BULLETINS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    term INT NOT NULL, -- Trimestre/Semestre 1, 2, 3
    date DATE NOT NULL,
    coefficient INT DEFAULT 1 NOT NULL,
    max_score NUMERIC(5,2) DEFAULT 20.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.report_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    term INT NOT NULL,
    general_average NUMERIC(5,2),
    rank INT,
    total_students INT,
    principal_remark TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (student_id, term)
);

-- ==============================================================================
-- DOMAINE 6 : FINANCES SCOLARITÉ & FACTURATION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.fee_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    amount BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.fee_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    fee_type_id UUID REFERENCES public.fee_types(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
    due_date DATE,
    total_amount BIGINT NOT NULL,
    paid_amount BIGINT DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.fee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT UNIQUE NOT NULL, -- ex: '#AV2024-3486'
    assignment_id UUID REFERENCES public.fee_assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    payment_method TEXT NOT NULL, -- 'Espèces', 'Stripe', 'Virement', 'Mobile Money'
    depositor_name TEXT,
    depositor_id_card TEXT,
    depositor_role TEXT,
    site TEXT DEFAULT 'LOMÉ',
    status TEXT DEFAULT 'validé' CHECK (status IN ('validé', 'en_attente', 'annulé')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- DOMAINE 7 : HÔTEL, CHAMBRES & SÉJOURS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.room_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    base_price_per_night BIGINT NOT NULL,
    capacity INT DEFAULT 2 NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number TEXT UNIQUE NOT NULL,
    floor INT DEFAULT 1 NOT NULL,
    type_id UUID REFERENCES public.room_types(id) ON DELETE RESTRICT,
    status TEXT DEFAULT 'disponible' CHECK (status IN ('disponible', 'occupée', 'réservée', 'nettoyage', 'maintenance', 'hors_service')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.hotel_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    nationality TEXT,
    id_card_or_passport TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.hotel_customers(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    check_in_date TIMESTAMPTZ NOT NULL,
    check_out_date TIMESTAMPTZ NOT NULL,
    adults_count INT DEFAULT 1 NOT NULL,
    children_count INT DEFAULT 0 NOT NULL,
    total_price BIGINT NOT NULL,
    advance_amount BIGINT DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'confirmée' CHECK (status IN ('en_attente', 'confirmée', 'en_cours', 'terminée', 'annulée')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- DOMAINE 8 : RESSOURCES HUMAINES & PAIE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.employee_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    matricule TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    department_id UUID REFERENCES public.employee_departments(id) ON DELETE SET NULL,
    position TEXT NOT NULL,
    contract_type TEXT NOT NULL, -- 'CDI', 'CDD', 'Stage', 'Vacataire'
    base_salary BIGINT NOT NULL,
    hire_date DATE NOT NULL,
    status TEXT DEFAULT 'actif' CHECK (status IN ('actif', 'suspendu', 'sorti')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.salary_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    period_month INT NOT NULL,
    period_year INT NOT NULL,
    base_salary BIGINT NOT NULL,
    bonuses BIGINT DEFAULT 0 NOT NULL,
    overtime_pay BIGINT DEFAULT 0 NOT NULL,
    deductions BIGINT DEFAULT 0 NOT NULL,
    net_salary BIGINT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (employee_id, period_month, period_year)
);

-- ==============================================================================
-- DOMAINE 9 : STOCKS, ARTICLES & FOURNISSEURS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    unit TEXT NOT NULL, -- 'kg', 'litre', 'paquet', 'unité'
    current_quantity NUMERIC(12,2) DEFAULT 0 NOT NULL,
    minimum_stock_alert NUMERIC(12,2) DEFAULT 5 NOT NULL,
    average_cost_price BIGINT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('ENTRÉE', 'SORTIE_CUISINE', 'SORTIE_HOTEL', 'PERTE', 'INVENTAIRE')),
    quantity NUMERIC(12,2) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- DOMAINE 10 : FINANCES GÉNÉRALES & TRÉSORERIE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'Loyer', 'Électricité', 'Maintenance', 'Salaires', etc.
    amount BIGINT NOT NULL,
    description TEXT,
    expense_date DATE NOT NULL,
    payment_method TEXT NOT NULL,
    beneficiary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_ref TEXT UNIQUE NOT NULL,
    transaction_type TEXT NOT NULL, -- 'SCOLARITÉ', 'HÔTEL', 'DÉPENSE', 'AUTRE'
    amount BIGINT NOT NULL,
    payment_method TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('RECETTE', 'DÉPENSE')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) : ACTIVATION SYSTÉMATIQUE
-- ==============================================================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_lates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- POLITIQUES RLS DE BASE (EXEMPLES SÉCURISÉS)
-- ==============================================================================

-- Profils : chaque utilisateur authentifié peut voir son profil et les profils publics
CREATE POLICY "Les utilisateurs peuvent voir les profils"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Rôles système initiaux
INSERT INTO public.roles (code, name, description)
VALUES 
    ('super_admin', 'Super Administrateur', 'Accès total sans restriction'),
    ('direction', 'Direction Générale', 'Supervision globale'),
    ('administration', 'Administration Scolaire', 'Gestion des dossiers scolaires et admissions'),
    ('responsable_pedagogique', 'Responsable Pédagogique', 'Suivi des cours, profs et bulletins'),
    ('responsable_financier', 'Responsable Financier', 'Comptabilité générale et recettes'),
    ('responsable_hotel', 'Responsable Hôtel', 'Gestion des chambres, réservations et hébergement'),
    ('ressources_humaines', 'Ressources Humaines', 'Personnel, paie et présences'),
    ('professeur', 'Enseignant', 'Saisie des notes et présences'),
    ('comptable', 'Comptable', 'Encaissement des écolages et dépenses'),
    ('eleve', 'Élève / Étudiant', 'Consultation des notes, présences et carnet')
ON CONFLICT (code) DO NOTHING;
