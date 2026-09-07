"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
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

  async function handleAddExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!exName.trim()) return;
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteDay() {
    if (!confirm(`"${day.name}" gününü silmek istediğine emin misin? İçindeki tüm hareketler ve kayıtlar silinecek.`)) return;
    await api.deleteWorkoutDay(day.id);
    onChanged();
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-3xl text-text tracking-wide">
          {day.name}
        </h2>
        <button
          onClick={handleDeleteDay}
          className="p-2 text-text-faint hover:text-accent transition-colors"
          aria-label="Günü sil"
        >
          <Trash2 size={16} />
        </button>
      </div>

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
          <button
            type="submit"
            disabled={saving || !exName.trim()}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-body font-medium py-2 rounded-md transition-colors"
          >
            Ekle
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAddingExercise(true)}
          className="mt-2 w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-lg py-3 text-sm text-text-muted hover:text-text hover:border-border-strong transition-colors font-body"
        >
          <Plus size={15} />
          Hareket Ekle
        </button>
      )}
    </section>
  );
}
