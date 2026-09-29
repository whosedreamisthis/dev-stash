import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/homepage/Reveal";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <Reveal className="mx-auto mb-14 max-w-2xl text-center">
      <Badge variant="outline" className="mb-4 h-auto px-3 py-1 text-xs text-muted-foreground">
        {eyebrow}
      </Badge>
      <h2 className="mb-3.5 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      <p className="text-lg text-muted-foreground">{description}</p>
    </Reveal>
  );
}
