import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PianoFooter } from "@/components/piano-footer";
import { SiteCredit } from "@/components/site-credit";

const FLOATING_NOTES = [
  { char: "♪", className: "left-[10%] top-[22%]", delay: 0 },
  { char: "♫", className: "right-[8%] top-[18%]", delay: 0.7 },
  { char: "𝄞", className: "left-[12%] bottom-[28%]", delay: 1.3 },
  { char: "♬", className: "right-[10%] bottom-[24%]", delay: 1.9 },
];

export default function NotFoundPage() {
  return (
    <main className="page-frame page-frame--stage game-surface page-enter">
      <div className="floating-notes floating-notes--bright" aria-hidden="true">
        {FLOATING_NOTES.map((note, index) => (
          <span
            key={index}
            className={note.className}
            style={{ animationDelay: `${note.delay}s` }}
          >
            {note.char}
          </span>
        ))}
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-5xl sm:text-6xl">🎼</p>
        <h1 className="mt-4 text-[clamp(2rem,8vw,3rem)] font-bold leading-tight text-[hsl(var(--ivory))]">
          Esta partitura se perdeu no palco
        </h1>
        <p className="mt-3 max-w-sm text-base text-[rgba(255,248,230,0.72)]">
          Essa página não existe. Volta pro início?
        </p>
        <Button asChild size="lg" className="mt-7 min-h-14 px-8">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>

      <PianoFooter />

      <SiteCredit />
    </main>
  );
}
