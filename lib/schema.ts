// Veritabanı şeması — scripts/schema.sql ile birebir aynı tutulmalıdır.
//
// Bunu (readFileSync ile scripts/schema.sql'i okumak yerine) doğrudan kod
// içine gömülü bir string olarak tutuyoruz, çünkü Vercel'in serverless
// fonksiyon paketleyicisi (Node File Trace) build klasörü dışındaki
// dosyaları bazı durumlarda otomatik olarak dahil etmeyebiliyor — bu da
// yerelde çalışıp production'da "dosya bulunamadı" hatası veren, teşhisi
// zor bir hataya yol açabilir. Kod içine gömmek bu riski tamamen ortadan
// kaldırır.
//
// scripts/schema.sql dosyası, `npm run db:init` ile yerelden kurulum
// yapmak isteyenler için ayrıca duruyor — schema.sql'i değiştirirseniz
// bu dosyayı da güncelleyin.
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS workout_days (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL CHECK (user_id IN ('omer')),
  name TEXT NOT NULL,
  day_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  workout_day_id INTEGER NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_sets INTEGER NOT NULL DEFAULT 3,
  target_reps TEXT NOT NULL DEFAULT '8-12',
  exercise_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS set_logs (
  id SERIAL PRIMARY KEY,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL CHECK (user_id IN ('omer')),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  set_number INTEGER NOT NULL,
  weight_kg NUMERIC(6,2) NOT NULL,
  reps INTEGER NOT NULL,
  rpe NUMERIC(3,1),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_set_logs_exercise ON set_logs(exercise_id);
CREATE INDEX IF NOT EXISTS idx_set_logs_user_date ON set_logs(user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_exercises_day ON exercises(workout_day_id);
CREATE INDEX IF NOT EXISTS idx_workout_days_user ON workout_days(user_id);
`;

// scripts/init-db.mjs ve app/api/init/route.ts'nin ikisi de aynı split
// mantığını kullanıyor: her ; ile biten ifadeyi ayrı çalıştırıyoruz çünkü
// Neon'un sql tag fonksiyonu tek seferde çoklu statement'ı desteklemiyor.
export function splitStatements(schema: string): string[] {
  return schema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
}
