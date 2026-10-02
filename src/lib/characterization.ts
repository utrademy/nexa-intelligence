import type { Channel, FieldSource, ProfileSection } from "./types";

export const CHANNEL_SOURCE: Record<Channel, FieldSource> = {
  voice: "Llamada con IA",
  whatsapp: "WhatsApp",
  sms: "SMS",
  form: "Formulario seguro",
};

export function profileScore(sections: ProfileSection[]) {
  const fields = sections.flatMap((s) => s.fields);
  const known = fields.filter((f) => f.known).length;
  return { known, total: fields.length, missing: fields.length - known, score: Math.round((known / fields.length) * 100) };
}

/**
 * Simulates the structured output of an AI conversation: fills missing
 * fields (critical first) until the profile reaches ~91%, or completes it.
 * Replace with the real conversation → structured data pipeline later.
 */
export function applyAiCharacterization(sections: ProfileSection[], channel: Channel, timestamp: string) {
  const { known, total, score } = profileScore(sections);
  const target = score < 91 ? Math.ceil(total * 0.91) : total;
  const toFill = Math.max(0, target - known);

  const missing = sections
    .flatMap((s) => s.fields.filter((f) => !f.known).map((f) => f.key))
    .sort((a, b) => {
      const fa = sections.flatMap((s) => s.fields).find((f) => f.key === a)!;
      const fb = sections.flatMap((s) => s.fields).find((f) => f.key === b)!;
      return Number(!!fb.critical) - Number(!!fa.critical);
    });
  const fill = new Set(missing.slice(0, toFill));

  let i = 0;
  const updated = sections.map((s) => ({
    ...s,
    fields: s.fields.map((f) => {
      if (!fill.has(f.key)) return f;
      i++;
      return {
        ...f,
        known: true,
        aiCollected: true,
        source: CHANNEL_SOURCE[channel],
        updatedAt: timestamp,
        confidence: 0.88 + ((i * 37) % 11) / 100,
        consent: "Otorgada" as const,
      };
    }),
  }));

  return { sections: updated, filled: fill.size };
}
