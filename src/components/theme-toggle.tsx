"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/theme-context";

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ showLabel = false, className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse ${className}`}
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
      title={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
      className={`relative inline-flex items-center gap-2 p-2 rounded-xl transition-all duration-300 border ${
        isDark
          ? "bg-zinc-800/90 text-amber-300 border-zinc-700 hover:bg-zinc-700 hover:text-amber-200 shadow-xs"
          : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 hover:text-orange-700 shadow-xs"
      } ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-4 h-4 transition-transform duration-300 rotate-0 scale-100 text-amber-300" />
        ) : (
          <Sun className="w-4 h-4 transition-transform duration-300 rotate-0 scale-100 text-orange-600" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold select-none pr-1">
          {isDark ? "Mode Gelap" : "Mode Terang"}
        </span>
      )}
    </button>
  );
}

