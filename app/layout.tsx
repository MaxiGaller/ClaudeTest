import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "FamilienAbenteuer · Dein Familienkompass",
  description:
    "Personalisierte Familien-Freizeitvorschläge, die wirklich zu eurer Situation passen.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="font-sans">
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-ink-950/80 px-4 py-3 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-accent-400 to-teal-500 text-lg shadow-glow">
                  🧭
                </span>
                <span className="leading-tight">
                  <span className="block font-display text-lg font-bold tracking-tight text-white">
                    FamilienAbenteuer
                  </span>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Dein Familienkompass
                  </span>
                </span>
              </Link>

              <div className="flex items-center gap-2">
                <span className="hidden items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 sm:inline-flex">
                  <span className="h-2 w-2 rounded-full bg-accent-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
                  München
                </span>
                <span
                  aria-hidden
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.12] bg-white/[0.04] text-slate-400"
                >
                  ⚙️
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6">{children}</main>

          <footer className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-500">
            MVP · Region München / Südbayern · Preise &amp; Öffnungszeiten ohne Gewähr
          </footer>
        </div>
      </body>
    </html>
  );
}
