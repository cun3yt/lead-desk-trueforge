import { connection } from "next/server";
import { ConciergeWidget } from "@/components/concierge/ConciergeWidget";
import { Faq } from "@/components/site/Faq";
import { Hero } from "@/components/site/Hero";
import { Integrations } from "@/components/site/Integrations";
import { Nav } from "@/components/site/Nav";
import { Pricing } from "@/components/site/Pricing";
import { greetingFor, readPlaybook } from "@/lib/playbook";

export default async function Home() {
  await connection(); // read the playbook on every page load, so Wiki edits show up after a refresh
  const playbook = await readPlaybook();
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Integrations />
        <Pricing />
        <Faq />
      </main>
      <ConciergeWidget playbook={playbook} greeting={greetingFor(playbook)} />
    </>
  );
}
