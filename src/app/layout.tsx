import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/context/theme-context";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import { ToastProvider } from "@/components/ui/toast";
import { ChatbotWidget } from "@/components/chatbot-widget";

export const metadata: Metadata = {
  title: "Baso & Mie Ayam Ojolali — UMKM Kuliner Pilihan",
  description:
    "Sistem manajemen dan pemesanan makanan UMKM Baso di Lingkungan Kecamatan dan Mie Ayam Ojolali. Nikmat, cepat, dan mudah dipesan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 antialiased selection:bg-orange-500 selection:text-white transition-colors duration-200">
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('ojolali-theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(!s&&p)){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.classList.remove('dark');document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();`,
          }}
        />
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <ToastProvider>
                {children}
                <ChatbotWidget />
              </ToastProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
