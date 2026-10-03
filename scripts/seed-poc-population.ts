import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

// Ensure SSL connections work behind proxies if needed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tzpwcdnvhcloknzrzpvk.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_k2K3LJXLM3Bj-2p_X_nQIA_weSNhXcf";

const ORGANIZATION_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const TARGET_POPULATION = 23746;
const BATCH_SIZE = 500;

// Seeded PRNG (Mulberry32) for reproducible synthetic data
function createMulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = createMulberry32(20261002);

function choice<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function weightedChoice<T>(items: { item: T; weight: number }[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let threshold = rand() * total;
  for (const entry of items) {
    if (threshold < entry.weight) return entry.item;
    threshold -= entry.weight;
  }
  return items[items.length - 1].item;
}

const MALE_NAMES = [
  "Carlos", "Juan", "Andrés", "Felipe", "Luis", "José", "Diego", "Santiago",
  "Alejandro", "Fernando", "Gabriel", "Daniel", "David", "Miguel", "Jorge",
  "Camilo", "Cristian", "Julián", "Óscar", "Ricardo", "Leonardo", "Mauricio",
  "Javier", "Sebastián", "Manuel", "Álvaro", "Hernando", "Gonzalo", "Gustavo",
  "Héctor", "Iván", "Rafael", "Alfonso", "Fabio", "Nelson", "Rodrigo", "Sergio",
  "Germán", "Mario", "Jaime", "César", "Pablo", "Ramiro", "Édgar", "Raúl"
];

const FEMALE_NAMES = [
  "María", "Ana", "Claudia", "Sandra", "Martha", "Patricia", "Andrea", "Carolina",
  "Paola", "Diana", "Natalia", "Daniela", "Laura", "Juliana", "Valentina", "Camila",
  "Sofía", "Luisa", "Mónica", "Adriana", "Gloria", "Esperanza", "Olga", "Carmen",
  "Rosa", "Lucía", "Isabel", "Elena", "Beatriz", "Teresa", "Cecilia", "Pilar",
  "Liliana", "Ximena", "Marcela", "Viviana", "Lorena", "Clara", "Rocío", "Consuelo",
  "Nelly", "Dora", "Astrid", "Marleny", "Sonia"
];

const LAST_NAMES = [
  "Rodríguez", "Gómez", "González", "Martínez", "García", "López", "Hernández",
  "Pérez", "Sánchez", "Ramírez", "Flórez", "Galvis", "Mantilla", "Pinzón",
  "Rueda", "Ardila", "Serrano", "Díaz", "Castro", "Suárez", "Barrera", "Cárdenas",
  "Villamizar", "Moreno", "Rojas", "Muñoz", "Vargas", "Romero", "Torres", "Álvarez",
  "Morales", "Ortiz", "Gutiérrez", "Medina", "Silva", "Castillo", "Peña", "Rivera",
  "Cruz", "Reyes", "Herrera", "Ospina", "Calderón", "Salazar", "Parra", "Arenas",
  "Jaimes", "Carvajal", "Navas", "Caballero", "Valdivieso", "Velandia"
];

const MUNICIPALITIES = [
  { item: { city: "Bucaramanga", dept: "Santander" }, weight: 30 },
  { item: { city: "Floridablanca", dept: "Santander" }, weight: 16 },
  { item: { city: "Girón", dept: "Santander" }, weight: 11 },
  { item: { city: "Piedecuesta", dept: "Santander" }, weight: 9 },
  { item: { city: "Barrancabermeja", dept: "Santander" }, weight: 6 },
  { item: { city: "San Gil", dept: "Santander" }, weight: 4 },
  { item: { city: "Socorro", dept: "Santander" }, weight: 2.5 },
  { item: { city: "Málaga", dept: "Santander" }, weight: 2 },
  { item: { city: "Lebrija", dept: "Santander" }, weight: 2 },
  { item: { city: "Rionegro", dept: "Santander" }, weight: 1.5 },
  { item: { city: "Cúcuta", dept: "Norte de Santander" }, weight: 5 },
  { item: { city: "Bogotá", dept: "Bogotá D.C." }, weight: 6 },
  { item: { city: "Medellín", dept: "Antioquia" }, weight: 5 },
];

const AGE_BRACKETS = [
  { item: { min: 18, max: 24 }, weight: 12 },
  { item: { min: 25, max: 34 }, weight: 26 },
  { item: { min: 35, max: 44 }, weight: 24 },
  { item: { min: 45, max: 54 }, weight: 18 },
  { item: { min: 55, max: 64 }, weight: 12 },
  { item: { min: 65, max: 84 }, weight: 8 },
];

const EMPLOYMENT_STATUSES = [
  { item: "Empleado", weight: 37 },
  { item: "Independiente", weight: 18 },
  { item: "Informal", weight: 11 },
  { item: "Desempleado", weight: 5 },
  { item: "Pensionado", weight: 12 },
  { item: "Estudiante", weight: 5 },
  { item: "Sin información", weight: 12 }, // Real gap
];

const EDUCATION_LEVELS = [
  { item: "Primaria", weight: 8 },
  { item: "Secundaria", weight: 24 },
  { item: "Técnico", weight: 20 },
  { item: "Tecnólogo", weight: 12 },
  { item: "Profesional", weight: 18 },
  { item: "Posgrado", weight: 8 },
  { item: "Sin información", weight: 10 }, // Real gap
];

const OCCUPATIONS_EMPLEADO = [
  "Empleado administrativo", "Asesor comercial", "Docente", "Analista de operaciones",
  "Auxiliar contable", "Operario de planta", "Cajero", "Técnico de soporte",
  "Secretario general", "Coordinador de logística"
];

const OCCUPATIONS_INDEPENDIENTE = [
  "Comerciante", "Propietario de negocio", "Conductor de transporte", "Consultor independiente",
  "Agricultor", "Prestador de servicios", "Contratista de obra", "Emprendedor gastronómico"
];

function generateUuid(): string {
  return randomUUID();
}

function cleanAccents(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

async function runSeed() {
  console.log("==================================================");
  console.log("NEXA INTELLIGENCE — EXPAND SYNTHETIC POC DATASET");
  console.log(`Target Population: ${TARGET_POPULATION.toLocaleString("es-CO")} synthetic people`);
  console.log("==================================================");

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Count current records in Supabase
  const { count: currentCount, error: countError } = await supabase
    .from("people")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("Failed to query people count:", countError.message);
    process.exit(1);
  }

  console.log(`Current population: ${currentCount}`);
  console.log(`Target population: ${TARGET_POPULATION}`);

  const needed = TARGET_POPULATION - (currentCount || 0);

  if (needed <= 0) {
    console.log("Target population already reached. No new records needed.");
    await printVerification(supabase);
    return;
  }

  console.log(`Generating: ${needed}`);

  // Fetch all existing document numbers to prevent any potential collision
  const usedDocNumbers = new Set<string>();
  let docFrom = 0;
  const docPageSize = 1000;
  while (true) {
    const { data: docChunk, error: docErr } = await supabase
      .from("people")
      .select("document_number")
      .range(docFrom, docFrom + docPageSize - 1);
    if (docErr || !docChunk || docChunk.length === 0) break;
    for (const d of docChunk) {
      if (d.document_number) usedDocNumbers.add(d.document_number);
    }
    if (docChunk.length < docPageSize) break;
    docFrom += docPageSize;
  }
  console.log(`Indexed ${usedDocNumbers.size} existing document numbers.`);

  // Generate synthetic records
  const newRecords: any[] = [];
  let docSeed = 100_000_000 + (currentCount || 0) * 17;

  for (let i = 0; i < needed; i++) {
    const isFemale = rand() > 0.49;
    const firstName = isFemale ? choice(FEMALE_NAMES) : choice(MALE_NAMES);
    const lastName1 = choice(LAST_NAMES);
    const lastName2 = choice(LAST_NAMES);
    const lastName = `${lastName1} ${lastName2}`;
    const gender = isFemale ? "F" : "M";

    // Age & Birth Date
    const ageBracket = weightedChoice(AGE_BRACKETS);
    const age = ageBracket.min + Math.floor(rand() * (ageBracket.max - ageBracket.min + 1));
    const birthYear = 2026 - age;
    const birthMonth = String(1 + Math.floor(rand() * 12)).padStart(2, "0");
    const birthDay = String(1 + Math.floor(rand() * 28)).padStart(2, "0");
    const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;

    // Document number (realistic Colombian format)
    let docNumStr = "";
    while (true) {
      docSeed += Math.floor(rand() * 89) + 11;
      const numStr = String(docSeed);
      if (numStr.length <= 8) {
        docNumStr = `${numStr.slice(0, 2)}.${numStr.slice(2, 5)}.${numStr.slice(5)}`;
      } else {
        docNumStr = `1.${numStr.slice(1, 4)}.${numStr.slice(4, 7)}.${numStr.slice(7, 10)}`;
      }
      if (!usedDocNumbers.has(docNumStr)) {
        usedDocNumbers.add(docNumStr);
        break;
      }
    }

    // Geography
    const loc = weightedChoice(MUNICIPALITIES);

    // Contactability: phone + email (78%), phone only (14%), email only (4%), neither (4%)
    const contactRoll = rand();
    let phone: string | null = null;
    let email: string | null = null;

    const cleanFirst = cleanAccents(firstName);
    const cleanLast = cleanAccents(lastName1);

    if (contactRoll < 0.78) {
      // Both phone and email
      const prefix = choice(["310", "311", "312", "313", "314", "315", "316", "317", "318", "319", "320", "321", "322", "323", "324", "300", "301", "302", "305", "350"]);
      const p1 = String(Math.floor(100 + rand() * 900));
      const p2 = String(Math.floor(1000 + rand() * 9000));
      phone = `+57 ${prefix} ${p1} ${p2}`;
      email = `${cleanFirst}.${cleanLast}${Math.floor(rand() * 900) + 10}@correo.co`;
    } else if (contactRoll < 0.92) {
      // Phone only
      const prefix = choice(["310", "311", "312", "313", "315", "317", "318", "320", "300", "301"]);
      const p1 = String(Math.floor(100 + rand() * 900));
      const p2 = String(Math.floor(1000 + rand() * 9000));
      phone = `+57 ${prefix} ${p1} ${p2}`;
      email = null;
    } else if (contactRoll < 0.96) {
      // Email only
      phone = null;
      email = `${cleanFirst}.${cleanLast}${Math.floor(rand() * 900) + 10}@correo.co`;
    } else {
      // Neither
      phone = null;
      email = null;
    }

    const contactable = Boolean(phone || email);

    // Employment
    let employmentStatus = weightedChoice(EMPLOYMENT_STATUSES);
    let occupation: string | null = null;
    if (age >= 65 && rand() < 0.75) {
      employmentStatus = "Pensionado";
    } else if (age <= 22 && rand() < 0.50) {
      employmentStatus = "Estudiante";
    }

    if (employmentStatus === "Empleado") {
      occupation = choice(OCCUPATIONS_EMPLEADO);
    } else if (employmentStatus === "Independiente") {
      occupation = choice(OCCUPATIONS_INDEPENDIENTE);
    } else if (employmentStatus === "Informal") {
      occupation = rand() < 0.5 ? "Comercio informal" : null;
    } else if (employmentStatus === "Pensionado") {
      occupation = "Pensionado";
    } else if (employmentStatus === "Estudiante") {
      occupation = "Estudiante universitario";
    } else if (employmentStatus === "Desempleado") {
      occupation = null;
    } else {
      occupation = null;
    }

    // Education
    let educationLevel = weightedChoice(EDUCATION_LEVELS);
    if (age < 21 && (educationLevel === "Profesional" || educationLevel === "Posgrado")) {
      educationLevel = "Secundaria";
    }

    // Inclusion
    const incRoll = rand();
    let inclusionStatus = "Pendiente";
    if (incRoll < 0.38) {
      inclusionStatus = "Reportada";
    } else if (incRoll < 0.68) {
      inclusionStatus = "Parcial";
    } else {
      inclusionStatus = "Pendiente";
    }

    // Member since & Segment
    const memberSince = 2000 + Math.floor(rand() * 26);
    let segment = "Ahorro tradicional";
    if (age >= 60 && rand() < 0.6) {
      segment = "Asociados mayores";
    } else if (age <= 28 && rand() < 0.6) {
      segment = "Asociados jóvenes";
    } else if ((employmentStatus === "Independiente" || employmentStatus === "Informal") && rand() < 0.6) {
      segment = "Microempresarios";
    } else if (["San Gil", "Socorro", "Málaga", "Lebrija", "Rionegro"].includes(loc.city) && rand() < 0.45) {
      segment = "Productores rurales";
    } else if (employmentStatus === "Empleado" && rand() < 0.4) {
      segment = "Crédito de libranza";
    }

    // Calculate Characterization Score consistently from populated attributes
    let score = 30; // Base identity completeness (name, doc, age, gender, city)
    if (phone) score += 12;
    if (email) score += 10;
    if (employmentStatus !== "Sin información") score += 15;
    if (occupation) score += 10;
    if (educationLevel !== "Sin información") score += 10;
    if (inclusionStatus === "Reportada") score += 13;
    else if (inclusionStatus === "Parcial") score += 7;

    // Small natural variance (-3 to +3)
    score += Math.floor(rand() * 7) - 3;
    score = Math.max(25, Math.min(98, score));

    // Profile status
    let profileStatus = "Parcial";
    if (score >= 88) {
      profileStatus = rand() < 0.1 ? "Actualizado por IA" : "Completo";
    } else if (score < 50 || (!phone && !email) || (employmentStatus === "Sin información" && educationLevel === "Sin información")) {
      profileStatus = "Vacíos críticos";
    } else {
      profileStatus = "Parcial";
    }

    // Last interaction date
    const intMonth = String(1 + Math.floor(rand() * 9)).padStart(2, "0");
    const intDay = String(1 + Math.floor(rand() * 28)).padStart(2, "0");
    const lastInteractionAt = `2026-${intMonth}-${intDay}T14:30:00.000Z`;

    newRecords.push({
      id: generateUuid(),
      organization_id: ORGANIZATION_ID,
      document_type: "CC",
      document_number: docNumStr,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      birth_date: birthDate,
      age,
      gender,
      city: loc.city,
      department: loc.dept,
      employment_status: employmentStatus,
      occupation,
      education_level: educationLevel,
      characterization_score: score,
      profile_status: profileStatus,
      contactable,
      inclusion_information_status: inclusionStatus,
      last_interaction_at: lastInteractionAt,
      member_since: memberSince,
      segment,
    });
  }

  // 2. Insert records in batches
  console.log(`Inserting ${newRecords.length} records in batches of ${BATCH_SIZE}...`);
  let insertedCount = 0;

  for (let b = 0; b < newRecords.length; b += BATCH_SIZE) {
    const chunk = newRecords.slice(b, b + BATCH_SIZE);
    const { error: insertError } = await supabase.from("people").insert(chunk);

    if (insertError) {
      console.error(`Batch insertion failed at index ${b}:`, insertError.message);
      process.exit(1);
    }

    insertedCount += chunk.length;
    process.stdout.write(`  Inserted: ${insertedCount} / ${newRecords.length} (${Math.round((insertedCount / newRecords.length) * 100)}%)\r`);
  }

  console.log(`\nInserted: ${insertedCount}`);

  // 3. Verify final population
  const { count: finalCount } = await supabase
    .from("people")
    .select("*", { count: "exact", head: true });

  console.log(`Final population: ${finalCount}`);

  // 4. Run full analytical verification
  await printVerification(supabase);
}

async function printVerification(supabase: any) {
  console.log("\n==================================================");
  console.log("SUPABASE ANALYTICAL VERIFICATION");
  console.log("==================================================");

  // Fetch all people using pagination to overcome any default PostgREST limit
  let allPeople: any[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("people")
      .select("age, city, department, employment_status, education_level, occupation, phone, email, characterization_score, profile_status, contactable")
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("Error fetching people chunk:", error.message);
      break;
    }

    if (!data || data.length === 0) break;
    allPeople.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  const total = allPeople.length;
  console.log(`Total verified profiles in database: ${total}`);

  let contactableCount = 0;
  let scoreSum = 0;
  let completeProfiles = 0;
  let incompleteProfiles = 0;
  let criticalGapsCount = 0;

  const missingFields: Record<string, number> = {
    occupation: 0,
    email: 0,
    employment_status: 0,
    education_level: 0,
    phone: 0,
  };

  const employmentDist: Record<string, number> = {};
  const educationDist: Record<string, number> = {};
  const statusDist: Record<string, number> = {};
  const cityDist: Record<string, number> = {};
  const ageDist = {
    "18–24": 0,
    "25–34": 0,
    "35–44": 0,
    "45–54": 0,
    "55–64": 0,
    "65+": 0,
  };

  for (const p of allPeople) {
    if (p.contactable) contactableCount++;
    const s = p.characterization_score || 0;
    scoreSum += s;

    if (p.profile_status === "Completo" || p.profile_status === "Actualizado por IA") {
      completeProfiles++;
    } else {
      incompleteProfiles++;
    }

    if (p.profile_status === "Vacíos críticos" || s < 50) criticalGapsCount++;

    const emp = p.employment_status || "Sin información";
    employmentDist[emp] = (employmentDist[emp] || 0) + 1;
    if (emp === "Sin información") missingFields.employment_status++;

    const edu = p.education_level || "Sin información";
    educationDist[edu] = (educationDist[edu] || 0) + 1;
    if (edu === "Sin información") missingFields.education_level++;

    if (!p.occupation || p.occupation === "Sin información") missingFields.occupation++;
    if (!p.email) missingFields.email++;
    if (!p.phone) missingFields.phone++;

    const st = p.profile_status || "Parcial";
    statusDist[st] = (statusDist[st] || 0) + 1;

    const city = p.city || "Otras";
    cityDist[city] = (cityDist[city] || 0) + 1;

    const age = p.age || 35;
    if (age <= 24) ageDist["18–24"]++;
    else if (age <= 34) ageDist["25–34"]++;
    else if (age <= 44) ageDist["35–44"]++;
    else if (age <= 54) ageDist["45–54"]++;
    else if (age <= 64) ageDist["55–64"]++;
    else ageDist["65+"]++;
  }

  const avgScore = total > 0 ? (scoreSum / total).toFixed(1) : "0";
  const contactablePct = total > 0 ? ((contactableCount / total) * 100).toFixed(1) : "0";
  const criticalGapsPct = total > 0 ? ((criticalGapsCount / total) * 100).toFixed(1) : "0";

  console.log(`\n--- REQUIRED OBJECTIVE METRICS ---`);
  console.log(`TOTAL POPULATION: ${total}`);
  console.log(`AVERAGE CHARACTERIZATION: ${avgScore}%`);
  console.log(`COMPLETE PROFILES: ${completeProfiles}`);
  console.log(`INCOMPLETE PROFILES: ${incompleteProfiles}`);

  console.log(`\nTOP 5 MISSING FIELDS:`);
  const sortedMissing = Object.entries(missingFields).sort((a, b) => b[1] - a[1]);
  for (const [fKey, cnt] of sortedMissing.slice(0, 5)) {
    console.log(`  - ${fKey}: ${cnt} missing (${((cnt / total) * 100).toFixed(1)}%)`);
  }

  console.log(`\nTOP 5 MUNICIPALITIES:`);
  const sortedCities = Object.entries(cityDist).sort((a, b) => b[1] - a[1]);
  for (const [city, cnt] of sortedCities.slice(0, 5)) {
    console.log(`  - ${city}: ${cnt} (${((cnt / total) * 100).toFixed(1)}%)`);
  }

  console.log(`\nEMPLOYMENT DISTRIBUTION:`);
  for (const [emp, cnt] of Object.entries(employmentDist).sort((a, b) => b[1] - a[1])) {
    console.log(`  - ${emp}: ${cnt} (${((cnt / total) * 100).toFixed(1)}%)`);
  }

  console.log(`\nEDUCATION DISTRIBUTION:`);
  for (const [edu, cnt] of Object.entries(educationDist).sort((a, b) => b[1] - a[1])) {
    console.log(`  - ${edu}: ${cnt} (${((cnt / total) * 100).toFixed(1)}%)`);
  }

  console.log(`\n--- ADDITIONAL CONTEXT ---`);
  console.log(`Contactable: ${contactableCount} (${contactablePct}%)`);
  console.log(`Profiles with Critical Gaps: ${criticalGapsCount} (${criticalGapsPct}%)`);
  console.log(`Profile Statuses:`, statusDist);
  console.log("==================================================");
}

runSeed().catch((err) => {
  console.error("Unhandled error during seeding:", err);
  process.exit(1);
});
