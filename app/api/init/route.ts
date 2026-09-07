import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/init
// Veritabanı tablolarını oluşturur (idempotent - CREATE TABLE IF NOT EXISTS).
// İlk kurulumda arayüzden bir kere tetiklenir.
export async function POST() {
  try {
    const sql = getSql();
    const schemaPath = join(process.cwd(), "scripts", "schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");

    const statements = schema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      await sql.query(statement);
    }

    return NextResponse.json({ success: true, message: "Veritabanı hazır." });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Bilinmeyen hata" },
      { status: 500 }
    );
  }
}

// GET /api/init -> tabloların var olup olmadığını kontrol eder
export async function GET() {
  try {
    const sql = getSql();
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'workout_days'
      ) as ready
    `;
    return NextResponse.json({ ready: result[0].ready });
  } catch (err: unknown) {
    return NextResponse.json(
      { ready: false, error: err instanceof Error ? err.message : "Bilinmeyen hata" },
      { status: 500 }
    );
  }
}
