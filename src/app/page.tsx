import type { Metadata } from "next";
import { AiSection } from "@/components/homepage/AiSection";
import { CtaSection } from "@/components/homepage/CtaSection";
import { FeaturesSection } from "@/components/homepage/FeaturesSection";
import { Hero } from "@/components/homepage/Hero";
import { HomeFooter } from "@/components/homepage/HomeFooter";
import { HomeNav } from "@/components/homepage/HomeNav";
import { PricingSection } from "@/components/homepage/PricingSection";
import { getSessionUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "DevStash — Your Developer Knowledge Hub",
  description:
    "One fast, searchable, AI-enhanced hub for your snippets, prompts, commands, notes, files, images and links.",
};

export default async function HomePage() {
  const isSignedIn = (await getSessionUserId()) !== null;

  return (
    <>
      <HomeNav isSignedIn={isSignedIn} />
      <main className="flex-1">
        <Hero isSignedIn={isSignedIn} />
        <FeaturesSection />
        <AiSection />
        <PricingSection isSignedIn={isSignedIn} />
        <CtaSection isSignedIn={isSignedIn} />
      </main>
      <HomeFooter />
    </>
  );
}
