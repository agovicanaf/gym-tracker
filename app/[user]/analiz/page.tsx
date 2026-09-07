"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { Loader2, Flame, Weight, CalendarCheck, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { api } from "@/lib/api";
import { USER_LABELS, type User } from "@/lib/db";
import type { StatsResponse } from "@/lib/types";

function StatCard({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="border border-border rounded-lg bg-surface p-4">
      <div className="flex items-center gap-2 text-text-faint mb-2">
        {icon}
        <span className="text-[11px] tracking-wider font-body">{label}</span>
      </div>
      <p className="font-display text-3xl text-text leading-none">
        {value}
        {unit && <span className="text-lg text-text-muted ml-1">{unit}</span>}
      </p>
    </div>
  );
}

export default function AnalizPage({
  params,
}: {
  params: Promise<{ user: string }>;
}) {
  const { user } = use(params) as { user: User };
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(
    (isFirstLoad: boolean) => {
      api
        .getStats(user)
        .then((data) => {
          setStats(data);
          setError(null);
          // Seçili hareket sekmesini sadece ilk yüklemede otomatik seçiyoruz;
          // sonraki arka plan yenilemelerinde kullanıcının seçtiği sekmeyi
          // (varsa) koruyoruz, yoksa her 2 saniyede bir ilk sekmeye zıplardı.
          if (isFirstLoad && data.exerciseProgress.length > 0) {
            setSelectedExercise(data.exerciseProgress[0].exercise_id);
          }
        })
        .catch((e: unknown) => {
          if (isFirstLoad) {
            setError(e instanceof Error ? e.message : "Yüklenemedi");
          }
        });
    },
    [user]
  );

  useEffect(() => {
    loadStats(true);
  }, [loadStats]);

  // Çoklu cihaz senkronizasyonu: mobilden eklenen yeni setler analiz
  // panelindeki grafik ve istatistiklere de 2 saniye içinde yansısın.
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      loadStats(false);
    }, 2000);

    function handleVisibility() {
      if (document.visibilityState === "visible") loadStats(false);
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadStats]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-16 text-center">
        <p className="text-accent font-body text-sm">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={20} className="animate-spin text-text-faint" />
      </div>
    );
  }

  const hasData = Number(stats.summary.total_sets) > 0;

  const weeklyChartData = stats.weeklyVolume.map((w) => ({
    week: new Date(w.week_start).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
    }),
    hacim: Math.round(Number(w.total_volume)),
  }));

  const exerciseTimeSeries = stats.timeSeries
    .filter((t) => t.exercise_id === selectedExercise)
    .map((t) => ({
      date: new Date(t.log_date).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
      }),
      agirlik: Number(t.max_weight),
    }));

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-12">
      <div className="mb-6 sm:mb-8">
        <p className="text-[11px] tracking-[0.2em] text-text-muted font-body mb-1">
          ANALİZ PANELİ
        </p>
        <h1 className="font-display text-3xl sm:text-4xl text-text">
          {USER_LABELS[user]}&apos;in İlerlemesi
        </h1>
      </div>

      {!hasData ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-text-muted font-body text-sm mb-4">
            Henüz kayıtlı veri yok. Program sayfasından set eklemeye başla,
            burada analizini göreceksin.
          </p>
          <Link
            href={`/${user}`}
            className="inline-flex items-center gap-2 text-sm font-body font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Programa git →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-8">
            <StatCard
              icon={<CalendarCheck size={14} />}
              label="TOPLAM SEANS"
              value={stats.summary.total_sessions}
            />
            <StatCard
              icon={<Flame size={14} />}
              label="TOPLAM SET"
              value={stats.summary.total_sets}
            />
            <StatCard
              icon={<Weight size={14} />}
              label="TOPLAM HACİM"
              value={Math.round(Number(stats.summary.total_volume_kg)).toLocaleString("tr-TR")}
              unit="kg"
            />
            <StatCard
              icon={<TrendingUp size={14} />}
              label="EN AĞIR KALDIRIŞ"
              value={stats.summary.heaviest_lift}
              unit="kg"
            />
          </div>

          {weeklyChartData.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display text-2xl text-text mb-3">
                Haftalık Hacim Trendi
              </h2>
              {weeklyChartData.length === 1 && (
                <p className="text-xs text-text-faint font-body mb-2">
                  Trend çizgisi için en az 2 farklı hafta gerekiyor — şimdilik tek haftan burada.
                </p>
              )}
              <div className="border border-border rounded-lg bg-surface p-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" vertical={false} />
                    <XAxis
                      dataKey="week"
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      axisLine={{ stroke: "#2a2a2e" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={45}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#1c1c1f",
                        border: "1px solid #2a2a2e",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "#f5f5f4" }}
                      formatter={(value) => [`${Number(value).toLocaleString("tr-TR")} kg`, "Hacim"]}
                    />
                    <Bar dataKey="hacim" fill="#dc2626" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-2xl text-text">Hareket İlerlemesi</h2>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-3 mb-3 -mx-1 px-1">
              {stats.exerciseProgress.map((ex) => (
                <button
                  key={ex.exercise_id}
                  onClick={() => setSelectedExercise(ex.exercise_id)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-body font-medium border transition-colors ${
                    selectedExercise === ex.exercise_id
                      ? "bg-accent border-accent text-white"
                      : "border-border text-text-muted hover:text-text"
                  }`}
                >
                  {ex.exercise_name}
                </button>
              ))}
            </div>

            {exerciseTimeSeries.length > 1 ? (
              <div className="border border-border rounded-lg bg-surface p-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={exerciseTimeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      axisLine={{ stroke: "#2a2a2e" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                      domain={["dataMin - 5", "dataMax + 5"]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#1c1c1f",
                        border: "1px solid #2a2a2e",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "#f5f5f4" }}
                      formatter={(value) => [`${value} kg`, "Max Ağırlık"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="agirlik"
                      stroke="#dc2626"
                      strokeWidth={2}
                      dot={{ fill: "#dc2626", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-lg py-10 text-center">
                <p className="text-xs text-text-faint font-body">
                  Grafik için en az 2 farklı günde kayıt gerekiyor.
                </p>
              </div>
            )}
          </div>

          <div>
            <h2 className="font-display text-2xl text-text mb-3">Hareket Özeti</h2>
            <div className="space-y-1.5">
              {stats.exerciseProgress.map((ex) => (
                <div
                  key={ex.exercise_id}
                  className="flex items-center justify-between border border-border rounded-lg bg-surface px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-body font-medium text-text">
                      {ex.exercise_name}
                    </p>
                    <p className="text-xs text-text-faint mt-0.5">
                      {ex.total_sets_logged} set kaydedildi
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl text-accent leading-none">
                      {ex.max_weight}kg
                    </p>
                    <p className="text-[10px] text-text-faint mt-1">EN İYİ</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
