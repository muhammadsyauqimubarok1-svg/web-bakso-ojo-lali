"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Sparkles,
  ChevronDown,
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Users,
  UtensilsCrossed,
  DollarSign,
  Clock,
  QrCode,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "assistant",
  content:
    "Halo! Saya **Oji**, asisten AI resmi **Baso & Mie Ayam Ojolali** 🍜\n\nSaya memahami seluruh menu, harga, ketersediaan stok, jumlah pelanggan, jam buka, hingga panduan pemesanan. Ada yang ingin Anda tanyakan?",
  timestamp: new Date(),
};

const APP_QUICK_ACTIONS = [
  { label: "Pesanan Minggu Ini 📅", query: "Berapa jumlah pesanan minggu ini?", icon: DollarSign },
  { label: "Siapa Saja yang Memesan 📝", query: "Siapa saja yang memesan?", icon: Users },
  { label: "Penjualan Hari Ini 📊", query: "Berapa penjualan hari ini?", icon: DollarSign },
  { label: "Menu Paling Laris 🔥", query: "Menu apa yang paling laris?", icon: UtensilsCrossed },
  { label: "Jumlah Pelanggan 👥", query: "Berapa jumlah pelanggan di warung Ojolali?", icon: Users },
  { label: "Siapa Saya 👤", query: "Siapa saya?", icon: Sparkles },
  { label: "Budget 20 Ribu 💰", query: "Budget 20 ribu bisa makan apa saja?", icon: DollarSign },
  { label: "Daftar Semua Menu 📋", query: "Tampilkan semua daftar menu dan harganya", icon: Sparkles },
  { label: "Jam Buka & Alamat 🕐", query: "Jam buka warung dan alamatnya di mana?", icon: Clock },
  { label: "Cara Bayar QRIS 📱", query: "Bagaimana cara pesan dan bayar pakai QRIS?", icon: QrCode },
];

function formatMarkdown(text: string) {
  // Simple markdown renderer for bold, bullets, and line breaks
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    // Check if bullet point
    const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
    const content = isBullet ? line.trim().replace(/^[•\-]\s*/, "") : line;

    // Bold parser
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    const renderedParts = parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-orange-600 dark:text-orange-400">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });

    if (isBullet) {
      return (
        <div key={lineIdx} className="flex items-start gap-2 my-1 pl-1">
          <span className="text-orange-500 font-bold">•</span>
          <div className="flex-1">{renderedParts}</div>
        </div>
      );
    }

    return (
      <p key={lineIdx} className={line.trim() === "" ? "h-2" : "my-0.5"}>
        {renderedParts}
      </p>
    );
  });
}

export function ChatbotWidget() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom(false);
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollDown(distanceFromBottom > 80);
  };

  const handleRefresh = useCallback(() => {
    if (isLoading) return;
    setMessages([
      {
        ...INITIAL_MESSAGE,
        id: Date.now().toString(),
        timestamp: new Date(),
      },
    ]);
    setInput("");
    setShowScrollDown(false);
    setShowRefreshConfirm(true);
    setTimeout(() => setShowRefreshConfirm(false), 2000);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isLoading]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      const historyForApi = messages
        .filter((m) => m.id !== "init")
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history: historyForApi,
          }),
        });

        const data = await res.json();
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            data.reply ||
            "Maaf, saat ini saya belum dapat menjawab pertanyaan tersebut. Silakan coba sesaat lagi.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Maaf, terjadi gangguan koneksi ke server AI. Silakan coba kembali 🙏",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [isLoading, messages]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  // On full-screen customer AI page, hide floating widget to prevent double chat windows
  if (pathname === "/customer/ai") {
    return null;
  }

  return (
    <>
      {/* --- FLOATING APP TRIGGER BUTTON (Bottom-Right) --- */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2.5 pointer-events-auto select-none">
        {/* Tooltip bubble (shows when closed) */}
        {!isOpen && (
          <div
            onClick={() => setIsOpen(true)}
            className="group cursor-pointer bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md border border-orange-200 dark:border-zinc-700 rounded-2xl px-3.5 py-2 shadow-xl shadow-orange-500/10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:text-orange-600 dark:hover:text-orange-400 hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Tanya Oji (Asisten AI)</span>
            <span className="text-[10px] bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-bold px-1.5 py-0.5 rounded-md">
              AI App
            </span>
          </div>
        )}

        {/* Main Floating Circle Button */}
        <button
          id="chatbot-toggle-btn"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? "Tutup Asisten AI" : "Buka Asisten AI Ojolali"}
          title={isOpen ? "Tutup Obrolan" : "Buka Asisten AI Ojolali"}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-orange-600 via-rose-600 to-amber-500 text-white flex items-center justify-center shadow-xl shadow-orange-600/40 hover:shadow-orange-600/60 hover:scale-108 active:scale-95 transition-all duration-300 relative group cursor-pointer border-2 border-white/20"
        >
          {isOpen ? (
            <X size={26} className="transition-transform duration-200 rotate-0 group-hover:rotate-90" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Bot size={28} className="animate-pulse" />
              {/* Online Green Indicator Dot */}
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-zinc-900 shadow-xs" />
            </div>
          )}

          {/* Pulse Ripple effect */}
          {!isOpen && (
            <span className="absolute -inset-1 rounded-full border-2 border-orange-500/40 animate-ping opacity-60 pointer-events-none" />
          )}
        </button>
      </div>

      {/* --- APP-LIKE FLOATING WINDOW --- */}
      {isOpen && (
        <div
          id="chatbot-window"
          className={`fixed z-50 flex flex-col overflow-hidden transition-all duration-300 ease-out border shadow-2xl ${
            isExpanded
              ? "inset-4 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[500px] sm:h-[680px] rounded-3xl"
              : "bottom-0 sm:bottom-24 inset-x-0 sm:inset-x-auto sm:right-6 w-full sm:w-[390px] h-[90vh] sm:h-[580px] max-h-[92vh] rounded-t-3xl sm:rounded-3xl"
          } bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-orange-500/10 dark:shadow-black/50`}
        >
          {/* Mobile Drag Indicator Bar */}
          <div className="sm:hidden w-full flex justify-center py-2 bg-gradient-to-r from-orange-600 via-rose-600 to-amber-600 shrink-0">
            <div className="w-12 h-1 rounded-full bg-white/40" />
          </div>

          {/* App Header */}
          <div className="bg-gradient-to-r from-orange-600 via-rose-600 to-amber-600 px-4 py-3 sm:py-3.5 flex items-center justify-between shrink-0 text-white shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shrink-0 shadow-inner">
                  <Bot size={22} color="white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-rose-600" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-sm flex items-center gap-1.5 leading-tight">
                  <span className="truncate">Oji Assistant</span>
                  <span className="bg-white/25 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                    <Sparkles size={9} />
                    AI App
                  </span>
                </div>
                <p className="text-[11px] text-orange-100 flex items-center gap-1.5 opacity-90 truncate mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  <span>Online · Siap Jawab Menu & Pelanggan</span>
                </p>
              </div>
            </div>

            {/* Header Control Actions */}
            <div className="flex items-center gap-1">
              {/* Refresh / New Chat */}
              <button
                id="chatbot-refresh-btn"
                onClick={handleRefresh}
                disabled={isLoading}
                title="Mulai obrolan baru"
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/25 active:scale-95 transition text-white disabled:opacity-50"
              >
                {showRefreshConfirm ? (
                  <span className="text-xs font-bold text-emerald-300">✓</span>
                ) : (
                  <RotateCcw size={15} />
                )}
              </button>

              {/* Expand / Minimize (Desktop) */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Perkecil ukuran" : "Perbesar ukuran"}
                className="hidden sm:inline-flex p-1.5 rounded-xl bg-white/10 hover:bg-white/25 active:scale-95 transition text-white"
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                title="Tutup obrolan"
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/25 active:scale-95 transition text-white"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Quick Actions Bar (Horizontal Scrollable Chips) */}
          <div className="px-3 py-2 bg-zinc-100/90 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700/60 overflow-x-auto flex gap-1.5 no-scrollbar shrink-0">
            {APP_QUICK_ACTIONS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => sendMessage(item.query)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-700/80 hover:bg-orange-50 dark:hover:bg-zinc-600 border border-zinc-200 dark:border-zinc-600/80 text-zinc-700 dark:text-zinc-200 hover:text-orange-600 dark:hover:text-orange-300 text-[11px] font-semibold flex items-center gap-1.5 shrink-0 transition shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  <Icon className="w-3 h-3 text-orange-500" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Messages Container */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-zinc-50 dark:bg-zinc-950/70"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 items-end ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-rose-600 flex items-center justify-center shrink-0 mb-3 text-white shadow-xs">
                    <Bot size={16} />
                  </div>
                )}

                <div
                  className={`max-w-[82%] sm:max-w-[78%] flex flex-col gap-1 ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`relative group px-4 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                      msg.role === "user"
                        ? "bg-gradient-to-tr from-orange-600 to-rose-600 text-white rounded-[20px_20px_4px_20px]"
                        : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/80 rounded-[20px_20px_20px_4px]"
                    }`}
                  >
                    {msg.role === "assistant" ? formatMarkdown(msg.content) : msg.content}

                    {/* Copy message button for assistant */}
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        title="Salin jawaban"
                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-2.5 right-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 p-1 rounded-md text-[10px] shadow-xs hover:bg-zinc-200"
                      >
                        {copiedId === msg.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 px-1 font-mono">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-end gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-rose-600 flex items-center justify-center shrink-0 text-white shadow-xs">
                  <Bot size={16} />
                </div>
                <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-[20px_20px_20px_4px] px-4 py-3 shadow-xs flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full bg-orange-500 inline-block animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    Oji sedang berpikir...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom button */}
          {showScrollDown && (
            <button
              onClick={() => scrollToBottom()}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-orange-600 hover:bg-orange-700 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition z-10 cursor-pointer"
            >
              <ChevronDown size={18} />
            </button>
          )}

          {/* Bottom Dock / Input Form */}
          <div className="p-3 sm:p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 space-y-2">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                id="chatbot-input"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder="Tanya menu, harga, jumlah pelanggan... (Enter kirim)"
                rows={1}
                disabled={isLoading}
                className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-xs sm:text-[13px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none transition overflow-hidden"
              />
              <button
                id="chatbot-send-btn"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                aria-label="Kirim pesan"
                className="w-10 h-10 rounded-2xl bg-gradient-to-r from-orange-600 to-rose-600 text-white flex items-center justify-center shrink-0 transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Send size={16} />
              </button>
            </div>

            {/* Micro Badge Footer */}
            <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 px-1">
              <span className="flex items-center gap-1">
                <Sparkles size={10} className="text-orange-500" />
                <span>Ojolali AI Engine v6.0</span>
              </span>
              <span>Data Riil Database Toko</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
