import { NextRequest, NextResponse } from "next/server";
import { getSql, isValidUser } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/stats?user=omer
// Analiz paneli için: genel özet + hareket bazlı ilerleme + PR listesi
export async function GET(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user") ?? "";
  if (!isValidUser(user)) {
    return NextResponse.json({ error: "Geçersiz kullanıcı" }, { status: 400 });
  }

  const sql = getSql();

  // Genel özet
  const summaryResult = await sql`
    SELECT
      COUNT(DISTINCT DATE(logged_at)) as total_sessions,
      COUNT(*) as total_sets,
      COALESCE(SUM(weight_kg * reps), 0) as total_volume_kg,
      COALESCE(MAX(weight_kg), 0) as heaviest_lift
    FROM set_logs
    WHERE user_id = ${user}
  `;

  // Hareket bazlı: her hareketin en son ve en yüksek (1RM tahmini yerine ham max) ağırlığı
  const exerciseProgress = await sql`
    SELECT
      e.id as exercise_id,
      e.name as exercise_name,
      MAX(sl.weight_kg) as max_weight,
      (ARRAY_AGG(sl.weight_kg ORDER BY sl.logged_at DESC))[1] as latest_weight,
      COUNT(sl.id) as total_sets_logged,
      MAX(sl.logged_at) as last_logged
    FROM exercises e
    JOIN set_logs sl ON sl.exercise_id = e.id
    WHERE sl.user_id = ${user}
    GROUP BY e.id, e.name
    ORDER BY last_logged DESC
  `;

  // Zaman serisi: her hareket için tarih bazlı max ağırlık (grafik için)
  const timeSeries = await sql`
    SELECT
      e.id as exercise_id,
      e.name as exercise_name,
      DATE(sl.logged_at) as log_date,
      MAX(sl.weight_kg) as max_weight,
      SUM(sl.weight_kg * sl.reps) as day_volume
    FROM exercises e
    JOIN set_logs sl ON sl.exercise_id = e.id
    WHERE sl.user_id = ${user}
    GROUP BY e.id, e.name, DATE(sl.logged_at)
    ORDER BY log_date ASC
  `;

  // Son 8 hafta toplam hacim (haftalık) - genel trend grafiği
  const weeklyVolume = await sql`
    SELECT
      DATE_TRUNC('week', logged_at) as week_start,
      SUM(weight_kg * reps) as total_volume
    FROM set_logs
    WHERE user_id = ${user} AND logged_at > now() - interval '16 weeks'
    GROUP BY week_start
    ORDER BY week_start ASC
  `;

  return NextResponse.json({
    summary: summaryResult[0],
    exerciseProgress,
    timeSeries,
    weeklyVolume,
  });
}
