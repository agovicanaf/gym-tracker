import { NextRequest, NextResponse } from "next/server";
import { getSql, isValidUser } from "@/lib/db";

export const dynamic = "force-dynamic";

// Desteklenen tarih aralığı seçenekleri. "all" için cutoff yok (en eski tarih).
const RANGE_DAYS: Record<string, number | null> = {
  "30d": 30,
  "90d": 90,
  all: null,
};

// GET /api/stats?user=omer&range=30d|90d|all  (range verilmezse "all" varsayılan)
// Analiz paneli için: genel özet + hareket bazlı ilerleme + zaman serisi.
// Seçilen aralık TÜM metrikleri etkiler — "en ağır kaldırış" da dahil,
// çünkü kullanıcı "son 30 günde ne kaldırdım" sorusuna cevap arıyor,
// tüm-zamanların-rekoru ayrı bir kavram değil (kasıtlı tasarım kararı).
export async function GET(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user") ?? "";
  if (!isValidUser(user)) {
    return NextResponse.json({ error: "Geçersiz kullanıcı" }, { status: 400 });
  }

  const rangeParam = req.nextUrl.searchParams.get("range") ?? "all";
  if (!(rangeParam in RANGE_DAYS)) {
    return NextResponse.json({ error: "Geçersiz range parametresi" }, { status: 400 });
  }
  const rangeDays = RANGE_DAYS[rangeParam];

  // "all" seçiliyken cutoff'u çok eski bir tarihe sabitliyoruz (WHERE
  // logged_at >= cutoff her zaman true olsun diye) — bu sayede tüm
  // sorgularda tek bir ortak WHERE deseni kullanabiliyoruz, range'e göre
  // ayrı sorgu dalları yazmaya gerek kalmıyor.
  const cutoff = rangeDays
    ? new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString()
    : new Date(0).toISOString();

  const sql = getSql();

  // Bu dört sorgu birbirinden bağımsız (hepsi aynı user_id + cutoff
  // filtresini kullanıyor ama biri diğerinin sonucuna ihtiyaç duymuyor),
  // bu yüzden Promise.all ile paralel çalıştırıyoruz. Öncesinde sırayla
  // (await, await, await, await) çalıştıkları için analiz sayfası her
  // açıldığında 4 ayrı veritabanı round-trip'i art arda bekleniyordu;
  // artık en yavaş sorgu kadar sürüyor, dördünün toplamı kadar değil.
  const [summaryRows, exerciseProgress, timeSeries, weeklyVolume] = await Promise.all([
    // Genel özet — seçilen aralıktaki kayıtlara göre
    sql`
      SELECT
        COUNT(DISTINCT DATE(logged_at)) as total_sessions,
        COUNT(*) as total_sets,
        COALESCE(SUM(weight_kg * reps), 0) as total_volume_kg,
        COALESCE(MAX(weight_kg), 0) as heaviest_lift
      FROM set_logs
      WHERE user_id = ${user} AND logged_at >= ${cutoff}
    `,
    // Hareket bazlı: seçilen aralıktaki en yüksek ağırlık, en son yapılan
    // ağırlık + tarihi, ve set sayısı.
    sql`
      SELECT
        e.id as exercise_id,
        e.name as exercise_name,
        MAX(sl.weight_kg) as max_weight,
        (ARRAY_AGG(sl.weight_kg ORDER BY sl.logged_at DESC))[1] as latest_weight,
        COUNT(sl.id) as total_sets_logged,
        MAX(sl.logged_at) as last_logged
      FROM exercises e
      JOIN set_logs sl ON sl.exercise_id = e.id
      WHERE sl.user_id = ${user} AND sl.logged_at >= ${cutoff}
      GROUP BY e.id, e.name
      ORDER BY last_logged DESC
    `,
    // Zaman serisi: her hareket için tarih bazlı max ağırlık + günlük hacim (grafik için)
    sql`
      SELECT
        e.id as exercise_id,
        e.name as exercise_name,
        DATE(sl.logged_at) as log_date,
        MAX(sl.weight_kg) as max_weight,
        SUM(sl.weight_kg * sl.reps) as day_volume
      FROM exercises e
      JOIN set_logs sl ON sl.exercise_id = e.id
      WHERE sl.user_id = ${user} AND sl.logged_at >= ${cutoff}
      GROUP BY e.id, e.name, DATE(sl.logged_at)
      ORDER BY log_date ASC
    `,
    // Haftalık toplam hacim trendi — seçilen aralığa göre, "all" seçiliyken
    // grafiğin aşırı uzayıp okunaksızlaşmaması için yine de son 16 haftayla
    // sınırlıyoruz (bu, cutoff'tan bağımsız ayrı bir üst sınır).
    sql`
      SELECT
        DATE_TRUNC('week', logged_at) as week_start,
        SUM(weight_kg * reps) as total_volume
      FROM set_logs
      WHERE user_id = ${user}
        AND logged_at >= ${cutoff}
        AND logged_at > now() - interval '16 weeks'
      GROUP BY week_start
      ORDER BY week_start ASC
    `,
  ]);

  return NextResponse.json({
    summary: summaryRows[0],
    exerciseProgress,
    timeSeries,
    weeklyVolume,
  });
}
