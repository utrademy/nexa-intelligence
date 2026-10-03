export interface NormalizedCallResult {
  personId: string;
  consentToContinue: boolean;
  employmentStatus?: string;
  occupation?: string;
  educationLevel?: string;
  municipality?: string;
  householdSize?: number | string;
  additionalField?: string;
  source: "AI_VOICE";
  providerCallId: string;
  completedAt: string;
  transcriptAvailable: boolean;
  transcriptText?: string;
  rawStructured?: Record<string, unknown>;
}

export interface VoiceCallInitiateParams {
  personId: string;
  destinationPhone: string;
  customerName: string;
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
 * ask if the person has a brief moment, and collect the 5 characterization fields.
 */
export const CHARACTERIZATION_ASSISTANT_SYSTEM_PROMPT = `Eres la asistente virtual de NEXA para Financiera Comultrasan, empresa afiliada a Sergio Flores y abogados en Colombia.

TU PERSONALIDAD Y VOZ:
- Hablas en español colombiano muy natural, cálido, educado y cercano (con cadencia amable y respetuosa típica de Medellín / Antioquia o Santander).
- Hablas de manera PAUSADA, tranquila y con excelente dicción. NO te apresures ni hables como robot o IVR comercial.
- Tu tono es empático, humano y profesional.

PASO 1: PRESENTACIÓN CÁLIDA Y CONSENTIMIENTO
Debes iniciar presentándote:
"Hola, un cordial saludo. Le hablo de Financiera Comultrasan, empresa afiliada a Sergio Flores y abogados. ¿Tiene usted un minutico disponible? Queríamos solicitarle unos datos muy sencillos de actualización que no le tomarán nada de tiempo. ¿Podemos continuar?"
- Si el usuario dice que no tiene tiempo o dice que NO, responde con mucha amabilidad: "Comprendo perfectamente, muchas gracias por atendernos. Que tenga un feliz día." y finalizas la llamada.
- Si el usuario dice que SÍ, responde: "Muchísimas gracias por su tiempo, es muy breve." y continúas con las preguntas.

PASO 2: PREGUNTAS (UNA POR UNA, PAUSADAS)
Haz exactamente UNA pregunta a la vez, esperando calmadamente la respuesta:
1. Situación laboral: "¿Cuál es actualmente su situación laboral? Por ejemplo: si es empleado, independiente, pensionado o desempleado."
2. Ocupación u oficio: "¿Y a qué actividad u ocupación principal se dedica en este momento?"
3. Nivel educativo: "¿Cuál ha sido su nivel educativo más alto alcanzado? Por ejemplo: secundaria, técnico, tecnólogo, profesional o posgrado."
4. Municipio de residencia: "¿En qué municipio o ciudad reside actualmente?"
5. Personas en el hogar: "Y por último, ¿cuántas personas conforman su hogar incluyéndose usted?"

REGLAS CRÍTICAS:
- Habla pausado y espera la respuesta completa del usuario antes de pasar al siguiente punto.
- Si la persona no escucha bien o duda, repítele con calma y una sonrisa en la voz.
- NO preguntes sobre discapacidad, salud, afiliación política ni temas personales sensibles.
- NO des asesoría legal ni financiera. Esta llamada es exclusivamente una breve actualización de datos.

PASO 3: CIERRE
Al responder las preguntas, despídete cordialmente:
"Muchísimas gracias por su amabilidad y por su tiempo. Hemos terminado con la actualización de sus datos. Que termine de pasar un excelente día."
Luego finaliza la llamada.`;

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
                  type: "function",
                  function: {
                    name: "saveCharacterizationData",
                    description: "Guarda la información de caracterización recopilada durante la llamada.",
                    parameters: {
                      type: "object",
                      properties: {
                        consentToContinue: { type: "boolean", description: "¿Autorizó continuar con la llamada?" },
                        employmentStatus: {
                          type: "string",
                          enum: ["Empleado", "Independiente", "Desempleado", "Pensionado", "Estudiante", "Informal"],
                          description: "Situación laboral",
                        },
                        occupation: { type: "string", description: "Ocupación o profesión" },
                        educationLevel: {
                          type: "string",
                          enum: ["Primaria", "Secundaria", "Técnico", "Tecnólogo", "Profesional", "Posgrado"],
                          description: "Nivel educativo",
                        },
                        municipality: { type: "string", description: "Municipio o ciudad de residencia" },
                        householdSize: { type: "number", description: "Cantidad de personas en el hogar" },
                      },
                      required: ["consentToContinue"],
                    },
                  },
                },
              ],
            },
            voice: {
              provider: "11labs",
              voiceId: "cgSgspJ2msm6clMCkdW9", // Jessica - warm, natural Spanish pacing
              model: "eleven_multilingual_v2",
              stability: 0.65,
              similarityBoost: 0.75,
              speed: 0.92, // slightly paused and articulate
            },
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
                    educationLevel: { type: "string" },
                    municipality: { type: "string" },
                    householdSize: { type: "number" },
                  },
                },
              },
            },
            serverUrl: webhookUrl,
            serverUrlSecret: VOICE_CONFIG.webhookSecret || undefined,
            metadata: {
              personId: params.personId,
              customerName: params.customerName,
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
      employmentStatus: combined.employmentStatus ? String(combined.employmentStatus) : undefined,
      occupation: combined.occupation ? String(combined.occupation) : undefined,
      educationLevel: combined.educationLevel ? String(combined.educationLevel) : undefined,
      municipality: combined.municipality || combined.city ? String(combined.municipality || combined.city) : undefined,
      householdSize: combined.householdSize !== undefined ? combined.householdSize : undefined,
      additionalField: combined.additionalField ? String(combined.additionalField) : undefined,
      source: "AI_VOICE",
      providerCallId: call.id || message.callId || payload.callId || `vapi-${Date.now()}`,
      completedAt: new Date().toISOString(),
      transcriptAvailable: Boolean(transcript && transcript.length > 0),
      transcriptText: transcript || undefined,
      rawStructured: combined,
    };
  }
}

// Export singleton instance
export const voiceProvider: VoiceProviderAdapter = new VapiVoiceAdapter();
