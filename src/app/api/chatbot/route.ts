import { NextResponse } from "next/server";
import { processChatbotQuery } from "@/lib/ai/chatbot-engine";
import { callChatbotAI, getChatbotAIConfig } from "@/lib/ai/ai-service";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history } = body as {
      message?: string;
      history?: Array<{ role: "user" | "assistant" | "model"; content: string }>;
    };

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { reply: "Silakan masukkan pertanyaan seputar menu, harga, pesanan, atau informasi warung Ojolali." },
        { status: 400 }
      );
    }

    const session = await getSession();
    const userId = session?.id || null;

    // Check if Chatbot AI is enabled and configured
    try {
      const aiConfig = await getChatbotAIConfig();
      if (aiConfig.enabled && aiConfig.apiKey) {
        const aiReply = await callChatbotAI({
          message: message.trim(),
          history: Array.isArray(history) ? history : [],
          userId,
        });

        if (aiReply && aiReply.trim()) {
          return NextResponse.json({
            reply: aiReply,
            source: "ai",
            model: aiConfig.model,
            blocked: false,
          });
        }
      }
    } catch (aiError) {
      console.warn("AI Generation failed, falling back to database engine:", aiError);
      // Fallback seamlessly to database engine below
    }

    // Default fallback to high-accuracy local database engine
    const reply = await processChatbotQuery(message, userId, history);

    return NextResponse.json({ reply, source: "db_engine", blocked: false });
  } catch (error) {
    console.error("Chatbot route error:", error);
    return NextResponse.json(
      { reply: "Maaf, terjadi kendala teknis saat memproses data. Silakan coba sesaat lagi." },
      { status: 500 }
    );
  }
}
