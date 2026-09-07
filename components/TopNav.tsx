"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { USER_LABELS, type User } from "@/lib/db";

export default function TopNav({ user }: { user: User }) {
  const pathname = usePathname();
  const isAnaliz = pathname?.endsWith("/analiz");

  return (
    <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16">
        <Link href="/" className="font-display text-2xl tracking-wide text-text hover:text-accent transition-colors">
          DEMİR
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href={`/${user}`}
            className={`px-4 py-2 text-sm font-body rounded-md transition-colors ${
              !isAnaliz
                ? "bg-surface-raised text-text"
                : "text-text-muted hover:text-text"
            }`}
          >
            Program
          </Link>
          <Link
            href={`/${user}/analiz`}
            className={`px-4 py-2 text-sm font-body rounded-md transition-colors ${
              isAnaliz
                ? "bg-surface-raised text-text"
                : "text-text-muted hover:text-text"
            }`}
          >
            Analiz
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="text-sm font-body text-text-muted">
            {USER_LABELS[user]}
          </span>
        </div>
      </div>
    </header>
  );
}
