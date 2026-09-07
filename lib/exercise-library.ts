// Yaygın antrenman hareketleri — hareket eklerken otomatik öneri için kullanılır.
// Kas grubuna göre gruplandırılmış, arama sırasında düz liste olarak taranır.

export interface ExerciseSuggestion {
  name: string;
  group: string;
}

const RAW: Record<string, string[]> = {
  Göğüs: [
    "Bench Press",
    "Incline Bench Press",
    "Decline Bench Press",
    "Dumbbell Bench Press",
    "Incline Dumbbell Press",
    "Decline Dumbbell Press",
    "Dumbbell Fly",
    "Incline Dumbbell Fly",
    "Cable Fly",
    "Cable Crossover",
    "Pec Deck (Butterfly)",
    "Push Up",
    "Chest Dip",
    "Smith Machine Bench Press",
    "Machine Chest Press",
  ],
  Sırt: [
    "Deadlift",
    "Romanian Deadlift",
    "Sumo Deadlift",
    "Pull Up",
    "Chin Up",
    "Lat Pulldown",
    "Close Grip Lat Pulldown",
    "Barbell Row",
    "Pendlay Row",
    "Dumbbell Row",
    "T-Bar Row",
    "Seated Cable Row",
    "Cable Row",
    "Face Pull",
    "Hyperextension",
    "Straight Arm Pulldown",
    "Machine Row",
  ],
  Omuz: [
    "Overhead Press",
    "Barbell Shoulder Press",
    "Dumbbell Shoulder Press",
    "Arnold Press",
    "Lateral Raise",
    "Cable Lateral Raise",
    "Front Raise",
    "Rear Delt Fly",
    "Reverse Pec Deck",
    "Upright Row",
    "Shrug",
    "Dumbbell Shrug",
    "Machine Shoulder Press",
  ],
  Biceps: [
    "Barbell Curl",
    "Dumbbell Curl",
    "Hammer Curl",
    "Preacher Curl",
    "Concentration Curl",
    "Cable Curl",
    "Incline Dumbbell Curl",
    "EZ Bar Curl",
    "Spider Curl",
    "21s Curl",
  ],
  Triceps: [
    "Triceps Pushdown",
    "Rope Pushdown",
    "Skull Crusher",
    "Overhead Triceps Extension",
    "Close Grip Bench Press",
    "Triceps Dip",
    "Dumbbell Kickback",
    "Cable Overhead Extension",
    "Diamond Push Up",
  ],
  Bacak: [
    "Squat",
    "Front Squat",
    "Leg Press",
    "Bulgarian Split Squat",
    "Lunge",
    "Walking Lunge",
    "Leg Extension",
    "Leg Curl",
    "Lying Leg Curl",
    "Seated Leg Curl",
    "Hip Thrust",
    "Glute Bridge",
    "Calf Raise",
    "Seated Calf Raise",
    "Standing Calf Raise",
    "Hack Squat",
    "Goblet Squat",
    "Step Up",
    "Sissy Squat",
  ],
  Karın: [
    "Crunch",
    "Sit Up",
    "Plank",
    "Hanging Leg Raise",
    "Cable Crunch",
    "Russian Twist",
    "Ab Wheel Rollout",
    "Mountain Climber",
    "Leg Raise",
    "Bicycle Crunch",
    "Side Plank",
  ],
  Kardiyo: [
    "Treadmill Koşu",
    "Bisiklet",
    "Eliptik",
    "Jump Rope",
    "Rowing Machine",
    "Stairmaster",
  ],
};

export const EXERCISE_LIBRARY: ExerciseSuggestion[] = Object.entries(RAW).flatMap(
  ([group, names]) => names.map((name) => ({ name, group }))
);

function normalize(str: string): string {
  return str
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

// query'ye göre kütüphaneden + geçmiş hareketlerden öneri filtreler.
// Geçmiş hareketler (kullanıcının kendi eklediği) önceliklidir.
export function getSuggestions(
  query: string,
  history: string[] = [],
  limit = 6
): ExerciseSuggestion[] {
  const q = normalize(query.trim());
  if (!q) return [];

  const historySet = new Set(history.map((h) => h.trim()));
  const historySuggestions: ExerciseSuggestion[] = history
    .filter((h) => normalize(h).includes(q))
    .map((h) => ({ name: h, group: "Daha Önce Kullandın" }));

  const librarySuggestions = EXERCISE_LIBRARY.filter(
    (ex) => normalize(ex.name).includes(q) && !historySet.has(ex.name)
  );

  // Başlangıçta eşleşenleri öne al (örn "inc" -> "Incline..." her zaman ilk sırada)
  const sortByStartsWith = (list: ExerciseSuggestion[]) =>
    [...list].sort((a, b) => {
      const aStarts = normalize(a.name).startsWith(q) ? 0 : 1;
      const bStarts = normalize(b.name).startsWith(q) ? 0 : 1;
      return aStarts - bStarts;
    });

  const combined = [
    ...sortByStartsWith(historySuggestions),
    ...sortByStartsWith(librarySuggestions),
  ];

  return combined.slice(0, limit);
}
