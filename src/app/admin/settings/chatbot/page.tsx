"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/dashboard/admin-layout";
import { useToast } from "@/components/ui/toast";
import {
  Bot,
  Sparkles,
  Key,
  Cpu,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Zap,
  RotateCcw,
  ShieldCheck,
  Check,
} from "lucide-react";

interface AIModelOption {
  id: string;
  name: string;
  provider: "gemini" | "openai" | "groq";
  description: string;
  badge?: string;
  isRecommended?: boolean;
}

interface ChatbotSettings {
  enabled: boolean;
  provider: "gemini" | "openai" | "groq";
  hasApiKey: boolean;
  maskedApiKey: string;
  model: string;
  temperature: number;
  systemPrompt: string;
}

export default function AdminChatbotSettingsPage() {
  const { toast } = useToast();

  // Settings State
  const [settings, setSettings] = useState<ChatbotSettings>({
    enabled: true,
    provider: "gemini",
    hasApiKey: false,
    maskedApiKey: "",
    model: "gemini-2.0-flash",
    temperature: 0.7,
    systemPrompt: "",
  });
  const [availableModels, setAvailableModels] = useState<AIModelOption[]>([]);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelInput, setCustomModelInput] = useState("");

  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Test State
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    reply?: string;
    latencyMs?: number;
    error?: string;
  } | null>(null);

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await fetch("/api/admin/chatbot/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setAvailableModels(data.availableModels || []);

        // Check if currently configured model is custom
        const isPreset = (data.availableModels || []).some(
          (m: AIModelOption) => m.id === data.settings.model
        );
        if (!isPreset && data.settings.model) {
          setIsCustomModel(true);
          setCustomModelInput(data.settings.model);
        } else {
          setIsCustomModel(false);
        }
      }
    } catch (err) {
      console.error("Error loading Chatbot AI settings:", err);
      toast({
        title: "Gagal Memuat Pengaturan",
        description: "Terjadi gangguan saat mengambil data konfigurasi AI.",
        variant: "error",
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const chosenModel = isCustomModel ? customModelInput.trim() : settings.model;

      if (isCustomModel && !chosenModel) {
        toast({
          title: "Model Tidak Boleh Kosong",
          description: "Silakan masukkan nama model kustom atau pilih model yang tersedia.",
          variant: "error",
        });
        setSavingSettings(false);
        return;
      }

      const res = await fetch("/api/admin/chatbot/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: settings.enabled,
          provider: settings.provider,
          apiKey: apiKeyInput.trim() ? apiKeyInput : undefined,
          model: chosenModel,
          temperature: settings.temperature,
          systemPrompt: settings.systemPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Gagal Menyimpan",
          description: data.error || "Terjadi kesalahan saat menyimpan pengaturan.",
          variant: "error",
        });
        return;
      }

      toast({
        title: "Pengaturan Disimpan",
        description: "Konfigurasi Chatbot AI & Model berhasil diperbarui.",
        variant: "success",
      });

      setApiKeyInput("");
      fetchSettings();
    } catch (err) {
      console.error("Save error:", err);
      toast({
        title: "Kesalahan Sistem",
        description: "Gagal menghubungi server saat menyimpan pengaturan.",
        variant: "error",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  // Test Connection
  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      setTestResult(null);

      const chosenModel = isCustomModel ? customModelInput.trim() : settings.model;
      const keyToTest = apiKeyInput.trim() ? apiKeyInput.trim() : undefined;

      const res = await fetch("/api/admin/chatbot/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: settings.provider,
          apiKey: keyToTest,
          model: chosenModel,
          temperature: settings.temperature,
        }),
      });

      const data = await res.json();
      setTestResult(data);

      if (data.success) {
        toast({
          title: "Koneksi Berhasil! 🎉",
          description: `Model ${chosenModel} aktif dan merespons dalam ${data.latencyMs}ms.`,
          variant: "success",
        });
      } else {
        toast({
          title: "Tes Koneksi Gagal",
          description: data.error || "Model AI tidak dapat merespons.",
          variant: "error",
        });
      }
    } catch (err) {
      console.error("Test error:", err);
      setTestResult({
        success: false,
        error: "Gagal mengirim permintaan tes ke server.",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Filter models based on selected provider
  const filteredModels = availableModels.filter((m) => m.provider === settings.provider);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                <Bot className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                Konfigurasi Chatbot AI & Model
              </h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Atur API Key kecerdasan buatan, pilih model AI (Gemini, OpenAI, Groq), serta kelola persona asisten Oji
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 ${
                settings.enabled && settings.hasApiKey
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  settings.enabled && settings.hasApiKey
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-amber-500"
                }`}
              />
              {settings.enabled && settings.hasApiKey
                ? `AI Aktif (${settings.model})`
                : "Mode Database Lokal (AI Nonaktif)"}
            </span>
          </div>
        </div>

        {/* Navigation Tabs between WhatsApp & Chatbot */}
        <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
          <Link
            href="/admin/settings/chatbot"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-orange-500 text-white shadow-xs flex items-center gap-2"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Chatbot AI & Model</span>
          </Link>
          <Link
            href="/admin/settings/whatsapp"
            className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition flex items-center gap-2"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Notifikasi WhatsApp</span>
          </Link>
        </div>

        {/* Main Grid: Form Settings (Left) & Test / Info Panel (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings Form (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-200 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-600" />
                <h2 className="text-sm font-bold text-zinc-900">Pengaturan Mesin Chatbot</h2>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                />
                Aktifkan Mesin AI
              </label>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* 1. Provider Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-2">
                  1. Pilih Penyedia AI (AI Provider)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Google Gemini */}
                  <div
                    onClick={() => {
                      setSettings({
                        ...settings,
                        provider: "gemini",
                        model: "gemini-2.0-flash",
                      });
                      setIsCustomModel(false);
                    }}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition ${
                      settings.provider === "gemini"
                        ? "border-orange-500 bg-orange-50/50"
                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-zinc-900">Google Gemini</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-orange-700">
                        Rekomendasi
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Gratis, cepat, dan sangat akurat mengenali data menu & restoran.
                    </p>
                  </div>

                  {/* OpenAI */}
                  <div
                    onClick={() => {
                      setSettings({
                        ...settings,
                        provider: "openai",
                        model: "gpt-4o-mini",
                      });
                      setIsCustomModel(false);
                    }}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition ${
                      settings.provider === "openai"
                        ? "border-emerald-500 bg-emerald-50/50"
                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-zinc-900">OpenAI</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">
                        GPT-4o
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Standar industri dengan model GPT-4o & GPT-4o Mini yang cerdas.
                    </p>
                  </div>

                  {/* Groq */}
                  <div
                    onClick={() => {
                      setSettings({
                        ...settings,
                        provider: "groq",
                        model: "llama-3.3-70b-versatile",
                      });
                      setIsCustomModel(false);
                    }}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition ${
                      settings.provider === "groq"
                        ? "border-purple-500 bg-purple-50/50"
                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-zinc-900">Groq (LPU)</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700">
                        Kecepatan Kilat
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Infrastruktur LPU berkecepatan tinggi berbasis Llama 3.3.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. API Key Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-zinc-400" />
                    <span>2. API Key {settings.provider.toUpperCase()}</span>
                  </label>
                  {settings.provider === "gemini" && (
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                    >
                      <span>Dapatkan API Key Gemini Gratis</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {settings.provider === "openai" && (
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                    >
                      <span>Dapatkan API Key OpenAI</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {settings.provider === "groq" && (
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                    >
                      <span>Dapatkan API Key Groq</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={
                      settings.hasApiKey
                        ? `Tersimpan: ${settings.maskedApiKey} (Isi hanya jika ingin mengubah)`
                        : settings.provider === "gemini"
                        ? "Contoh: AIzaSyD..."
                        : settings.provider === "openai"
                        ? "Contoh: sk-..."
                        : "Contoh: gsk_..."
                    }
                    className="w-full px-4 py-2.5 pr-10 text-xs rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-1.5">
                  {settings.hasApiKey ? (
                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      API Key tersimpan aman di database ({settings.maskedApiKey})
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Belum ada API Key. Masukkan kunci agar chatbot dapat memproses dengan AI.
                    </span>
                  )}
                </div>
              </div>

              {/* 3. AI Model Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 mb-2">
                  <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                  <span>3. Pilihan Model AI</span>
                </label>

                {/* Grid of Preset Models */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  {filteredModels.map((m) => {
                    const isSelected = !isCustomModel && settings.model === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          setIsCustomModel(false);
                          setSettings({ ...settings, model: m.id });
                        }}
                        className={`cursor-pointer p-3.5 rounded-2xl border-2 transition relative ${
                          isSelected
                            ? "border-orange-500 bg-orange-50/40 shadow-xs"
                            : "border-zinc-200 hover:border-zinc-300 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-zinc-900">{m.name}</span>
                          </div>
                          {m.badge && (
                            <span
                              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                m.isRecommended
                                  ? "bg-orange-500 text-white"
                                  : "bg-zinc-100 text-zinc-600"
                              }`}
                            >
                              {m.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                          {m.description}
                        </p>
                        <div className="mt-2 text-[10px] font-mono text-zinc-400">
                          ID: {m.id}
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px]">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Option for Custom Model */}
                <div
                  className={`p-3.5 rounded-2xl border-2 transition ${
                    isCustomModel
                      ? "border-orange-500 bg-orange-50/40"
                      : "border-zinc-200 bg-zinc-50"
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-800 mb-2">
                    <input
                      type="checkbox"
                      checked={isCustomModel}
                      onChange={(e) => {
                        setIsCustomModel(e.target.checked);
                        if (e.target.checked && !customModelInput) {
                          setCustomModelInput(settings.model);
                        }
                      }}
                      className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Gunakan Model Kustom / Versi Lainnya</span>
                  </label>
                  {isCustomModel && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={customModelInput}
                        onChange={(e) => setCustomModelInput(e.target.value)}
                        placeholder="Contoh: gemini-2.0-pro-exp-02-05 atau gpt-4o-2024-08-06"
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Ketik nama ID model persis seperti yang dirilis oleh penyedia AI.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Temperature Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                    <span>4. Kreativitas & Variasi Respon (Temperature)</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-orange-600">
                    {settings.temperature.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.temperature}
                  onChange={(e) =>
                    setSettings({ ...settings, temperature: parseFloat(e.target.value) })
                  }
                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                  <span>0.0 (Presisi & Konsisten)</span>
                  <span>0.7 (Standar Rekomendasi)</span>
                  <span>1.0 (Kreatif & Santai)</span>
                </div>
              </div>

              {/* 5. Custom System Persona Prompt */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-zinc-400" />
                    <span>5. Persona & Instruksi Sistem Oji</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        systemPrompt: `Anda adalah "Oji", asisten virtual pintar dan ramah resmi dari warung "Baso & Mie Ayam Ojolali".

Tugas utama Anda:
1. Membantu pelanggan dengan ramah, hangat, dan informatif mengenai menu, daftar harga, status stok ketersediaan, jam buka, lokasi warung, metode pembayaran, dan status pesanan.
2. Memberikan rekomendasi makanan atau paket sesuai selera atau budget pelanggan berdasarkan data menu riil warung.
3. Selalu menggunakan data resmi yang tertera pada konteks toko di bawah. Jangan pernah mengarang menu atau harga yang tidak ada di daftar!
4. Jika pelanggan bertanya hal di luar konteks warung atau kuliner Ojolali, tolak secara sopan dan arahkan kembali ke menu atau layanan warung.
5. Format jawaban dengan rapi menggunakan markdown (tebalkan nama menu/harga, gunakan bullet points jika menyajikan daftar) agar nyaman dibaca.`,
                      });
                    }}
                    className="text-[11px] text-zinc-500 hover:text-zinc-800 flex items-center gap-1 font-medium transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Persona Default</span>
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={settings.systemPrompt}
                  onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                  placeholder="Masukkan persona atau instruksi khusus untuk asisten AI..."
                  className="w-full p-3 text-xs rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 leading-relaxed font-sans"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Sistem secara otomatis akan menggabungkan daftar menu riil, harga, stok, dan jam buka warung dari database ke dalam instruksi ini saat pelanggan bertanya.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="w-full sm:w-auto px-5 py-2.5 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 text-amber-500 ${testingConnection ? "animate-bounce" : ""}`} />
                  <span>{testingConnection ? "Menguji Koneksi..." : "Tes Koneksi Model AI"}</span>
                </button>

                <button
                  type="submit"
                  disabled={savingSettings || loadingSettings}
                  className="w-full sm:w-auto px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${savingSettings ? "animate-spin" : ""}`} />
                  <span>{savingSettings ? "Menyimpan Perubahan..." : "Simpan Konfigurasi"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Testing Results & Help Card */}
          <div className="space-y-6">
            {/* Live Test Panel */}
            <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-zinc-900">Uji Coba Respon AI</h3>
              </div>

              <p className="text-xs text-zinc-500 leading-relaxed">
                Uji langsung apakah API Key dan Model yang Anda pilih berhasil terhubung ke server penyedia AI.
              </p>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${testingConnection ? "animate-pulse" : ""}`} />
                <span>{testingConnection ? "Sedang Mengirim Tes..." : "Jalankan Tes Sekarang"}</span>
              </button>

              {/* Test Result Box */}
              {testResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-2 animate-fadeIn ${
                    testResult.success
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                      : "bg-rose-50/70 border-rose-200 text-rose-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      {testResult.success ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Berhasil Terhubung</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          <span>Koneksi Gagal</span>
                        </>
                      )}
                    </span>
                    {testResult.latencyMs !== undefined && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/70">
                        {testResult.latencyMs} ms
                      </span>
                    )}
                  </div>

                  {testResult.success && testResult.reply && (
                    <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 text-[11px] leading-relaxed text-zinc-700 italic">
                      &quot;{testResult.reply}&quot;
                    </div>
                  )}

                  {!testResult.success && testResult.error && (
                    <div className="bg-white/80 p-3 rounded-xl border border-rose-100 text-[11px] leading-relaxed text-rose-700">
                      {testResult.error}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Smart Fallback & Info Box */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-orange-200/70 p-6 space-y-4">
              <div className="flex items-center gap-2 text-orange-800">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Garansi Tanpa Downtime</h4>
              </div>

              <div className="space-y-2.5 text-xs text-orange-950/80 leading-relaxed">
                <p>
                  <strong>Dual Engine Cerdas:</strong> Website ini dilengkapi sistem perlindungan ganda. Jika kuota API Key habis atau jaringan AI mengalami gangguan:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-orange-900">
                  <li>Sistem otomatis beralih ke <strong>Database Query Engine lokal</strong>.</li>
                  <li>Chatbot tetap dapat menjawab pertanyaan harga, jam buka, rekomendasi, dan status order 100% akurat.</li>
                  <li>Pengunjung warung tidak akan pernah melihat error atau pesan rusak.</li>
                </ul>
              </div>

              <div className="pt-2 border-t border-orange-200/50 flex items-center justify-between text-[11px] font-semibold text-orange-800">
                <span>Model Aktif: {isCustomModel ? customModelInput : settings.model}</span>
                <span className="text-orange-600 font-mono">v6.0 AI Engine</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

