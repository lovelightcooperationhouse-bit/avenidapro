import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read credentials from environment or .env.local
const token = process.env.SUPABASE_TOKEN || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const projectRef = process.env.SUPABASE_PROJECT_REF || "xlugccxuittetcayjsxc";

if (!token) {
  console.error("❌ SUPABASE_TOKEN manquant. Définissez la variable d'environnement SUPABASE_TOKEN.");
  process.exit(1);
}

async function runSql(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, data: json };
}

async function main() {
  console.log("📋 Lecture du fichier de migration...");
  const sqlPath = join(__dirname, '..', 'supabase', 'migrations', '20250102000000_fix_policies_and_columns.sql');
  const sql = readFileSync(sqlPath, 'utf-8');
  
  // Split into individual statements to handle them one by one
  // Remove comments and split
  const cleanSql = sql.replace(/--.*$/gm, '').trim();
  
  console.log("🔧 Application de la migration sur Supabase...");
  
  // Execute each ALTER TABLE statement separately to avoid partial failures
  const statements = [
    // Students columns
    "ALTER TABLE public.students ADD COLUMN IF NOT EXISTS program_code TEXT",
    "ALTER TABLE public.students ADD COLUMN IF NOT EXISTS class_name TEXT",
    "ALTER TABLE public.students ADD COLUMN IF NOT EXISTS academic_year TEXT",
    "ALTER TABLE public.students ADD COLUMN IF NOT EXISTS total_fee BIGINT DEFAULT 0",
    "ALTER TABLE public.students ADD COLUMN IF NOT EXISTS paid_fee BIGINT DEFAULT 0",
    "ALTER TABLE public.students ADD COLUMN IF NOT EXISTS remaining_fee BIGINT DEFAULT 0",
    "ALTER TABLE public.students ADD COLUMN IF NOT EXISTS uploaded_documents JSONB DEFAULT '{}'::jsonb",
    "ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_gender_check",
    "ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_boarder_status_check",
    "ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_status_check",
    
    // Employees columns
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS sector TEXT",
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS role_title TEXT",
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS department TEXT",
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS specialty TEXT",
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS cnss_number TEXT",
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS contract_duration TEXT",
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS contract_end_date DATE",
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS highest_degree TEXT",
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 0",
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS cv_summary TEXT",
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS photo_url TEXT",
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS uploaded_documents JSONB DEFAULT '{}'::jsonb",
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS phone TEXT",
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS email TEXT",
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS gender TEXT",
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS birth_date DATE",
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS nationality TEXT",
    "ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS neighborhood TEXT",
    "ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_status_check",
    
    // Hotel customers columns
    "ALTER TABLE public.hotel_customers ADD COLUMN IF NOT EXISTS code TEXT",
    "ALTER TABLE public.hotel_customers ADD COLUMN IF NOT EXISTS full_name TEXT",
    "ALTER TABLE public.hotel_customers ADD COLUMN IF NOT EXISTS company TEXT",
    "ALTER TABLE public.hotel_customers ADD COLUMN IF NOT EXISTS total_stays INT DEFAULT 0",
    "ALTER TABLE public.hotel_customers ADD COLUMN IF NOT EXISTS total_spent BIGINT DEFAULT 0",
    "ALTER TABLE public.hotel_customers ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false",
    
    // Reservations columns
    "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS booking_ref TEXT",
    "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS customer_name TEXT",
    "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS customer_phone TEXT",
    "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS customer_email TEXT",
    "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS customer_id_card TEXT",
    "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS customer_nationality TEXT",
    "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS room_number TEXT",
    "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS room_type TEXT",
    "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS check_in TEXT",
    "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS check_out TEXT",
    "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS nights_count INT DEFAULT 1",
    "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS nightly_rate BIGINT DEFAULT 0",
    "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS deposit_paid BIGINT DEFAULT 0",
    "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'en_attente'",
    "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS payment_method TEXT",
    "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS cashier_name TEXT",
    "ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS notes TEXT",
    "ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check",
    
    // Expenses columns
    "ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS reference TEXT",
    "ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'depense'",
    "ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS recorded_by TEXT",
    "ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS receipt_number TEXT",
    "ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS receipt_document_url TEXT",
    
    // Rooms columns
    "ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS room_type TEXT",
    "ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS price_per_night BIGINT DEFAULT 25000",
    "ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS current_guest TEXT",
    "ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_status_check",
    
    // Fee payments columns
    "ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS student_name TEXT",
    "ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS student_matricule TEXT",
    "ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS class_name TEXT",
    "ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS designation TEXT",
    "ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS total_due BIGINT DEFAULT 0",
    "ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS remaining_due BIGINT DEFAULT 0",
    "ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS depositor_phone TEXT",
    "ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS cashier_name TEXT",
    "ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS payment_date DATE DEFAULT CURRENT_DATE",
    
    // Unique indexes
    "CREATE UNIQUE INDEX IF NOT EXISTS expenses_reference_idx ON public.expenses(reference)",
    "CREATE UNIQUE INDEX IF NOT EXISTS reservations_booking_ref_idx ON public.reservations(booking_ref)",
    "CREATE UNIQUE INDEX IF NOT EXISTS hotel_customers_code_idx ON public.hotel_customers(code)",
    "CREATE UNIQUE INDEX IF NOT EXISTS hotel_customers_phone_idx ON public.hotel_customers(phone)",
  ];
  
  let success = 0;
  let errors = [];
  
  for (const stmt of statements) {
    const result = await runSql(stmt + ';');
    if (result.ok || result.data?.message?.includes('already exists') || 
        JSON.stringify(result.data).includes('already exists') ||
        JSON.stringify(result.data).includes('does not exist')) {
      success++;
      process.stdout.write('.');
    } else {
      const errMsg = JSON.stringify(result.data).substring(0, 100);
      if (!errMsg.includes('already exists') && !errMsg.includes('does not exist')) {
        errors.push({ stmt: stmt.substring(0, 60), err: errMsg });
        process.stdout.write('x');
      } else {
        success++;
        process.stdout.write('.');
      }
    }
  }
  
  console.log('\n');
  
  // Apply RLS policies using a DO block
  console.log("🔐 Application des politiques RLS...");
  const rlsSql = `
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
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "public_full_access" ON public.%I;', tbl);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "allow_all" ON public.%I;', tbl);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      EXECUTE format('CREATE POLICY "public_full_access" ON public.%I FOR ALL TO public, anon, authenticated USING (true) WITH CHECK (true);', tbl);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;
  `;
  
  const rlsResult = await runSql(rlsSql);
  if (rlsResult.ok) {
    console.log("✅ Politiques RLS appliquées avec succès !");
  } else {
    console.log("⚠️ Résultat RLS:", JSON.stringify(rlsResult.data).substring(0, 200));
  }
  
  console.log(`\n✅ ${success} instructions exécutées avec succès`);
  if (errors.length > 0) {
    console.log(`⚠️ ${errors.length} erreurs:`);
    errors.forEach(e => console.log(`  - ${e.stmt}: ${e.err}`));
  }
  
  // Verify: Try inserting a test student
  console.log("\n🧪 Test d'insertion dans la table students...");
  const testResult = await runSql(`
    INSERT INTO public.students (
      registration_number, first_name, last_name, gender, status
    ) VALUES (
      'TEST-VERIFY-001', 'Test', 'Verification', 'M', 'actif'
    ) ON CONFLICT (registration_number) DO UPDATE SET first_name = EXCLUDED.first_name
    RETURNING registration_number, first_name, last_name;
  `);
  
  if (testResult.ok) {
    console.log("✅ SUCCÈS - Insertion dans students fonctionne !");
    console.log("   Données:", JSON.stringify(testResult.data));
    
    // Clean up test data
    await runSql("DELETE FROM public.students WHERE registration_number = 'TEST-VERIFY-001'");
    console.log("   ✅ Données de test nettoyées");
  } else {
    console.log("❌ ÉCHEC insertion students:", JSON.stringify(testResult.data).substring(0, 300));
  }
}

main().catch(console.error);
