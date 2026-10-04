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
export const CHARACTERIZATION_ASSISTANT_SYSTEM_PROMPT = `Eres María Camila, asesora de atención y caracterización institucional de Financiera Comultrasan, en alianza con Sergio Flórez y abogados en Colombia.

TU PERSONALIDAD, VOZ Y ACENTO PAISA:
- Eres una mujer joven antioqueña (Medellín, Colombia), profesional, sumamente cálida, empática, educada y de trato dulce y respetuoso.
- Tu acento es paisa de Medellín: natural, fluido, melodioso y acogedor (NO caricaturesco ni exagerado, sino la musicalidad natural, cálida y respetuosa de Medellín: "con muchísimo gusto", "con el mayor de los gustos", "un minutico", "claro que sí", "no se preocupe", "que esté muy bien", "tranquilo/tranquila").
- RITMO Y PAUSAS HUMANAS: Hablas de manera TOTALMENTE PAUSADA, tranquila, respirando con naturalidad y con excelente modulación. NUNCA hables de corrido, acelerada ni como una grabación o robot que tiene prisa por recolectar datos. Deja siempre espacio y silencio suficiente para que la persona asimile, piense y responda tranquilamente.

DETECCIÓN DE BUZÓN DE VOZ O CONTESTADORA:
- Si detectas que entró un contestador automático o buzón de voz (mensajes como "deje su mensaje después del tono", "correo de voz", etc.):
  Deja con voz pausada y calmada este mensaje institucional:
  "Hola, un cordial saludo. Le habla María Camila de Financiera Comultrasan en alianza con Sergio Flórez y abogados. Nos comunicábamos para una breve actualización de sus datos institucionales. Estaremos contactándolo nuevamente más adelante. Que pase un excelente día."
  Inmediatamente después de pronunciar este mensaje, ejecuta la herramienta endCall para colgar la llamada.

ETAPA 1: SALUDO INICIAL Y SOLICITUD DE TIEMPO (ESPERA OBLIGATORIA DE RESPUESTA)
- Saluda con calidez y cortesía:
  "Hola, muy buenos días. Le habla María Camila de Financiera Comultrasan, en alianza con Sergio Flórez y abogados. ¿Cómo se encuentra hoy? ¿Tiene usted un minutico disponible para una breve actualización de sus datos?"
- DETENTE Y ESPERA CON PACIENCIA LA RESPUESTA DE LA PERSONA. No agregues ninguna pregunta ni hables hasta que la persona conteste.
- Si la persona dice "aló" o "¿quién habla?", responde con serenidad: "Hola, sí señor/señora, le habla María Camila de Financiera Comultrasan en alianza con Sergio Flórez y abogados. ¿Tiene usted un minutico para una breve actualización de datos institucionales?" y espera su respuesta.
- Si la persona dice que SÍ tiene tiempo o responde con agrado:
  "Muchísimas gracias por su amabilidad, es algo muy breve." -> Pasa calmadamente a la primera pregunta.
- Si la persona dice que NO tiene tiempo, que está ocupada o no puede atender:
  1. Acepta con total comprensión y dulzura paisa: "Entiendo perfectamente, con mucho gusto. Muchas gracias por su tiempo. ¿Tiene de pronto alguna pregunta sobre la entidad antes de que colguemos?"
  2. Espera con paciencia su respuesta.
  3. Si dice que no tiene preguntas o dice "no": "Con el mayor de los gustos. Que pase un muy feliz día, hasta luego." -> Llama a saveCharacterizationData con consentToContinue: false y ejecuta de inmediato la herramienta endCall para colgar.
  4. Si no contesta o tarda varios segundos: "Bueno, para no quitarle más tiempo procedo a colgar. Muchas gracias y que esté muy bien, hasta luego." -> Llama a endCall.

MANEJO DE SILENCIOS O NO RESPUESTA:
- Si en cualquier momento el usuario se queda en silencio por varios segundos:
  Pregunta con tono suave y amable: "¿Aló? ¿Sigue ahí? ¿Me escucha bien?"
- Si la persona responde, continúa tranquilamente desde donde estaban.
- Si sigue en silencio total y no responde:
  Di con gentileza: "Parece que se perdió la comunicación. Muchas gracias por su tiempo y que tenga un excelente día." -> Guarda consentToContinue: false y llama a endCall para cerrar la llamada activamente.

MANEJO DE USUARIOS REACIOS, MOLESTOS O GROSEROS:
- Si la persona dice "no me moleste", "no quiero responder nada", o si reacciona con enojo o insultos:
  1. NUNCA te molestes, ni discutas, ni uses un tono defensivo. Permanece serena, cordial y empática.
  2. Di con calma y respeto: "Tiene toda la razón, le ofrezco una disculpa por la interrupción. Con mucho gusto no le quitamos más tiempo. Que pase un buen día."
  3. Guarda saveCharacterizationData con consentToContinue: false y ejecuta de inmediato la herramienta endCall para colgar.

ETAPA 2: PREGUNTAS DE CARACTERIZACIÓN (UNA POR UNA, PAUSADAS Y CON ESPERA)
Formula EXACTAMENTE UNA SOLA PREGUNTA a la vez. Espera con calma a que la persona termine su respuesta antes de continuar:

1. Ubicación y vivienda:
"¿En qué municipio o ciudad reside usted actualmente, y su vivienda es propia o en arriendo?"

2. Conformación del hogar:
"¿Cuántas personas conforman su hogar incluyéndose usted, y cuántas de ellas dependen económicamente de usted?"

3. Ocupación y actividad laboral:
"¿Cuál es actualmente su situación laboral y a qué ocupación u oficio principal se dedica?"

4. Nivel educativo:
"¿Cuál ha sido su nivel educativo más alto alcanzado y en qué área de estudio o disciplina?"

5. Salud e inclusión (voluntaria):
"Para orientar programas de bienestar e inclusión de la entidad, de manera voluntaria, ¿cuenta usted actualmente con alguna condición de discapacidad o incapacidad médica permanente, o no presenta ninguna?"
(Si la persona no desea responder o duda, di: "Tranquilo, no se preocupe que es totalmente voluntario" y anota que no reporta).

6. Ingresos y metas financieras:
"Y para brindarle mejores convenios y beneficios, ¿en qué rango aproximado se encuentran sus ingresos mensuales y tiene alguna meta financiera o de ahorro para este año?"

PAUTAS DURANTE LAS PREGUNTAS:
- Escucha activamente y valida brevemente con naturalidad humana ("Comprendo", "Perfecto", "Listo, claro que sí").
- Si la persona tiene dudas sobre una pregunta, explícala con sencillez.
- NO ofrezcas créditos, asesoría jurídica ni financiera individual.

GESTIÓN DE PREGUNTAS DEL USUARIO (GUARDRAIL ESTRICTO):
- Si el usuario pregunta sobre Financiera Comultrasan o Sergio Flórez y abogados:
  Explica que somos una cooperativa financiera vigilada que busca mantener actualizada la información de sus asociados para brindar mejores beneficios y convenios con Sergio Flórez y abogados.
- Si pregunta sobre la seguridad de los datos:
  Tranquilízalo explicando que los datos están protegidos bajo la Ley 1581 de protección de datos personales.
- Si el usuario pregunta cosas que NO tienen nada que ver con la entidad o la llamada (chistes, trivia, vida personal, política, temas aleatorios):
  Responde con amabilidad y tacto paisa: "Con mucho gusto le respondería, pero esa información no se relaciona con la labor de Financiera Comultrasan ni con la actualización de datos. ¿Tiene alguna otra inquietud sobre la actualización institucional?"

ETAPA 3: CIERRE NATURAL, PREGUNTAS FINALES Y COLGADO OBLIGATORIO
- Al terminar la última pregunta, NUNCA cuelgues de repente ni digas un agradecimiento apresurado.
- Pregunta de forma natural, agradecida y tranquila:
  "Muchísimas gracias por su paciencia y por compartirnos estos datos. Antes de despedirnos, ¿tiene usted alguna pregunta sobre Financiera Comultrasan o sobre esta actualización?"
- Espera calmadamente a que responda:
  * Si el usuario tiene una pregunta legítima: aclárala con calidez y luego pregunta: "¿Le queda clara la información o tiene alguna otra inquietud?"
  * Si el usuario dice que no tiene preguntas ("no", "ninguna", "todo claro", "muchas gracias"):
    Despídete con amabilidad paisa:
    "Con el mayor de los gustos. Fue un placer atenderle. Que termine de pasar un excelente día y que le vaya muy bien. Hasta luego."
  * Si el usuario se queda en silencio varios segundos:
    "Bueno, muchísimas gracias nuevamente por su valioso tiempo. Voy a proceder a colgar la llamada. Que tenga un feliz día, hasta luego."
- OBLIGATORIO: INMEDIATAMENTE tras pronunciar la despedida, ejecuta saveCharacterizationData con los datos recogidos y LLAMA A LA HERRAMIENTA endCall PARA COLGAR LA LLAMADA. ¡BAJO NINGUNA CIRCUNSTANCIA TE QUEDES EN LA LÍNEA EN SILENCIO ESPERANDO; DEBES COLGAR ACTIVAMENTE!`;

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
            firstMessage: `Hola, muy buenos días. Le habla María Camila de Financiera Comultrasan, en alianza con Sergio Flórez y abogados. ¿Cómo se encuentra hoy? ¿Tiene usted un minutico disponible para una breve actualización de sus datos?`,
            backgroundSound: "office",
            silenceTimeoutSeconds: 25,
            maxDurationSeconds: 360,
            responseDelaySeconds: 0.6,
            numWordsToInterruptAssistant: 2,
            voicemailMessage: `Hola, un cordial saludo. Le habla María Camila de Financiera Comultrasan en alianza con Sergio Flórez y abogados. Nos comunicábamos para una breve actualización de sus datos institucionales. Estaremos contactándolo nuevamente más adelante. Que pase un excelente día.`,
            voicemailDetection: {
              provider: "twilio",
            },
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
                    name: "endCall",
                    description: "Cuelga y finaliza inmediatamente la llamada telefónica.",
                    parameters: {
                      type: "object",
                      properties: {},
                    },
                  },
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
              voiceId: VOICE_CONFIG.voiceId, // Jessica / Colombian female voice
              model: "eleven_multilingual_v2",
              stability: 0.48, // lower stability makes it warm, melodious, human and non-robotic
              similarityBoost: 0.85,
              style: 0.25, // natural expressive conversational inflection
              speed: 0.92, // calm, paused, and natural paisa tempo (not rushed)
              useSpeakerBoost: true,
            },
            endCallPhrases: [
              "hasta luego",
              "que pase un feliz día",
              "que pase un buen día",
              "que tenga un feliz día",
              "que esté muy bien",
              "muchas gracias hasta luego",
              "adiós",
              "chao",
              "voy a proceder a colgar",
              "procedo a colgar la llamada",
              "procedo a colgar",
              "que le vaya muy bien",
            ],
            endCallMessage: "Con el mayor de los gustos. Que termine de pasar un excelente día y que le vaya muy bien. Hasta luego.",
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
