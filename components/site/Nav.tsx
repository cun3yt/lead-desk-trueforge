const LINKS = [
  { href: "#product", label: "Product" },
  { href: "#integrations", label: "Integrations" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-ground/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
        <a href="#" className="flex items-center gap-2">
          <span aria-hidden className="grid size-8 place-items-center rounded-sm bg-ink font-display text-lg font-bold text-signal">
            A
          </span>
          <span className="font-display text-2xl font-bold tracking-wide">ACME</span>
        </a>
        <ul className="hidden items-center gap-6 text-sm font-medium text-steel md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="hover:text-ink">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#pricing"
          className="rounded-sm bg-signal px-4 py-2 font-display text-base font-semibold uppercase tracking-wide text-white hover:bg-signal-ink"
        >
          Book a demo
        </a>
      </nav>
    </header>
  );
}
