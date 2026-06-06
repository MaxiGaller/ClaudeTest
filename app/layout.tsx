import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Was machen wir heute?",
  description:
    "Familien-Freizeitempfehlungen, die wirklich zu eurer Situation passen.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">🧭</span>
              <span className="font-semibold">Was machen wir heute?</span>
            </Link>
          </header>
          <main className="flex-1 px-4 py-5">{children}</main>
          <footer className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-400">
            MVP · Region München / Südbayern · Preise &amp; Öffnungszeiten ohne Gewähr
          </footer>
        </div>
      </body>
    </html>
  );
}
