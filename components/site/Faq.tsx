// Mirrors Wiki → Acme → FAQ. Deliberately no on-prem/hosting question (Flow E knowledge gap).
const QUESTIONS = [
  ["How long does setup take?", "About a day for most fleets: import vehicles from a spreadsheet, connect telematics, invite your team."],
  ["Do you have an API?", "Yes. A REST API and webhooks are available on every plan."],
  ["Is there a free trial?", "Yes, 14 days on any plan, no credit card needed."],
  ["Do drivers need a paid seat?", "No. Drivers using the mobile inspection app are always free."],
  ["Can I switch plans later?", "Yes. Upgrades are prorated; downgrades apply at renewal."],
];

export function Faq() {
  return (
    <section id="faq" className="border-t border-line bg-panel">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h2 className="font-display text-4xl font-bold uppercase">FAQ</h2>
        <div className="mt-6 divide-y divide-line border-y border-line">
          {QUESTIONS.map(([question, answer]) => (
            <details key={question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {question}
                <span aria-hidden className="font-mono text-signal transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-steel">{answer}</p>
            </details>
          ))}
        </div>
        <p className="mt-10 font-mono text-xs text-steel">© 2026 Acme Fleet Inc. · Demo company</p>
      </div>
    </section>
  );
}
