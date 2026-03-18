import { PianoFooter } from "@/components/piano-footer";
import { SiteCredit } from "@/components/site-credit";
import { SiteHeader } from "@/components/site-header";

export default function ResultLoading() {
  return (
    <main className="page-frame page-frame--stage page-enter">
      <SiteHeader />

      <div className="flex flex-1 flex-col items-center justify-center py-6">
        <div className="h-10 w-44 animate-pulse rounded-xl bg-[rgba(255,248,230,0.14)]" />
        <div className="mt-5 h-56 w-full max-w-md animate-pulse rounded-3xl bg-[rgba(255,248,230,0.08)]" />
        <div className="mt-5 h-72 w-full max-w-md animate-pulse rounded-3xl bg-[rgba(255,248,230,0.08)]" />
      </div>

      <PianoFooter />
      <SiteCredit />
    </main>
  );
}
