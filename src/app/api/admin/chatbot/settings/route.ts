import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getChatbotAIConfig,
  saveChatbotAIConfig,
  AVAILABLE_AI_MODELS,
  DEFAULT_SYSTEM_PROMPT,
} from "@/lib/ai/ai-service";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak (Hanya Admin)" }, { status: 403 });
    }

    const config = await getChatbotAIConfig();

    // Mask the API key so it is never exposed in plain text on the frontend
    const hasKey = Boolean(config.apiKey && config.apiKey.length > 0);
    const maskedApiKey = hasKey
      ? config.apiKey.length > 8
        ? `${config.apiKey.slice(0, 4)}••••••••${config.apiKey.slice(-4)}`
        : "••••••••"
      : "";

    return NextResponse.json({
      settings: {
        enabled: config.enabled,
        provider: config.provider,
        hasApiKey: hasKey,
        maskedApiKey,
        model: config.model,
        temperature: config.temperature,
        systemPrompt: config.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      },
      availableModels: AVAILABLE_AI_MODELS,
    });
  } catch (error) {
    console.error("Get Chatbot AI settings error:", error);
    return NextResponse.json({ error: "Gagal memuat pengaturan Chatbot AI" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak (Hanya Admin)" }, { status: 403 });
    }

    const body = await req.json();
    const { enabled, provider, apiKey, model, temperature, systemPrompt } = body;

    const updatePayload: Record<string, string | number | boolean> = {};

    if (typeof enabled === "boolean") {
      updatePayload.enabled = enabled;
    }

    if (provider === "gemini" || provider === "openai" || provider === "groq") {
      updatePayload.provider = provider;
    }

    // Only update API key if provided and not masked
    if (typeof apiKey === "string" && apiKey.trim() !== "") {
      if (!apiKey.includes("••••")) {
        updatePayload.apiKey = apiKey.trim();
      }
    }

    if (typeof model === "string" && model.trim() !== "") {
      updatePayload.model = model.trim();
    }

    if (typeof temperature === "number" && !isNaN(temperature)) {
      updatePayload.temperature = Math.max(0, Math.min(1.0, temperature));
    }

    if (typeof systemPrompt === "string") {
      updatePayload.systemPrompt = systemPrompt.trim();
    }

    await saveChatbotAIConfig(updatePayload);

    const updated = await getChatbotAIConfig();
    const hasKey = Boolean(updated.apiKey && updated.apiKey.length > 0);
    const maskedApiKey = hasKey
      ? updated.apiKey.length > 8
        ? `${updated.apiKey.slice(0, 4)}••••••••${updated.apiKey.slice(-4)}`
        : "••••••••"
      : "";

    return NextResponse.json({
      message: "Konfigurasi Chatbot AI berhasil disimpan",
      settings: {
        enabled: updated.enabled,
        provider: updated.provider,
        hasApiKey: hasKey,
        maskedApiKey,
        model: updated.model,
        temperature: updated.temperature,
        systemPrompt: updated.systemPrompt,
      },
    });
  } catch (error) {
    console.error("Save Chatbot AI settings error:", error);
    return NextResponse.json({ error: "Gagal menyimpan konfigurasi Chatbot AI" }, { status: 500 });
  }
}

