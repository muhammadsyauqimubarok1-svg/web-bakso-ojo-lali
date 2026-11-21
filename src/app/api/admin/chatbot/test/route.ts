import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getChatbotAIConfig, testChatbotAIConnection } from "@/lib/ai/ai-service";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak (Hanya Admin)" }, { status: 403 });
    }

    const body = await req.json();
    const { provider, model, temperature } = body;
    let apiKey = body.apiKey;

    // If apiKey is empty or masked, fallback to saved API key from DB
    if (!apiKey || apiKey.includes("••••")) {
      const currentConfig = await getChatbotAIConfig();
      apiKey = currentConfig.apiKey;
    }

    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "API Key belum diisi. Masukkan API Key terlebih dahulu untuk menguji koneksi.",
        },
        { status: 400 }
      );
    }

    const result = await testChatbotAIConnection({
      provider: provider || "gemini",
      apiKey: apiKey.trim(),
      model: model || "gemini-2.0-flash",
      temperature: typeof temperature === "number" ? temperature : 0.7,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Test AI Chatbot error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Terjadi kesalahan saat menguji AI",
      },
      { status: 500 }
    );
  }
}

