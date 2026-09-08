import type { WorkoutDayWithExercises, SetLog, StatsResponse } from "@/lib/types";

// Veritabanı tabloları henüz kurulmamışken /api/workout-days'in döndüğü
// özel durumu (409 + needsInit:true) ayırt etmek için kullanılıyor.
// Böylece sayfa açılışında ayrı bir /api/init GET isteği yapmaya gerek
// kalmıyor — checkInit ve getWorkoutDays tek isteğe indi, açılış hızlandı.
export class NeedsInitError extends Error {
  constructor() {
    super("Veritabanı henüz kurulmamış");
    this.name = "NeedsInitError";
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 409 && body?.needsInit) {
      throw new NeedsInitError();
    }
    throw new Error(body.error ?? `İstek başarısız (${res.status})`);
  }
  return res.json();
}

export const api = {
  checkInit: () => fetch("/api/init").then((r) => handle<{ ready: boolean }>(r)),
  runInit: () =>
    fetch("/api/init", { method: "POST" }).then((r) =>
      handle<{ success: boolean; message?: string; error?: string }>(r)
    ),

  getWorkoutDays: (user: string) =>
    fetch(`/api/workout-days?user=${user}`).then((r) =>
      handle<WorkoutDayWithExercises[]>(r)
    ),

  createWorkoutDay: (user_id: string, name: string) =>
    fetch("/api/workout-days", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, name }),
    }).then((r) => handle(r)),

  renameWorkoutDay: (id: number, name: string) =>
    fetch(`/api/workout-days/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then((r) => handle(r)),

  deleteWorkoutDay: (id: number) =>
    fetch(`/api/workout-days/${id}`, { method: "DELETE" }).then((r) => handle(r)),

  createExercise: (
    workout_day_id: number,
    name: string,
    target_sets: number,
    target_reps: string
  ) =>
    fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workout_day_id, name, target_sets, target_reps }),
    }).then((r) => handle(r)),

  updateExercise: (
    id: number,
    data: Partial<{ name: string; target_sets: number; target_reps: string }>
  ) =>
    fetch(`/api/exercises/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handle(r)),

  deleteExercise: (id: number) =>
    fetch(`/api/exercises/${id}`, { method: "DELETE" }).then((r) => handle(r)),

  getSetLogs: (exerciseId: number) =>
    fetch(`/api/set-logs?exercise_id=${exerciseId}`).then((r) =>
      handle<SetLog[]>(r)
    ),

  createSetLog: (data: {
    exercise_id: number;
    user_id: string;
    set_number: number;
    weight_kg: number;
    reps: number;
    rpe?: number | null;
    notes?: string | null;
  }) =>
    fetch("/api/set-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handle<SetLog>(r)),

  updateSetLog: (
    id: number,
    data: Partial<{
      weight_kg: number;
      reps: number;
      rpe: number | null;
      notes: string | null;
      logged_at: string;
    }>
  ) =>
    fetch(`/api/set-logs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handle<SetLog>(r)),

  deleteSetLog: (id: number) =>
    fetch(`/api/set-logs/${id}`, { method: "DELETE" }).then((r) => handle(r)),

  getStats: (user: string, range: "30d" | "90d" | "all" = "all") =>
    fetch(`/api/stats?user=${user}&range=${range}`).then((r) =>
      handle<StatsResponse>(r)
    ),
};
