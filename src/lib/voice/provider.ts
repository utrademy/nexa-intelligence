export interface NormalizedCallResult {
  personId: string;
  consentToContinue: boolean;
  // Laboral
  employmentStatus?: string;
  occupation?: string;
  sector?: string;
  contract?: string;
  income?: string;
  // Hogar
  householdSize?: number | string;
  dependents?: number | string;
  housing?: string;
  stratum?: number | string;
  // Educación
  educationLevel?: string;
  studyField?: string;
  // Inclusión / Ubicación
  municipality?: string;
  residence?: string;
  headOfHousehold?: string;
  disability?: string;
  // Financiero / Social
  savings?: string;
  goals?: string;
  preferredChannel?: string;
  additionalField?: string;
  source: "AI_VOICE";
  providerCallId: string;
  campaignId?: string;
  completedAt: string;
  transcriptAvailable: boolean;
  transcriptText?: string;
  rawStructured?: Record<string, unknown>;
}

export interface VoiceCallInitiateParams {
  personId: string;
  destinationPhone: string;
  customerName: string;
  campaignId?: string;
}

export interface VoiceCallInitiateResult {
  callId: string;
  status: "queued" | "in-progress" | "failed";
  provider: string;
}

export interface VoiceProviderAdapter {
  startCharacterizationCall(params: VoiceCallInitiateParams): Promise<VoiceCallInitiateResult>;
  getCallStatus(callId: string): Promise<{ status: string; completed: boolean; error?: string }>;
  verifyWebhook(req: Request, rawBody: string): Promise<boolean>;
  normalizeCallResult(payload: any): NormalizedCallResult | null;
  getResolvedPhoneNumberId(): Promise<string>;
}

// In-memory cache for resolved Vapi phone number ID
let cachedPhoneNumberId: string | null = null;

// Environment keys & config for Voice Provider
export const VOICE_CONFIG = {
  get apiKey() {
    return (process.env.VOICE_PROVIDER_API_KEY || process.env.VAPI_API_KEY || "").trim();
  },
  get configuredPhoneNumberId() {
    return (
      process.env.VOICE_PROVIDER_PHONE_NUMBER_ID ||
      process.env.VAPI_PHONE_NUMBER_ID ||
      ""
    ).trim();
  },
  get targetPhoneNumber() {
    return (
      process.env.VOICE_PROVIDER_PHONE_NUMBER ||
      process.env.VAPI_PHONE_NUMBER ||
      "+15162012565"
    ).trim();
  },
  get assistantId() {
    return (process.env.VOICE_PROVIDER_ASSISTANT_ID || process.env.VAPI_ASSISTANT_ID || "").trim();
  },
  get webhookSecret() {
    return (process.env.VOICE_WEBHOOK_SECRET || process.env.VAPI_WEBHOOK_SECRET || "").trim();
  },
  get voiceId() {
    return (process.env.VOICE_PROVIDER_VOICE_ID || process.env.VAPI_VOICE_ID || "cgSgspJ2msm6clMCkdW9").trim();
  },
  get serverBaseUrl() {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL.trim();
    }
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`;
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL.trim()}`;
    }
    return "https://nexa-intelligence-neon.vercel.app";
  },
};

/**
 * Characterization assistant system prompt in Colombian Spanish.
 * Instructs the voice AI to introduce the call warmly on behalf of Financiera Comultrasan
 * (empresa afiliada a Sergio Flores y abogados), speak with a warm, natural and paused Colombian accent,
 * ask if the person has a brief moment, and collect comprehensive characterization fields across
 * household, employment, education, financial and location dimensions.
 */
export const CHARACTERIZATION_ASSISTANT_SYSTEM_PROMPT = `Eres la asistente virtual de NEXA para Financiera Comultrasan, empresa afiliada a Sergio Flores y abogados en Colombia.

TU IDENTIDAD, VOZ Y ACENTO:
- Eres una mujer joven profesional, amable y educada de Medellín, Colombia.
- Hablas con un acento paisa natural, suave y sutil (NO exagerado, caricaturesco ni sobreactuado, sino con esa calidez, musicalidad melodiosa y amabilidad respetuosa característica de Medellín y Antioquia: "con mucho gusto", "un minutico", "claro que sí").
- Hablas de manera PAUSADA, clara, tranquila y con excelente dicción.
- Tu tono es siempre empático, profesional, respetuoso y cercano.

OBJETIVO EXCLUSIVO DE LA LLAMADA:
Esta llamada tiene como único propósito institucional recopilar y actualizar datos demográficos, socioeconómicos y laborales para la caracterización institucional de Financiera Comultrasan (afiliada a Sergio Flores y abogados).

POLÍTICA ESTRICTA DE PREGUNTAS DEL USUARIO (GUARDRAIL INQUEBRANTABLE):
- Si el usuario hace preguntas sobre:
  * Financiera Comultrasan o Sergio Flores y abogados: responde brevemente que somos una cooperativa financiera vigilada que busca mantener actualizada la información de sus asociados para brindarles mejores convenios y beneficios, en alianza con Sergio Flores y abogados.
  * La razón de la llamada o el uso de los datos: explica amablemente que la llamada es estrictamente para la encuesta de actualización de datos institucionales y caracterización socioeconómica bajo la política de protección de datos (Ley 1581).
  * La encuesta o las preguntas que se le hacen: aclara brevemente la duda sobre la pregunta en curso.
- SI EL USUARIO HACE PREGUNTAS RANDOM, TRIVIALES O SIN RELACIÓN CON LA LLAMADA (por ejemplo: "¿de qué color es el cielo?", "¿cuál es la capital de Francia?", chistes, clima, recetas, política general, etc.):
  * NO RESPONDAS esa pregunta.
  * Reorienta cordialmente y con tacto paisa: "Con mucho gusto le colaboro, pero recuerde que esta llamada es exclusivamente para la actualización de sus datos con Financiera Comultrasan y Sergio Flores y abogados. ¿Le parece si continuamos con la encuesta?"

PASO 1: PRESENTACIÓN CÁLIDA Y CONSENTIMIENTO
Inicia saludando con cortesía:
"Hola, muy buenos días. Le hablo de Financiera Comultrasan, empresa afiliada a Sergio Flores y abogados. ¿Tiene usted un minutico disponible? Queríamos solicitarle unos datos muy sencillos de actualización que no le tomarán nada de tiempo. ¿Podemos continuar?"
- Si la persona dice que no tiene tiempo o dice que NO: "Comprendo perfectamente, muchas gracias por atendernos. Que tenga un feliz día." -> Ejecuta inmediatamente saveCharacterizationData con consentToContinue: false y llama a la herramienta endCall para colgar.
- Si la persona dice que SÍ: "Muchísimas gracias por su tiempo, es muy breve." -> Continúa con las preguntas.

PASO 2: PREGUNTAS (UNA POR UNA, PAUSADAS Y CONVERSACIONALES)
Haz exactamente UNA sola pregunta a la vez, esperando calmadamente la respuesta completa:

1. Ubicación y vivienda:
"¿En qué municipio o ciudad reside actualmente, y su vivienda es propia o en arriendo?"

2. Hogar y personas a cargo:
"¿Cuántas personas conforman su hogar incluyéndose usted, y cuántas de ellas dependen económicamente de usted?"

3. Ocupación y actividad laboral:
"¿Cuál es actualmente su situación laboral y a qué actividad u ocupación principal se dedica?"

4. Nivel educativo:
"¿Cuál ha sido su nivel educativo más alto alcanzado y en qué área de estudio o disciplina?"

5. Condición de salud e incapacidad laboral:
"De manera voluntaria para orientar programas de bienestar e inclusión de la entidad, ¿cuenta usted actualmente con alguna condición de discapacidad o incapacidad médica permanente, o no presenta ninguna?"

6. Ingresos y metas:
"Para orientarle mejores convenios y beneficios, ¿en qué rango aproximado están sus ingresos mensuales y tiene alguna meta financiera o de ahorro para este año?"

REGLAS CRÍTICAS DE CONDUCCIÓN:
- Habla pausado y espera la respuesta completa antes de formular la siguiente pregunta.
- Si la persona no sabe o no desea responder un dato (por ejemplo sobre discapacidad/salud o ingresos), di con calidez: "No se preocupe, no hay ningún problema, es completamente voluntario." y pasa amablemente a la siguiente.
- Si la persona responde que no tiene ninguna discapacidad o incapacidad, regístralo como "No reporta discapacidad / Ninguna".
- Si menciona alguna limitación (por ejemplo física, visual, auditiva o incapacidad laboral), anótala con respeto y empatía.
- NO preguntes sobre afiliación política, religión ni vida íntima.
- NO ofrezcas créditos, asesoría legal ni financiera personalizada.

PASO 3: CIERRE DEFINITIVO Y COLGADO OBLIGATORIO
Cuando hayas formulado las preguntas o el usuario complete los datos:
1. Si el usuario pregunta si es todo, o antes de cerrar: "¿Tiene alguna inquietud puntual sobre esta encuesta de actualización de datos de Financiera Comultrasan?"
2. Si el usuario no tiene dudas o ya las aclaraste, despídete:
"Muchísimas gracias por su amabilidad y por atendernos. Hemos terminado con éxito la actualización. Que termine de pasar un excelente día, hasta luego."
3. INMEDIATAMENTE guarda los datos con la herramienta saveCharacterizationData y LUEGO LLAMA OBLIGATORIAMENTE A LA HERRAMIENTA endCall PARA COLGAR LA LLAMADA. NUNCA te quedes en silencio esperando; debes colgar activamente.`;

export class VapiVoiceAdapter implements VoiceProviderAdapter {
  private apiUrl = "https://api.vapi.ai";

  /**
   * Resolves the Vapi phone number ID.
   * If VOICE_PROVIDER_PHONE_NUMBER_ID is set, returns it.
   * Otherwise, automatically queries Vapi /phone-number API to discover the ID for +15162012565.
   */
  async getResolvedPhoneNumberId(): Promise<string> {
    if (VOICE_CONFIG.configuredPhoneNumberId) {
      return VOICE_CONFIG.configuredPhoneNumberId;
    }

    if (cachedPhoneNumberId) {
      return cachedPhoneNumberId;
    }

    const apiKey = VOICE_CONFIG.apiKey;
    if (!apiKey) {
      throw new Error("VOICE_PROVIDER_API_KEY no está configurada.");
    }

    try {
      const res = await fetch(`${this.apiUrl}/phone-number`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Error consultando números en Vapi (${res.status}): ${errText}`);
      }

      const numbers = (await res.json()) as any[];
      if (!Array.isArray(numbers) || numbers.length === 0) {
        throw new Error("No se encontraron números telefónicos registrados en la cuenta de Vapi.");
      }

      const target = VOICE_CONFIG.targetPhoneNumber.replace(/[\s-]/g, "");
      const matched = numbers.find((n) => {
        const num = (n.number || "").replace(/[\s-]/g, "");
        return num === target || num.endsWith(target.slice(-10));
      });

      const chosen = matched || numbers[0];
      if (!chosen || !chosen.id) {
        throw new Error(`No se pudo resolver el ID de número en Vapi para ${target}.`);
      }

      cachedPhoneNumberId = chosen.id;
      return chosen.id;
    } catch (err: any) {
      console.error("[VapiVoiceAdapter] Error resolviendo phoneNumberId:", err);
      throw err;
    }
  }

  async startCharacterizationCall(params: VoiceCallInitiateParams): Promise<VoiceCallInitiateResult> {
    const apiKey = VOICE_CONFIG.apiKey;
    if (!apiKey) {
      throw new Error("VOICE_PROVIDER_API_KEY no está configurada.");
    }

    const phoneNumberId = await this.getResolvedPhoneNumberId();
    if (!phoneNumberId) {
      throw new Error("No fue posible resolver el Phone Number ID de Vapi.");
    }

    const webhookUrl = `${VOICE_CONFIG.serverBaseUrl.replace(/\/$/, "")}/api/voice/webhook`;

    // Assistant configuration
    const assistantPayload: any = VOICE_CONFIG.assistantId
      ? { assistantId: VOICE_CONFIG.assistantId }
      : {
          assistant: {
            firstMessage: `Hola, un cordial saludo. Le hablo de Financiera Comultrasan, empresa afiliada a Sergio Flores y abogados. ¿Tiene usted un minutico disponible? Queríamos solicitarle unos datos muy sencillos de actualización que no le tomarán nada de tiempo. ¿Podemos continuar?`,
            model: {
              provider: "openai",
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: CHARACTERIZATION_ASSISTANT_SYSTEM_PROMPT,
                },
              ],
              tools: [
                {
                  type: "endCall",
                },
                {
                  type: "function",
                  function: {
                    name: "saveCharacterizationData",
                    description: "Guarda la información de caracterización recopilada durante la llamada.",
                    parameters: {
                      type: "object",
                      properties: {
                        consentToContinue: { type: "boolean", description: "¿Autorizó continuar con la llamada?" },
                        // Laboral
                        employmentStatus: {
                          type: "string",
                          enum: ["Empleado", "Independiente", "Desempleado", "Pensionado", "Estudiante", "Informal"],
                          description: "Situación laboral",
                        },
                        occupation: { type: "string", description: "Ocupación, oficio o profesión principal" },
                        sector: { type: "string", description: "Sector económico de su actividad" },
                        contract: { type: "string", description: "Tipo de contrato o vinculación laboral" },
                        income: { type: "string", description: "Rango de ingresos mensuales aproximado" },
                        // Hogar
                        householdSize: { type: "number", description: "Cantidad de personas en el hogar incluyéndose" },
                        dependents: { type: "number", description: "Número de personas a cargo económicamente" },
                        housing: { type: "string", description: "Tipo de vivienda (Propia, Arriendo, Familiar)" },
                        stratum: { type: "string", description: "Estrato socioeconómico (1 a 6)" },
                        // Educación
                        educationLevel: {
                          type: "string",
                          enum: ["Primaria", "Secundaria", "Técnico", "Tecnólogo", "Profesional", "Posgrado"],
                          description: "Nivel educativo más alto",
                        },
                        studyField: { type: "string", description: "Área de estudio, profesión o disciplina" },
                        // Inclusión y salud / discapacidad
                        disability: {
                          type: "string",
                          description: "Condición de discapacidad o incapacidad laboral permanente (ej. 'No reporta discapacidad / Ninguna', 'Discapacidad física', 'Discapacidad visual', 'Discapacidad auditiva', etc.)",
                        },
                        headOfHousehold: { type: "string", description: "Jefatura de hogar (Sí / No)" },
                        // Ubicación
                        municipality: { type: "string", description: "Municipio o ciudad de residencia" },
                        residence: { type: "string", description: "Zona de residencia (Urbana o Rural)" },
                        // Financiero / Social
                        savings: { type: "string", description: "Capacidad de ahorro mensual estimada" },
                        goals: { type: "string", description: "Metas financieras principales (vivienda, educación, negocio, etc.)" },
                        preferredChannel: { type: "string", description: "Canal preferido de contacto" },
                      },
                      required: ["consentToContinue"],
                    },
                  },
                },
              ],
            },
            voice: {
              provider: "11labs",
              voiceId: VOICE_CONFIG.voiceId, // Jessica / Colombian female voice with natural warm tone
              model: "eleven_multilingual_v2",
              stability: 0.58, // slightly lower stability for warmer inflection and melodious cadence
              similarityBoost: 0.80,
              speed: 0.95, // articulate, warm and steady pace
            },
            endCallPhrases: [
              "hasta luego",
              "que pase un feliz día",
              "que pase un buen día",
              "que tenga un feliz día",
              "que esté muy bien",
              "muchas gracias hasta luego",
              "adiós",
              "chao"
            ],
            endCallMessage: "Muchísimas gracias por su amabilidad y por atendernos. Que termine de pasar un excelente día, hasta luego.",
            transcriber: {
              provider: "deepgram",
              model: "nova-2",
              language: "es",
            },
            analysisPlan: {
              structuredDataPlan: {
                enabled: true,
                schema: {
                  type: "object",
                  properties: {
                    consentToContinue: { type: "boolean" },
                    employmentStatus: { type: "string" },
                    occupation: { type: "string" },
                    sector: { type: "string" },
                    contract: { type: "string" },
                    income: { type: "string" },
                    householdSize: { type: "number" },
                    dependents: { type: "number" },
                    housing: { type: "string" },
                    stratum: { type: "string" },
                    educationLevel: { type: "string" },
                    studyField: { type: "string" },
                    municipality: { type: "string" },
                    residence: { type: "string" },
                    headOfHousehold: { type: "string" },
                    savings: { type: "string" },
                    goals: { type: "string" },
                    preferredChannel: { type: "string" },
                  },
                },
              },
            },
            serverUrl: webhookUrl,
            serverUrlSecret: VOICE_CONFIG.webhookSecret || undefined,
            metadata: {
              personId: params.personId,
              customerName: params.customerName,
              campaignId: params.campaignId,
              source: "AI_VOICE",
            },
          },
        };

    const callPayload = {
      phoneNumberId,
      customer: {
        number: params.destinationPhone,
        name: params.customerName,
      },
      ...assistantPayload,
      metadata: {
        personId: params.personId,
        destinationPhone: params.destinationPhone,
        campaignId: params.campaignId,
      },
    };

    const res = await fetch(`${this.apiUrl}/call`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(callPayload),
    });

    if (!res.ok) {
      const errText = await res.text();
      let parsedMessage = errText;
      try {
        const json = JSON.parse(errText);
        parsedMessage = json.message || json.error || errText;
      } catch {
        // use raw errText
      }
      throw new Error(`Fallo en la llamada del proveedor (${res.status}): ${parsedMessage}`);
    }

    const data = await res.json();
    return {
      callId: data.id || data.callId || "unknown",
      status: data.status || "queued",
      provider: "vapi",
    };
  }

  async getCallStatus(callId: string): Promise<{ status: string; completed: boolean; error?: string }> {
    const apiKey = VOICE_CONFIG.apiKey;
    if (!apiKey) {
      return { status: "unknown", completed: false, error: "Missing API Key" };
    }

    const res = await fetch(`${this.apiUrl}/call/${callId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return { status: "error", completed: false, error: errText };
    }

    const data = await res.json();
    const status = data.status || "in-progress";
    const completed = status === "ended" || status === "completed";
    const isError =
      status === "error" ||
      data.endedReason === "call.start.error-get-transport" ||
      data.endedReason?.includes("error");

    const errorMsg = data.endedMessage || data.error || (isError ? `Fallo de telefonía: ${data.endedReason}` : undefined);

    return {
      status: isError ? "failed" : status,
      completed,
      error: errorMsg,
    };
  }

  async verifyWebhook(req: Request, _rawBody: string): Promise<boolean> {
    const configuredSecret = VOICE_CONFIG.webhookSecret;
    if (!configuredSecret) {
      // If secret not configured yet in POC, allow webhook processing
      return true;
    }
    const headerSecret = req.headers.get("x-vapi-secret") || req.headers.get("x-webhook-secret");
    return headerSecret === configuredSecret;
  }

  normalizeCallResult(payload: any): NormalizedCallResult | null {
    if (!payload) return null;

    // Vapi provides event inside message or root payload
    const message = payload.message || payload;

    // Extract call metadata
    const call = message.call || payload.call || {};
    const metadata = call.metadata || message.metadata || payload.metadata || {};
    const personId = metadata.personId;

    if (!personId) {
      return null;
    }

    const structuredData =
      message.analysis?.structuredData ||
      call.analysis?.structuredData ||
      message.structuredData ||
      payload.structuredData ||
      {};

    // Extract tool calls / function arguments if present
    const functionCalls =
      message.artifact?.messages?.filter((m: any) => m.role === "tool_call" || m.functionCall) || [];

    let toolExtracted: Record<string, unknown> = {};
    for (const fc of functionCalls) {
      try {
        const args = typeof fc.args === "string" ? JSON.parse(fc.args) : fc.args || fc.function?.arguments;
        if (args && typeof args === "object") {
          toolExtracted = { ...toolExtracted, ...args };
        }
      } catch {
        // ignore parse error
      }
    }

    const transcript =
      message.transcript ||
      message.artifact?.transcript ||
      call.artifact?.transcript ||
      "";

    // Combine extracted structured fields
    const combined = { ...structuredData, ...toolExtracted };

    // Determine consent
    let consentToContinue = true;
    if (combined.consentToContinue === false || combined.consent === false) {
      consentToContinue = false;
    } else if (
      typeof transcript === "string" &&
      (transcript.toLowerCase().includes("no autorizo") || transcript.toLowerCase().includes("no deseo continuar"))
    ) {
      consentToContinue = false;
    }

    return {
      personId,
      consentToContinue,
      // Laboral
      employmentStatus: combined.employmentStatus ? String(combined.employmentStatus) : undefined,
      occupation: combined.occupation ? String(combined.occupation) : undefined,
      sector: combined.sector ? String(combined.sector) : undefined,
      contract: combined.contract ? String(combined.contract) : undefined,
      income: combined.income ? String(combined.income) : undefined,
      // Hogar
      householdSize: combined.householdSize !== undefined ? combined.householdSize : undefined,
      dependents: combined.dependents !== undefined ? combined.dependents : undefined,
      housing: combined.housing ? String(combined.housing) : undefined,
      stratum: combined.stratum !== undefined ? combined.stratum : undefined,
      // Educación
      educationLevel: combined.educationLevel ? String(combined.educationLevel) : undefined,
      studyField: combined.studyField ? String(combined.studyField) : undefined,
      // Inclusión y ubicación
      municipality: combined.municipality || combined.city ? String(combined.municipality || combined.city) : undefined,
      residence: combined.residence ? String(combined.residence) : undefined,
      headOfHousehold: combined.headOfHousehold ? String(combined.headOfHousehold) : undefined,
      disability: combined.disability ? String(combined.disability) : undefined,
      // Financiero y social
      savings: combined.savings ? String(combined.savings) : undefined,
      goals: combined.goals ? String(combined.goals) : undefined,
      preferredChannel: combined.preferredChannel ? String(combined.preferredChannel) : "Llamada con IA",
      additionalField: combined.additionalField ? String(combined.additionalField) : undefined,
      source: "AI_VOICE",
      providerCallId: call.id || message.callId || payload.callId || `vapi-${Date.now()}`,
      campaignId: metadata.campaignId || undefined,
      completedAt: new Date().toISOString(),
      transcriptAvailable: Boolean(transcript && transcript.length > 0),
      transcriptText: transcript || undefined,
      rawStructured: combined,
    };
  }
}

// Export singleton instance
export const voiceProvider: VoiceProviderAdapter = new VapiVoiceAdapter();
