import { NextResponse } from "next/server";
import { askOjolaliAssistant } from "@/lib/ai/ojolali-assistant";
import { callChatbotAI, getChatbotAIConfig } from "@/lib/ai/ai-service";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { reply: "Halo! Saya AI Asisten Ojolali. Ada yang bisa saya bantu terkait menu atau pemesanan Baso & Mie Ayam Ojolali? 😊" },
        { status: 400 }
      );
    }

    // Retrieve session if available (for personalized order context)
    const session = await getSession();
    const userId = session?.id || null;

    // Check if Chatbot AI is enabled and configured
    try {
      const aiConfig = await getChatbotAIConfig();
      if (aiConfig.enabled && aiConfig.apiKey) {
        // Format history
        const formattedHistory: Array<{ role: "user" | "assistant" | "model"; content: string }> = Array.isArray(history)
          ? history.map((h: { sender?: string; role?: string; text?: string; content?: string }) => ({
              role: h.sender === "bot" ? "assistant" : "user",
              content: h.text || h.content || "",
            }))
          : [];

        const aiReply = await callChatbotAI({
          message: message.trim(),
          history: formattedHistory,
          userId,
        });

        if (aiReply && aiReply.trim()) {
          return NextResponse.json({
            reply: aiReply,
            source: "ai",
            model: aiConfig.model,
            guarded: false,
            topicAllowed: true,
          });
        }
      }
    } catch (aiError) {
      console.warn("AI recommend call failed, falling back to rule assistant:", aiError);
    }

    const result = await askOjolaliAssistant({
      userMessage: message,
      userId,
      history,
    });

    return NextResponse.json({
      reply: result.reply,
      source: "db_assistant",
      guarded: result.guarded,
      topicAllowed: result.topicAllowed,
    });
  } catch (error) {
    console.error("AI recommend route error:", error);
    return NextResponse.json(
      {
        reply: "Maaf, terjadi kendala saat memproses permintaan Anda. Silakan coba sesaat lagi.",
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
