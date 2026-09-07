// Kullanım: DATABASE_URL ortam değişkeni tanımlıyken `node scripts/init-db.mjs` çalıştırın.
// Ya da `npm run db:init` (package.json'a eklenmiştir).
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("HATA: DATABASE_URL ortam değişkeni bulunamadı.");
  console.error("Vercel'den 'vercel env pull .env.local' ile çekebilir ya da .env.local dosyasına elle ekleyebilirsiniz.");
  process.exit(1);
}

const sql = neon(connectionString);
const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");

// Basit split: her CREATE ifadesini ayrı çalıştır (neon sql tag'i tek seferde
// çoklu statement'ı desteklemez).
const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--"));

try {
  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log("✅ Veritabanı şeması başarıyla oluşturuldu.");
} catch (err) {
  console.error("❌ Şema oluşturulurken hata:", err);
  process.exit(1);
}
