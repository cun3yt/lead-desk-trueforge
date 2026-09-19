import type { Plan } from "@/lib/contracts";

// Same numbers as the Pricing page in Wiki → Acme (scripts/seed/pricing.md).
const PLANS: { id: Plan; name: string; price: string; unit: string; fit: string; features: string[] }[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$10",
    unit: "per seat / month",
    fit: "Up to 25 seats",
    features: ["Maintenance schedules", "Work orders", "Driver inspections", "Slack & QuickBooks"],
  },
  {
    id: "growth",
    name: "Growth",
    price: "$25",
    unit: "per seat / month",
    fit: "25–500 seats",
    features: ["Everything in Starter", "SAP S/4HANA & Salesforce", "Parts inventory & cost reports", "Named success manager"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    unit: "annual contract",
    fit: "500+ seats",
    features: ["Everything in Growth", "SSO & audit logs", "Custom contract", "Dedicated onboarding"],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-14 sm:px-6">
      <h2 className="font-display text-4xl font-bold uppercase">Pricing</h2>
      <p className="mt-2 text-steel">Per seat. Drivers on the inspection app are always free. 14-day free trial.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <article
            key={plan.id}
            id={`plan-${plan.id}`}
            data-plan={plan.id}
            className="flex flex-col rounded-md border border-line bg-panel p-6 transition-shadow"
          >
            <h3 className="font-display text-2xl font-semibold uppercase tracking-wide">{plan.name}</h3>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.15em] text-steel">{plan.fit}</p>
            <p className="mt-5 flex items-baseline gap-2">
              <span className="font-display text-5xl font-bold tabular-nums">{plan.price}</span>
              <span className="text-sm text-steel">{plan.unit}</span>
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span aria-hidden className="text-signal">
                    ▸
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
