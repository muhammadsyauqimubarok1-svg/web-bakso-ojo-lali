# 🍜 Web Bakso & Mie Ayam Ojolali V6

Aplikasi Web Pemesanan & Manajemen Restoran Kuliner UMKM Modern berbasis **Next.js 16**, **React 19**, **Tailwind CSS v4**, **Prisma ORM**, dan **MySQL**, dilengkapi dengan **Asisten AI Chatbot "Oji"** pintar yang terhubung ke database dan **Notifikasi WhatsApp Otomatis (Fonnte Gateway)**.

---

## ✨ Fitur Utama

### 1. 🛒 Katalog Menu & Pemesanan Mandiri (Customer)
- Tampilan menu kuliner interaktif (Bakso, Mie Ayam, Minuman Segar, Extra Topping).
- Keranjang belanja dinamis (*add to cart*, atur kuantiti, dan catatan khusus).
- Pilihan metode pembayaran: **CASH**, **QRIS**, dan **TRANSFER**.
- Pelacakan status pesanan secara *real-time*.

### 2. 📊 Dashboard Admin & Operasional Kasir
- **Metrik Penjualan Terkini**: Penjualan Hari Ini, Total Pesanan Masuk, dan Antrean Dapur.
- **Alur Dapur Terintegrasi**: Mengubah status pesanan (`PENDING` ➔ `PROCESSING` ➔ `READY` ➔ `COMPLETED`).
- **Verifikasi Pembayaran**: Konfirmasi pembayaran kasir atau scan QRIS.
- **Cetak Nota & Struk Digital**: Cetak bukti transaksi langsung dari browser.
- **Manajemen Menu & Stok**: Tambah, ubah, dan atur ketersediaan menu.

### 3. 🤖 Asisten AI Chatbot "Oji" (Context-Aware)
- **Terhubung Langsung ke Database Toko**: Menjawab data riil seperti daftar menu, harga, stok habis/ready, hingga kategori.
- **Sinkronisasi Metrik Dashboard**: Mengetahui omzet hari ini, jumlah pesanan, dan antrean aktif secara akurat.
- **Pencarian Spesifik Pelanggan**: Mampu mencari rincian belanja pelanggan tertentu berdasarkan nama atau nomor telepon (misal: *"Agus Salim apa yang dipesan"*).
- **Multi-Turn Context Tracking**: Memahami pertanyaan lanjutan secara alami (misal: *"siapa saja"*, *"detailnya"*, *"rinciannya"*).

### 4. 📲 Notifikasi WhatsApp Otomatis (Fonnte API Gateway)
- Notifikasi instan ke WhatsApp pelanggan saat order berhasil dibuat.
- Notifikasi broadcast ke nomor WhatsApp Admin / Kasir toko.
- Pengiriman update status pesanan (sedang disiapkan, siap diambil/disajikan).
- Terintegrasi dengan endpoint resmi Fonnte (`https://api.fonnte.com/send`).

### 5. 🌓 Dark Mode & Light Mode
- Dukungan tema Gelap (*Dark Mode*) dan Terang (*Light Mode*) dengan toggle instan.
- Desain antarmuka modern, bersih, dan ramah pengguna di semua ukuran layar (Desktop & Mobile).

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) with Turbopack
- **Library UI**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & Lucide Icons
- **Database & ORM**: [MySQL 8.4+](https://www.mysql.com/) & [Prisma ORM 5.22](https://www.prisma.io/)
- **Authentication**: JWT (JSON Web Tokens) & Cookie Session
- **WhatsApp Gateway**: [Fonnte API](https://fonnte.com/)
- **AI Engine**: Custom Context-Aware AI Rules Engine + Google Gemini API Fallback

---

## 🚀 Panduan Instalasi & Menjalankan Proyek

### 1. Clone Repository
```bash
git clone https://github.com/muhammadsyauqimubarok1-svg/web-bakso-ojo-lali.git
cd web-bakso-ojo-lali
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment (`.env`)
Salin file template `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi di dalam file `.env`:
```env
# Koneksi Database MySQL
DATABASE_URL="mysql://root:@localhost:3306/ojolali_db"

# JWT Secret
JWT_SECRET="super-secret-ojolali-key-2026-min-32-characters"

# Konfigurasi Fonnte WhatsApp Gateway
WHATSAPP_MODE=production
WHATSAPP_API_URL=https://api.fonnte.com/send
WHATSAPP_API_TOKEN="TOKEN_FONNTE_ANDA"
WHATSAPP_ADMIN_NUMBER="6289502997292"
```

### 4. Setup Database
Anda dapat menggunakan salah satu dari dua cara berikut:

**Cara A: Import file SQL Dump (Direkomendasikan - Termasuk Data Awal)**
- Buka HeidiSQL / phpMyAdmin / Laragon MySQL.
- Buat database baru bernama `ojolali_db` (atau `db_webbakso`).
- Import file **`db_webbakso_dump.sql`** yang tersedia di root proyek.

**Cara B: Menggunakan Prisma CLI**
```bash
npx prisma db push
npx prisma generate
```

### 5. Jalankan Server Development
```bash
npm run dev
```
Buka browser dan akses [http://localhost:3000](http://localhost:3000).

---

## 👥 Akun Demo Default

| Role | Email | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@ojolali.com` | `admin123` | Akses penuh dashboard, menu, dan laporan |
| **Kasir** | `kasir@ojolali.com` | `kasir123` | Akses manajemen pesanan & struk |
| **Customer** | `budi@gmail.com` | `customer123` | Pelanggan setia Ojolali |

---

## 📁 Struktur Direktori Utama

```
WEB BAKSO OJO LALI V6/
├── db_webbakso_dump.sql        # Backup lengkap skema DDL & data riil database
├── prisma/
│   └── schema.prisma           # Skema Prisma ORM (7 Model Tabel)
├── public/                     # Aset statis & logo
├── src/
│   ├── app/
│   │   ├── (admin)/            # Halaman Dashboard Admin & Kasir
│   │   ├── api/                # Endpoint API (Chatbot, Pesanan, WhatsApp, Auth)
│   │   └── page.tsx            # Halaman Utama Pemesanan Pelanggan
│   ├── components/             # Komponen UI (Navbar, Chatbot, Modal, Struk)
│   └── lib/
│       ├── ai/                 # Engine AI Chatbot "Oji" & context processor
│       ├── prisma.ts           # Prisma Client Singleton
│       └── whatsapp.ts         # Integrasi API Fonnte WhatsApp
├── .env.example                # Template konfigurasi environment
├── package.json
└── README.md
```

---

## 📄 Lisensi
Proyek ini dikembangkan untuk UMKM **Baso & Mie Ayam Ojolali**.
Hak Cipta © 2026. All rights reserved.
