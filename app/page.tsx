import Link from "next/link";

const USERS = [
  { id: "omer", label: "Ömer", tagline: "Sistemine gir" },
  { id: "efehan", label: "Efehan", tagline: "Sistemine gir" },
] as const;

export default function Home() {
  return (
    <div className="flex-1 flex flex-col bg-bg">
      <header className="pt-14 pb-8 px-6 text-center">
        <p className="text-[11px] tracking-[0.2em] text-text-muted font-body mb-3">
          KİŞİSEL ANTRENMAN SİSTEMİ
        </p>
        <h1 className="font-display text-6xl sm:text-7xl leading-none text-text">
          DEMİR
        </h1>
      </header>

      <main className="flex-1 flex flex-col sm:flex-row">
        {USERS.map((user, i) => (
          <Link
            key={user.id}
            href={`/${user.id}`}
            className="group relative flex-1 flex flex-col items-center justify-center py-20 sm:py-0 border-t sm:border-t-0 first:border-t-0 border-border sm:border-l first:sm:border-l-0 transition-colors duration-300 hover:bg-surface"
          >
            <span className="absolute top-8 left-1/2 -translate-x-1/2 sm:left-8 sm:translate-x-0 text-[11px] tracking-[0.2em] text-text-faint font-body">
              {i === 0 ? "01" : "02"}
            </span>

            <span className="font-display text-[5rem] sm:text-[6rem] leading-none text-text group-hover:text-accent transition-colors duration-300">
              {user.label}
            </span>
            <span className="mt-3 text-sm text-text-muted font-body group-hover:text-text transition-colors duration-300">
              {user.tagline}
            </span>

            <span className="mt-8 h-px w-12 bg-border-strong group-hover:w-24 group-hover:bg-accent transition-all duration-300" />
          </Link>
        ))}
      </main>

      <footer className="py-6 text-center">
        <p className="text-xs text-text-faint font-body">
          Hareket • Set • Tekrar • Ağırlık — hepsi tek yerde
        </p>
      </footer>
    </div>
  );
}
