export function Footer() {
  return (
    <footer className="mt-28 border-t border-line bg-mist/60 sm:mt-36">
      <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-6 px-5 py-10 text-xs text-mute sm:flex-row sm:items-center sm:px-8">
        <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-ink">
          Brand my garage
        </div>
        <div className="max-w-md leading-relaxed">
          Independent project. Not affiliated with, endorsed by, or sponsored by Tesla, Mercedes-Benz or
          Porsche. Payments by Stripe. Renders are illustrative; the vinyl is real.
        </div>
        <a href="#" className="font-medium text-ink underline-offset-4 hover:underline">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
