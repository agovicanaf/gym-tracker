"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, TrendingUp, ChevronDown, ChevronUp, Pencil, X, Check } from "lucide-react";
import { api } from "@/lib/api";
import type { ExerciseWithLogs, SetLog } from "@/lib/types";
import type { User } from "@/lib/db";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

export default function ExerciseCard({
  exercise,
  user,
  onDeleted,
  onLogAdded,
}: {
  exercise: ExerciseWithLogs;
  user: User;
  onDeleted: () => void;
  onLogAdded: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState<SetLog[] | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(exercise.name);
  const [editSets, setEditSets] = useState(String(exercise.target_sets));
  const [editReps, setEditReps] = useState(exercise.target_reps);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);

  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editLogWeight, setEditLogWeight] = useState("");
  const [editLogReps, setEditLogReps] = useState("");
  const [savingLogId, setSavingLogId] = useState<number | null>(null);
  const [editLogError, setEditLogError] = useState<string | null>(null);

  const lastLog = exercise.logs?.[0];

  const refreshLogs = useCallback(
    async (showLoading: boolean) => {
      if (showLoading) setLoadingLogs(true);
      try {
        const data = await api.getSetLogs(exercise.id);
        setLogs(data);
      } catch {
        if (showLoading) setLogs([]);
        // sessiz arka plan yenilemesinde hata olursa mevcut listeyi koru
      } finally {
        if (showLoading) setLoadingLogs(false);
      }
    },
    [exercise.id]
  );

  async function toggleExpand() {
    const next = !expanded;
    setExpanded(next);
    if (next && logs === null) {
      await refreshLogs(true);
    }
  }

  // Çoklu cihaz senkronizasyonu: bu kart açıkken (geçmiş kayıtlar görünürken)
  // başka bir cihazdan eklenen/silinen/değiştirilen setlerin de kısa sürede
  // burada görünmesi için her 2 saniyede bir arka planda tazeliyoruz. Kullanıcı
  // tam o anda bir kaydı düzenliyor veya siliyorsa (editingLogId/deletingLogId
  // dolu) araya girip taslağını bozmamak için o turu atlıyoruz.
  useEffect(() => {
    if (!expanded) return;

    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (editingLogId !== null) return;
      if (deletingLogId !== null) return;
      refreshLogs(false);
    }, 2000);

    return () => clearInterval(interval);
  }, [expanded, editingLogId, deletingLogId, refreshLogs]);

  async function handleAddSet() {
    const w = parseFloat(weight.replace(",", "."));
    const r = parseInt(reps, 10);
    if (isNaN(w) || w <= 0) {
      setError("Geçerli bir ağırlık girin");
      return;
    }
    if (isNaN(r) || r <= 0) {
      setError("Geçerli bir tekrar sayısı girin");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const nextSetNumber = (logs?.filter(
        (l) => new Date(l.logged_at).toDateString() === new Date().toDateString()
      ).length ?? 0) + 1;

      const newLog = await api.createSetLog({
        exercise_id: exercise.id,
        user_id: user,
        set_number: nextSetNumber,
        weight_kg: w,
        reps: r,
      });
      setLogs((prev) => (prev ? [newLog, ...prev] : [newLog]));
      setWeight("");
      setReps("");
      onLogAdded();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteLog(id: number) {
    if (!confirm("Bu set kaydını silmek istediğine emin misin?")) return;
    setDeletingLogId(id);
    try {
      await api.deleteSetLog(id);
      setLogs((prev) => prev?.filter((l) => l.id !== id) ?? null);
      onLogAdded();
    } catch {
      // sessizce yok say, kullanıcı tekrar deneyebilir
    } finally {
      setDeletingLogId(null);
    }
  }

  function startEditingLog(log: SetLog) {
    setEditingLogId(log.id);
    setEditLogWeight(String(log.weight_kg));
    setEditLogReps(String(log.reps));
    setEditLogError(null);
  }

  function cancelEditingLog() {
    setEditingLogId(null);
    setEditLogError(null);
  }

  async function handleSaveLogEdit(log: SetLog) {
    const w = parseFloat(editLogWeight.replace(",", "."));
    const r = parseInt(editLogReps, 10);
    if (isNaN(w) || w <= 0) {
      setEditLogError("Geçerli bir ağırlık girin");
      return;
    }
    if (isNaN(r) || r <= 0) {
      setEditLogError("Geçerli bir tekrar sayısı girin");
      return;
    }
    setEditLogError(null);
    setSavingLogId(log.id);
    try {
      const updated = await api.updateSetLog(log.id, { weight_kg: w, reps: r });
      setLogs((prev) =>
        prev ? prev.map((l) => (l.id === log.id ? updated : l)) : null
      );
      setEditingLogId(null);
      onLogAdded();
    } catch (e: unknown) {
      setEditLogError(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setSavingLogId(null);
    }
  }

  async function handleDeleteExercise() {
    if (!confirm(`"${exercise.name}" hareketini silmek istediğine emin misin? Tüm kayıtları silinecek.`)) return;
    await api.deleteExercise(exercise.id);
    onDeleted();
  }

  function startEditing() {
    setEditName(exercise.name);
    setEditSets(String(exercise.target_sets));
    setEditReps(exercise.target_reps);
    setEditing(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = editName.trim();
    if (!trimmedName) return;
    setSavingEdit(true);
    try {
      await api.updateExercise(exercise.id, {
        name: trimmedName,
        target_sets: parseInt(editSets, 10) || exercise.target_sets,
        target_reps: editReps.trim() || exercise.target_reps,
      });
      setEditing(false);
      onLogAdded();
    } finally {
      setSavingEdit(false);
    }
  }

  // PR: en son kayıt, ondan önceki tüm kayıtların en yükseğini eşitliyor ya
  // da geçiyor mu? (Sadece "tek kayıt var, o da en yüksek" durumunu PR
  // saymamak için önceki kayıtlarla kıyaslıyoruz — ilk set otomatik PR olmasın.)
  const previousLogs = exercise.logs.slice(1);
  const isPR =
    !!lastLog &&
    previousLogs.length > 0 &&
    lastLog.weight_kg >= Math.max(...previousLogs.map((l) => l.weight_kg));

  return (
    <div className="border border-border rounded-lg bg-surface overflow-hidden">
      {editing ? (
        <form
          onSubmit={handleSaveEdit}
          className="px-4 py-3.5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-body font-medium text-text">Hareketi Düzenle</p>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-text-faint hover:text-text"
              aria-label="Vazgeç"
            >
              <X size={16} />
            </button>
          </div>
          <input
            autoFocus
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-text font-body text-sm focus:border-accent outline-none"
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[11px] text-text-muted mb-1 font-body">Set</label>
              <input
                type="text"
                inputMode="numeric"
                value={editSets}
                onChange={(e) => setEditSets(e.target.value)}
                className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-text font-body text-sm focus:border-accent outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] text-text-muted mb-1 font-body">Tekrar aralığı</label>
              <input
                type="text"
                value={editReps}
                onChange={(e) => setEditReps(e.target.value)}
                placeholder="8-12"
                className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-text font-body text-sm focus:border-accent outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingEdit || !editName.trim()}
            className="w-full flex items-center justify-center gap-1.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-body font-medium py-2 rounded-md transition-colors"
          >
            <Check size={15} />
            Kaydet
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between px-4 py-3.5">
          <button
            onClick={toggleExpand}
            className="flex-1 flex items-center gap-3 text-left min-w-0"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-body font-medium text-text truncate">
                  {exercise.name}
                </span>
                {isPR && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-success bg-success/10 px-1.5 py-0.5 rounded">
                    <TrendingUp size={10} /> PR
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Hedef: {exercise.target_sets} set × {exercise.target_reps} tekrar
                {lastLog && (
                  <span className="text-text-faint">
                    {" "}
                    · son: {lastLog.weight_kg}kg × {lastLog.reps}
                  </span>
                )}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={startEditing}
              className="p-2 text-text-faint hover:text-text transition-colors"
              aria-label="Hareketi düzenle"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={handleDeleteExercise}
              className="p-2 text-text-faint hover:text-accent transition-colors"
              aria-label="Hareketi sil"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={toggleExpand}
              className="p-2 text-text-muted hover:text-text transition-colors"
              aria-label={expanded ? "Daralt" : "Genişlet"}
            >
              {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </button>
          </div>
        </div>
      )}

      {expanded && !editing && (
        <div className="border-t border-border px-4 py-4 bg-bg/40">
          <div className="flex items-end gap-2 mb-4">
            <div className="flex-1">
              <label className="block text-[11px] text-text-muted mb-1.5 font-body">
                Ağırlık (kg)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0"
                className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-text font-body text-sm focus:border-accent outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] text-text-muted mb-1.5 font-body">
                Tekrar
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="0"
                className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-text font-body text-sm focus:border-accent outline-none"
              />
            </div>
            <button
              onClick={handleAddSet}
              disabled={saving}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-body font-medium px-4 py-2 rounded-md transition-colors h-[38px]"
            >
              <Plus size={15} />
              Set Ekle
            </button>
          </div>
          {error && <p className="text-xs text-accent mb-3">{error}</p>}

          {loadingLogs ? (
            <p className="text-xs text-text-faint">Yükleniyor…</p>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[11px] text-text-faint font-body mb-2">
                GEÇMİŞ KAYITLAR
              </p>
              {logs.slice(0, 8).map((log) =>
                editingLogId === log.id ? (
                  <div
                    key={log.id}
                    className="rounded bg-surface-raised border border-accent px-2.5 py-2 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted text-xs w-16 shrink-0">
                        {formatDate(log.logged_at)}
                      </span>
                      <input
                        autoFocus
                        type="text"
                        inputMode="decimal"
                        value={editLogWeight}
                        onChange={(e) => setEditLogWeight(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") cancelEditingLog();
                          if (e.key === "Enter") handleSaveLogEdit(log);
                        }}
                        placeholder="kg"
                        className="w-16 bg-surface border border-border rounded-md px-2 py-1.5 text-text font-body text-sm focus:border-accent outline-none"
                      />
                      <span className="text-text-faint text-xs shrink-0">kg ×</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editLogReps}
                        onChange={(e) => setEditLogReps(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") cancelEditingLog();
                          if (e.key === "Enter") handleSaveLogEdit(log);
                        }}
                        placeholder="tekrar"
                        className="w-16 bg-surface border border-border rounded-md px-2 py-1.5 text-text font-body text-sm focus:border-accent outline-none"
                      />
                      <div className="flex items-center gap-1 ml-auto shrink-0">
                        <button
                          onClick={() => handleSaveLogEdit(log)}
                          disabled={savingLogId === log.id}
                          className="p-2 text-accent hover:text-accent-hover disabled:opacity-50 transition-colors"
                          aria-label="Kaydı güncelle"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={cancelEditingLog}
                          className="p-2 text-text-faint hover:text-text transition-colors"
                          aria-label="Vazgeç"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                    {editLogError && (
                      <p className="text-xs text-accent">{editLogError}</p>
                    )}
                  </div>
                ) : (
                  <div
                    key={log.id}
                    className="flex items-center justify-between text-sm py-1.5 px-2.5 rounded bg-surface/60 group"
                  >
                    <span className="text-text-muted text-xs w-16 shrink-0">
                      {formatDate(log.logged_at)}
                    </span>
                    <span className="text-text font-body flex-1">
                      {log.weight_kg}kg × {log.reps} tekrar
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditingLog(log)}
                        className="p-2 -m-0.5 text-text-faint hover:text-accent transition-colors"
                        aria-label="Kaydı düzenle"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        disabled={deletingLogId === log.id}
                        className="p-2 -m-0.5 text-text-faint hover:text-accent transition-colors disabled:opacity-30"
                        aria-label="Kaydı sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-xs text-text-faint">Henüz kayıt yok. İlk seti ekle.</p>
          )}
        </div>
      )}
    </div>
  );
}
