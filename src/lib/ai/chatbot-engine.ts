import { prisma } from "../prisma";
import { formatRupiah } from "../utils";

// Helper function to normalize text
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("62")) {
    const rest = digits.slice(2);
    return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
  }
  if (digits.startsWith("0")) {
    const rest = digits.slice(1);
    return `0${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
  }
  return phone;
}

export interface StoreSalesMetrics {
  todayStr: string;
  todayOmzet: number;
  todayOrdersCount: number;
  todayCompletedCount: number;

  weekOmzet: number;
  weekOrdersCount: number;
  weekCompletedCount: number;
  weekAvg: number;

  monthOmzet: number;
  monthOrdersCount: number;
  monthCompletedCount: number;
  monthAvg: number;

  allTimeOmzet: number;
  allTimeOrdersCount: number;
  allTimeCompletedCount: number;

  processingCount: number;
}

/**
 * Real-time calculation that mirrors the exact KPI numbers on Admin Dashboard
 */
export async function getStoreSalesMetrics(): Promise<StoreSalesMetrics> {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const localYear = now.getFullYear();
  const localMonth = String(now.getMonth() + 1).padStart(2, "0");
  const localDay = String(now.getDate()).padStart(2, "0");
  const localTodayStr = `${localYear}-${localMonth}-${localDay}`;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const allOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Today's orders (matches exactly how dashboard filters: startsWith(todayStr) or local date)
  const todayOrders = allOrders.filter((o) => {
    const isoDate = o.createdAt.toISOString().split("T")[0];
    return isoDate === todayStr || isoDate === localTodayStr;
  });
  const todayCompleted = todayOrders.filter((o) => o.status === "COMPLETED");
  const todayOmzet = todayCompleted.reduce((sum, o) => sum + o.total, 0);

  // Week orders (7 days - matches period=week on /api/admin/reports and Dashboard KPI Card 2)
  const weekOrders = allOrders.filter((o) => o.createdAt >= sevenDaysAgo);
  const weekCompleted = weekOrders.filter((o) => o.status === "COMPLETED");
  const weekOmzet = weekCompleted.reduce((sum, o) => sum + o.total, 0);
  const weekAvg = weekCompleted.length > 0 ? Math.round(weekOmzet / weekCompleted.length) : 0;

  // Month orders (30 days - matches period=month)
  const monthOrders = allOrders.filter((o) => o.createdAt >= thirtyDaysAgo);
  const monthCompleted = monthOrders.filter((o) => o.status === "COMPLETED");
  const monthOmzet = monthCompleted.reduce((sum, o) => sum + o.total, 0);
  const monthAvg = monthCompleted.length > 0 ? Math.round(monthOmzet / monthCompleted.length) : 0;

  // All-time totals
  const allTimeCompleted = allOrders.filter((o) => o.status === "COMPLETED");
  const allTimeOmzet = allTimeCompleted.reduce((sum, o) => sum + o.total, 0);

  // Processing/Pending queue (Dashboard KPI Card 3)
  const queueOrders = allOrders.filter((o) => o.status === "PROCESSING" || o.status === "PENDING");

  return {
    todayStr,
    todayOmzet,
    todayOrdersCount: todayOrders.length,
    todayCompletedCount: todayCompleted.length,

    weekOmzet,
    weekOrdersCount: weekOrders.length,
    weekCompletedCount: weekCompleted.length,
    weekAvg,

    monthOmzet,
    monthOrdersCount: monthOrders.length,
    monthCompletedCount: monthCompleted.length,
    monthAvg,

    allTimeOmzet,
    allTimeOrdersCount: allOrders.length,
    allTimeCompletedCount: allTimeCompleted.length,

    processingCount: queueOrders.length,
  };
}

export async function processChatbotQuery(
  rawMessage: string,
  userId?: string | null,
  history?: Array<{ role: string; content: string }>
): Promise<string> {
  const query = rawMessage.trim();
  const lower = normalize(query);

  // Ambil konteks pesan terakhir dari riwayat percakapan (conversation context)
  const lastAssistantMsg =
    history
      ?.slice()
      .reverse()
      .find((m) => m.role === "assistant" || m.role === "model")?.content || "";
  const lastUserMsg =
    history
      ?.slice()
      .reverse()
      .find((m) => m.role === "user")?.content || "";

  if (!query) {
    return "Silakan masukkan pertanyaan seputar menu, harga, pesanan, atau informasi warung Ojolali.";
  }

  // 1. Cek Order Number spesifik (misal: ORD-20261008-001)
  const orderNumberMatch = query.match(/ORD-[\w-]+/i);
  if (orderNumberMatch) {
    const orderNumber = orderNumberMatch[0].toUpperCase();
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return `Pesanan dengan nomor **${orderNumber}** tidak ditemukan dalam database sistem.`;
    }

    const itemsStr = order.items
      .map((item) => `• ${item.product.name} x${item.quantity} (${formatRupiah(item.subtotal)})`)
      .join("\n");

    const dateStr = order.createdAt.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return `Informasi Pesanan **#${order.orderNumber}**:
• Pelanggan: ${order.customerName}
• Status Pesanan: ${order.status}
• Status Pembayaran: ${order.paymentStatus} (${order.paymentMethod})
• Total: ${formatRupiah(order.total)}
• Waktu: ${dateStr}
• Rincian Item:
${itemsStr}${order.notes ? `\n• Catatan: ${order.notes}` : ""}`;
  }

  // Ambil data database secara real-time
  const [products, categories, settings, totalOrdersCount] = await Promise.all([
    prisma.product.findMany({
      include: { category: true },
      orderBy: [{ categoryId: "asc" }, { price: "asc" }],
    }),
    prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.setting.findMany(),
    prisma.order.count(),
  ]);

  const settingsMap: Record<string, string> = {};
  for (const s of settings) {
    settingsMap[s.key] = s.value;
  }

  const rawPhone = settingsMap["whatsapp_admin_number"] || "6289682519919";
  const formattedPhone = formatPhone(rawPhone);

  // 1b. Pertanyaan Pesanan Pelanggan Tertentu (Berdasarkan Nama Pelanggan atau Nomor HP)
  // Contoh: "Agus Salim apa yang di pesann", "Agus Salim pesan apa", "pesanan Agus Salim", "apa yang dipesan Budi Santoso", "089429338889 pesan apa"
  const phoneDigitsMatch = lower.match(/(?:\+?62|08)\d{8,12}/);
  let targetOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string | null;
    total: number;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    notes: string | null;
    createdAt: Date;
    items: Array<{
      quantity: number;
      subtotal: number;
      product: { name: string; price: number };
    }>;
  }> = [];
  let targetCustomerLabel = "";

  if (phoneDigitsMatch) {
    const rawDigits = phoneDigitsMatch[0];
    targetOrders = await prisma.order.findMany({
      where: {
        OR: [
          { customerPhone: { contains: rawDigits } },
          { customerPhone: { contains: rawDigits.replace(/^0/, "62") } },
          { customerPhone: { contains: rawDigits.replace(/^\+?62/, "0") } },
        ],
      },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (targetOrders.length > 0) {
      targetCustomerLabel = targetOrders[0].customerName;
    }
  }

  if (targetOrders.length === 0) {
    const customersInDb = await prisma.order.findMany({
      select: { customerName: true },
      distinct: ["customerName"],
    });

    for (const c of customersInDb) {
      const originalName = c.customerName;
      const cleanName = originalName.replace(/\(.*?\)/g, "").trim();
      const normClean = normalize(cleanName);

      const matchesFullName = lower.includes(normClean);
      const hasOrderKeywords = /(pesan|pesann|order|beli|dibeli|dipesan|transaksi|ambil|apa)/i.test(lower);
      const nameParts = normClean.split(" ").filter((p) => p.length >= 4);
      const matchesAnyPart = hasOrderKeywords && nameParts.some((part) => new RegExp(`\\b${part}\\b`, "i").test(lower));

      if (matchesFullName || matchesAnyPart) {
        targetOrders = await prisma.order.findMany({
          where: {
            customerName: { contains: cleanName },
          },
          include: {
            items: {
              include: { product: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        if (targetOrders.length > 0) {
          targetCustomerLabel = originalName;
          break;
        }
      }
    }
  }

  if (targetOrders.length > 0) {
    const formatOrderCard = (o: (typeof targetOrders)[0]) => {
      const itemsFormatted = o.items
        .map((i) => `  • **${i.product.name}** (${i.quantity}x) — ${formatRupiah(i.subtotal)}`)
        .join("\n");
      const dateFormatted = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(o.createdAt);

      return `📦 **Pesanan #${o.orderNumber}** (${dateFormatted}):
• **Status Pesanan**: **${o.status}**
• **Status Pembayaran**: **${o.paymentStatus}** (${o.paymentMethod})
• **Total Biaya**: **${formatRupiah(o.total)}**
• **Menu yang Dipesan**:
${itemsFormatted}${o.notes ? `\n• **Catatan**: ${o.notes}` : ""}`;
    };

    const ordersList = targetOrders.map(formatOrderCard).join("\n\n---\n\n");
    return `📋 Rincian Pesanan untuk Pelanggan **${targetCustomerLabel}**:\n\n${ordersList}\n\n📊 *Data ini 100% sinkron dengan halaman Semua Pesanan di Dashboard.*`;
  }

  // 2. Pertanyaan Identitas Asisten
  if (
    /^(siapa\s+(kamu|anda|dirimu|namamu)|kamu\s+siapa|anda\s+siapa|namamu\s+siapa|nama\s+kamu|perkenalkan\s+diri|apa\s+namamu|bot\s+apa\s+ini)$/i.test(lower) ||
    lower === "siapa kamu" ||
    lower === "kamu siapa"
  ) {
    return "Saya **Oji**, asisten virtual cerdas resmi dari **Baso & Mie Ayam Ojolali** 🍜\n\nSaya siap membantu Anda mengetahui seluruh menu, harga, ketersediaan stok, laporan penjualan hari ini, jumlah pelanggan, dan panduan pemesanan.";
  }

  // 2b. Pertanyaan Identitas Pengguna ("siapa saya", "siapa aku", "profil saya", "akun saya", "nama saya")
  if (
    /(siapa\s+(saya|aku)|saya\s+siapa|aku\s+siapa|nama\s+(saya|ku|aku)|profil\s+saya|akun\s+saya|data\s+saya|tentang\s+saya)/i.test(lower)
  ) {
    if (userId) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: { orders: true },
          },
        },
      });

      if (currentUser) {
        const roleLabel =
          currentUser.role === "ADMIN"
            ? "Administrator Sistem"
            : currentUser.role === "CASHIER"
            ? "Kasir Warung"
            : "Pelanggan Setia";

        return `Halo Kak **${currentUser.name}**! 👋

Data Profil Akun Anda di Baso & Mie Ayam Ojolali:
• **Nama**: ${currentUser.name}
• **Peran (Role)**: ${roleLabel}
• **Kontak**: ${currentUser.phone || currentUser.email || "-"}
• **Total Pesanan Anda**: ${currentUser._count.orders} pesanan tercatat di akun ini

Ada menu favorit yang ingin Anda pesan hari ini?`;
      }
    }

    return `Anda saat ini mengakses sebagai **Tamu / Pengunjung** di warung Baso & Mie Ayam Ojolali.

Untuk melihat data profil lengkap dan riwayat pesanan Anda, silakan masuk ke akun Anda melalui menu **Masuk** di navigasi atas.`;
  }

  // 2c. Pertanyaan Pemilik Warung / Owner
  if (
    /(pemilik|owner|yang\s+punya|pendiri|siapa\s+yang\s+punya\s+warung|bos\s+warung|juragan)/i.test(lower)
  ) {
    return "Warung **Baso di Lingkungan Kecamatan & Mie Ayam Ojolali** adalah UMKM kuliner legendaris yang dikelola langsung oleh keluarga **Ojolali** dengan resep kuah kaldu sapi asli turun-temurun sejak lama.";
  }

  // 3. Salam / Greeting murni
  if (/^(halo|hai|hey|hei|assalamu['a]?laikum|pagi|selamat\s+(pagi|siang|sore|malam))$/i.test(lower)) {
    return "Halo! Selamat datang di Baso & Mie Ayam Ojolali 🍜 Ada yang bisa Oji bantu terkait menu, harga, penjualan hari ini, atau informasi warung?";
  }

  // 3b. Pertanyaan Kabar / Kemampuan Asisten ("apa kabar", "kamu bisa apa", "bantu apa")
  if (/(apa\s+kabar|kabar|bisa\s+apa|fitur\s+apa|bantu\s+apa|bisa\s+bantu\s+apa|panduan)/i.test(lower)) {
    return `Kabar baik! Saya **Oji**, asisten AI resmi Baso & Mie Ayam Ojolali 🍜

Saya dapat membantu Anda mengecek:
• 📋 **Daftar Menu & Harga** (Ketik: *"daftar menu"* atau *"menu terlaris"*)
• 💰 **Rekomendasi Budget** (Ketik: *"budget 20 ribu"*)
• 📊 **Laporan Penjualan** (Ketik: *"berapa penjualan hari ini"*)
• 👥 **Data Pelanggan** (Ketik: *"berapa jumlah pelanggan"*)
• 👤 **Profil Akun** (Ketik: *"siapa saya"*)
• 📦 **Cek Status Pesanan** (Ketik nomor pesanan, contoh: *ORD-20261008-001*)
• 📍 **Jam Buka & Alamat** (Ketik: *"jam buka"* atau *"alamat"*).`;
  }

  // 3c. Terima kasih & apresiasi
  if (
    /(terima\s*kasih|makasih|tengkyu|thanks|thank\s+you|matur\s+nuwun|keren|mantap|enak\s+banget)/i.test(lower)
  ) {
    return "Sama-sama! Senang bisa melayani Anda 😊 Selamat menikmati semangkuk baso sapi atau mie ayam hangat di Baso & Mie Ayam Ojolali! 🍜";
  }

  // 4. Pertanyaan Jam Buka / Operasional (termasuk pertanyaan hari tertentu seperti hari minggu)
  if (
    /(jam\s+(buka|tutup|operasional)|buka\s+jam\s+berapa|kapan\s+buka|kapan\s+tutup|hari\s+apa\s+(saja\s+)?buka|jadwal\s+buka|buka\s+(hari\s+)?(senin|selasa|rabu|kamis|jumat|sabtu|minggu|weekend)|libur)/i.test(lower)
  ) {
    return "Warung Baso & Mie Ayam Ojolali buka setiap hari (termasuk hari Minggu dan hari libur) pukul 10:00 - 21:00 WIB.";
  }

  // 5. Pertanyaan Lokasi / Alamat
  if (
    /(lokasi|alamat|dimana\s+(lokasi|warung|alamat)|di\s+mana\s+(lokasi|warung|alamat)|tempat\s+warung|posisi\s+warung)/i.test(lower)
  ) {
    return "Alamat warung: Jl. Raya Lingkungan Kecamatan No. 45 (Dekat Kantor Camat).";
  }

  // 6. Pertanyaan Kontak / Nomor Telepon / WA
  if (
    /(nomor\s+(telepon|telp|hp|wa|whatsapp)|kontak|hubungi|no\s+wa|customer\s+service)/i.test(lower)
  ) {
    return `Kontak WhatsApp resmi warung Ojolali: ${formattedPhone} (WhatsApp Pemesanan & Bantuan).`;
  }

  // 7. Pertanyaan Metode Pembayaran
  if (
    /(metode\s+pembayaran|cara\s+bayar|bisa\s+bayar\s+pakai|bayar\s+pake\s+apa|bisa\s+qris|bisa\s+transfer|bisa\s+cash|bisa\s+tunai|pembayaran\s+apa\s+saja|info\s+pembayaran)/i.test(lower)
  ) {
    return "Metode pembayaran yang diterima di Baso & Mie Ayam Ojolali: Tunai (Cash), Transfer Bank, dan QRIS.";
  }

  // 8. Pertanyaan Dine In / Take Away
  if (
    /(dine\s*in|take\s*away|makan\s+di\s+tempat|bawa\s+pulang|dibungkus|bungkus)/i.test(lower)
  ) {
    return "Warung Baso & Mie Ayam Ojolali melayani makan di tempat (Dine In) dan bungkus bawa pulang (Take Away).";
  }

  // 9. Pertanyaan Halal / Bahan
  if (
    /(halal|daging\s+apa|daging\s+sapi|bahan\s+dasar|sapi\s+asli)/i.test(lower)
  ) {
    return "Semua menu di Baso & Mie Ayam Ojolali 100% halal dan dibuat menggunakan daging sapi asli pilihan dengan kuah kaldu rempah alami.";
  }

  // 10. Pertanyaan Cara Pesan
  if (
    /(cara\s+(pesan|order|beli|checkout|pemesanan)|gimana\s+cara\s+(pesan|order|beli)|bagaimana\s+cara\s+(pesan|order|beli))/i.test(lower)
  ) {
    return `Cara melakukan pemesanan di website Ojolali:
1. Buka halaman Menu Makanan.
2. Pilih menu yang diinginkan dan klik "+ Keranjang".
3. Buka halaman Keranjang.
4. Periksa pesanan, isi nama dan nomor kontak.
5. Pilih metode pembayaran (Tunai, Transfer Bank, atau QRIS).
6. Klik "Konfirmasi Pesanan" untuk mendapatkan nomor pesanan resmi.`;
  }

  // 11. Pertanyaan Menu / Produk Terlaris / Best Seller / Favorit
  if (
    /(terlaris|paling\s+laris|paling\s+laku|best\s*seller|bestseller|favorit|terfavorit|diminati|paling\s+banyak\s+(di|)(beli|pesan|order)|produk\s+terlaris|menu\s+terlaris|makanan\s+terlaris|minuman\s+terlaris|unggulan)/i.test(lower)
  ) {
    const popularItems = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    if (popularItems.length > 0) {
      const list = popularItems
        .map((item, idx) => {
          const prod = productMap.get(item.productId);
          const name = prod?.name || "Produk";
          const price = prod ? formatRupiah(prod.price) : "";
          const qty = item._sum.quantity || 0;
          return `${idx + 1}. **${name}** (${price}) — **${qty} porsi terjual** 🔥`;
        })
        .join("\n");

      return `Daftar Produk & Menu Terlaris di Baso & Mie Ayam Ojolali:\n${list}\n\nSemua menu diolah menggunakan daging sapi pilihan berkualitas dan bumbu rempah asli!`;
    }

    const defaultTop = products.slice(0, 4);
    const list = defaultTop
      .map((p, idx) => `${idx + 1}. **${p.name}** (${formatRupiah(p.price)}) — Pilihan Favorit ⭐`)
      .join("\n");
    return `Produk & Menu Unggulan Terfavorit di Ojolali:\n${list}`;
  }

  // 12. Pertanyaan Rekomendasi Menu / Makanan / Saran
  if (
    /(rekomendasi|rekomendasikan|saran\s+menu|sarankan|menu\s+favorit|makan\s+apa\s+ya|mau\s+makan)/i.test(lower) &&
    !/(budget|uang|dana)/i.test(lower)
  ) {
    const popularItems = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 4,
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    let recList = "";
    if (popularItems.length > 0) {
      recList = popularItems
        .map((item, idx) => {
          const prod = productMap.get(item.productId);
          return `${idx + 1}. **${prod?.name}** (${formatRupiah(prod?.price || 0)})`;
        })
        .join("\n");
    } else {
      recList = products
        .slice(0, 4)
        .map((p, idx) => `${idx + 1}. **${p.name}** (${formatRupiah(p.price)})`)
        .join("\n");
    }

    return `Rekomendasi menu berdasarkan data penjualan terlaris:\n${recList}`;
  }

  // 12b. Pertanyaan Jumlah Pelanggan / Customer
  const isCustomerCountQuery =
    /(pelanggan|customer|user|pengguna|member|pembeli)/i.test(lower) &&
    /(berapa|jumlah|total|banyak|data|ada\s+berapa|hitung|statistik|semua)/i.test(lower) &&
    !/(siapa|nama)/i.test(lower);

  if (isCustomerCountQuery) {
    const [customerCount, totalUsers, totalOrders, uniqueOrderCustomers] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.groupBy({
        by: ["customerName"],
        _count: { id: true },
      }),
    ]);

    return `Data Pelanggan Baso & Mie Ayam Ojolali saat ini:
• **Pelanggan Terdaftar**: ${customerCount} orang
• **Total Akun Pengguna**: ${totalUsers} orang (termasuk pelanggan, kasir, & admin)
• **Pelanggan yang Pernah Memesan**: ${uniqueOrderCustomers.length} orang
• **Total Transaksi Pesanan**: ${totalOrders} pesanan tercatat di sistem`;
  }

  // 12c. Pertanyaan Siapa Saja yang Memesan / Daftar Pemesan / Customer Orders
  // Mendukung pertanyaan mandiri maupun follow-up percakapan (contoh: "siapa saja", "siapa aja", "siapa saja mereka", "detailnya", "rinciannya")
  const isContextOrderFollowUp =
    /(pesanan|order|transaksi)/i.test(lastAssistantMsg) || /(pesanan|order|transaksi)/i.test(lastUserMsg);

  const isShortFollowUp =
    /^(siapa(\s+saja|\s+aja|\s+mereka|\s+orangnya)?|siapa\s+saja|siapa\s+aja|detail(nya)?|rincian(nya)?|rincikan|jelaskan|apa\s+saja(\s+pesanannya)?|siapa\s+pemesannya)$/i.test(
      lower.trim()
    );

  const isWhoOrderedQuery =
    isShortFollowUp ||
    (isContextOrderFollowUp && /(siapa|detail|rincian|apa\s+saja)/i.test(lower)) ||
    /(siapa(\s+saja)?\s+(yang\s+)?(memesan|pesan|order|beli)|daftar\s+(pemesan|pembeli|yang\s+(memesan|pesan|order|beli))|nama(\s+nama)?\s+(pemesan|pembeli)|siapa\s+(saja\s+)?(pemesan|pembeli)|pelanggan\s+yang\s+(memesan|pesan|order|beli)|customer\s+yang\s+(memesan|pesan|order|beli)|siapa\s+saja|siapa\s+aja)/i.test(
      lower
    );

  if (isWhoOrderedQuery) {
    const isToday = /(hari\s*ini|today|sekarang)/i.test(lower);
    const isWeek = /(minggu|pekan|7\s*hari|seminggu)/i.test(lower);

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const localYear = now.getFullYear();
    const localMonth = String(now.getMonth() + 1).padStart(2, "0");
    const localDay = String(now.getDate()).padStart(2, "0");
    const localTodayStr = `${localYear}-${localMonth}-${localDay}`;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    if (orders.length === 0) {
      return "Belum ada pesanan yang tercatat dalam sistem warung Baso & Mie Ayam Ojolali.";
    }

    const formatOrderLine = (o: (typeof orders)[0], idx: number) => {
      const itemsList = o.items
        .map((i) => `   • **${i.product.name}** (${i.quantity}x) — ${formatRupiah(i.subtotal)}`)
        .join("\n");
      const dateFormatted = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(o.createdAt);

      const statusDesc =
        o.status === "COMPLETED"
          ? "COMPLETED (Selesai Lunas)"
          : o.status === "PROCESSING"
          ? "PROCESSING (Sedang Dimasak)"
          : o.status === "READY"
          ? "READY (Siap Diambil/Diantar)"
          : o.status === "CANCELLED"
          ? "CANCELLED (Dibatalkan)"
          : "PENDING (Menunggu Konfirmasi Dapur)";

      return `${idx + 1}. **${o.customerName}**
   📦 **#${o.orderNumber}** | 🕒 ${dateFormatted}
   • **Status**: **${statusDesc}**
   • **Pembayaran**: ${o.paymentStatus === "PAID" ? "Lunas" : "Belum Lunas"} (${o.paymentMethod})
   • **Total Tagihan**: **${formatRupiah(o.total)}**
   • **Menu yang Dipesan**:
${itemsList}${o.notes ? `\n   • **Catatan**: "${o.notes}"` : ""}`;
    };

    // Cek apakah ada spesifik menu yang ditanyakan (contoh: "siapa yang pesan mie ayam", "siapa yang beli es jeruk")
    const targetFoodMatch = lower.match(/(?:pesan|beli|order|memesan)\s+([^?.,!]+)/i);
    const targetFood = targetFoodMatch ? targetFoodMatch[1].trim() : "";
    const mentionedProduct = products.find((p) => {
      const pNorm = normalize(p.name);
      return lower.includes(pNorm) || (targetFood.length >= 3 && pNorm.includes(targetFood));
    });

    if (mentionedProduct) {
      const ordersWithProduct = orders.filter((o) =>
        o.items.some((i) => i.productId === mentionedProduct.id)
      );
      if (ordersWithProduct.length > 0) {
        const listProd = ordersWithProduct.slice(0, 5).map((o, idx) => formatOrderLine(o, idx)).join("\n\n");
        return `Daftar Pelanggan yang Memesan **${mentionedProduct.name}**:\n\n${listProd}`;
      } else {
        return `Belum ada pesanan terbaru untuk menu **${mentionedProduct.name}**.`;
      }
    }

    if (isToday) {
      const todayOrders = orders.filter((o) => {
        const iso = o.createdAt.toISOString().split("T")[0];
        return iso === todayStr || iso === localTodayStr;
      });

      if (todayOrders.length === 0) {
        return `Belum ada pelanggan yang memesan untuk **hari ini**. Total pesanan hari ini masih 0.`;
      }

      const listToday = todayOrders.map((o, idx) => formatOrderLine(o, idx)).join("\n\n");
      const totalOmzetToday = todayOrders
        .filter((o) => o.status === "COMPLETED")
        .reduce((sum, o) => sum + o.total, 0);

      return `Daftar Pelanggan yang Memesan **Hari Ini** (${todayOrders.length} Pesanan, Omzet Lunas: ${formatRupiah(totalOmzetToday)}):\n\n${listToday}\n\n📊 *Data ini 100% sinkron dengan kartu "Penjualan Hari Ini" di Dashboard Admin.*`;
    }

    if (isWeek) {
      const weekOrders = orders.filter((o) => o.createdAt >= sevenDaysAgo);
      if (weekOrders.length === 0) {
        return "Belum ada pelanggan yang memesan pada minggu ini (7 hari terakhir).";
      }

      const listWeek = weekOrders.map((o, idx) => formatOrderLine(o, idx)).join("\n\n");
      const totalOmzetWeek = weekOrders
        .filter((o) => o.status === "COMPLETED")
        .reduce((sum, o) => sum + o.total, 0);

      return `Daftar Pelanggan yang Memesan **Minggu Ini (7 Hari Terakhir)** (${weekOrders.length} Pesanan, Total Omzet Lunas: ${formatRupiah(totalOmzetWeek)}):\n\n${listWeek}\n\n📊 *Data ini 100% sinkron dengan Laporan Penjualan Ojolali.*`;
    }

    // Default (termasuk kueri "siapa saja", "siapa aja", "daftar pemesan"):
    // Tampilkan seluruh pesanan aktif periode ini (7 hari terakhir atau pesanan terbaru)
    const recentActiveOrders = orders.filter((o) => o.createdAt >= sevenDaysAgo);
    const displayOrders = recentActiveOrders.length > 0 ? recentActiveOrders : orders.slice(0, 5);
    const listRecent = displayOrders.map((o, idx) => formatOrderLine(o, idx)).join("\n\n");

    const totalOmzetActive = displayOrders
      .filter((o) => o.status === "COMPLETED")
      .reduce((sum, o) => sum + o.total, 0);

    const pendingCount = displayOrders.filter((o) => o.status !== "COMPLETED").length;
    const completedCount = displayOrders.filter((o) => o.status === "COMPLETED").length;

    return `Rincian Lengkap Pelanggan yang Memesan (${displayOrders.length} Pesanan Terdaftar):

${listRecent}

📊 *Ringkasan Transaksi: ${completedCount} Pesanan Selesai Lunas (${formatRupiah(totalOmzetActive)})${
      pendingCount > 0 ? `, ${pendingCount} Pesanan Dalam Antrean Dapur` : ""
    }. Data 100% sinkron dengan Dashboard Admin.*`;
  }

  // 12d. Permintaan Jawaban Lebih Detail / Rangkuman Lengkap Toko
  if (
    /(jawab(\s+lebih)?\s+detail|lebih\s+detail|penjelasan\s+detail|rincian\s+lengkap|info\s+lengkap|jelaskan\s+(lebih\s+)?(detail|rinci))/i.test(
      lower
    )
  ) {
    const metrics = await getStoreSalesMetrics();
    const recentOrders = await prisma.order.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    });

    const ordersSummary = recentOrders
      .map((o, idx) => {
        const items = o.items.map((i) => `${i.product.name} (${i.quantity}x)`).join(", ");
        return `${idx + 1}. **${o.customerName}** (#${o.orderNumber}) — ${formatRupiah(o.total)} [Status: **${o.status}**]\n   Menu: ${items}`;
      })
      .join("\n\n");

    const topMenuList = products
      .slice(0, 4)
      .map((p, idx) => `${idx + 1}. **${p.name}** (${p.category.name}) — ${formatRupiah(p.price)} [${p.available ? "Ready" : "Habis"}]`)
      .join("\n");

    return `Rangkuman Informasi Lengkap & Detail Warung Baso & Mie Ayam Ojolali:

📊 **1. Performa Penjualan & Transaksi (Sinkron Dashboard Admin)**:
• **Penjualan Hari Ini**: ${formatRupiah(metrics.todayOmzet)} (${metrics.todayCompletedCount} pesanan selesai lunas)
• **Jumlah Pesanan Minggu Ini**: ${metrics.weekOrdersCount} Pesanan (${metrics.weekCompletedCount} lunas, ${metrics.processingCount} antrean dapur)
• **Total Omzet Minggu Ini**: ${formatRupiah(metrics.weekOmzet)} (Rata-rata: ${formatRupiah(metrics.weekAvg)} per transaksi)
• **Akumulasi Seluruh Omzet (All-Time)**: ${formatRupiah(metrics.allTimeOmzet)} (${metrics.allTimeCompletedCount} selesai dari ${metrics.allTimeOrdersCount} transaksi)

📦 **2. Transaksi Pemesan Terbaru**:
${ordersSummary}

🔥 **3. Menu Unggulan & Harga**:
${topMenuList}

👥 **4. Data Pelanggan**:
• ${totalOrdersCount} transaksi tercatat di database sistem
• Layanan: Makan di tempat (Dine In) & Bungkus bawa pulang (Take Away)

Silakan tanyakan bagian mana yang ingin Anda ketahui lebih lanjut!`;
  }

  // 13. Pertanyaan Penjualan, Omzet, Transaksi, Jumlah Pesanan (Hari Ini, Minggu Ini, Bulan Ini, Antrean, Statistik)
  const isTransactionOrSalesQuery =
    !isWhoOrderedQuery &&
    (/(transaksi|penjualan|omzet|omset|pendapatan|laporan|pesanan|antrian|antrean|diproses|order)/i.test(lower) ||
      (/(berapa|total|jumlah|cek)/i.test(lower) && /(minggu|hari|bulan|sekarang|lunas|antri)/i.test(lower)));

  if (isTransactionOrSalesQuery) {
    const metrics = await getStoreSalesMetrics();

    const isWeekQuery = /(minggu|pekan|7\s*hari|seminggu)/i.test(lower);
    const isMonthQuery = /(bulan|30\s*hari|sebulan)/i.test(lower);
    const isTodayQuery = /(hari\s*ini|today|sekarang)/i.test(lower);
    const isQueueQuery = /(antrian|antrean|diproses|pending|menunggu)/i.test(lower);
    const isAverageQuery = /(rata\s*rata|average|rataan)/i.test(lower);

    // Kasus 0: Pertanyaan Khusus JUMLAH PESANAN (Hanya berikan angka jumlah spesifik sesuai kartu Dashboard Admin)
    const isOrderCountSpecific =
      /(jumlah\s+(pesanan|order|transaksi)|berapa\s+(jumlah\s+)?(pesanan|order|transaksi)|total\s+(pesanan|order|transaksi)|banyak(nya)?\s+pesanan)/i.test(
        lower
      ) && !/(omzet|omset|pendapatan|uang|laporan|rata|daftar|siapa)/i.test(lower);

    if (isOrderCountSpecific) {
      if (isTodayQuery) {
        return `Jumlah pesanan hari ini: **${metrics.todayOrdersCount} Pesanan** (${metrics.todayCompletedCount} selesai lunas, ${Math.max(0, metrics.todayOrdersCount - metrics.todayCompletedCount)} dalam antrean).
• **Total Penjualan Hari Ini**: ${formatRupiah(metrics.todayOmzet)}

💡 *Ketik **"siapa saja"** untuk melihat rincian pemesan hari ini.*`;
      }
      if (isMonthQuery) {
        return `Jumlah pesanan bulan ini (30 hari terakhir): **${metrics.monthOrdersCount} Pesanan** (${metrics.monthCompletedCount} transaksi lunas).
• **Total Omzet Bulan Ini**: ${formatRupiah(metrics.monthOmzet)}
• **Rata-Rata Transaksi**: ${formatRupiah(metrics.monthAvg)}`;
      }
      if (isQueueQuery) {
        return `Jumlah pesanan antrian saat ini: **${metrics.processingCount} Antrian** (perlu ditindaklanjuti di alur dapur).`;
      }
      if (isWeekQuery) {
        return `Jumlah pesanan minggu ini (7 hari terakhir): **${metrics.weekOrdersCount} Pesanan** (${metrics.weekCompletedCount} lunas, ${metrics.processingCount} antrean).
• **Total Omzet**: ${formatRupiah(metrics.weekOmzet)}

💡 *Ketik **"siapa saja"** untuk melihat rincian lengkap nama pemesan dan menu yang dibeli.*`;
      }
      // Default untuk "jumlah pesanan" / "berapa jumlah pesanan":
      return `Jumlah pesanan saat ini: **${metrics.weekOrdersCount} Pesanan** (sinkron dengan kartu *Jumlah Pesanan* di Dashboard Admin).

Rincian Status:
• **Pesanan Selesai Lunas**: ${metrics.weekCompletedCount} pesanan
• **Pesanan Antrean / Menunggu**: ${metrics.processingCount} antrian
• **Total Omzet**: ${formatRupiah(metrics.weekOmzet)}

💡 *Ketik **"siapa saja"** untuk melihat rincian lengkap nama pemesan dan menu yang dibeli.*`;
    }

    // Kasus 0b: Pertanyaan Khusus PENJUALAN HARI INI (Spesifik nilai nominal penjualan sesuai kartu Dashboard Admin)
    const isSalesOnlyQuery =
      /(penjualan\s+hari\s+ini|berapa\s+penjualan\s+hari\s+ini|omzet\s+hari\s+ini|omset\s+hari\s+ini|pendapatan\s+hari\s+ini)/i.test(lower) &&
      !/(laporan|semua|ringkasan|grafik|minggu|bulan)/i.test(lower);

    if (isSalesOnlyQuery) {
      return `Penjualan hari ini: **${formatRupiah(metrics.todayOmzet)}** (${metrics.todayCompletedCount} transaksi lunas).`;
    }

    // Kasus 1: Pertanyaan Antrean / Pesanan Sedang Diproses
    if (isQueueQuery && !isTodayQuery && !isWeekQuery && !isMonthQuery) {
      return `Pesanan antrian saat ini: **${metrics.processingCount} Antrian** (sinkron dengan kartu *Pesanan Antrean* di Dashboard Admin).`;
    }

    // Kasus 2: Pertanyaan MINGGU INI (7 Hari Terakhir - Sesuai Periode Dashboard Admin & Laporan Penjualan)
    if (isWeekQuery) {
      return `Laporan Transaksi & Penjualan Minggu Ini (7 Hari Terakhir):
• **Total Transaksi**: **${metrics.weekOrdersCount} Pesanan** (${metrics.weekCompletedCount} berhasil lunas)
• **Total Omzet**: **${formatRupiah(metrics.weekOmzet)}** (Pesanan yang telah lunas)
• **Rata-Rata Transaksi**: **${formatRupiah(metrics.weekAvg)}** per pesanan
• **Antrean Saat Ini**: ${metrics.processingCount} antrian

📊 *Data ini 100% sinkron dengan halaman Laporan Penjualan Ojolali & Dashboard Admin.*`;
    }

    // Kasus 3: Pertanyaan HARI INI
    if (isTodayQuery) {
      return `Data Penjualan & Pesanan Hari Ini:
• **Penjualan Hari Ini**: **${formatRupiah(metrics.todayOmzet)}** (Transaksi lunas)
• **Jumlah Pesanan Hari Ini**: ${metrics.todayOrdersCount} transaksi
• **Pesanan Selesai**: ${metrics.todayCompletedCount} pesanan
• **Pesanan Diproses (Antrean)**: ${metrics.processingCount} antrian

📊 *Data ini 100% sinkron dengan kartu "Penjualan Hari Ini" di Dashboard Admin.*`;
    }

    // Kasus 4: Pertanyaan BULAN INI (30 Hari Terakhir)
    if (isMonthQuery) {
      return `Data Pesanan & Penjualan Bulan Ini (30 Hari Terakhir):
• **Total Transaksi Bulan Ini**: **${metrics.monthOrdersCount} Pesanan** (${metrics.monthCompletedCount} berhasil lunas)
• **Total Omzet Bulan Ini**: **${formatRupiah(metrics.monthOmzet)}**
• **Rata-Rata Transaksi**: **${formatRupiah(metrics.monthAvg)}** per pesanan`;
    }

    // Kasus 5: Pertanyaan Rata-Rata Transaksi
    if (isAverageQuery) {
      return `Data Rata-Rata Nilai Transaksi:
• **Rata-Rata Transaksi Minggu Ini**: **${formatRupiah(metrics.weekAvg)}** per pesanan
• **Rata-Rata Transaksi Bulan Ini**: **${formatRupiah(metrics.monthAvg)}** per pesanan
• **Total Transaksi Minggu Ini**: ${metrics.weekOrdersCount} pesanan (Omzet: ${formatRupiah(metrics.weekOmzet)})`;
    }

    // Kasus 6: Ringkasan Umum / Statistik Seluruhnya
    return `Ringkasan Data Penjualan & Transaksi Ojolali (Sinkron Dashboard):

1. **Penjualan Hari Ini**: **${formatRupiah(metrics.todayOmzet)}** (${metrics.todayCompletedCount} pesanan lunas)
2. **Jumlah Pesanan Minggu Ini**: **${metrics.weekOrdersCount} Pesanan** (Total Omzet: ${formatRupiah(metrics.weekOmzet)})
3. **Rata-Rata Transaksi Minggu Ini**: **${formatRupiah(metrics.weekAvg)}**
4. **Pesanan Antrean / Diproses**: **${metrics.processingCount} Antrian**
5. **Akumulasi Seluruh Omzet (All-Time)**: **${formatRupiah(metrics.allTimeOmzet)}** (${metrics.allTimeCompletedCount} pesanan lunas dari ${metrics.allTimeOrdersCount} total transaksi)`;
  }

  // 14. Pertanyaan Budget (Misal: "budget 20 ribu", "uang 15.000", "budget 25k")
  const budgetKMatch = lower.match(/(\d+)\s*(?:rb|ribu|k)\b/i);
  const budgetFullMatch = lower.match(/(?:rp\.?|budget|dana|uang)?\s*(\d{1,3}(?:\.\d{3})+|\d{4,6})/i);
  const isBudgetContext = /(budget|uang|dana|modal|kantong|hemat)/i.test(lower);

  if ((budgetKMatch || (budgetFullMatch && isBudgetContext)) && /(budget|uang|dana|makan\s+apa|dapat\s+apa|bisa\s+beli\s+apa)/i.test(lower)) {
    let budgetAmount = 0;
    if (budgetKMatch) {
      budgetAmount = parseInt(budgetKMatch[1], 10) * 1000;
    } else if (budgetFullMatch) {
      budgetAmount = parseInt(budgetFullMatch[1].replace(/\./g, ""), 10);
    }

    if (budgetAmount > 0) {
      const affordable = products.filter((p) => p.available && p.price <= budgetAmount);
      if (affordable.length === 0) {
        const cheapest = products.filter((p) => p.available).sort((a, b) => a.price - b.price)[0];
        return `Dengan budget ${formatRupiah(budgetAmount)}, tidak ada menu yang sesuai. Menu termurah yang tersedia adalah **${cheapest?.name}** seharga ${formatRupiah(cheapest?.price || 0)}.`;
      }

      const list = affordable.map((p) => `• **${p.name}** — ${formatRupiah(p.price)}`).join("\n");
      return `Menu yang sesuai dengan budget ${formatRupiah(budgetAmount)}:\n${list}`;
    }
  }

  // 15. Pertanyaan Menu Termurah / Termahal
  if (/(paling\s+murah|termurah|harga\s+terendah)/i.test(lower)) {
    const sorted = [...products].filter((p) => p.available).sort((a, b) => a.price - b.price);
    const minPrice = sorted[0]?.price;
    const cheapestItems = sorted.filter((p) => p.price === minPrice);
    return `Menu termurah saat ini (${formatRupiah(minPrice || 0)}):
${cheapestItems.map((p) => `• **${p.name}** (${p.category.name})`).join("\n")}`;
  }

  if (/(paling\s+mahal|termahal|harga\s+tertinggi)/i.test(lower)) {
    const sorted = [...products].filter((p) => p.available).sort((a, b) => b.price - a.price);
    const maxPrice = sorted[0]?.price;
    const expensiveItems = sorted.filter((p) => p.price === maxPrice);
    return `Menu termahal saat ini (${formatRupiah(maxPrice || 0)}):
${expensiveItems.map((p) => `• **${p.name}** (${p.category.name})`).join("\n")}`;
  }

  // 16. Pertanyaan spesifik tentang produk tertentu (misal: "harga baso komplit", "apakah ada es teh manis", "mie ayam baso harganya berapa")
  // Cari apakah ada nama produk atau substring signifikan produk yang disebut
  const productMatches = products.filter((p) => {
    const pName = normalize(p.name);
    // Exact or contains product name
    if (lower.includes(pName)) return true;

    // Check specific aliases
    if (pName.includes("es teh") && lower.includes("es teh")) return true;
    if (pName.includes("es jeruk") && lower.includes("es jeruk")) return true;
    if (pName.includes("pangsit") && lower.includes("pangsit")) return true;
    if (pName.includes("mie ayam baso") && lower.includes("mie ayam baso")) return true;
    if (pName.includes("mie ayam original") && (lower.includes("mie ayam original") || lower.includes("mie ayam ori") || lower.includes("mie ayam biasa"))) return true;
    if (pName.includes("mie ayam spesial") && lower.includes("mie ayam spesial")) return true;
    if (pName.includes("baso biasa") && lower.includes("baso biasa")) return true;
    if (pName.includes("baso spesial") && lower.includes("baso spesial")) return true;
    if (pName.includes("baso komplit") && lower.includes("baso komplit")) return true;

    return false;
  });

  if (productMatches.length > 0) {
    // Jika pertanyaan tentang harga
    if (/(berapa\s+harga|harganya\s+berapa|harga|biaya|tarif|bayar)/i.test(lower)) {
      return productMatches
        .map((p) => `Harga **${p.name}** adalah **${formatRupiah(p.price)}** (Status: ${p.available ? "Tersedia" : "Habis"}).`)
        .join("\n");
    }

    // Jika pertanyaan tentang isi / komposisi / deskripsi
    if (/(isi(nya)?|komposisi|deskripsi|apa\s+saja\s+isinya|porsi|terdiri\s+dari)/i.test(lower)) {
      return productMatches
        .map((p) => {
          const desc = p.description || "Tidak ada rincian deskripsi tambahan.";
          return `**${p.name}** (${formatRupiah(p.price)}):\n${desc}`;
        })
        .join("\n\n");
    }

    // Jika pertanyaan tentang ketersediaan ("ada ...", "apakah ada ...", "ready gak")
    if (/(ada|tersedia|ready|habis|stok)/i.test(lower)) {
      return productMatches
        .map((p) => `**${p.name}** saat ini **${p.available ? "Tersedia" : "Sedang Habis"}** dengan harga ${formatRupiah(p.price)}.`)
        .join("\n");
    }

    // Default info produk yang cocok
    return productMatches
      .map((p) => {
        return `**${p.name}** — ${formatRupiah(p.price)}\n• Status: ${p.available ? "Tersedia" : "Habis"}${p.description ? `\n• Keterangan: ${p.description}` : ""}`;
      })
      .join("\n\n");
  }

  // 17. Pertanyaan Kategori Menu Spesifik
  // Misalnya: "ada mie ayam gak?", "mie ayam ada apa aja?", "menu baso apa saja?", "minuman apa saja?"
  const isBasoCategory = /(baso|bakso)/i.test(lower);
  const isMieAyamCategory = /(mie\s*ayam)/i.test(lower);
  const isMinumanCategory = /(minum|minuman|ekstra)/i.test(lower);
  const isMakananGeneral = /(menu\s+makanan|makanan\s+apa)/i.test(lower);

  if (isMieAyamCategory) {
    const cat = categories.find((c) => c.slug.includes("mie-ayam") || c.name.toLowerCase().includes("mie ayam"));
    const catProds = products.filter((p) => p.categoryId === cat?.id);
    if (catProds.length > 0) {
      const list = catProds
        .map((p) => `• **${p.name}** — ${formatRupiah(p.price)} (${p.available ? "Tersedia" : "Habis"})`)
        .join("\n");
      return `Daftar menu **Mie Ayam** yang tersedia di Ojolali:\n${list}`;
    }
  }

  if (isBasoCategory) {
    const cat = categories.find((c) => c.slug.includes("baso") || c.name.toLowerCase().includes("baso"));
    const catProds = products.filter((p) => p.categoryId === cat?.id);
    if (catProds.length > 0) {
      const list = catProds
        .map((p) => `• **${p.name}** — ${formatRupiah(p.price)} (${p.available ? "Tersedia" : "Habis"})`)
        .join("\n");
      return `Daftar menu **Baso Sapi** yang tersedia di Ojolali:\n${list}`;
    }
  }

  if (isMinumanCategory) {
    const cat = categories.find((c) => c.slug.includes("minuman") || c.name.toLowerCase().includes("minum"));
    const catProds = products.filter((p) => p.categoryId === cat?.id);
    if (catProds.length > 0) {
      const list = catProds
        .map((p) => `• **${p.name}** — ${formatRupiah(p.price)} (${p.available ? "Tersedia" : "Habis"})`)
        .join("\n");
      return `Daftar menu kategori **Minuman & Ekstra**:\n${list}`;
    }
  }

  if (isMakananGeneral) {
    const foodProds = products.filter((p) => !p.category.slug.includes("minuman"));
    const list = foodProds
      .map((p) => `• **${p.name}** — ${formatRupiah(p.price)} (${p.available ? "Tersedia" : "Habis"})`)
      .join("\n");
    return `Daftar menu makanan Ojolali:\n${list}`;
  }

  // 18. Pertanyaan Daftar Semua Menu / Katalog / Daftar Harga
  if (
    /(daftar\s+menu|semua\s+menu|ada\s+menu\s+apa|menu\s+apa\s+saja|lihat\s+menu|katalog|minta\s+menu|list\s+menu|daftar\s+harga|price\s*list|tampilkan\s+semua\s+menu)/i.test(lower) ||
    lower === "menu"
  ) {
    const lines: string[] = ["Daftar menu Baso & Mie Ayam Ojolali:"];
    for (const cat of categories) {
      const catProds = products.filter((p) => p.categoryId === cat.id);
      if (catProds.length > 0) {
        lines.push(`\n**${cat.name}:**`);
        for (const p of catProds) {
          lines.push(`• ${p.name} — ${formatRupiah(p.price)} (${p.available ? "Tersedia" : "Habis"})`);
        }
      }
    }
    return lines.join("\n");
  }

  // 19. Pertanyaan Pesanan Milik User (jika login / meminta pesanan saya)
  if (/(pesanan\s+saya|order\s+saya|status\s+pesanan|cek\s+pesanan)/i.test(lower)) {
    if (userId) {
      const userOrders = await prisma.order.findMany({
        where: { userId },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
        take: 3,
      });

      if (userOrders.length === 0) {
        return "Anda belum memiliki riwayat pesanan di akun ini.";
      }

      const list = userOrders
        .map((o) => {
          const itemsStr = o.items.map((i) => `${i.product.name} (${i.quantity}x)`).join(", ");
          return `• **#${o.orderNumber}** — ${formatRupiah(o.total)} | Status: **${o.status}** | Bayar: ${o.paymentStatus}\n  Item: ${itemsStr}`;
        })
        .join("\n\n");

      return `Riwayat pesanan terakhir Anda:\n${list}`;
    } else {
      return "Untuk mengecek status pesanan, silakan ketik nomor pesanan Anda (contoh: ORD-20261008-001) atau masuk ke akun Anda.";
    }
  }

  // 20. Pertanyaan Kasir, Admin, & Staf Warung
  if (/(siapa\s+saja\s+kasir|daftar\s+kasir|kasirnya\s+siapa|kasir\s+warung|siapa\s+kasir|nama\s+kasir)/i.test(lower)) {
    const cashiers = await prisma.user.findMany({
      where: { role: "CASHIER" },
      select: { name: true, email: true, phone: true },
    });
    if (cashiers.length > 0) {
      const list = cashiers.map((c) => `• **${c.name}** (Email: ${c.email} | HP: ${c.phone || "-"})`).join("\n");
      return `Daftar Kasir Resmi di Baso & Mie Ayam Ojolali:\n${list}\n\nStaf kasir bertugas melayani transaksi tunai, konfirmasi QRIS, dan pemrosesan pesanan di warung.`;
    }
  }

  if (/(siapa\s+saja\s+admin|daftar\s+admin|adminnya\s+siapa|admin\s+warung|siapa\s+admin|nama\s+admin)/i.test(lower)) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { name: true, email: true, phone: true },
    });
    if (admins.length > 0) {
      const list = admins.map((a) => `• **${a.name}** (Email: ${a.email} | HP: ${a.phone || "-"})`).join("\n");
      return `Administrator Sistem Baso & Mie Ayam Ojolali:\n${list}\n\nAdmin bertanggung jawab mengelola operasional warung, menu makanan, dan laporan keuangan.`;
    }
  }

  if (/(kasir|admin|petugas|karyawan|pelayan|staf|hubungi\s+staf)/i.test(lower)) {
    return `Staf dan kasir kami siap melayani pesanan Anda secara langsung di warung atau melalui sistem kasir digital POS. Jika ada kendala dengan pesanan, silakan hubungi kasir kami melalui WhatsApp di ${formattedPhone}.`;
  }

  // 20b. Pertanyaan Kategori Menu
  if (/(kategori\s+apa\s+saja|daftar\s+kategori|ada\s+kategori\s+apa|apa\s+saja\s+kategori|sebutkan\s+kategori)/i.test(lower)) {
    const list = categories.map((c) => `• **${c.name}** (${c._count.products} menu)`).join("\n");
    return `Kategori Menu di Baso & Mie Ayam Ojolali:\n${list}\n\nSilakan ketik nama kategori (misal: *"menu makanan"* atau *"menu minuman"*) untuk melihat daftar lengkapnya!`;
  }

  // 20c. Pertanyaan Menu Habis / Kosong vs Tersedia / Ready
  if (/(menu\s+(yang\s+)?(habis|kosong|sold\s*out)|ada\s+menu\s+(yang\s+)?(habis|kosong)|stok\s+habis)/i.test(lower)) {
    const outOfStock = products.filter((p) => !p.available);
    if (outOfStock.length === 0) {
      return "Kabar baik! Saat ini seluruh menu di Baso & Mie Ayam Ojolali dalam kondisi **Tersedia (Ready)** dan siap dipesan!";
    }
    const list = outOfStock.map((p) => `• **${p.name}** (${formatRupiah(p.price)})`).join("\n");
    return `Menu yang saat ini sedang habis / kosong:\n${list}`;
  }

  if (/(menu\s+(yang\s+)?(ready|tersedia|ada)|stok\s+ready|bisa\s+dipesan)/i.test(lower) && !/(semua|daftar)/i.test(lower)) {
    const readyProds = products.filter((p) => p.available);
    const list = readyProds.map((p) => `• **${p.name}** — ${formatRupiah(p.price)}`).join("\n");
    return `Menu yang saat ini **Tersedia (Ready)** untuk dipesan:\n${list}`;
  }

  // 20d. Pertanyaan Status Pesanan Dapur Tertentu (Pending, Processing, Ready, Completed, Cancelled)
  const statusFilterMatch = lower.match(/(pending|processing|diproses|antrian|antrean|ready|siap|completed|selesai|cancelled|dibatalkan|batal)/i);
  if (statusFilterMatch && /(pesanan|order|antrian|antrean)/i.test(lower) && !/(berapa|jumlah|total|laporan)/i.test(lower)) {
    let targetStatus = "PENDING";
    const raw = statusFilterMatch[1].toLowerCase();
    if (raw === "processing" || raw === "diproses" || raw === "antrian" || raw === "antrean") targetStatus = "PROCESSING";
    else if (raw === "ready" || raw === "siap") targetStatus = "READY";
    else if (raw === "completed" || raw === "selesai") targetStatus = "COMPLETED";
    else if (raw === "cancelled" || raw === "dibatalkan" || raw === "batal") targetStatus = "CANCELLED";

    const ordersByStatus = await prisma.order.findMany({
      where: { status: targetStatus },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (ordersByStatus.length === 0) {
      return `Saat ini tidak ada pesanan dengan status **${targetStatus}** dalam sistem.`;
    }

    const list = ordersByStatus
      .map((o, idx) => {
        const items = o.items.map((i) => `${i.product.name} (${i.quantity}x)`).join(", ");
        return `${idx + 1}. **${o.customerName}** (#${o.orderNumber}) — ${formatRupiah(o.total)}\n   Status: **${o.status}** | Bayar: ${o.paymentStatus} (${o.paymentMethod})\n   Menu: ${items}`;
      })
      .join("\n\n");

    return `Daftar Pesanan dengan Status **${targetStatus}**:\n\n${list}\n\n📊 *Data ini sinkron langsung dengan halaman Semua Pesanan di Dashboard.*`;
  }

  // 20e. Pertanyaan Fitur Website & Panduan Navigasi Web
  if (/(fitur\s+(web|website|aplikasi|sistem)|halaman\s+(apa\s+saja|web)|struktur\s+(web|website)|ada\s+apa\s+saja\s+di\s+web)/i.test(lower)) {
    return `Fitur & Halaman Utama Website Baso & Mie Ayam Ojolali:
• 🏠 **Beranda**: Profil warung UMKM Ojolali, keunggulan daging sapi asli, dan link cepat.
• 🍜 **Menu Makanan**: Katalog kuliner lengkap dengan filter kategori & tombol tambah ke keranjang.
• 🛒 **Keranjang & Checkout**: Pesan online dengan pilihan bayar Tunai, Transfer, atau QRIS.
• 📦 **Semua Pesanan (Dapur)**: Pelacakan alur dapur (*Pending ➔ Processing ➔ Ready ➔ Completed*) dengan integrasi WhatsApp.
• 📊 **Dashboard Admin**: Ringkasan performa penjualan harian, pesanan masuk, dan grafik 7 hari.
• 📈 **Laporan Penjualan**: Laporan transaksi harian, mingguan, bulanan, rata-rata transaksi, dan ranking menu terlaris.
• ⚙️ **Pengaturan WhatsApp & AI**: Konfigurasi gateway pesan instan dan model AI Chatbot.
• 🤖 **Chatbot Asisten Oji**: Asisten virtual mengambang di pojok kanan bawah yang terhubung langsung ke database toko.`;
  }

  // 20f. Universal Smart Matcher: Cari produk atau konteks apapun sebelum ke fallback
  const queryWords = lower.split(" ").filter((w) => w.length >= 3);
  const matchedProd = products.find((p) => {
    const pNorm = normalize(p.name);
    return queryWords.some((w) => pNorm.includes(w));
  });

  if (matchedProd) {
    return `Menemukan menu yang relevan dengan pertanyaan Anda:
• **${matchedProd.name}** (${matchedProd.category.name}) — **${formatRupiah(matchedProd.price)}**
• Status: **${matchedProd.available ? "Tersedia / Ready" : "Sedang Habis"}**${matchedProd.description ? `\n• Keterangan: ${matchedProd.description}` : ""}

Ada yang ingin Anda tanyakan lebih lanjut seputar menu ini?`;
  }

  // 21. Smart Friendly Fallback
  return `Halo! Saya **Oji**, asisten AI resmi **Baso & Mie Ayam Ojolali** 🍜

Saya belum sepenuhnya memahami maksud pertanyaan Anda, namun saya siap membantu Anda untuk informasi seputar warung:
• 📋 **Daftar Menu & Harga** (Ketik: *"daftar menu"*, *"harga baso"*, atau *"mie ayam"*)
• 🔥 **Menu Paling Laris** (Ketik: *"menu terlaris"*)
• 📊 **Laporan Penjualan** (Ketik: *"berapa penjualan hari ini"*)
• 👥 **Data Pelanggan & Pemesan** (Ketik: *"siapa saja yang memesan"*, *"berapa jumlah pelanggan"*)
• 📦 **Cek Pesanan Pelanggan** (Ketik nama pelanggan, contoh: *"Agus Salim apa yang dipesan"*)
• 👤 **Profil Akun Anda** (Ketik: *"siapa saya"*)
• 💰 **Rekomendasi Budget** (Ketik: *"budget 20 ribu"*)
• 📍 **Jam Buka & Alamat** (Ketik: *"jam buka"* atau *"alamat"*)
• 🔢 **Cek No. Order** (Ketik: *ORD-20261114-994*)

Silakan ketik pertanyaan Anda sesuai opsi di atas!`;
}
