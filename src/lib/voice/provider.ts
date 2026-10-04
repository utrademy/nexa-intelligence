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
  knownSummary?: string[];
  missingFields?: string[];
}

export interface VoiceCallInitiateResult {
  callId: string;
  status: "queued" | "in-progress" | "failed";
  provider: string;
}

export interface VoiceProviderAdapter {
  startCharacterizationCall(params: VoiceCallInitiateParams): Promise<VoiceCallInitiateResult>;
  cancelCall(callId: string): Promise<boolean>;
  getCallStatus(callId: string): Promise<{
    status: string;
    completed: boolean;
    notAnswered?: boolean;
    hasData?: boolean;
    consentDenied?: boolean;
    endedReason?: string;
    error?: string;
    rawCallData?: any;
  }>;
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

export interface StartCallParams {
  personId: string;
  destinationPhone: string;
  customerName: string;
  campaignId?: string;
  knownSummary?: string[];
  missingFields?: string[];
}

/**
 * Generates the characterization assistant system prompt in Colombian Spanish.
 * Instructs the voice AI to introduce the call warmly on behalf of Financiera Comultrasan
 * (empresa afiliada a Sergio Flores y abogados), speak with a warm, natural and agile Colombian Paisa accent,
 * respond immediately without artificial pauses, understand disability cleanly ("no tengo" vs "no quiero"),
 * and focus questions on missing fields.
 */
export function buildCharacterizationPrompt(params: {
  customerName: string;
  knownSummary?: string[];
  missingFields?: string[];
}): string {
  const knownText =
    params.knownSummary && params.knownSummary.length > 0
      ? params.knownSummary.map((k) => `- ${k}`).join("\n")
      : "Ningún dato previo registrado.";

  const missingText =
    params.missingFields && params.missingFields.length > 0
      ? params.missingFields.map((m) => `- ${m}`).join("\n")
      : "Todos los campos de caracterización (vivienda, hogar, laboral, educación, salud/discapacidad, ingresos/metas).";

  return `Eres María Camila, asesora de atención y caracterización institucional de Financiera Comultrasan, en alianza con Sergio Flórez y abogados en Colombia.

ESTA LLAMADA ES PARA ACTUALIZAR LOS DATOS DEL ASOCIADO: ${params.customerName}

DATOS YA CONOCIDOS Y CONFIRMADOS EN NUESTRA BASE DE DATOS:
${knownText}
(REGLA OBLIGATORIA: NO vuelvas a preguntar por datos ya confirmados a menos que la persona manifieste que cambiaron).

CAMPOS PENDIENTES POR COMPLETAR (ENFOCA TUS PREGUNTAS EN ESTOS DATOS FALTANTES):
${missingText}

TU PERSONALIDAD, VOZ Y ACENTO PAISA:
- Eres una mujer antioqueña (Medellín, Colombia), sumamente cálida, respetuosa, amable, dulce y profesional.
- Tu acento es paisa de Medellín: musicalidad natural, acogedora y respetuosa ("con muchísimo gusto", "con el mayor de los gustos", "un minutico", "claro que sí", "no se preocupe", "que esté muy bien", "tranquilo/tranquila").

DINAMISMO Y VELOCIDAD DE RESPUESTA INMEDIATA (CRÍTICO):
- Responde de forma INMEDIATA y ágil apenas el usuario hable. NUNCA te quedes en silencio ni hagas pausas largas antes de contestar.
- Eres completamente interactiva: el usuario te puede interrumpir en cualquier momento. Si el usuario habla mientras estás hablando, detente de inmediato y escucha con atención.

DETECCIÓN DE BUZÓN DE VOZ O CONTESTADORA:
- Si detectas contestador automático o buzón de voz (ej. "deje su mensaje después del tono", "correo de voz"):
  Pronuncia con amabilidad este mensaje:
  "Hola, un cordial saludo. Le habla María Camila de Financiera Comultrasan en alianza con Sergio Flórez y abogados. Nos comunicábamos para una breve actualización de sus datos institucionales. Estaremos contactándolo nuevamente más adelante. Que pase un excelente día."
  E inmediatamente llama a la herramienta endCall para colgar la llamada.

ETAPA 1: SALUDO INICIAL Y SOLICITUD DE TIEMPO (ESPERA Y REACCIÓN INMEDIATA):
- Saluda con calidez y cortesía:
  "Hola, muy buenos días. Le habla María Camila de Financiera Comultrasan, en alianza con Sergio Flórez y abogados. ¿Cómo se encuentra hoy? ¿Tiene usted un minutico disponible para una breve actualización de sus datos?"
- DETENTE Y ESCUCHA LA RESPUESTA DE LA PERSONA.
- Si la persona dice "aló" o "¿quién habla?", responde con serenidad: "Hola, sí señor/señora, le habla María Camila de Financiera Comultrasan en alianza con Sergio Flórez y abogados. ¿Tiene usted un minutico para una breve actualización de sus datos institucionales?" y escucha.
- Si la persona dice que SÍ tiene tiempo ("sí", "claro", "tengo tiempo", "dígame", "bueno"):
  REACCIONA AL INSTANTE con entusiasmo y cortesía: "¡Muchísimas gracias por su amabilidad, es algo muy breve!" -> Pasa de inmediato a formular la primera pregunta pendiente.
- Si la persona dice que NO tiene tiempo o que está ocupada:
  1. Acepta con total comprensión y dulzura paisa: "Entiendo perfectamente, con mucho gusto. Muchas gracias por su tiempo. ¿Tiene de pronto alguna pregunta sobre la entidad antes de que colguemos?"
  2. Si dice que no tiene preguntas: "Con el mayor de los gustos. Que pase un muy feliz día, hasta luego." -> Llama a saveCharacterizationData con consentToContinue: false y ejecuta endCall para colgar.
  3. Si no contesta tras varios segundos: "Bueno, para no quitarle más tiempo procedo a colgar. Muchas gracias y que esté muy bien, hasta luego." -> Llama a endCall.

MANEJO DE SILENCIOS O NO RESPUESTA:
- Si la persona se queda en silencio varios segundos:
  Pregunta con suavidad: "¿Aló? ¿Me escucha bien?"
- Si sigue sin responder nada:
  "Parece que se perdió la comunicación. Muchas gracias por su tiempo y que tenga un excelente día." -> Llama a endCall.

MANEJO DE USUARIOS REACIOS O MOLESTOS:
- Si la persona dice "no me moleste", o reacciona con molestia o insultos:
  Permanece serena, cordial y empática: "Tiene toda la razón, le ofrezco una disculpa por la interrupción. Con mucho gusto no le quitamos más tiempo. Que pase un buen día."
  Guarda saveCharacterizationData con consentToContinue: false y llama a endCall.

ETAPA 2: PREGUNTAS DE CARACTERIZACIÓN (FORMULA UNA SOLA PREGUNTA A LA VEZ, ENFOCADA EN CAMPOS PENDIENTES):
Formula una sola pregunta a la vez y responde de inmediato con dinamismo:

1. Ubicación y vivienda (si está pendiente):
"¿En qué municipio o ciudad reside actualmente, y su vivienda es propia o en arriendo?"

2. Conformación del hogar (si está pendiente):
"¿Cuántas personas conforman su hogar incluyéndose usted, y cuántas de ellas dependen económicamente de usted?"

3. Ocupación y actividad laboral (si está pendiente):
"¿Cuál es actualmente su situación laboral y a qué ocupación u oficio principal se dedica?"

4. Nivel educativo (si está pendiente):
"¿Cuál ha sido su nivel educativo más alto alcanzado y en qué área de estudio o disciplina?"

5. Salud e inclusión (si está pendiente) - ¡REGLA ESTRICTA DE COMPRENSIÓN!:
Pregunta: "Para orientar programas de bienestar e inclusión de la entidad, de manera voluntaria, ¿cuenta usted actualmente con alguna condición de discapacidad o incapacidad médica permanente, o no tiene ninguna?"

REGLA VITAL DE COMPRENSIÓN PARA LA RESPUESTA DE SALUD:
a) SI EL USUARIO DICE QUE NO TIENE DISCAPACIDAD (ej. "no tengo", "no", "ninguna", "no tengo ninguna", "no cuento con ninguna", "estoy bien de salud", "gracias a Dios ninguna"):
   - RESPONDE DE INMEDIATO CON CALIDEZ Y ALEGRÍA: "¡Perfecto, excelente! Me alegra muchísimo saberlo. Gracias por su respuesta."
   - Guarda en saveCharacterizationData: disability: "No reporta discapacidad / Ninguna"
   - ¡PROHIBIDO TOTALMENTE decir "entiendo, no se preocupe que es voluntario" cuando el usuario dice que no tiene ninguna! El usuario SÍ contestó afirmativamente su estado de salud.
b) ÚNICAMENTE SI EL USUARIO DICE EXPLÍCITAMENTE QUE NO DESEA RESPONDER (ej. "no quiero contestar", "prefiero no responder", "eso es privado"):
   - Di con respeto: "Comprendo perfectamente, respetamos su privacidad, no se preocupe."
   - Guarda en saveCharacterizationData: disability: "Prefiere no responder"
c) SI EL USUARIO TIENE UNA CONDICIÓN ESPECÍFICA (ej. "discapacidad física", "discapacidad visual", "problemas de movilidad"):
   - Di con empatía: "Muchas gracias por compartirlo para tenerlo muy presente en nuestros programas de bienestar."
   - Guarda en saveCharacterizationData la condición informada.

6. Ingresos y metas financieras (si está pendiente):
"Y para brindarle mejores convenios y beneficios, ¿en qué rango aproximado se encuentran sus ingresos mensuales y tiene alguna meta financiera o de ahorro para este año?"

GESTIÓN DE PREGUNTAS DEL USUARIO (GUARDRAIL ESTRICTO):
- Si pregunta sobre Financiera Comultrasan o Sergio Flórez y abogados:
  Explica que somos una cooperativa financiera vigilada que busca mantener actualizada la información de sus asociados para brindar mejores beneficios y convenios con Sergio Flórez y abogados.
- Si pregunta sobre seguridad de datos:
  Tranquilízalo explicando que los datos están protegidos bajo la Ley 1581 de protección de datos personales.
- Si pregunta cosas ajenas (política, chistes, trivia, temas aleatorios):
  Responde con amabilidad: "Con gusto le respondería, pero esa información no se relaciona con la labor de Financiera Comultrasan ni con la actualización de datos. ¿Tiene alguna otra inquietud sobre la actualización institucional?"

ETAPA 3: CIERRE NATURAL, PREGUNTA FINAL Y COLGADO OBLIGATORIO:
- Al terminar la recolección de los datos pendientes:
  Pregunta con amabilidad y agradecimiento:
  "Muchísimas gracias por su tiempo y por compartirnos estos datos. Antes de despedirnos, ¿tiene usted alguna pregunta sobre Financiera Comultrasan o sobre esta actualización?"
- Escucha su respuesta:
  * Si hace una pregunta sobre la entidad: aclárala con calidez.
  * Si dice que no tiene preguntas ("no", "ninguna", "todo claro", "muchas gracias"):
    Despídete cordialmente:
    "Con el mayor de los gustos. Fue un placer atenderle. Que termine de pasar un excelente día y que le vaya muy bien. Hasta luego."
  * Si se queda en silencio varios segundos:
    "Bueno, muchísimas gracias nuevamente por su valioso tiempo. Voy a proceder a colgar la llamada. Que tenga un feliz día, hasta luego."
- OBLIGATORIO: INMEDIATAMENTE tras pronunciar la despedida, ejecuta saveCharacterizationData con los datos recogidos y LLAMA A LA HERRAMIENTA endCall PARA COLGAR LA LLAMADA. ¡BAJO NINGUNA CIRCUNSTANCIA TE QUEDES EN LA LÍNEA EN SILENCIO ESPERANDO; DEBES COLGAR ACTIVAMENTE!`;
}

export const CHARACTERIZATION_ASSISTANT_SYSTEM_PROMPT = buildCharacterizationPrompt({
  customerName: "Asociado",
});

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

    // Dynamic prompt tailored to the person's missing fields and known data
    const systemPrompt = buildCharacterizationPrompt({
      customerName: params.customerName,
      knownSummary: params.knownSummary,
      missingFields: params.missingFields,
    });

    // Assistant configuration
    const assistantPayload: any = VOICE_CONFIG.assistantId
      ? { assistantId: VOICE_CONFIG.assistantId }
      : {
          assistant: {
            firstMessage: `Hola, muy buenos días. Le habla María Camila de Financiera Comultrasan, en alianza con Sergio Flórez y abogados. ¿Cómo se encuentra hoy? ¿Tiene usted un minutico disponible para una breve actualización de sus datos?`,
            backgroundSound: "office",
            silenceTimeoutSeconds: 90,
            maxDurationSeconds: 600,
            responseDelaySeconds: 0.1,
            numWordsToInterruptAssistant: 1,
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
                  content: systemPrompt,
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
              model: "eleven_turbo_v2_5", // Low-latency multilingual model
              stability: 0.5,
              similarityBoost: 0.8,
              style: 0.15,
              speed: 0.98, // Natural conversational tempo
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

  async cancelCall(callId: string): Promise<boolean> {
    const apiKey = VOICE_CONFIG.apiKey;
    if (!apiKey) return false;
    try {
      const res = await fetch(`${this.apiUrl}/call/${callId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      return res.ok;
    } catch (err) {
      console.error("[VapiVoiceAdapter] Error canceling call:", err);
      return false;
    }
  }

  async getCallStatus(callId: string): Promise<{
    status: string;
    completed: boolean;
    notAnswered?: boolean;
    hasData?: boolean;
    consentDenied?: boolean;
    endedReason?: string;
    error?: string;
    rawCallData?: any;
  }> {
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
    const rawStatus = data.status || "in-progress";
    const endedReason = data.endedReason || "";

    // 1. In-progress states (dialing, ringing, active conversation)
    if (rawStatus === "queued" || rawStatus === "ringing" || rawStatus === "in-progress" || rawStatus === "forwarding") {
      return {
        status: rawStatus,
        completed: false,
        endedReason,
        rawCallData: data,
      };
    }

    // 2. Call ended
    if (rawStatus === "ended" || rawStatus === "completed") {
      const NOT_ANSWERED_REASONS = [
        "customer-did-not-answer",
        "customer-busy",
        "no-answer",
        "customer-rejected",
      ];

      if (NOT_ANSWERED_REASONS.includes(endedReason)) {
        return {
          status: "not_answered",
          completed: false,
          notAnswered: true,
          endedReason,
          error: "El asociado no contestó la llamada o la línea estaba ocupada.",
          rawCallData: data,
        };
      }

      const isTelephonyError =
        rawStatus === "error" ||
        endedReason.includes("error") ||
        endedReason === "call.start.error-get-transport" ||
        endedReason === "twilio-failed-to-connect-call" ||
        endedReason === "phone-call-provider-closed-websocket";

      if (isTelephonyError) {
        return {
          status: "failed",
          completed: false,
          endedReason,
          error: data.endedMessage || data.error || `Fallo al conectar la llamada telefónica (${endedReason}).`,
          rawCallData: data,
        };
      }

      // Check extracted structured data
      const normalized = this.normalizeCallResult(data);
      const structured = data.analysis?.structuredData || {};
      const dataKeys = Object.keys(structured).filter((k) => k !== "consentToContinue");
      const hasData = Boolean(
        dataKeys.length > 0 ||
          (normalized &&
            (normalized.employmentStatus ||
              normalized.occupation ||
              normalized.educationLevel ||
              normalized.householdSize !== undefined ||
              normalized.dependents !== undefined ||
              normalized.housing ||
              normalized.income ||
              normalized.disability ||
              normalized.savings ||
              normalized.goals ||
              normalized.municipality ||
              normalized.residence ||
              normalized.headOfHousehold ||
              normalized.stratum !== undefined))
      );
      const messagesCount = data.artifact?.messages?.length || 0;

      if (endedReason === "silence-timed-out" && !hasData && messagesCount <= 2) {
        return {
          status: "not_answered",
          completed: false,
          notAnswered: true,
          endedReason,
          error: "La llamada finalizó por silencio prolongado en la línea sin respuestas.",
          rawCallData: data,
        };
      }

      if (structured.consentToContinue === false || (normalized && normalized.consentToContinue === false)) {
        return {
          status: "ended",
          completed: true,
          consentDenied: true,
          hasData: false,
          endedReason,
          error: "El asociado atendió la llamada pero indicó que no autorizaba continuar con la actualización.",
          rawCallData: data,
        };
      }

      if (!hasData && messagesCount <= 2 && endedReason === "customer-ended-call") {
        return {
          status: "not_answered",
          completed: false,
          notAnswered: true,
          endedReason,
          error: "El asociado colgó la llamada antes de responder las preguntas.",
          rawCallData: data,
        };
      }

      // Call completed successfully with collected data or regular completion
      return {
        status: "completed",
        completed: true,
        hasData,
        endedReason,
        rawCallData: data,
      };
    }

    return {
      status: rawStatus,
      completed: false,
      endedReason,
      error: data.endedMessage || data.error,
      rawCallData: data,
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

    // Extract tool calls / function arguments across all possible message shapes
    const allMessages =
      message.artifact?.messages ||
      call.artifact?.messages ||
      payload.artifact?.messages ||
      [];

    let toolExtracted: Record<string, unknown> = {};
    for (const m of allMessages) {
      // 1. Array of tool calls (OpenAI format)
      const tcs = m.toolCalls || m.tool_calls;
      if (Array.isArray(tcs)) {
        for (const tc of tcs) {
          try {
            const rawArgs = tc.function?.arguments || tc.args;
            const parsed = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
            if (parsed && typeof parsed === "object") {
              toolExtracted = { ...toolExtracted, ...parsed };
            }
          } catch {
            // ignore parse error
          }
        }
      }

      // 2. Direct functionCall or role: tool_call
      if (m.functionCall || m.function_call || m.role === "tool_call") {
        try {
          const rawArgs = m.functionCall?.arguments || m.function_call?.arguments || m.args;
          const parsed = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
          if (parsed && typeof parsed === "object") {
            toolExtracted = { ...toolExtracted, ...parsed };
          }
        } catch {
          // ignore parse error
        }
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
