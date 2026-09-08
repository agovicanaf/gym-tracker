"use client";

import { useEffect, useState, useCallback, use } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { api, NeedsInitError } from "@/lib/api";
import WorkoutDayCard from "@/components/WorkoutDayCard";
import type { WorkoutDayWithExercises } from "@/lib/types";
import { USER_LABELS, type User } from "@/lib/db";

export default function UserDashboard({
  params,
}: {
  params: Promise<{ user: string }>;
}) {
  const { user } = use(params) as { user: User };

  const [days, setDays] = useState<WorkoutDayWithExercises[] | null>(null);
  const [dbReady, setDbReady] = useState<boolean | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [addingDay, setAddingDay] = useState(false);
  const [dayName, setDayName] = useState("");
  const [addDayError, setAddDayError] = useState<string | null>(null);
  const [addingDaySaving, setAddingDaySaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // silent=true: arka plan polling çağrısı — ağda geçici bir hıçkırık
  // olursa kullanıcıyı kırmızı hata mesajıyla rahatsız etmiyoruz, bir
  // sonraki 2 saniyelik denemede zaten kendi kendine düzelir.
  const load = useCallback(
    async (silent = false) => {
      try {
        const data = await api.getWorkoutDays(user);
        setDays(data);
        setDbReady(true);
        setError(null);
      } catch (e: unknown) {
        if (e instanceof NeedsInitError) {
          setDbReady(false);
          return;
        }
        if (!silent) {
          setError(e instanceof Error ? e.message : "Yüklenemedi");
        }
      }
    },
    [user]
  );

  // Önceden burada önce /api/init'e (checkInit) sonra /api/workout-days'e
  // sırayla istek atılıyordu — iki ayrı ağ round-trip'i art arda bekleniyor,
  // sayfa açılışında spinner'ın gereğinden uzun dönmesine yol açıyordu.
  // Artık doğrudan getWorkoutDays çağrılıyor; tablolar henüz kurulmamışsa
  // sunucu bunu tek yanıtta (409 + needsInit) bildiriyor ve load() bunu
  // yakalayıp kurulum ekranına yönlendiriyor. Normal durumda (kurulum
  // tamamlanmışsa, yani neredeyse her zaman) tek istek yeterli.
  useEffect(() => {
    load();
  }, [load]);

  // Çoklu cihaz senkronizasyonu: örneğin telefondan bir set eklendiğinde,
  // bilgisayarda açık duran bu sayfa da kısa süre içinde güncellensin diye
  // her 2 saniyede bir arka planda veriyi tazeliyoruz. Sayfa görünür değilken
  // (başka bir sekmedeyken) boşuna istek atmamak için visibilitychange'e
  // bakıyoruz. setDays yeni veriyle çağrılsa bile WorkoutDayCard/ExerciseCard
  // bileşenleri key={id} sayesinde yeniden mount olmuyor, dolayısıyla o an
  // bir formu doldurmakta olan kullanıcının kendi local state'i (örn. gün
  // adını düzenlerken yazdığı taslak metin) bu yenilemeden etkilenmiyor.
  useEffect(() => {
    if (!dbReady) return;

    let cancelled = false;
    const POLL_MS = 2000;

    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (cancelled) return;
      load(true);
    }, POLL_MS);

    function handleVisibility() {
      if (document.visibilityState === "visible") load(true);
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [dbReady, load]);

  async function handleInit() {
    setInitializing(true);
    setInitError(null);
    try {
      const res = await api.runInit();
      if (res.success) {
        setDbReady(true);
        await load();
      } else {
        setInitError(res.error ?? "Kurulum başarısız");
      }
    } catch (e: unknown) {
      setInitError(e instanceof Error ? e.message : "Kurulum başarısız");
    } finally {
      setInitializing(false);
    }
  }

  async function handleAddDay(e: React.FormEvent) {
    e.preventDefault();
    if (!dayName.trim()) return;
    setAddingDaySaving(true);
    setAddDayError(null);
    try {
      await api.createWorkoutDay(user, dayName.trim());
      setDayName("");
      setAddingDay(false);
      await load();
    } catch (e: unknown) {
      // Formu açık bırakıyoruz, kullanıcı girdiği gün adını kaybetmesin.
      setAddDayError(e instanceof Error ? e.message : "Gün eklenemedi");
    } finally {
      setAddingDaySaving(false);
    }
  }

  // Veritabanı henüz kurulmadıysa kurulum ekranı göster
  if (dbReady === false) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <h2 className="font-display text-3xl text-text mb-3">İlk Kurulum</h2>
        <p className="text-sm text-text-muted font-body mb-6">
          Veritabanı tabloları henüz oluşturulmamış. Aşağıdaki butona basarak
          bir kerelik kurulumu tamamla.
        </p>
        <button
          onClick={handleInit}
          disabled={initializing}
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-body font-medium px-6 py-3 rounded-md transition-colors"
        >
          {initializing && <Loader2 size={16} className="animate-spin" />}
          Veritabanını Kur
        </button>
        {initError && (
          <p className="text-xs text-accent mt-4 font-body">{initError}</p>
        )}
      </div>
    );
  }

  if (dbReady === null || days === null) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={20} className="animate-spin text-text-faint" />
      </div>
    );
  }

  const exerciseHistory = Array.from(
    new Set(days.flatMap((d) => d.exercises.map((e) => e.name)))
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-12">
      <div className="mb-6 sm:mb-8">
        <p className="text-[11px] tracking-[0.2em] text-text-muted font-body mb-1">
          HAFTALIK PROGRAM
        </p>
        <h1 className="font-display text-3xl sm:text-4xl text-text">
          {USER_LABELS[user]}&apos;in Antrenmanı
        </h1>
      </div>

      {error && <p className="text-sm text-accent mb-4 font-body">{error}</p>}

      {days.length === 0 && !addingDay && (
        <div className="text-center py-16 border border-dashed border-border rounded-lg px-6">
          <p className="text-text-muted font-body text-sm mb-2">
            Henüz bir antrenman günü eklemedin.
          </p>
          <p className="text-text-faint font-body text-xs">
            Önce aşağıdan bir gün ekle (örn. Push, Pull, Bacak) → sonra o güne
            hareket ekle → sonra set/tekrar/ağırlık gir.
          </p>
        </div>
      )}

      {days.map((day) => (
        <WorkoutDayCard
          key={day.id}
          day={day}
          user={user}
          exerciseHistory={exerciseHistory}
          onChanged={load}
        />
      ))}

      {addingDay ? (
        <form
          onSubmit={handleAddDay}
          className="border border-border rounded-lg bg-surface p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-body font-medium text-text">
              Yeni Antrenman Günü
            </p>
            <button
              type="button"
              onClick={() => setAddingDay(false)}
              className="text-text-faint hover:text-text"
            >
              <X size={16} />
            </button>
          </div>
          <input
            autoFocus
            type="text"
            value={dayName}
            onChange={(e) => setDayName(e.target.value)}
            placeholder="Gün adı (örn: Push Günü, Bacak Günü)"
            className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-text font-body text-sm focus:border-accent outline-none"
          />
          {addDayError && <p className="text-xs text-accent">{addDayError}</p>}
          <button
            type="submit"
            disabled={!dayName.trim() || addingDaySaving}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-body font-medium py-2 rounded-md transition-colors"
          >
            {addingDaySaving ? "Ekleniyor…" : "Ekle"}
          </button>
        </form>
      ) : (
        <button
          onClick={() => {
            setAddDayError(null);
            setAddingDay(true);
          }}
          className="w-full flex items-center justify-center gap-2 border border-border rounded-lg py-3.5 text-sm text-text font-body font-medium hover:bg-surface transition-colors"
        >
          <Plus size={16} />
          Antrenman Günü Ekle
        </button>
      )}
    </div>
  );
}
