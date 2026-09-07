import { neon } from "@neondatabase/serverless";

// Vercel + Neon entegrasyonu kurulduğunda bu env variable otomatik oluşur.
// Yerelde .env.local dosyasına DATABASE_URL eklenmeli.
export function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL tanımlı değil. Vercel Postgres (Neon) entegrasyonunu bağladığınızdan emin olun."
    );
  }
  return neon(connectionString);
}

export type User = "omer" | "efehan";

export const USER_LABELS: Record<User, string> = {
  omer: "Ömer",
  efehan: "Efehan",
};

export function isValidUser(value: string): value is User {
  return value === "omer" || value === "efehan";
}
