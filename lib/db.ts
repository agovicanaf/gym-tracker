import { neon } from "@neondatabase/serverless";

// PostgreSQL sürücüsü varsayılan olarak NUMERIC (weight_kg, rpe) ve BIGINT
// (COUNT(*) gibi agregasyonlar) tiplerini JS'e STRING olarak döner — JS'in
// number tipinin büyük/hassas değerleri güvenli temsil edememesi yüzünden
// bu, node-postgres/Neon'un standart davranışıdır. Bu proje o hassasiyet
// aralığına hiç girmiyor (kg cinsinden ağırlıklar, birkaç yüz set kaydı),
// bu yüzden ikisini de number'a çeviriyoruz. Bu sayede API'den dönen JSON'da
// weight_kg: 80 gelir, weight_kg: "80.00" değil — frontend'de her yerde
// Number()/parseFloat() sarmalamaya gerek kalmaz.
const NUMERIC_OID = 1700;
const INT8_OID = 20; // BIGINT — COUNT(*), SUM() gibi agregasyon sonuçları

// Vercel + Neon entegrasyonu kurulduğunda bu env variable otomatik oluşur.
// Yerelde .env.local dosyasına DATABASE_URL eklenmeli.
export function getSql() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL tanımlı değil. Vercel Postgres (Neon) entegrasyonunu bağladığınızdan emin olun."
    );
  }
  return neon(connectionString, {
    types: {
      getTypeParser: (oid: number) => {
        if (oid === NUMERIC_OID || oid === INT8_OID) {
          return (val: string | null) => (val === null ? null : Number(val));
        }
        // Diğer tüm tipler için sürücünün zaten yaptığı şeyi yapıyoruz:
        // ham metni olduğu gibi döndürüyoruz (TEXT, TIMESTAMPTZ, vb. bu
        // şekilde işlenir ve mevcut kodun geri kalanı bunu bekliyor).
        return (val: string | null) => val;
      },
    },
  });
}

export type User = "omer" | "efehan";

export const USER_LABELS: Record<User, string> = {
  omer: "Ömer",
  efehan: "Efehan",
};

export function isValidUser(value: string): value is User {
  return value === "omer" || value === "efehan";
}
