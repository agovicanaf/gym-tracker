"use client";

import { useState } from "react";
import { Plus, Trash2, X, Pencil, Check } from "lucide-react";
import { api } from "@/lib/api";
import ExerciseCard from "@/components/ExerciseCard";
import ExerciseAutocomplete from "@/components/ExerciseAutocomplete";
import type { WorkoutDayWithExercises } from "@/lib/types";
import type { User } from "@/lib/db";

export default function WorkoutDayCard({
  day,
  user,
  exerciseHistory,
  onChanged,
}: {
  day: WorkoutDayWithExercises;
  user: User;
  exerciseHistory: string[];
  onChanged: () => void;
}) {
  const [addingExercise, setAddingExercise] = useState(false);
  const [exName, setExName] = useState("");
  const [exSets, setExSets] = useState("3");
  const [exReps, setExReps] = useState("8-12");
  const [saving, setSaving] = useState(false);
  const [exError, setExError] = useState<string | null>(null);

  const [editingDay, setEditingDay] = useState(false);
  const [dayNameDraft, setDayNameDraft] = useState(day.name);
  const [savingDayName, setSavingDayName] = useState(false);
  const [dayNameError, setDayNameError] = useState<string | null>(null);
  const [deletingDay, setDeletingDay] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleAddExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!exName.trim()) return;
    setSaving(true);
    setExError(null);
    try {
      await api.createExercise(
        day.id,
        exName.trim(),
        parseInt(exSets, 10) || 3,
        exReps.trim() || "8-12"
      );
      setExName("");
      setExSets("3");
      setExReps("8-12");
      setAddingExercise(false);
      onChanged();
    } catch (e: unknown) {
      // Formu kapatmıyoruz: kullanıcı girdiği bilgiyi kaybetmesin ve
      // "Ekle"ye tekrar basabilsin. Sessizce başarısız olup hareketin
      // hiç eklenmediğini fark etmemesi en kötü senaryo.
      setExError(e instanceof Error ? e.message : "Hareket eklenemedi");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteDay() {
    if (!confirm(`"${day.name}" gününü silmek istediğine emin misin? İçindeki tüm hareketler ve kayıtlar silinecek.`)) return;
    setDeletingDay(true);
    setDeleteError(null);
    try {
      await api.deleteWorkoutDay(day.id);
      onChanged();
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : "Gün silinemedi");
    } finally {
      setDeletingDay(false);
    }
  }

  function startEditingDay() {
    setDayNameDraft(day.name);
    setDayNameError(null);
    setEditingDay(true);
  }

  async function handleSaveDayName(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = dayNameDraft.trim();
    if (!trimmed || trimmed === day.name) {
      setEditingDay(false);
      return;
    }
    setSavingDayName(true);
    setDayNameError(null);
    try {
      await api.renameWorkoutDay(day.id, trimmed);
      setEditingDay(false);
      onChanged();
    } catch (e: unknown) {
      // Düzenleme kutusunu açık bırakıyoruz ki kullanıcı tekrar deneyebilsin.
      setDayNameError(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setSavingDayName(false);
    }
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3 gap-2">
        {editingDay ? (
          <div className="flex-1 min-w-0">
            <form onSubmit={handleSaveDayName} className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={dayNameDraft}
                onChange={(e) => setDayNameDraft(e.target.value)}
                onBlur={handleSaveDayName}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setDayNameDraft(day.name);
                    setDayNameError(null);
                    setEditingDay(false);
                  }
                }}
                className="flex-1 min-w-0 bg-surface-raised border border-accent rounded-md px-3 py-1.5 font-display text-xl sm:text-2xl text-text tracking-wide outline-none"
              />
              <button
                type="submit"
                disabled={savingDayName || !dayNameDraft.trim()}
                className="p-2 text-accent hover:text-accent-hover disabled:opacity-50 transition-colors shrink-0"
                aria-label="Kaydet"
              >
                <Check size={18} />
              </button>
            </form>
            {dayNameError && (
              <p className="text-xs text-accent mt-1">{dayNameError}</p>
            )}
          </div>
        ) : (
          <button
            onClick={startEditingDay}
            className="group/title flex items-center gap-2 min-w-0 text-left"
            aria-label="Gün adını düzenle"
          >
            <h2 className="font-display text-2xl sm:text-3xl text-text tracking-wide truncate">
              {day.name}
            </h2>
            <Pencil
              size={14}
              className="text-text-faint opacity-60 sm:opacity-0 sm:group-hover/title:opacity-100 transition-opacity shrink-0"
            />
          </button>
        )}
        <button
          onClick={handleDeleteDay}
          disabled={deletingDay}
          className="p-2 text-text-faint hover:text-accent transition-colors shrink-0 disabled:opacity-40"
          aria-label="Günü sil"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {deleteError && (
        <p className="text-xs text-accent mb-2">{deleteError}</p>
      )}

      <div className="space-y-2">
        {day.exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            user={user}
            onDeleted={onChanged}
            onLogAdded={onChanged}
          />
        ))}
      </div>

      {addingExercise ? (
        <form
          onSubmit={handleAddExercise}
          className="mt-3 border border-border rounded-lg bg-surface p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-body font-medium text-text">Yeni Hareket</p>
            <button
              type="button"
              onClick={() => setAddingExercise(false)}
              className="text-text-faint hover:text-text"
            >
              <X size={16} />
            </button>
          </div>
          <ExerciseAutocomplete
            autoFocus
            value={exName}
            onChange={setExName}
            history={exerciseHistory}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[11px] text-text-muted mb-1 font-body">Set</label>
              <input
                type="text"
                inputMode="numeric"
                value={exSets}
                onChange={(e) => setExSets(e.target.value)}
                className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-text font-body text-sm focus:border-accent outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] text-text-muted mb-1 font-body">Tekrar aralığı</label>
              <input
                type="text"
                value={exReps}
                onChange={(e) => setExReps(e.target.value)}
                placeholder="8-12"
                className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-text font-body text-sm focus:border-accent outline-none"
              />
            </div>
          </div>
          {exError && <p className="text-xs text-accent">{exError}</p>}
          <button
            type="submit"
            disabled={saving || !exName.trim()}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-body font-medium py-2 rounded-md transition-colors"
          >
            {saving ? "Ekleniyor…" : "Ekle"}
          </button>
        </form>
      ) : (
        <button
          onClick={() => {
            setExError(null);
            setAddingExercise(true);
          }}
          className="mt-2 w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-lg py-3 text-sm text-text-muted hover:text-text hover:border-border-strong transition-colors font-body"
        >
          <Plus size={15} />
          Hareket Ekle
        </button>
      )}
    </section>
  );
}
