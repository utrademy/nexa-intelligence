import { NextResponse } from "next/server";
import { voiceProvider } from "@/lib/voice/provider";
import { persistVoiceCharacterization } from "@/lib/voice/service";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    let payload: any = {};
    if (rawBody) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }
    }

    // 1. Verify webhook authenticity if configured
    const isValid = await voiceProvider.verifyWebhook(request, rawBody);
    if (!isValid) {
      console.warn("[voice-webhook] Webhook signature verification failed.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Handle events
    const message = payload.message || payload;
    const type = message.type || payload.type;
    console.log(`[voice-webhook] Received event: ${type}`);

    // If it's an end-of-call report or status update indicating completion
    if (
      type === "end-of-call-report" ||
      type === "call.ended" ||
      type === "call-ended" ||
      type === "status-update" ||
      payload.status === "completed" ||
      payload.status === "ended"
    ) {
      const normalized = voiceProvider.normalizeCallResult(payload);
      if (!normalized) {
        console.log("[voice-webhook] Event does not contain person characterization metadata. Acknowledging.");
        return NextResponse.json({ received: true });
      }

      console.log(`[voice-webhook] Processing normalized call result for person: ${normalized.personId}`);
      const result = await persistVoiceCharacterization(normalized);

      return NextResponse.json({
        received: true,
        persisted: result.persisted,
        personId: result.personId,
        score: result.newScore,
        fieldsUpdated: result.fieldsUpdated,
      });
    }

    // Call started / progress / ping events
    return NextResponse.json({ received: true, status: "acknowledged" });
  } catch (err: any) {
    console.error("[voice-webhook] Error processing webhook:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err?.message || String(err) },
      { status: 500 },
    );
  }
}
