import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { BOLSHOI_LOGO_URL } from "@/lib/site";

export const SiteHeader = ({ rightSlot }: { rightSlot?: ReactNode }) => (
  <header className="flex items-center justify-between py-3">
    <Link href="/" className="flex items-center gap-2.5">
      <div className="rounded-xl border border-[rgba(176,148,90,0.2)] bg-white/90 p-1.5 shadow-sm">
        <Image
          alt="Escola do Teatro Bolshoi no Brasil"
          src={BOLSHOI_LOGO_URL}
          width={36}
          height={36}
          className="h-8 w-8 object-contain"
          priority
        />
      </div>
      <span className="[font-family:var(--font-display),serif] text-xl font-bold">
        MusiQuiz
      </span>
    </Link>
    {rightSlot ?? null}
  </header>
);
