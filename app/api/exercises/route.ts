import { NextRequest, NextResponse } from "next/server";
import { getSql, isValidUser } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/exercises?user=omer
// Kullanıcının daha önce girdiği tüm hareket isimlerini (tekilleştirilmiş) döner.
// Hareket ekleme formundaki öneri listesinde kullanılır.
export async function GET(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user") ?? "";
  if (!isValidUser(user)) {
    return NextResponse.json({ error: "Geçersiz kullanıcı" }, { status: 400 });
  }

  const sql = getSql();

  const rows = await sql`
    SELECT DISTINCT e.name FROM exercises e
    JOIN workout_days d ON e.workout_day_id = d.id
    WHERE d.user_id = ${user}
    ORDER BY e.name ASC
  `;

  return NextResponse.json(rows.map((r) => (r as { name: string }).name));
}

// POST /api/exercises
// Body: { workout_day_id, name, target_sets, target_reps }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { workout_day_id, name, target_sets, target_reps } = body;

  if (!workout_day_id || !name || typeof name !== "string") {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const sql = getSql();

  const maxOrderResult = await sql`
    SELECT COALESCE(MAX(exercise_order), -1) as max_order FROM exercises WHERE workout_day_id = ${workout_day_id}
  `;
  const nextOrder = Number(maxOrderResult[0].max_order) + 1;

  const [exercise] = await sql`
    INSERT INTO exercises (workout_day_id, name, target_sets, target_reps, exercise_order)
    VALUES (
      ${workout_day_id},
      ${name.trim()},
      ${target_sets ?? 3},
      ${target_reps ?? "8-12"},
      ${nextOrder}
    )
    RETURNING *
  `;

  return NextResponse.json(exercise, { status: 201 });
}
