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
    total_sessions: string;
    total_sets: string;
    total_volume_kg: string;
    heaviest_lift: string;
  };
  exerciseProgress: Array<{
    exercise_id: number;
    exercise_name: string;
    max_weight: string;
    latest_weight: string;
    total_sets_logged: string;
    last_logged: string;
  }>;
  timeSeries: Array<{
    exercise_id: number;
    exercise_name: string;
    log_date: string;
    max_weight: string;
    day_volume: string;
  }>;
  weeklyVolume: Array<{
    week_start: string;
    total_volume: string;
  }>;
}

export interface WorkoutDayWithExercises extends WorkoutDay {
  exercises: ExerciseWithLogs[];
}
