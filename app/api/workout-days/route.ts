import { NextRequest, NextResponse } from "next/server";
import { getSql, isValidUser } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/workout-days?user=omer
// Kullanıcının tüm program günlerini, altındaki hareketlerle birlikte döner.
export async function GET(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user") ?? "";
  if (!isValidUser(user)) {
    return NextResponse.json({ error: "Geçersiz kullanıcı" }, { status: 400 });
  }

  const sql = getSql();

  const days = await sql`
    SELECT * FROM workout_days
    WHERE user_id = ${user}
    ORDER BY day_order ASC, id ASC
  `;

  const exercises = await sql`
    SELECT e.* FROM exercises e
    JOIN workout_days d ON e.workout_day_id = d.id
    WHERE d.user_id = ${user}
    ORDER BY e.exercise_order ASC, e.id ASC
  `;

  // Her hareketin geçmiş setlerini tek sorguda çekip exercise_id'ye göre
  // grupluyoruz. Bu, ExerciseCard'daki "son kayıt" metni ve PR rozeti için
  // gerekli — onlar exercise.logs alanına bakıyor.
  const logs = await sql`
    SELECT sl.* FROM set_logs sl
    JOIN exercises e ON sl.exercise_id = e.id
    JOIN workout_days d ON e.workout_day_id = d.id
    WHERE d.user_id = ${user}
    ORDER BY sl.logged_at DESC, sl.set_number DESC
  `;

  const logsByExercise = new Map<number, Record<string, unknown>[]>();
  for (const log of logs as Record<string, unknown>[]) {
    const exId = Number(log.exercise_id);
    const list = logsByExercise.get(exId);
    if (list) {
      list.push(log);
    } else {
      logsByExercise.set(exId, [log]);
    }
  }

  const result = days.map((day: Record<string, unknown>) => ({
    ...day,
    exercises: exercises
      .filter(
        (ex: Record<string, unknown>) => Number(ex.workout_day_id) === Number(day.id)
      )
      .map((ex: Record<string, unknown>) => ({
        ...ex,
        logs: logsByExercise.get(Number(ex.id)) ?? [],
      })),
  }));

  return NextResponse.json(result);
}

// POST /api/workout-days
// Body: { user_id, name }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { user_id, name } = body;

  if (!isValidUser(user_id) || !name || typeof name !== "string") {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const sql = getSql();

  const maxOrderResult = await sql`
    SELECT COALESCE(MAX(day_order), -1) as max_order FROM workout_days WHERE user_id = ${user_id}
  `;
  const nextOrder = Number(maxOrderResult[0].max_order) + 1;

  const [day] = await sql`
    INSERT INTO workout_days (user_id, name, day_order)
    VALUES (${user_id}, ${name.trim()}, ${nextOrder})
    RETURNING *
  `;

  return NextResponse.json(day, { status: 201 });
}
