import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// 1. Lire les variables .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[match[1].trim()] = val;
  }
}

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

console.log("==================================================================");
console.log("🔍 TEST COMPLET DE VALIDATION ET D'ÉCRITURE SUPABASE — TOUTES LES TABLES");
console.log("==================================================================");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTests() {
  const tablesToVerify = [
    'students',
    'employees',
    'hotel_customers',
    'reservations',
    'rooms',
    'fee_payments',
    'expenses',
    'salary_records',
    'products',
    'grades',
    'report_cards',
    'student_absences',
    'student_lates',
    'director_modifications',
  ];

  let successCount = 0;
  let failCount = 0;

  for (const table of tablesToVerify) {
    try {
      const { data, count, error } = await supabase.from(table).select('*', { count: 'exact', head: false }).limit(3);
      if (error) {
        console.error(`❌ Table "${table}": ÉCHEC lecture -> ${error.message}`);
        failCount++;
      } else {
        console.log(`✅ Table "${table}": OK (${data.length} enregistrements récupérés)`);
        successCount++;
      }
    } catch (e) {
      console.error(`❌ Table "${table}": EXCEPTION ->`, e.message);
      failCount++;
    }
  }

  console.log("------------------------------------------------------------------");
  console.log(`RÉSULTAT DES TESTS : ${successCount}/${tablesToVerify.length} tables accessibles.`);

  // Test d'écriture élève avec toutes les données étendues (parents, adresse, docs, raw_data)
  console.log("\n🧪 Test d'insertion d'un élève avec données complètes & volumineuses...");
  const testMatricule = `TEST-${Date.now().toString().slice(-4)}AVN`;
  const testStudent = {
    registration_number: testMatricule,
    student_number: `ETU-${testMatricule}`,
    first_name: "Testeur",
    last_name: "AVENIDA",
    gender: "M",
    birth_date: "2005-06-15",
    birth_place: "Lomé",
    nationality: "Togolaise",
    residence_neighborhood: "Dékon",
    address: "Rue du Grand Marché, Immeuble Avenida",
    city: "Lomé",
    phone: "+228 90 12 34 56",
    phone_secondary: "+228 91 23 45 67",
    email: "test.student@ecole-avenida.tg",
    boarder_status: "externe",
    emergency_contact_name: "M. Tuteur Test",
    emergency_contact_phone: "+228 99 88 77 66",
    id_card_number: "TG-CNI-987654321",
    previous_school: "Lycée de Tokoin",
    last_diploma: "BAC 2 Série G2",
    last_class: "Terminale",
    average_last_year: "14.50",
    transfer_reason: "Passion pour les arts culinaires",
    year_level: "1ère Année",
    specialty: "Cuisine & Arts de la Table",
    program_code: "BTS",
    class_name: "1ère Année BTS - Cuisine",
    academic_year: "2026 - 2027",
    parent_father_name: "M. Test Père",
    parent_father_phone: "+228 90 11 22 33",
    parent_father_profession: "Enseignant",
    parent_mother_name: "Mme. Test Mère",
    parent_mother_phone: "+228 92 33 44 55",
    parent_mother_profession: "Commerçante",
    tutor_name: "M. Tuteur Général",
    tutor_phone: "+228 93 44 55 66",
    tutor_profession: "Cadre de banque",
    tutor_relation: "Oncle",
    blood_group: "O+",
    allergies: "Aucune",
    medical_notes: "Apte à la pratique en cuisine et hébergement",
    payment_method: "Espèces",
    registration_fee: 50000,
    total_fee: 370000,
    paid_fee: 50000,
    remaining_fee: 320000,
    installments_count: 3,
    status: "actif",
    notes: "Inscription validée par la Direction",
    uploaded_documents: {
      doc_cni: {
        name: "cni_recto_verso.pdf",
        size: 154200,
        type: "application/pdf",
        dataUrl: "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr...",
        category: "Pièces d'Identité"
      }
    },
    raw_data: { test: true, timestamp: Date.now() }
  };

  const { data: upsertData, error: upsertError } = await supabase
    .from("students")
    .upsert(testStudent, { onConflict: "registration_number" })
    .select();

  if (upsertError) {
    console.error("❌ Échec insertion élève étendu :", upsertError.message);
  } else {
    console.log("✅ Succès insertion élève étendu ! Matricule :", testMatricule);
    console.log("✅ Données retournées :", {
      nom: `${upsertData[0].last_name} ${upsertData[0].first_name}`,
      tuteur: upsertData[0].tutor_name,
      quartier: upsertData[0].residence_neighborhood,
      documents: Object.keys(upsertData[0].uploaded_documents || {})
    });

    // Nettoyage de l'élève de test
    await supabase.from("students").delete().eq("registration_number", testMatricule);
    console.log("🧹 Élève de test nettoyé de la base.");
  }
}

runTests();
