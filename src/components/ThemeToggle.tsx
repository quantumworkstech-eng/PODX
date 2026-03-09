"use client";

import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/context/ThemeContext";

const options: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const CurrentIcon =
    theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        title="Change theme"
        aria-label="Toggle theme"
      >
        <CurrentIcon className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          {options.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => {
                setTheme(value);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                theme === value
                  ? "text-[#D9FC67] bg-[#D9FC67]/10"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
