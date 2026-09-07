import Link from "next/link";

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-transparent bg-paper/80 backdrop-blur-md [@supports(backdrop-filter:blur(0))]:bg-paper/70">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="whitespace-nowrap font-mono text-[11px] font-semibold uppercase tracking-[0.1em] sm:text-[12px] sm:tracking-[0.14em]">
          Brand my garage
        </Link>
        <nav className="flex items-center gap-1 text-sm font-semibold">
          <a href="#spots" className="hidden rounded-full px-3.5 py-2 text-mute transition hover:text-ink sm:block">
            Spots
          </a>
          <a href="#sponsors" className="hidden rounded-full px-3.5 py-2 text-mute transition hover:text-ink sm:block">
            Sponsors
          </a>
          <a href="#how" className="hidden rounded-full px-3.5 py-2 text-mute transition hover:text-ink md:block">
            How it works
          </a>
          <a href="#faq" className="hidden rounded-full px-3.5 py-2 text-mute transition hover:text-ink md:block">
            FAQ
          </a>
          <a
            href="#configure"
            className="ml-2 shrink-0 whitespace-nowrap rounded-full bg-ink px-4 py-2 text-white transition hover:bg-black"
          >
            Claim a spot
          </a>
        </nav>
      </div>
    </header>
  );
}
