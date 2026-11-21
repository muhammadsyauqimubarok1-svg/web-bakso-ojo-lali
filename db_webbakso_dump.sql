-- ========================================================
-- DUMP DATABASE BAKSO & MIE AYAM OJOLALI
-- Di-generate otomatis untuk HeidiSQL / phpMyAdmin / MySQL
-- Tanggal: 2026-11-14T03:26:50.400Z
-- ========================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+07:00";

-- --------------------------------------------------------
-- 1. Tabel: categories
-- --------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_name_key` (`name`),
  UNIQUE KEY `categories_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `categories` (`id`, `name`, `slug`, `createdAt`) VALUES
('cmvsw9b57000411pedu0up6je', 'Baso Sapi', 'baso-sapi', '2026-10-29 08:58:17'),
('cmvsw9b5c000511pe7r968hu2', 'Mie Ayam', 'mie-ayam', '2026-10-29 08:58:17'),
('cmvsw9b5g000611pe85xq8ugw', 'Minuman & Ekstra', 'minuman-ekstra', '2026-10-29 08:58:17');

-- --------------------------------------------------------
-- 2. Tabel: users
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CUSTOMER',
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `createdAt`, `updatedAt`) VALUES
('cmvsw9b44000011pettjcypfs', 'Budi Santoso (Admin Ojolali)', 'admin@ojolali.test', '$2b$10$Y4vs3lxHt9qoibRAZ4pFRezqAKswX2J2JT8nGgchuSEuBNvdnclF.', 'ADMIN', '081234567890', '2026-10-29 08:58:17', '2026-10-29 08:58:17'),
('cmvsw9b4t000111pe5rszl3b4', 'Siti Rahma (Kasir 1)', 'kasir@ojolali.test', '$2b$10$cRR6f16C7WngufREN9CVkeXxw2rtfny5s/wehW5padTaq8r0LQmQK', 'CASHIER', '081298765432', '2026-10-29 08:58:17', '2026-10-29 08:58:17'),
('cmvsw9b4x000211peiz8oyoxu', 'Ahmad Fauzi', 'customer@ojolali.test', '$2b$10$lMIMIHPF/65E/FBc63yNkOekYNscsW7O6AC6A0xxrDLliMrHyr7oG', 'CUSTOMER', '085712345678', '2026-10-29 08:58:17', '2026-10-29 08:58:17'),
('cmvsw9b52000311pee0co9n1u', 'Dewi Lestari', 'dewi@ojolali.test', '$2b$10$cU4udRrHKrRFMLR9qnp0ketp//D..zFS0LyVFgX8iuLDziXU6egrC', 'CUSTOMER', '081377889900', '2026-10-29 08:58:17', '2026-10-29 08:58:17');

-- --------------------------------------------------------
-- 3. Tabel: products
-- --------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` int NOT NULL,
  `image` text COLLATE utf8mb4_unicode_ci,
  `available` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `products_categoryId_fkey` (`categoryId`),
  CONSTRAINT `products_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `products` (`id`, `categoryId`, `name`, `description`, `price`, `image`, `available`, `createdAt`, `updatedAt`) VALUES
('cmvsw9b5k000811pe8c5wywh6', 'cmvsw9b57000411pedu0up6je', 'Baso Biasa', 'Semangkuk baso daging sapi asli berisi 5 butir baso halus, mie kuning, bihun, tahu, dan kuah kaldu sapi gurih khas Ojolali.', 15000, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80', 1, '2026-10-29 08:58:17', '2026-10-29 08:58:17'),
('cmvsw9b5q000a11peafrki5ls', 'cmvsw9b57000411pedu0up6je', 'Baso Spesial', 'Baso urat gurih besar + 3 baso halus, tahu baso, pangsit renyah, tetelan empuk dan kuah kaldu rempah nikmat.', 20000, 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80', 1, '2026-10-29 08:58:17', '2026-10-29 08:58:17'),
('cmvsw9b5v000c11peig09ii27', 'cmvsw9b57000411pedu0up6je', 'Baso Komplit', 'Pilihan paling puas! Baso urat jumbo, baso telur, baso halus, tahu bakso, tetelan sapi melimpah, dan taburan bawang goreng.', 25000, 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80', 1, '2026-10-29 08:58:17', '2026-10-29 08:58:17'),
('cmvsw9b60000e11peepsukqea', 'cmvsw9b5c000511pe7r968hu2', 'Mie Ayam Original', 'Mie kenyal buatan sendiri disajikan dengan tumisan ayam kecap bumbu rempah gurih manis, sawi hijau segar, dan kaldu terpisah.', 15000, 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80', 1, '2026-10-29 08:58:17', '2026-10-29 08:58:17'),
('cmvsw9b63000g11pe3i02b1uf', 'cmvsw9b5c000511pe7r968hu2', 'Mie Ayam Baso', 'Perpaduan favorit! Mie ayam manis gurih dilengkapi 2 butir baso sapi halus berkuah kaldu hangat dan renyahnya kerupuk pangsit.', 20000, 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=600&auto=format&fit=crop&q=80', 1, '2026-10-29 08:58:17', '2026-10-29 08:58:17'),
('cmvsw9b67000i11petbkzexvk', 'cmvsw9b5c000511pe7r968hu2', 'Mie Ayam Spesial', 'Porsi jumbo komplit mie ayam dengan potongan ayam melimpah, 2 butir baso halus, 1 baso urat, ceker empuk, dan pangsit basah/goreng.', 25000, 'https://images.unsplash.com/photo-1594998893017-36147cbcae05?w=600&auto=format&fit=crop&q=80', 1, '2026-10-29 08:58:17', '2026-10-29 08:58:17'),
('cmvsw9b6a000k11pecy7lapxn', 'cmvsw9b5g000611pe85xq8ugw', 'Pangsit Goreng Renyah (3 pcs)', 'Pangsit renyah gurih dengan cocolan saus sambal khas Ojolali.', 5000, 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&auto=format&fit=crop&q=80', 1, '2026-10-29 08:58:17', '2026-10-29 08:58:17'),
('cmvsw9b6f000m11pe4uqcdqux', 'cmvsw9b5g000611pe85xq8ugw', 'Es Teh Manis Jumbo', 'Teh melati wangi diseduh segar dengan gula pasir alami dan es batu menyegarkan.', 5000, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80', 1, '2026-10-29 08:58:17', '2026-10-29 08:58:17'),
('cmvsw9b6j000o11peyv9gulcc', 'cmvsw9b5g000611pe85xq8ugw', 'Es Jeruk Peras Segar', 'Perasan jeruk segar asli kaya vitamin C, manis asam dingin yang menyegarkan dahaga.', 7000, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80', 1, '2026-10-29 08:58:17', '2026-10-29 08:58:17');

-- --------------------------------------------------------
-- 4. Tabel: settings
-- --------------------------------------------------------
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_key_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `settings` (`id`, `key`, `value`, `createdAt`, `updatedAt`) VALUES
('cmwfoyvwv0009w9ki7a008bqy', 'whatsapp_mode', 'mock', '2026-11-14 07:52:55', '2026-11-14 07:52:55'),
('cmwfoyvx5000aw9kii6zgu3uv', 'whatsapp_api_url', 'https://api.fonnte.com/send', '2026-11-14 07:52:55', '2026-11-14 07:52:55'),
('cmwfoyvx9000bw9kib9ohqnx8', 'whatsapp_admin_number', '6289502997292', '2026-11-14 07:52:55', '2026-11-14 07:52:55'),
('cmwfoyvxe000cw9kilhzzg7ze', 'whatsapp_enabled', 'true', '2026-11-14 07:52:55', '2026-11-14 07:52:55'),
('cmwftw0zx000pw9kimznhfluu', 'chatbot_ai_enabled', 'false', '2026-11-14 10:10:40', '2026-11-14 10:10:40'),
('cmwftw105000qw9kih8ehyphb', 'chatbot_ai_provider', 'gemini', '2026-11-14 10:10:40', '2026-11-14 10:10:40'),
('cmwftw10d000rw9kiwoe1x3l1', 'chatbot_ai_api_key', '', '2026-11-14 10:10:40', '2026-11-14 10:10:40'),
('cmwftw10i000sw9kigi976kt1', 'chatbot_ai_model', 'gemini-2.0-flash', '2026-11-14 10:10:40', '2026-11-14 10:10:40'),
('cmwftw10n000tw9ki9tm7kid2', 'chatbot_ai_temperature', '0.7', '2026-11-14 10:10:40', '2026-11-14 10:10:40'),
('cmwftw10u000uw9kitlaqjhcu', 'chatbot_ai_system_prompt', 'Anda adalah "Oji", asisten virtual pintar dan ramah resmi dari warung "Baso & Mie Ayam Ojolali".

Tugas utama Anda:
1. Membantu pelanggan dengan ramah, hangat, dan informatif mengenai menu, daftar harga, status stok ketersediaan, jam buka, lokasi warung, metode pembayaran, dan status pesanan.
2. Memberikan rekomendasi makanan atau paket sesuai selera atau budget pelanggan berdasarkan data menu riil warung.
3. Menjawab pertanyaan seputar jumlah pelanggan, data penjualan hari ini, omzet warung, dan statistik sistem secara akurat berdasarkan data resmi di bawah.
4. Menjawab pertanyaan pengguna tentang profil/identitas mereka ("siapa saya", "akun saya") berdasarkan info pengguna yang tertera di konteks di bawah.
5. Menjawab pertanyaan tentang pemilik warung (dikelola oleh keluarga Ojolali dengan resep kuah kaldu sapi asli legendaris).
6. Selalu menggunakan data resmi yang tertera pada konteks toko di bawah. Jangan pernah mengarang menu atau harga yang tidak ada di daftar!
7. Format jawaban dengan rapi menggunakan markdown (tebalkan nama menu/harga, gunakan bullet points jika menyajikan daftar) agar nyaman dibaca.', '2026-11-14 10:10:40', '2026-11-14 10:10:40');

-- --------------------------------------------------------
-- 5. Tabel: orders
-- --------------------------------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderNumber` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerPhone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total` int NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `paymentMethod` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CASH',
  `paymentStatus` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `whatsappLastSent` datetime(3) DEFAULT NULL,
  `whatsappStatus` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_orderNumber_key` (`orderNumber`),
  KEY `orders_userId_fkey` (`userId`),
  CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `orders` (`id`, `orderNumber`, `userId`, `customerName`, `customerPhone`, `total`, `status`, `paymentMethod`, `paymentStatus`, `notes`, `whatsappLastSent`, `whatsappStatus`, `createdAt`, `updatedAt`) VALUES
('cmvsw9b6p000q11pe4ecnxxp3', 'ORD-20261001-001', 'cmvsw9b4x000211peiz8oyoxu', 'Ahmad Fauzi', '085712345678', 50000, 'COMPLETED', 'QRIS', 'PAID', 'Kuah dipisah, sambal sedikit', NULL, 'PENDING', '2026-10-22 06:58:17', '2026-10-22 06:58:17'),
('cmvsw9b75000w11pey12sl7c0', 'ORD-20261002-002', 'cmvsw9b52000311pee0co9n1u', 'Dewi Lestari', '081377889900', 54000, 'COMPLETED', 'CASH', 'PAID', 'Mie ayam tanpa daun bawang ya', NULL, 'PENDING', '2026-10-23 04:58:17', '2026-10-23 04:58:17'),
('cmvsw9b7l001211pe6vbjcrgn', 'ORD-20261003-003', NULL, 'Pak Camat & Staf', '081200112233', 210000, 'COMPLETED', 'TRANSFER', 'PAID', 'Pesanan kantor kecamatan, bawa ke lantai 2', NULL, 'PENDING', '2026-10-24 05:58:17', '2026-10-24 05:58:17'),
('cmvsw9b81001a11pelps87qbn', 'ORD-20261004-004', 'cmvsw9b4x000211peiz8oyoxu', 'Ahmad Fauzi', '085712345678', 45000, 'COMPLETED', 'QRIS', 'PAID', 'Makan di tempat meja 4', NULL, 'PENDING', '2026-10-25 07:58:17', '2026-10-25 07:58:17'),
('cmvsw9b8h001i11peflhhzg8f', 'ORD-20261005-005', 'cmvsw9b52000311pee0co9n1u', 'Dewi Lestari', '081377889900', 75000, 'COMPLETED', 'CASH', 'PAID', 'Bungkus bawa pulang', NULL, 'PENDING', '2026-10-26 03:58:17', '2026-10-26 03:58:17'),
('cmvsw9b8t001o11pe33zzem98', 'ORD-20261006-006', NULL, 'Rudi Hartono', '081599887766', 74000, 'COMPLETED', 'QRIS', 'PAID', 'Banyakin bawang goreng', NULL, 'PENDING', '2026-10-27 02:58:17', '2026-10-27 02:58:17'),
('cmvsw9b9a001w11petehpesnm', 'ORD-20261007-007', 'cmvsw9b4x000211peiz8oyoxu', 'Ahmad Fauzi', '085712345678', 60000, 'COMPLETED', 'QRIS', 'PAID', 'Sambal banyak ya mas', NULL, 'PENDING', '2026-10-28 05:58:17', '2026-10-28 05:58:17'),
('cmvsw9b9o002211peh9ump0u8', 'ORD-20261008-001', 'cmvsw9b4x000211peiz8oyoxu', 'Ahmad Fauzi', '085712345678', 70000, 'COMPLETED', 'QRIS', 'PAID', 'Meja No. 03', '2026-11-14 09:21:20', 'MOCK_SENT', '2026-10-29 06:58:17', '2026-11-14 09:21:20'),
('cmvsw9bae002a11pek4r4y125', 'ORD-20261008-002', NULL, 'Ibu Nurul Hidayah', '082133445566', 64000, 'COMPLETED', 'CASH', 'PAID', 'Baso kuah panas, tidak pedas sama sekali', '2026-11-14 09:21:11', 'MOCK_SENT', '2026-10-29 07:58:17', '2026-11-14 09:21:11'),
('cmvsw9bat002g11ped4knh7rd', 'ORD-20261008-003', 'cmvsw9b52000311pee0co9n1u', 'Dewi Lestari', '081377889900', 50000, 'COMPLETED', 'QRIS', 'PAID', 'Tolong segera disiapkan', '2026-11-14 09:21:02', 'MOCK_SENT', '2026-10-29 08:58:17', '2026-11-14 09:21:02'),
('cmwd0i3ea000110kdh7bi2gxu', 'ORD-20261112-446', NULL, 'Udin dingin', NULL, 7000, 'COMPLETED', 'QRIS', 'PAID', NULL, '2026-11-12 10:52:29', 'MOCK_SENT', '2026-11-12 10:52:29', '2026-11-14 08:54:39'),
('cmwfernwd0001uebrzj52g9a8', 'ORD-20261114-870', NULL, 'Agus Salim', '089429338889', 20000, 'COMPLETED', 'QRIS', 'PAID', NULL, '2026-11-14 07:53:50', 'MOCK_SENT', '2026-11-14 03:07:22', '2026-11-14 07:53:50'),
('cmwfox6r30001w9ki0bke3w1x', 'ORD-20261114-994', 'cmvsw9b44000011pettjcypfs', 'Budi Santoso (Admin Ojolali)', '081234567890', 27000, 'COMPLETED', 'QRIS', 'PAID', NULL, '2026-11-14 07:53:44', 'MOCK_SENT', '2026-11-14 07:51:36', '2026-11-14 07:53:44');

-- --------------------------------------------------------
-- 6. Tabel: order_items
-- --------------------------------------------------------
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `price` int NOT NULL,
  `subtotal` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_orderId_fkey` (`orderId`),
  KEY `order_items_productId_fkey` (`productId`),
  CONSTRAINT `order_items_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `order_items` (`id`, `orderId`, `productId`, `quantity`, `price`, `subtotal`) VALUES
('cmvsw9b6u000s11peu1s7atp0', 'cmvsw9b6p000q11pe4ecnxxp3', 'cmvsw9b5q000a11peafrki5ls', 2, 20000, 40000),
('cmvsw9b71000u11pezfysl44i', 'cmvsw9b6p000q11pe4ecnxxp3', 'cmvsw9b6f000m11pe4uqcdqux', 2, 5000, 10000),
('cmvsw9b7a000y11pex3chlkh4', 'cmvsw9b75000w11pey12sl7c0', 'cmvsw9b63000g11pe3i02b1uf', 2, 20000, 40000),
('cmvsw9b7h001011peiiaks37h', 'cmvsw9b75000w11pey12sl7c0', 'cmvsw9b6j000o11peyv9gulcc', 2, 7000, 14000),
('cmvsw9b7p001411pe9x86j4ri', 'cmvsw9b7l001211pe6vbjcrgn', 'cmvsw9b5v000c11peig09ii27', 4, 25000, 100000),
('cmvsw9b7u001611pe7ej8p5mw', 'cmvsw9b7l001211pe6vbjcrgn', 'cmvsw9b67000i11petbkzexvk', 3, 25000, 75000),
('cmvsw9b7y001811pea39ztdoh', 'cmvsw9b7l001211pe6vbjcrgn', 'cmvsw9b6f000m11pe4uqcdqux', 7, 5000, 35000),
('cmvsw9b85001c11pemklk6r8p', 'cmvsw9b81001a11pelps87qbn', 'cmvsw9b5k000811pe8c5wywh6', 2, 15000, 30000),
('cmvsw9b8a001e11peqjw8kiic', 'cmvsw9b81001a11pelps87qbn', 'cmvsw9b6a000k11pecy7lapxn', 1, 5000, 5000),
('cmvsw9b8d001g11peecjywbmj', 'cmvsw9b81001a11pelps87qbn', 'cmvsw9b6f000m11pe4uqcdqux', 2, 5000, 10000),
('cmvsw9b8k001k11pek1ygr48k', 'cmvsw9b8h001i11peflhhzg8f', 'cmvsw9b63000g11pe3i02b1uf', 3, 20000, 60000),
('cmvsw9b8p001m11pe3ho5fcsx', 'cmvsw9b8h001i11peflhhzg8f', 'cmvsw9b6f000m11pe4uqcdqux', 3, 5000, 15000),
('cmvsw9b8w001q11pef91zexl5', 'cmvsw9b8t001o11pe33zzem98', 'cmvsw9b5q000a11peafrki5ls', 2, 20000, 40000),
('cmvsw9b90001s11pewi4kp9ex', 'cmvsw9b8t001o11pe33zzem98', 'cmvsw9b63000g11pe3i02b1uf', 1, 20000, 20000),
('cmvsw9b95001u11pez9hqlziq', 'cmvsw9b8t001o11pe33zzem98', 'cmvsw9b6j000o11peyv9gulcc', 2, 7000, 14000),
('cmvsw9b9e001y11pe32z3tbrw', 'cmvsw9b9a001w11petehpesnm', 'cmvsw9b5v000c11peig09ii27', 2, 25000, 50000),
('cmvsw9b9j002011pemtdjwopq', 'cmvsw9b9a001w11petehpesnm', 'cmvsw9b6f000m11pe4uqcdqux', 2, 5000, 10000),
('cmvsw9b9r002411pej5yqcriq', 'cmvsw9b9o002211peh9ump0u8', 'cmvsw9b63000g11pe3i02b1uf', 2, 20000, 40000),
('cmvsw9ba6002611pejx5wm98k', 'cmvsw9b9o002211peh9ump0u8', 'cmvsw9b5q000a11peafrki5ls', 1, 20000, 20000),
('cmvsw9baa002811pe06tlv4cw', 'cmvsw9b9o002211peh9ump0u8', 'cmvsw9b6f000m11pe4uqcdqux', 2, 5000, 10000),
('cmvsw9bak002c11pej61cyqrh', 'cmvsw9bae002a11pek4r4y125', 'cmvsw9b5v000c11peig09ii27', 2, 25000, 50000),
('cmvsw9ban002e11peym0w9k37', 'cmvsw9bae002a11pek4r4y125', 'cmvsw9b6j000o11peyv9gulcc', 2, 7000, 14000),
('cmvsw9baw002i11pejv5hst09', 'cmvsw9bat002g11ped4knh7rd', 'cmvsw9b60000e11peepsukqea', 2, 15000, 30000),
('cmvsw9bb1002k11pe5kdr07ce', 'cmvsw9bat002g11ped4knh7rd', 'cmvsw9b6a000k11pecy7lapxn', 2, 5000, 10000),
('cmvsw9bb6002m11pe2a94k89o', 'cmvsw9bat002g11ped4knh7rd', 'cmvsw9b6f000m11pe4uqcdqux', 2, 5000, 10000),
('cmwd0i3ea000310kd6m768ha9', 'cmwd0i3ea000110kdh7bi2gxu', 'cmvsw9b6j000o11peyv9gulcc', 1, 7000, 7000),
('cmwfernwd0003uebrzpb2y554', 'cmwfernwd0001uebrzj52g9a8', 'cmvsw9b63000g11pe3i02b1uf', 1, 20000, 20000),
('cmwfox6r40003w9kim3oamy8o', 'cmwfox6r30001w9ki0bke3w1x', 'cmvsw9b6j000o11peyv9gulcc', 1, 7000, 7000),
('cmwfox6r40004w9kial4qthco', 'cmwfox6r30001w9ki0bke3w1x', 'cmvsw9b63000g11pe3i02b1uf', 1, 20000, 20000);

-- --------------------------------------------------------
-- 7. Tabel: notification_logs
-- --------------------------------------------------------
DROP TABLE IF EXISTS `notification_logs`;
CREATE TABLE `notification_logs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipientPhone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `providerResponse` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `notification_logs_orderId_fkey` (`orderId`),
  CONSTRAINT `notification_logs_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `notification_logs` (`id`, `orderId`, `recipientPhone`, `message`, `status`, `providerResponse`, `createdAt`) VALUES
('cmwd0i3fd000510kdgmdezano', 'cmwd0i3ea000110kdh7bi2gxu', '6281234567890', '🔔 PESANAN BARU - MIE AYAM & BAKSO OJOLALI

No. Pesanan: ORD-20261112-446
Tanggal: 12 November 2026
Jam: 10.52

Pelanggan: Udin dingin
No. WhatsApp: -

Detail Pesanan:
🍲 Es Jeruk Peras Segar x1 = Rp 7.000

Total Pesanan: Rp 7.000
Metode Pembayaran: QRIS
Status: Menunggu

Silakan buka dashboard admin untuk memproses pesanan.', 'Simulasi Terkirim', NULL, '2026-11-12 10:52:29'),
('cmwfd7vj50001ozmieprvb4y2', NULL, '6289502997292', '🧪 TES NOTIFIKASI WHATSAPP - OJOLALI

Halo Admin! Ini adalah pesan uji coba sistem notifikasi WhatsApp Mie Ayam & Bakso Ojolali.

Waktu Kirim: Sabtu, 14 November 2026 pukul 02.23
Mode: MOCK
Status Sistem: AKTIF & SIAP DIGUNAKAN

Jika Anda menerima pesan ini, konfigurasi WhatsApp Anda telah berjalan dengan sukses! 👍', 'Simulasi Terkirim', NULL, '2026-11-14 02:23:59'),
('cmwfernxm0005uebrzhx3f67v', 'cmwfernwd0001uebrzj52g9a8', '6281234567890', '🔔 PESANAN BARU - MIE AYAM & BAKSO OJOLALI

No. Pesanan: ORD-20261114-870
Tanggal: 14 November 2026
Jam: 03.07

Pelanggan: Agus Salim
No. WhatsApp: 089429338889

Detail Pesanan:
🍜 Mie Ayam Baso x1 = Rp 20.000

Total Pesanan: Rp 20.000
Metode Pembayaran: QRIS
Status: Menunggu

Silakan buka dashboard admin untuk memproses pesanan.', 'Simulasi Terkirim', NULL, '2026-11-14 03:07:22'),
('cmwfernyj0007uebr3sh6d8xb', 'cmwfernwd0001uebrzj52g9a8', '6289429338889', '🍜 Halo Kak Agus Salim!

Terima kasih telah memesan di *Mie Ayam & Bakso Ojolali*. Pesanan Anda telah kami terima dan segera diteruskan ke dapur.

No. Pesanan: ORD-20261114-870
Waktu: 14 November 2026, 03.07

Rincian:
• Mie Ayam Baso x1 = Rp 20.000

Total: Rp 20.000 (QRIS)
Status: Menunggu konfirmasi

Kami akan mengirimkan notifikasi kembali saat pesanan Anda mulai diproses. Selamat menikmati!', 'Simulasi Terkirim', NULL, '2026-11-14 03:07:22'),
('cmwfox6s90006w9kiqo9romlb', 'cmwfox6r30001w9ki0bke3w1x', '6281234567890', '🔔 PESANAN BARU - MIE AYAM & BAKSO OJOLALI

No. Pesanan: ORD-20261114-994
Tanggal: 14 November 2026
Jam: 07.51

Pelanggan: Budi Santoso (Admin Ojolali)
No. WhatsApp: 081234567890

Detail Pesanan:
🍲 Es Jeruk Peras Segar x1 = Rp 7.000
🍜 Mie Ayam Baso x1 = Rp 20.000

Total Pesanan: Rp 27.000
Metode Pembayaran: QRIS
Status: Menunggu

Silakan buka dashboard admin untuk memproses pesanan.', 'Simulasi Terkirim', NULL, '2026-11-14 07:51:36'),
('cmwfox6t50008w9kii9poo9mz', 'cmwfox6r30001w9ki0bke3w1x', '6281234567890', '🍜 Halo Kak Budi Santoso (Admin Ojolali)!

Terima kasih telah memesan di *Mie Ayam & Bakso Ojolali*. Pesanan Anda telah kami terima dan segera diteruskan ke dapur.

No. Pesanan: ORD-20261114-994
Waktu: 14 November 2026, 07.51

Rincian:
• Es Jeruk Peras Segar x1 = Rp 7.000
• Mie Ayam Baso x1 = Rp 20.000

Total: Rp 27.000 (QRIS)
Status: Menunggu konfirmasi

Kami akan mengirimkan notifikasi kembali saat pesanan Anda mulai diproses. Selamat menikmati!', 'Simulasi Terkirim', NULL, '2026-11-14 07:51:36'),
('cmwfoztz4000ew9kil11wq0vk', 'cmwfox6r30001w9ki0bke3w1x', '6281234567890', '✅ PESANAN SUDAH SIAP

No. Pesanan: ORD-20261114-994

Pesanan Anda sudah siap diambil/dihidangkan.

Silakan datang ke tempat pengambilan pesanan.', 'Simulasi Terkirim', NULL, '2026-11-14 07:53:40'),
('cmwfozxpp000gw9kialyn13bx', 'cmwfox6r30001w9ki0bke3w1x', '6281234567890', '🎉 PESANAN SELESAI

No. Pesanan: ORD-20261114-994

Pesanan Anda telah selesai.

Terima kasih telah memesan di Mie Ayam & Bakso Ojolali.', 'Simulasi Terkirim', NULL, '2026-11-14 07:53:44'),
('cmwfp01t5000iw9kilcjrcqai', 'cmwfernwd0001uebrzj52g9a8', '6289429338889', '🎉 PESANAN SELESAI

No. Pesanan: ORD-20261114-870

Pesanan Anda telah selesai.

Terima kasih telah memesan di Mie Ayam & Bakso Ojolali.', 'Simulasi Terkirim', NULL, '2026-11-14 07:53:50'),
('cmwfs46zb000kw9ki7k6vtq1s', 'cmvsw9bat002g11ped4knh7rd', '6281377889900', '🎉 PESANAN SELESAI

No. Pesanan: ORD-20261008-003

Pesanan Anda telah selesai.

Terima kasih telah memesan di Mie Ayam & Bakso Ojolali.', 'Simulasi Terkirim', NULL, '2026-11-14 09:21:02'),
('cmwfs4e56000mw9kio2v6qing', 'cmvsw9bae002a11pek4r4y125', '6282133445566', '🎉 PESANAN SELESAI

No. Pesanan: ORD-20261008-002

Pesanan Anda telah selesai.

Terima kasih telah memesan di Mie Ayam & Bakso Ojolali.', 'Simulasi Terkirim', NULL, '2026-11-14 09:21:11'),
('cmwfs4km7000ow9kiyu3imj9k', 'cmvsw9b9o002211peh9ump0u8', '6285712345678', '🎉 PESANAN SELESAI

No. Pesanan: ORD-20261008-001

Pesanan Anda telah selesai.

Terima kasih telah memesan di Mie Ayam & Bakso Ojolali.', 'Simulasi Terkirim', NULL, '2026-11-14 09:21:20');

SET FOREIGN_KEY_CHECKS = 1;
-- =================== SELESAI ===================
