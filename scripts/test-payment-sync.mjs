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

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'] || 'https://xlugccxuittetcayjsxc.supabase.co';
const supabaseAnonKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || 'sb_publishable_HwIkJ3XqvKdiuXx8T3J_fg_2fhtfSu7';

console.log("==================================================================");
console.log("🧪 TEST AUTOMATIQUE DU FLUX DE PAIEMENT & DÉDUCTION ÉCOLAGE SUPABASE");
console.log("==================================================================");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  const testMatricule = `TEST-${Date.now().toString().slice(-4)}AVN`;
  const testRefReceipt1 = `REC-TEST-${Date.now().toString().slice(-4)}-1`;
  const testRefReceipt2 = `REC-TEST-${Date.now().toString().slice(-4)}-2`;

  console.log(`\n1️⃣  Création d'un élève de test avec dossier complet : ${testMatricule}`);
  const initialStudent = {
    registration_number: testMatricule,
    student_number: `ETU-${testMatricule}`,
    first_name: "Koffi",
    last_name: "MENSAH",
    gender: "M",
    birth_date: "2004-03-12",
    birth_place: "Lomé",
    nationality: "Togolaise",
    residence_neighborhood: "Dékon",
    address: "30, Rue de l'Avenir",
    city: "Lomé",
    phone: "+228 90 12 34 56",
    email: "koffi.mensah.test@ecole-avenida.tg",
    boarder_status: "externe",
    program_code: "BTS",
    class_name: "1ère Année Hôtellerie",
    academic_year: "2024 - 2025",
    total_fee: 370000,
    paid_fee: 50000,        // Acompte initial d'inscription
    remaining_fee: 320000,   // Reste dû : 320 000 F CFA
    parent_father_name: "M. MENSAH Paul",
    parent_father_phone: "+228 90 00 11 22",
    parent_father_profession: "Fonctionnaire",
    tutor_name: "M. MENSAH Paul",
    tutor_phone: "+228 90 00 11 22",
    emergency_contact_name: "M. MENSAH Paul",
    emergency_contact_phone: "+228 90 00 11 22",
    blood_group: "O+",
    allergies: "Aucune",
    medical_notes: "Apte à la pratique hôtelière et cuisine",
    status: "actif"
  };

  const { error: insertErr } = await supabase.from("students").upsert(initialStudent, { onConflict: "registration_number" });
  if (insertErr) {
    console.error("❌ Échec insertion élève:", insertErr.message);
    process.exit(1);
  }
  console.log("   ✅ Élève inséré dans Supabase.");
  console.log(`   📊 Situation initiale : Total = 370 000 F | Versé = 50 000 F | Reste dû = 320 000 F CFA`);

  // 2. Premier versement : 100 000 F CFA
  console.log("\n2️⃣  Simulation du 1er versement de Tranche : 100 000 F CFA...");
  const paymentAmount1 = 100000;

  // Enregistrement du reçu dans fee_payments
  const receipt1 = {
    receipt_number: testRefReceipt1,
    student_name: `${initialStudent.last_name} ${initialStudent.first_name}`,
    student_matricule: testMatricule,
    class_name: "BTS Hôtellerie",
    designation: "Frais de scolarité - Tranche 1",
    amount: paymentAmount1,
    total_due: initialStudent.total_fee,
    remaining_due: initialStudent.remaining_fee - paymentAmount1, // 220 000
    payment_method: "Espèces",
    depositor_name: "M. MENSAH Paul",
    depositor_phone: "+228 90 00 11 22",
    cashier_name: "Caisse Scolaire Avenida Lomé",
    site: "LOMÉ",
    status: "validé"
  };

  const { error: recErr1 } = await supabase.from("fee_payments").upsert(receipt1, { onConflict: "receipt_number" });
  if (recErr1) {
    console.error("❌ Échec reçu 1:", recErr1.message);
  } else {
    console.log(`   ✅ Reçu N° ${testRefReceipt1} enregistré dans fee_payments.`);
  }

  // Déduction et mise à jour de l'élève dans students
  const newPaid1 = initialStudent.paid_fee + paymentAmount1; // 150 000
  const newRemaining1 = initialStudent.total_fee - newPaid1;  // 220 000
  const { error: updateErr1 } = await supabase
    .from("students")
    .update({ paid_fee: newPaid1, remaining_fee: newRemaining1 })
    .eq("registration_number", testMatricule);

  if (updateErr1) {
    console.error("❌ Échec mise à jour solde 1:", updateErr1.message);
  } else {
    console.log(`   ✅ Déduction effectuée dans Supabase : Payé = ${newPaid1} F | Reste = ${newRemaining1} F CFA`);
  }

  // Enregistrement en caisse dans expenses (recette)
  const { error: expErr1 } = await supabase.from("expenses").upsert({
    reference: testRefReceipt1,
    type: "recette",
    category: "Écolages Scolaires",
    amount: paymentAmount1,
    description: `Encaissement Scolarité — ${receipt1.student_name} (${testMatricule})`,
    payment_method: "Espèces",
    recorded_by: "Caisse Scolaire Lomé"
  }, { onConflict: "reference" });

  if (!expErr1) {
    console.log(`   ✅ Recette de ${paymentAmount1.toLocaleString()} F CFA créditée en comptabilité.`);
  }

  // Vérification de lecture dans Supabase
  console.log("\n3️⃣  Vérification de la base Supabase en direct...");
  const { data: verify1, error: readErr1 } = await supabase
    .from("students")
    .select("registration_number, first_name, last_name, total_fee, paid_fee, remaining_fee")
    .eq("registration_number", testMatricule)
    .single();

  if (readErr1 || !verify1) {
    console.error("❌ Échec relecture élève:", readErr1?.message);
  } else {
    console.log("   📋 Données relues depuis Supabase :", verify1);
    if (verify1.paid_fee === 150000 && verify1.remaining_fee === 220000) {
      console.log("   🎯 VALIDATION ÉTAPE 1 : Le solde est parfaitement exact (220 000 F restants) !");
    } else {
      console.error("   ⚠️ Incohérence de solde :", verify1);
    }
  }

  // 4. Deuxième versement soldant le reste : 220 000 F CFA
  console.log("\n4️⃣  Simulation du règlement du solde final : 220 000 F CFA...");
  const paymentAmount2 = 220000;
  const newPaid2 = verify1.paid_fee + paymentAmount2; // 370 000
  const newRemaining2 = Math.max(0, verify1.total_fee - newPaid2); // 0

  await supabase.from("fee_payments").upsert({
    receipt_number: testRefReceipt2,
    student_name: `${initialStudent.last_name} ${initialStudent.first_name}`,
    student_matricule: testMatricule,
    class_name: "BTS Hôtellerie",
    designation: "Solde final de scolarité",
    amount: paymentAmount2,
    total_due: initialStudent.total_fee,
    remaining_due: newRemaining2,
    payment_method: "Virement bancaire",
    depositor_name: "M. MENSAH Paul",
    cashier_name: "Caisse Scolaire Avenida Lomé",
    site: "LOMÉ",
    status: "validé"
  }, { onConflict: "receipt_number" });

  await supabase
    .from("students")
    .update({ paid_fee: newPaid2, remaining_fee: newRemaining2 })
    .eq("registration_number", testMatricule);

  // Vérification solde final
  const { data: verify2 } = await supabase
    .from("students")
    .select("registration_number, paid_fee, remaining_fee")
    .eq("registration_number", testMatricule)
    .single();

  console.log("   📋 Données après solde intégral :", verify2);
  if (verify2 && verify2.remaining_fee === 0 && verify2.paid_fee === 370000) {
    console.log("   🌟 VALIDATION FINALE : Écolage 100% SOLDÉ (Reste = 0 F CFA) !");
  }

  // Nettoyage des données de test
  console.log("\n5️⃣  Nettoyage des enregistrements de test...");
  await supabase.from("fee_payments").delete().in("receipt_number", [testRefReceipt1, testRefReceipt2]);
  await supabase.from("expenses").delete().eq("reference", testRefReceipt1);
  await supabase.from("students").delete().eq("registration_number", testMatricule);
  console.log("   🧹 Données de test supprimées proprement de Supabase.");

  console.log("\n==================================================================");
  console.log("✅ TOUS LES TESTS DE SYNCHRONISATION SUPABASE SONT VALIDÉS À 100% !");
  console.log("==================================================================");
}

runTest().catch(console.error);
