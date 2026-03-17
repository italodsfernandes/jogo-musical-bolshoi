export function SiteCredit() {
  return (
    <p className="mt-3 pb-2 text-center text-[0.7rem] tracking-wide text-[hsl(var(--ivory))]">
      <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(255,248,230,0.12)] bg-[rgba(4,34,35,0.34)] px-3 py-1 shadow-[0_6px_18px_rgba(0,0,0,0.18)] backdrop-blur-sm">
        <span className="text-[rgba(255,248,230,0.82)]">
          Desenvolvido com 💜 por
        </span>
        <a
          href="https://migracode.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[hsl(var(--accent))] underline underline-offset-2 transition-colors hover:text-[rgba(255,248,230,0.94)]"
        >
          migracode.com.br
        </a>
      </span>
    </p>
  );
}
