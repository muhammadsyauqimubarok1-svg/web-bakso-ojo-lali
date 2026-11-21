import { prisma } from "../prisma";
import { formatRupiah } from "../utils";
import { getStoreSalesMetrics } from "./chatbot-engine";

export interface ChatbotAIConfig {
  enabled: boolean;
  provider: "gemini" | "openai" | "groq";
  apiKey: string;
  model: string;
  temperature: number;
  systemPrompt: string;
}

export interface AIModelOption {
  id: string;
  name: string;
  provider: "gemini" | "openai" | "groq";
  description: string;
  badge?: string;
  isRecommended?: boolean;
}

export const AVAILABLE_AI_MODELS: AIModelOption[] = [
  // Google Gemini Models
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "gemini",
    description: "Model generasi terbaru Google. Sangat cepat, cerdas, dan responsif untuk chatbot kasir & restoran.",
    badge: "Rekomendasi Utama",
    isRecommended: true,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "gemini",
    description: "Versi teranyar dengan kecepatan tinggi dan penalaran mutakhir untuk interaksi pelanggan.",
    badge: "Terbaru",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "gemini",
    description: "Model cepat, efisien, hemat token, dan sangat stabil untuk percakapan sehari-hari.",
    badge: "Hemat Kuota",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "gemini",
    description: "Model unggulan dengan kemampuan analisis mendalam, pemahaman konteks panjang, dan akurasi tinggi.",
    badge: "Akurasi Tinggi",
  },

  // OpenAI Models
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "Model OpenAI yang cepat, ringan, dan sangat hemat biaya dengan kualitas jawaban tinggi.",
    badge: "OpenAI Hemat",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o (Omni)",
    provider: "openai",
    description: "Model flagship OpenAI dengan kecerdasan maksimal dan pemahaman multi-bahasa terbaik.",
    badge: "Flagship",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "openai",
    description: "Model klasik OpenAI untuk respon percakapan dasar yang cepat.",
    badge: "Klasik",
  },

  // Groq Models
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B (Groq)",
    provider: "groq",
    description: "Open-source Llama 3.3 berkecepatan ultra tinggi di infrastruktur Groq LPU.",
    badge: "Super Cepat",
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B (Groq)",
    provider: "groq",
    description: "Model instan dengan latensi terendah untuk jawaban langsung tanpa jeda.",
    badge: "Instan",
  },
];

export const DEFAULT_SYSTEM_PROMPT = `Anda adalah "Oji", asisten virtual pintar dan ramah resmi dari warung "Baso & Mie Ayam Ojolali".

Tugas utama Anda:
1. Membantu pelanggan dengan ramah, hangat, dan informatif mengenai menu, daftar harga, status stok ketersediaan, jam buka, lokasi warung, metode pembayaran, dan status pesanan.
2. Memberikan rekomendasi makanan atau paket sesuai selera atau budget pelanggan berdasarkan data menu riil warung.
3. Menjawab pertanyaan seputar jumlah pelanggan, data penjualan hari ini, omzet warung, dan statistik sistem secara akurat berdasarkan data resmi di bawah.
4. Menjawab pertanyaan pengguna tentang profil/identitas mereka ("siapa saya", "akun saya") berdasarkan info pengguna yang tertera di konteks di bawah.
5. Menjawab pertanyaan tentang pemilik warung (dikelola oleh keluarga Ojolali dengan resep kuah kaldu sapi asli legendaris).
6. Selalu menggunakan data resmi yang tertera pada konteks toko di bawah. Jangan pernah mengarang menu atau harga yang tidak ada di daftar!
7. Format jawaban dengan rapi menggunakan markdown (tebalkan nama menu/harga, gunakan bullet points jika menyajikan daftar) agar nyaman dibaca.`;

/**
 * Get active AI Configuration from DB with fallback to environment variables
 */
export async function getChatbotAIConfig(): Promise<ChatbotAIConfig> {
  const envGeminiKey = process.env.GEMINI_API_KEY || "";

  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "chatbot_ai_enabled",
            "chatbot_ai_provider",
            "chatbot_ai_api_key",
            "chatbot_ai_model",
            "chatbot_ai_temperature",
            "chatbot_ai_system_prompt",
          ],
        },
      },
    });

    const map = new Map(settings.map((s) => [s.key, s.value]));

    const enabled = map.has("chatbot_ai_enabled")
      ? map.get("chatbot_ai_enabled") === "true"
      : Boolean(envGeminiKey || map.get("chatbot_ai_api_key"));

    const provider = (map.get("chatbot_ai_provider") as "gemini" | "openai" | "groq") || "gemini";
    const apiKey = map.get("chatbot_ai_api_key") || envGeminiKey;
    const model = map.get("chatbot_ai_model") || "gemini-2.0-flash";
    const temperature = parseFloat(map.get("chatbot_ai_temperature") || "0.7") || 0.7;
    const systemPrompt = map.get("chatbot_ai_system_prompt") || DEFAULT_SYSTEM_PROMPT;

    return {
      enabled,
      provider,
      apiKey,
      model,
      temperature,
      systemPrompt,
    };
  } catch (err) {
    console.error("Error reading Chatbot AI config from DB:", err);
    return {
      enabled: Boolean(envGeminiKey),
      provider: "gemini",
      apiKey: envGeminiKey,
      model: "gemini-2.0-flash",
      temperature: 0.7,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
    };
  }
}

/**
 * Save Chatbot AI configuration to DB
 */
export async function saveChatbotAIConfig(config: Partial<ChatbotAIConfig>): Promise<void> {
  const entries: { key: string; value: string }[] = [];

  if (config.enabled !== undefined) {
    entries.push({ key: "chatbot_ai_enabled", value: config.enabled ? "true" : "false" });
  }
  if (config.provider !== undefined) {
    entries.push({ key: "chatbot_ai_provider", value: config.provider });
  }
  if (config.apiKey !== undefined) {
    // Only save if not empty
    entries.push({ key: "chatbot_ai_api_key", value: config.apiKey.trim() });
  }
  if (config.model !== undefined) {
    entries.push({ key: "chatbot_ai_model", value: config.model.trim() });
  }
  if (config.temperature !== undefined) {
    entries.push({ key: "chatbot_ai_temperature", value: config.temperature.toString() });
  }
  if (config.systemPrompt !== undefined) {
    entries.push({ key: "chatbot_ai_system_prompt", value: config.systemPrompt.trim() });
  }

  for (const item of entries) {
    await prisma.setting.upsert({
      where: { key: item.key },
      create: { key: item.key, value: item.value },
      update: { value: item.value },
    });
  }
}

/**
 * Fetch dynamic store context from database for AI prompt injection
 */
export async function buildStoreContextForAI(userId?: string | null): Promise<string> {
  try {
    const [
      products,
      categories,
      settings,
      customerCount,
      totalUsersCount,
      popularItems,
      currentUser,
      metrics,
      recentOrders,
    ] = await Promise.all([
      prisma.product.findMany({
        include: { category: true },
        orderBy: [{ categoryId: "asc" }, { price: "asc" }],
      }),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.setting.findMany(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.count(),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      userId
        ? prisma.user.findUnique({
            where: { id: userId },
            include: { _count: { select: { orders: true } } },
          })
        : Promise.resolve(null),
      getStoreSalesMetrics(),
      prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: true } } },
      }),
    ]);

    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    const adminPhone = settingsMap["whatsapp_admin_number"] || "081234567890";

    const productMap = new Map(products.map((p) => [p.id, p]));
    const bestSellers = popularItems
      .map((it) => {
        const prod = productMap.get(it.productId);
        return prod ? `${prod.name} (${it._sum.quantity} porsi terjual)` : null;
      })
      .filter(Boolean)
      .join(", ");

    const menuLines = products.map(
      (p) =>
        `- ${p.name} (${p.category.name}): ${formatRupiah(p.price)} [${p.available ? "TERSEDIA / READY" : "HABIS"}]${
          p.description ? ` - Ket: ${p.description}` : ""
        }`
    );

    const userInfo = currentUser
      ? `Pengguna saat ini sedang login: Nama: ${currentUser.name}, Role: ${currentUser.role}, Email: ${currentUser.email || "-"}, No HP: ${currentUser.phone || "-"}, Total Riwayat Pesanan: ${currentUser._count.orders} pesanan.`
      : "Pengguna saat ini mengakses sebagai Tamu / Pengunjung (belum login).";

    return `
### DATA IDENTITAS PENGGUNA YANG BERTANYA:
${userInfo}

### DATA RESMI WARUNG BASO & MIE AYAM OJOLALI:
- **Nama Warung**: Baso di Lingkungan Kecamatan & Mie Ayam Ojolali
- **Pemilik / Pengelola**: Dikelola oleh keluarga Ojolali sebagai UMKM kuliner legendaris kecamatan dengan resep kuah kaldu sapi asli
- **Alamat**: Jl. Raya Lingkungan Kecamatan No. 45 (Dekat Kantor Camat)
- **Jam Buka / Operasional**: Setiap hari (Senin - Minggu, termasuk hari libur nasional) pukul 10:00 - 21:00 WIB
- **Kontak WhatsApp Resmi**: ${adminPhone}
- **Metode Pembayaran**: Tunai (Cash), Transfer Bank, dan QRIS
- **Layanan**: Makan di tempat (Dine In) dan Bungkus bawa pulang (Take Away)
- **Jaminan Kualitas**: 100% Halal, dibuat dari daging sapi asli berkualitas dan rempah pilihan

### DATA METRIK PENJUALAN & PESANAN (SINKRON 100% DENGAN DASHBOARD ADMIN):
- **Penjualan Hari Ini**: ${formatRupiah(metrics.todayOmzet)} (Transaksi pesanan lunas)
- **Pesanan Selesai Hari Ini**: ${metrics.todayCompletedCount} pesanan (${metrics.todayOrdersCount} total transaksi masuk hari ini)
- **Jumlah Pesanan Minggu Ini (7 Hari Terakhir)**: ${metrics.weekOrdersCount} pesanan
- **Total Omzet Minggu Ini**: ${formatRupiah(metrics.weekOmzet)} (${metrics.weekCompletedCount} pesanan selesai)
- **Rata-Rata Nilai Transaksi Minggu Ini**: ${formatRupiah(metrics.weekAvg)} per pesanan
- **Jumlah Pesanan Bulan Ini (30 Hari Terakhir)**: ${metrics.monthOrdersCount} pesanan (Omzet Bulan Ini: ${formatRupiah(metrics.monthOmzet)})
- **Pesanan Antrean / Sedang Diproses Saat Ini**: ${metrics.processingCount} antrian
- **Total Akumulasi Seluruh Omzet (All-Time)**: ${formatRupiah(metrics.allTimeOmzet)} (${metrics.allTimeCompletedCount} pesanan selesai dari ${metrics.allTimeOrdersCount} transaksi)
- **Menu Paling Laris (Best Seller)**: ${bestSellers || "Baso Komplit, Mie Ayam Spesial"}

### DATA STATISTIK & JUMLAH PELANGGAN RIIL TOKO:
- **Jumlah Pelanggan Terdaftar**: ${customerCount} orang pelanggan
- **Total Pengguna Sistem**: ${totalUsersCount} akun (termasuk pelanggan, kasir, dan admin)
- **Total Seluruh Pesanan Masuk**: ${metrics.allTimeOrdersCount} transaksi pesanan
- **Total Pesanan Selesai Dilayani**: ${metrics.allTimeCompletedCount} pesanan selesai

### DAFTAR PEMESAN & TRANSAKSI TERBARU (SINKRON DENGAN ADMIN):
${
  recentOrders.length > 0
    ? recentOrders
        .map(
          (o, idx) =>
            `${idx + 1}. ${o.customerName} (#${o.orderNumber}) - ${formatRupiah(o.total)} [Status: ${o.status}] - Item: ${o.items.map((i) => `${i.product.name} (${i.quantity}x)`).join(", ")}`
        )
        .join("\n")
    : "Belum ada pesanan terbaru."
}

### DAFTAR MENU LENGKAP & HARGA SAAT INI DARI DATABASE:
${menuLines.join("\n")}
`;
  } catch (error) {
    console.error("Error building store context for AI:", error);
    return `
### DATA RESMI WARUNG BASO & MIE AYAM OJOLALI:
- Jam Buka: 10:00 - 21:00 WIB (Buka setiap hari)
- Alamat: Jl. Raya Lingkungan Kecamatan No. 45
- Pembayaran: Tunai, Transfer, QRIS
`;
  }
}

/**
 * Perform a test call to verify API key and model validity
 */
export async function testChatbotAIConnection(params: {
  provider: "gemini" | "openai" | "groq";
  apiKey: string;
  model: string;
  temperature?: number;
}): Promise<{
  success: boolean;
  reply?: string;
  latencyMs?: number;
  error?: string;
}> {
  const { provider, apiKey, model, temperature = 0.7 } = params;

  if (!apiKey || !apiKey.trim()) {
    return {
      success: false,
      error: "API Key tidak boleh kosong. Masukkan API Key terlebih dahulu.",
    };
  }

  const startTime = Date.now();
  const testPrompt = "Halo Oji! Ini adalah tes koneksi dari sistem Admin Ojolali. Jawab singkat dalam 1-2 kalimat untuk mengonfirmasi bahwa kamu aktif dan siap melayani pelanggan!";

  try {
    let reply = "";

    if (provider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: testPrompt }],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: 250,
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error?.message || `HTTP ${res.status}: Gagal terhubung ke Google Gemini API`;
        return { success: false, error: errorMsg, latencyMs: Date.now() - startTime };
      }

      reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Koneksi berhasil, namun model tidak mengembalikan respon teks.";
    } else if (provider === "openai" || provider === "groq") {
      const endpoint =
        provider === "openai"
          ? "https://api.openai.com/v1/chat/completions"
          : "https://api.groq.com/openai/v1/chat/completions";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: testPrompt }],
          temperature,
          max_tokens: 250,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg =
          data.error?.message || `HTTP ${res.status}: Gagal terhubung ke penyedia AI (${provider})`;
        return { success: false, error: errorMsg, latencyMs: Date.now() - startTime };
      }

      reply =
        data.choices?.[0]?.message?.content ||
        "Koneksi berhasil, namun model tidak mengembalikan respon teks.";
    } else {
      return { success: false, error: `Penyedia AI "${provider}" tidak didukung.` };
    }

    const latencyMs = Date.now() - startTime;
    return {
      success: true,
      reply: reply.trim(),
      latencyMs,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Kesalahan koneksi ke server AI";
    return {
      success: false,
      error: errorMsg,
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Call the configured AI for a real user chat query with store context and conversation history
 */
export async function callChatbotAI(params: {
  message: string;
  history?: Array<{ role: "user" | "assistant" | "model"; content: string }>;
  userId?: string | null;
}): Promise<string> {
  const config = await getChatbotAIConfig();

  if (!config.enabled || !config.apiKey) {
    throw new Error("Chatbot AI belum diaktifkan atau API Key belum diisi di dashboard admin.");
  }

  const storeContext = await buildStoreContextForAI(params.userId);
  const fullSystemPrompt = `${config.systemPrompt}\n\n${storeContext}`;

  const { provider, apiKey, model, temperature } = config;
  const { message, history = [] } = params;

  if (provider === "gemini") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

    // Format Gemini contents: { role: 'user' | 'model', parts: [{ text: ... }] }
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Take last 8 history messages for context
    const recentHistory = history.slice(-8);
    for (const h of recentHistory) {
      contents.push({
        role: h.role === "assistant" || h.role === "model" ? "model" : "user",
        parts: [{ text: h.content }],
      });
    }

    // Append current user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: fullSystemPrompt }],
      },
      generationConfig: {
        temperature,
        maxOutputTokens: 1000,
      },
    };

    let res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Fallback if systemInstruction is rejected on older model variants
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (errData?.error?.message?.toLowerCase().includes("systeminstruction")) {
        const fallbackPayload = {
          contents: [
            {
              role: "user",
              parts: [{ text: `[INSTRUKSI SISTEM]\n${fullSystemPrompt}\n[AKHIR INSTRUKSI]` }],
            },
            {
              role: "model",
              parts: [{ text: "Dimengerti. Saya siap bertindak sebagai Oji, asisten warung Ojolali." }],
            },
            ...contents,
          ],
          generationConfig: {
            temperature,
            maxOutputTokens: 1000,
          },
        };

        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fallbackPayload),
        });
      } else {
        throw new Error(errData?.error?.message || `Google Gemini API error (HTTP ${res.status})`);
      }
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || `Google Gemini API error (HTTP ${res.status})`);
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      throw new Error("Model Gemini tidak menghasilkan teks jawaban.");
    }

    return reply.trim();
  } else if (provider === "openai" || provider === "groq") {
    const endpoint =
      provider === "openai"
        ? "https://api.openai.com/v1/chat/completions"
        : "https://api.groq.com/openai/v1/chat/completions";

    const messages = [
      { role: "system", content: fullSystemPrompt },
      ...history.slice(-8).map((h) => ({
        role: h.role === "assistant" || h.role === "model" ? "assistant" : "user",
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: 1000,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || `AI API error (HTTP ${res.status})`);
    }

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      throw new Error("Model AI tidak menghasilkan respon.");
    }

    return reply.trim();
  }

  throw new Error(`Penyedia AI "${provider}" tidak didukung.`);
}

