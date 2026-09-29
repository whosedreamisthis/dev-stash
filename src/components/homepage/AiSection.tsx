import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checklist } from "@/components/homepage/Checklist";
import { Container } from "@/components/homepage/Container";
import { Reveal } from "@/components/homepage/Reveal";
import {
  AI_CAPABILITIES,
  AI_CODE_LINES,
  AI_TAGS,
  type CodeTokenKind,
} from "@/lib/homepage-content";
import { cn } from "@/lib/utils";

const TOKEN_CLASSES: Record<CodeTokenKind, string> = {
  keyword: "text-purple-400",
  function: "text-blue-400",
  string: "text-green-300",
  number: "text-amber-300",
  plain: "",
};

// Static classes so each tag pops in a little after the previous one
const TAG_DELAYS = ["delay-300", "delay-500", "delay-700", "delay-900", "delay-1100"];

function EditorMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-neutral-950 shadow-2xl">
      <div className="flex items-center gap-2 border-b bg-card px-4 py-3">
        <span className="size-2.75 rounded-full bg-[#ff5f57]" />
        <span className="size-2.75 rounded-full bg-[#febc2e]" />
        <span className="size-2.75 rounded-full bg-[#28c840]" />
        <span className="ml-2.5 font-mono text-xs text-muted-foreground">useDebounce.ts</span>
      </div>

      <pre className="editor-scrollbar overflow-x-auto p-4 font-mono text-xs leading-6 text-neutral-300 sm:text-[13px] sm:leading-7">
        <code>
          {/* Lines wrap under their own start on mobile, where a hidden scrollbar looks like clipping */}
          {AI_CODE_LINES.map((line, i) => (
            <div key={i} className="flex">
              <span className="mr-3 w-6 shrink-0 text-right text-muted-foreground/60 select-none">
                {i + 1}
              </span>
              <span className="min-w-0 wrap-break-word whitespace-pre-wrap sm:whitespace-pre">
                {line.map(([kind, text], j) => (
                  <span key={j} className={TOKEN_CLASSES[kind]}>
                    {text}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </code>
      </pre>

      <div className="border-t bg-card p-4">
        <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-violet-400 uppercase">
          <Sparkles className="size-3.5" />
          AI Generated Tags
        </p>
        <Reveal variant="group" threshold={0.5} className="flex flex-wrap gap-2">
          {AI_TAGS.map((tag, i) => (
            <span
              key={tag}
              className={cn(
                "reveal-item rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 font-mono text-xs text-violet-200",
                TAG_DELAYS[i % TAG_DELAYS.length]
              )}
            >
              {tag}
            </span>
          ))}
        </Reveal>
      </div>
    </div>
  );
}

export function AiSection() {
  return (
    <section className="border-y bg-card/40 py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Reveal className="min-w-0 text-center lg:text-left">
          <Badge
            variant="outline"
            className="mb-5 h-auto gap-1.5 border-violet-500/40 bg-violet-500/15 px-3 py-1 text-xs text-violet-300"
          >
            <Sparkles />
            Pro Feature
          </Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Let AI do the organizing</h2>
          <p className="mb-7 text-lg text-muted-foreground">
            DevStash reads what you save and helps you keep it tidy, understandable and easy to find.
          </p>
          <Checklist items={AI_CAPABILITIES} className="mx-auto w-fit lg:mx-0" />
        </Reveal>
        {/* min-w-0 lets the code scroll inside the editor instead of widening the page */}
        <Reveal className="min-w-0">
          <EditorMockup />
        </Reveal>
      </Container>
    </section>
  );
}
