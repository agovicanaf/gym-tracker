export interface WorkoutDay {
  id: number;
  user_id: string;
  name: string;
  day_order: number;
  created_at: string;
}

export interface Exercise {
  id: number;
  workout_day_id: number;
  name: string;
  target_sets: number;
  target_reps: string;
  exercise_order: number;
  created_at: string;
}

export interface SetLog {
  id: number;
  exercise_id: number;
  user_id: string;
  logged_at: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  rpe: number | null;
  notes: string | null;
}

export interface ExerciseWithLogs extends Exercise {
  logs: SetLog[];
}

export interface StatsResponse {
  summary: {
    // Not: Bu alanlar veritabanından COUNT/SUM/MAX ile geliyor. lib/db.ts'teki
    // getSql() içinde NUMERIC (OID 1700) ve BIGINT (OID 20) tipleri için özel
    // bir tip dönüştürücü tanımlı olduğundan bunlar sürücüden JS number olarak
    // gelir, string olarak değil. Önceki sürümde bu alanlar yanlışlıkla
    // string olarak tanımlanmıştı; number'a düzeltildi ki tip kontrolleri
    // gerçek çalışma zamanı davranışıyla eşleşsin.
    total_sessions: number;
    total_sets: number;
    total_volume_kg: number;
    heaviest_lift: number;
  };
  exerciseProgress: Array<{
    exercise_id: number;
    exercise_name: string;
    max_weight: number;
    latest_weight: number;
    total_sets_logged: number;
    last_logged: string;
  }>;
  timeSeries: Array<{
    exercise_id: number;
    exercise_name: string;
    log_date: string;
    max_weight: number;
    day_volume: number;
  }>;
  weeklyVolume: Array<{
    week_start: string;
    total_volume: number;
  }>;
}

export interface WorkoutDayWithExercises extends WorkoutDay {
  exercises: ExerciseWithLogs[];
}
