import { NextRequest, NextResponse } from "next/server";
import { getSql, isValidUser } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/set-logs?exercise_id=5   -> tek hareketin geçmişi
// GET /api/set-logs?user=omer       -> kullanıcının tüm kayıtları (analiz paneli için)
export async function GET(req: NextRequest) {
  const exerciseId = req.nextUrl.searchParams.get("exercise_id");
  const user = req.nextUrl.searchParams.get("user");

  const sql = getSql();

  if (exerciseId) {
    const logs = await sql`
      SELECT * FROM set_logs
      WHERE exercise_id = ${exerciseId}
      ORDER BY logged_at DESC, set_number ASC
    `;
    return NextResponse.json(logs);
  }

  if (user) {
    if (!isValidUser(user)) {
      return NextResponse.json({ error: "Geçersiz kullanıcı" }, { status: 400 });
    }
    const logs = await sql`
      SELECT sl.*, e.name as exercise_name, d.name as day_name
      FROM set_logs sl
      JOIN exercises e ON sl.exercise_id = e.id
      JOIN workout_days d ON e.workout_day_id = d.id
      WHERE sl.user_id = ${user}
      ORDER BY sl.logged_at DESC
      LIMIT 500
    `;
    return NextResponse.json(logs);
  }

  return NextResponse.json({ error: "exercise_id veya user parametresi gerekli" }, { status: 400 });
}

// POST /api/set-logs
// Body: { exercise_id, user_id, set_number, weight_kg, reps, rpe?, notes?, logged_at? }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { exercise_id, user_id, set_number, weight_kg, reps, rpe, notes, logged_at } = body;

  if (!exercise_id || !isValidUser(user_id) || !set_number || weight_kg == null || reps == null) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const sql = getSql();

  const [log] = await sql`
    INSERT INTO set_logs (exercise_id, user_id, set_number, weight_kg, reps, rpe, notes, logged_at)
    VALUES (
      ${exercise_id},
      ${user_id},
      ${set_number},
      ${weight_kg},
      ${reps},
      ${rpe ?? null},
      ${notes ?? null},
      ${logged_at ?? new Date().toISOString()}
    )
    RETURNING *
  `;

  return NextResponse.json(log, { status: 201 });
}
