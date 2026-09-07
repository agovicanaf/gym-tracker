"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSuggestions, type ExerciseSuggestion } from "@/lib/exercise-library";

export default function ExerciseAutocomplete({
  value,
  onChange,
  history,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  history: string[];
  autoFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [rawActiveIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(
    () => getSuggestions(value, history),
    [value, history]
  );

  // Öneri listesi değiştiğinde eski index sınırların dışında kalabilir;
  // effect yerine render sırasında clamp ederek senkron tutuyoruz.
  const activeIndex =
    rawActiveIndex >= suggestions.length ? -1 : rawActiveIndex;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectSuggestion(name: string) {
    onChange(name);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex].name);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        autoFocus={autoFocus}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Hareket adı (örn: inc yaz, Incline Bench Press çıksın)"
        autoComplete="off"
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-autocomplete="list"
        className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-text font-body text-sm focus:border-accent outline-none"
      />

      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1.5 w-full bg-surface-raised border border-border rounded-md shadow-lg overflow-hidden max-h-64 overflow-y-auto"
        >
          {suggestions.map((s, i) => (
            <li key={`${s.group}-${s.name}`} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSuggestion(s.name);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors ${
                  i === activeIndex ? "bg-accent-dim/30" : "hover:bg-bg/60"
                }`}
              >
                <span className="text-sm text-text font-body truncate">{s.name}</span>
                <span className="text-[10px] text-text-faint shrink-0">{s.group}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
