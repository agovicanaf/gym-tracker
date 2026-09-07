-- Antrenman Takip Sistemi — Veritabanı Şeması
-- Bu dosyayı Neon/Vercel Postgres konsolunda bir kez çalıştırın
-- (veya npm run db:init komutuyla otomatik çalıştırın).

CREATE TABLE IF NOT EXISTS workout_days (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL CHECK (user_id IN ('omer', 'efehan')),
  name TEXT NOT NULL,              -- örn: "Push Günü", "Bacak Günü"
  day_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  workout_day_id INTEGER NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,              -- örn: "Bench Press"
  target_sets INTEGER NOT NULL DEFAULT 3,
  target_reps TEXT NOT NULL DEFAULT '8-12',  -- aralık olabilir: "8-12"
  exercise_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Her gerçek antrenmanda girilen tekil set kayıtları (ağırlık takibi burada)
CREATE TABLE IF NOT EXISTS set_logs (
  id SERIAL PRIMARY KEY,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL CHECK (user_id IN ('omer', 'efehan')),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  set_number INTEGER NOT NULL,
  weight_kg NUMERIC(6,2) NOT NULL,
  reps INTEGER NOT NULL,
  rpe NUMERIC(3,1),                -- opsiyonel efor skoru (1-10)
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_set_logs_exercise ON set_logs(exercise_id);
CREATE INDEX IF NOT EXISTS idx_set_logs_user_date ON set_logs(user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_exercises_day ON exercises(workout_day_id);
CREATE INDEX IF NOT EXISTS idx_workout_days_user ON workout_days(user_id);
