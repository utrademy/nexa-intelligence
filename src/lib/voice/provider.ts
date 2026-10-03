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
    return (
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
      "https://nexa-intelligence.vercel.app"
    );
  },
};

/**
 * Characterization assistant system prompt in Colombian Spanish.
 * Instructs the voice AI to collect key characterization fields without sensitive/disability questions.
 */
export const CHARACTERIZATION_ASSISTANT_SYSTEM_PROMPT = `Eres el asistente virtual de NEXA para Financiera Comultrasan en Colombia.
Tu objetivo es realizar una breve actualización de datos (caracterización) de forma cálida, profesional y muy ágil (máximo 60 a 90 segundos).
Habla en español neutro / colombiano, con tono amable, claro y respetuoso.

PASO 1: PRESENTACIÓN Y CONSENTIMIENTO
Debes iniciar presentándote:
"Hola, soy el asistente virtual de NEXA. Estamos realizando una breve actualización de información. Esta llamada puede ser procesada mediante inteligencia artificial con fines de demostración. ¿Podemos continuar?"
- Si el usuario dice que NO, responde amablemente: "Entendido, muchas gracias por su tiempo. Que tenga un buen día." y finaliza la llamada.
- Si el usuario dice que SÍ o confirma de manera afirmativa, continúa inmediatamente al Paso 2.

PASO 2: PREGUNTAS (UNA POR UNA)
Haz exactamente UNA pregunta a la vez y espera la respuesta del usuario antes de continuar:
1. Situación laboral: "¿Cuál es actualmente su situación laboral? Por ejemplo: empleado, independiente, pensionado o desempleado."
2. Ocupación u oficio: "¿A qué actividad u ocupación principal se dedica?"
3. Nivel educativo: "¿Cuál es su nivel educativo más alto alcanzado? (por ejemplo: secundaria, técnico, tecnólogo, profesional o posgrado)."
4. Municipio de residencia: "¿En qué municipio o ciudad reside actualmente?"
5. Personas en el hogar: "¿Cuántas personas viven actualmente en su hogar incluyéndose usted?"

REGLAS CRÍTICAS:
- Haz una sola pregunta a la vez. No acumules preguntas.
- Si la respuesta es ambigua, pide una aclaración breve y amable.
- No preguntes sobre discapacidad, salud, afiliación política ni datos sensibles.
- No ofrezcas asesoría financiera ni legal. Si preguntan sobre créditos o temas legales, indica que esta llamada es exclusivamente para actualizar datos de caracterización.

PASO 3: CIERRE
Una vez respondidas las preguntas, concluye con:
"Muchas gracias por su valiosa información. Hemos terminado la actualización de sus datos. Que tenga un excelente día."
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
            firstMessage: `Hola, soy el asistente virtual de NEXA. Me comunico con ${params.customerName}. Estamos realizando una breve actualización de información. Esta llamada puede ser procesada mediante inteligencia artificial con fines de demostración. ¿Podemos continuar?`,
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
              voiceId: "sarah",
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

    return {
      status,
      completed,
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
