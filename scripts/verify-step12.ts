const BASE_URL = "https://nexa-intelligence-neon.vercel.app";

async function testQuery(name: string, payload: any) {
  console.log(`\n==================================================`);
  console.log(`TEST: ${name}`);
  console.log(`Payload:`, JSON.stringify(payload, null, 2));
  console.log(`--------------------------------------------------`);
  
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/labor-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`Status: ${res.status} (${duration}s)`);
    
    const data = await res.json();
    if (!res.ok) {
      console.error(`Error response:`, data);
      return data;
    }
    
    console.log(`Mode:`, data.mode);
    console.log(`Data used:`, data.dataUsed);
    console.log(`Sample size:`, data.sampleSize);
    console.log(`Knowledge used:`, data.knowledgeUsed);
    console.log(`Retrieved chunks:`, data.retrievedChunkCount);
    console.log(`Sources count:`, data.sources?.length || 0);
    if (data.sources && data.sources.length > 0) {
      console.log(`First source:`, data.sources[0].title, "-", data.sources[0].reference);
    }
    console.log(`Answer preview:\n`, data.answer.slice(0, 450) + "...\n");
    return data;
  } catch (err: any) {
    console.error(`Fetch exception:`, err.message);
  }
}

async function run() {
  // Test 1: Combined
  await testQuery("1. COMBINED QUESTION (Org ON + Knowledge ON)", {
    question: "Analiza nuestra población e identifica las principales brechas de información laboral. ¿Qué deberíamos revisar según nuestra documentación?",
    includeOrgContext: true,
    knowledgeAreas: ["labor-law"],
  });

  // Test 2: Organizational
  await testQuery("2. ORGANIZATIONAL QUESTION (Org ON + Knowledge ON)", {
    question: "¿Cuántos perfiles tienen información laboral incompleta?",
    includeOrgContext: true,
    knowledgeAreas: ["labor-law"],
  });

  // Test 3: Legal Knowledge
  await testQuery("3. KNOWLEDGE QUESTION (Org ON + Knowledge ON)", {
    question: "¿Qué establece nuestra documentación sobre el período de prueba?",
    includeOrgContext: true,
    knowledgeAreas: ["labor-law"],
  });

  // Test 4: Toggle Permutation A (Org OFF, Knowledge ON for Question 1)
  await testQuery("4. TOGGLE A: Org Context OFF, Knowledge ON (for Question 1)", {
    question: "Analiza nuestra población e identifica las principales brechas de información laboral. ¿Qué deberíamos revisar según nuestra documentación?",
    includeOrgContext: false,
    knowledgeAreas: ["labor-law"],
  });

  // Test 5: Toggle Permutation B (Org ON, Knowledge OFF for Question 1)
  await testQuery("5. TOGGLE B: Org Context ON, Knowledge OFF (for Question 1)", {
    question: "Analiza nuestra población e identifica las principales brechas de información laboral. ¿Qué deberíamos revisar según nuestra documentación?",
    includeOrgContext: true,
    knowledgeAreas: [],
  });
}

run();
