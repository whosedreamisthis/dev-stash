import { Container } from "@/components/homepage/Container";
import { Reveal } from "@/components/homepage/Reveal";
import { SectionHeading } from "@/components/homepage/SectionHeading";
import { FEATURES } from "@/lib/homepage-content";
import {
  ITEM_TYPE_BORDER_COLORS,
  ITEM_TYPE_TEXT_COLORS,
  ITEM_TYPE_TINT_COLORS,
} from "@/lib/item-type-icons";
import { cn } from "@/lib/utils";

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-16 py-24 md:py-28">
      <Container>
        <SectionHeading
          eyebrow="Features"
          title="Everything a developer saves, in one place"
          description="Every item has a type, every type has a home, and all of it is one keystroke away."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ title, description, slug, Icon }) => (
            <Reveal key={title}>
              <article
                className={cn(
                  "h-full rounded-2xl border bg-card p-7 text-center transition-[border-color,translate] hover:-translate-y-0.5 sm:text-left",
                  ITEM_TYPE_BORDER_COLORS[slug]
                )}
              >
                <div
                  className={cn(
                    "mx-auto mb-4 grid size-11 place-items-center rounded-xl sm:mx-0",
                    ITEM_TYPE_TINT_COLORS[slug],
                    ITEM_TYPE_TEXT_COLORS[slug]
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                <p className="text-[15px] text-muted-foreground">{description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
