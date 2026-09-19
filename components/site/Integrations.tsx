const GROUPS = [
  { name: "ERP & finance", items: ["SAP S/4HANA", "QuickBooks Online"] },
  { name: "CRM & chat", items: ["Salesforce", "Slack"] },
  { name: "Telematics", items: ["Samsara", "Geotab", "Motive"] },
];

export function Integrations() {
  return (
    <section id="integrations" className="border-y border-line bg-panel">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="font-display text-4xl font-bold uppercase">Integrations</h2>
        <p className="mt-2 max-w-xl text-steel">Mileage, costs and alerts flow between Acme and the tools your fleet already runs.</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {GROUPS.map((group) => (
            <div key={group.name}>
              <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-steel">{group.name}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li key={item} className="rounded-sm border border-line px-3 py-1.5 font-medium">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
