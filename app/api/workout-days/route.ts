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

  try {
    // Bu üç sorgu birbirine bağımlı değil (hepsi aynı user_id'yi bağımsız
    // filtreliyor), bu yüzden Promise.all ile paralel çalıştırıyoruz.
    // Öncesinde sırayla (await, await, await) çalıştıkları için her sayfa
    // açılışında 3 ayrı veritabanı round-trip'i art arda bekleniyordu; artık
    // en yavaş sorgu kadar sürüyor, üçünün toplamı kadar değil.
    const [days, exercises, logs] = await Promise.all([
      sql`
        SELECT * FROM workout_days
        WHERE user_id = ${user}
        ORDER BY day_order ASC, id ASC
      `,
      sql`
        SELECT e.* FROM exercises e
        JOIN workout_days d ON e.workout_day_id = d.id
        WHERE d.user_id = ${user}
        ORDER BY e.exercise_order ASC, e.id ASC
      `,
      // Her hareketin geçmiş setlerini tek sorguda çekip exercise_id'ye göre
      // grupluyoruz. Bu, ExerciseCard'daki "son kayıt" metni ve PR rozeti
      // için gerekli — onlar exercise.logs alanına bakıyor.
      sql`
        SELECT sl.* FROM set_logs sl
        JOIN exercises e ON sl.exercise_id = e.id
        JOIN workout_days d ON e.workout_day_id = d.id
        WHERE d.user_id = ${user}
        ORDER BY sl.logged_at DESC, sl.set_number DESC
      `,
    ]);

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
  } catch (err: unknown) {
    // PostgreSQL "relation does not exist" (SQLSTATE 42P01) — tablolar
    // henüz kurulmamış demektir. Bunu ayrı bir durum kodu (409) ve
    // needsInit bayrağıyla dönüyoruz ki frontend, sayfa açılışında ayrı
    // bir /api/init kontrolü yapmak zorunda kalmadan tek istekte hem
    // "veri" hem "kurulum gerekiyor mu" bilgisini alabilsin. Bu, önceden
    // her sayfa yüklemesinde sırayla yapılan checkInit + getWorkoutDays
    // isteklerini tek isteğe indirip açılış hızını belirgin şekilde artırır.
    // code kontrolüne ek olarak mesaj metnine de bakıyoruz — Neon'un HTTP
    // sürücüsü SQLSTATE'i her zaman aynı şekilde yüzeye çıkarmayabilir,
    // "does not exist" metni ekstra bir güvenlik ağı.
    const code = (err as { code?: string } | null)?.code;
    const message = err instanceof Error ? err.message : String(err);
    if (code === "42P01" || message.includes("does not exist")) {
      return NextResponse.json({ needsInit: true }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
