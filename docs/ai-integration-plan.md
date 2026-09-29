# AI Integration Plan (Gemini)

Research output for `context/research/ai-integration-research.md`. This plan covers how to add the four Pro AI features (auto-tagging, summaries, code explanation and prompt optimization) to DevStash with Google's Gemini API, following the patterns the codebase already uses.

> **Spec note:** `context/project-overview.md` names Gemini `gemini-3.8-flash` and `GEMINI_API_KEY` as the AI provider, and `.env.example` has the `GEMINI_API_KEY=` line.

---

## 1. Model choice

**Use `gemini-3.8-flash`. It is on the free tier.**

Google's pricing page (checked 2026-09-29) lists these models with a free tier:

| Model                  | Free tier | Paid input / 1M | Paid output / 1M |
| ---------------------- | --------- | --------------- | ---------------- |
| **Gemini 3.8 Flash**   | ✅        | $0.75\*         | $3.75\*          |
| Gemini 3.7 / 3.6 Flash | ✅        | $0.75\*         | $3.75\*          |
| Gemini 3.5 Flash       | ✅        | $1.50           | $9.00            |
| Gemini 3.5 Flash-Lite  | ✅        | $0.30           | $2.50            |
| Gemini 2.5 Flash-Lite  | ✅        | $0.10           | $0.40            |

\* Introductory price through Dec 31, 2026. It goes up on Jan 1, 2027.

Keep the model ID in one constant (`AI_MODEL` in `src/lib/ai.ts`) so it can be swapped. If cost or quota becomes a problem, `gemini-3.5-flash-lite` or `gemini-2.5-flash-lite` are good fallbacks for auto-tagging, which is simple and high-volume.

### Free-tier caveats that matter for DevStash

1. **Data use.** On the free tier, Google marks prompt and response content as _"used to improve our products"_. On the paid tier it is not. User snippets, prompts and notes can contain private code or secrets, so **production should run on a paid (billing-enabled) project**. The free tier is fine for development.
2. **Quotas are per Google Cloud project, not per API key or per user.** Every DevStash user shares one project's RPM, TPM and RPD. Exact numbers vary by model and account and are shown in AI Studio. Requests-per-day quotas reset at midnight Pacific time. This is why DevStash needs its own per-user limits (section 5).
3. **Over-quota requests return HTTP `429 RESOURCE_EXHAUSTED`.**

---

## 2. SDK setup and configuration

Package: **`@google/genai`** (the Google Gen AI SDK; the older `@google/generative-ai` package is deprecated).

```bash
npm install @google/genai
```

```bash
# .env
GEMINI_API_KEY=   # server-only; never NEXT_PUBLIC_
```

### Lazy client (`src/lib/ai.ts`)

Follow the lazy-client pattern in `src/lib/stripe.ts` and `src/lib/rate-limit.ts`: create the client on first use, so a missing key doesn't break imports, the build or tests.

```ts
import "server-only";
import { GoogleGenAI } from "@google/genai";

export const AI_MODEL = "gemini-3.8-flash";

let client: GoogleGenAI | null = null;

// Created on first use so a missing key doesn't break imports or the build
export function getAiClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}
```

### Core call shape

```ts
const response = await getAiClient().models.generateContent({
  model: AI_MODEL,
  contents: userContent, // the item content, sent as data
  config: {
    systemInstruction: SYSTEM_PROMPT, // fixed per feature, never user-supplied
    maxOutputTokens: 400, // hard cost cap per feature
    temperature: 0.3,
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    abortSignal: AbortSignal.timeout(20_000),
  },
});
const text = response.text; // convenience accessor
const usage = response.usageMetadata; // token counts for logging
```

Useful `GenerateContentConfig` fields (from the SDK reference): `systemInstruction`, `maxOutputTokens`, `temperature`, `responseMimeType`, `responseJsonSchema`, `thinkingConfig`, `abortSignal`, `safetySettings`, `stopSequences`, `seed`.

### Thinking level

Gemini 3.x Flash thinks by default at **medium**, and **thinking tokens are billed as output tokens**. None of the four features needs deep reasoning, so set `thinkingLevel` explicitly:

| Feature          | Thinking level                                     |
| ---------------- | -------------------------------------------------- |
| Auto-tag         | `MINIMAL` if the model accepts it, otherwise `LOW` |
| Summary          | `LOW`                                              |
| Explain code     | `LOW` (try `MEDIUM` if quality is poor)            |
| Prompt optimizer | `LOW` or `MEDIUM`                                  |

The SDK's `ThinkingLevel` enum has `MINIMAL`, `LOW`, `MEDIUM` and `HIGH`. Google's thinking guide lists only low/medium/high for `gemini-3.8-flash`, so check `MINIMAL` against the live model before relying on it.

### Structured output (auto-tagging)

Ask for JSON and pass a JSON Schema. With Zod 4 (already installed, `^4.6.5`), build the schema once and convert it with `z.toJSONSchema()`. Then **still validate the response with the same Zod schema**, because model output is untrusted input.

```ts
const tagSuggestionSchema = z.object({
  tags: z.array(z.string().trim().min(1).max(ITEM_LIMITS.tag)).max(5),
});

const response = await getAiClient().models.generateContent({
  model: AI_MODEL,
  contents: buildTagPrompt(item),
  config: {
    systemInstruction: TAG_SYSTEM_PROMPT,
    responseMimeType: "application/json",
    responseJsonSchema: z.toJSONSchema(tagSuggestionSchema),
    maxOutputTokens: 150,
  },
});

const parsed = tagSuggestionSchema.safeParse(JSON.parse(response.text ?? "{}"));
```

Wrap the `JSON.parse` in the action's try/catch. Lower-case the tags, dedupe them, and drop any the item already has before returning them.

---

## 3. Server action patterns

The codebase loads and mutates data from client components through server actions in `src/actions/`, not API routes, and returns `{ success, data, error }`. The AI features should follow the same approach: **one new file, `src/actions/ai.ts`**, with no `/api/ai/*` routes. (The route table in the overview lists `/api/ai/*`, but the later "Replace API Routes with Server Actions" work set the rule that API routes are only for callbacks, webhooks and file responses.)

### Suggested file layout

| File                        | Purpose                                                                                             |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| `src/lib/ai.ts`             | Lazy client, `AI_MODEL`, `AI_LIMITS`, shared `generateText` / `generateJson` helpers, error mapping |
| `src/lib/ai-prompts.ts`     | System prompts and prompt builders per feature (pure functions, easy to unit test)                  |
| `src/lib/validations/ai.ts` | Zod input schemas and the tag-suggestion output schema                                              |
| `src/actions/ai.ts`         | `suggestTags`, `summarizeItem`, `explainCode`, `optimizePrompt`                                     |
| `src/actions/ai.test.ts`    | Vitest tests with `@/lib/ai`, `@/auth` and `@/lib/rate-limit` mocked                                |

### Action template

Every AI action runs the same guard sequence in the same order as `createItem` / `createCollection`: session → validation → Pro → rate limit → call → validate output.

```ts
"use server";

export interface AiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  rateLimited?: boolean; // lets the client reuse useRateLimitToast
}

export async function suggestTags(itemId: string): Promise<AiResult<string[]>> {
  const user = await getSessionUser();
  if (!user) return { success: false, error: NOT_SIGNED_IN_ERROR };
  if (!hasProAccess(user)) return { success: false, error: PRO_REQUIRED_ERROR };

  const parsed = aiItemIdSchema.safeParse(itemId);
  if (!parsed.success) return { success: false, error: "Item not found." };

  const limit = await checkRateLimit("ai", user.id);
  if (!limit.success) {
    return {
      success: false,
      rateLimited: true,
      error: getRateLimitMessage(limit.reset),
    };
  }

  try {
    // Load the item scoped by userId; never trust content sent from the client
    const item = await getItemDetail(user.id, parsed.data);
    if (!item) return { success: false, error: "Item not found." };

    const tags = await generateTagSuggestions(item);
    return { success: true, data: tags };
  } catch (error) {
    console.error("Suggesting tags failed:", error);
    return { success: false, error: toAiErrorMessage(error) };
  }
}
```

### Load by item ID, or accept draft content?

- **Existing items (drawer):** pass `itemId`, and the action loads the content with the user-scoped `getItemDetail`. This keeps the input bounded, owned by the user and already validated.
- **Unsaved drafts (`NewItemForm`, `ItemEditForm`):** auto-tag and the prompt optimizer are most useful _while_ the user is writing. Accept `{ title, content, typeSlug }` and validate it with a Zod schema that reuses `ITEM_LIMITS`, plus a tighter AI-specific cap (see section 6).

Supporting both is reasonable: validate either `{ itemId }` or `{ draft }` with a Zod union.

### AI never writes directly

The AI actions **return suggestions only; they don't save them**. Accepted tags, summaries or rewritten prompts are saved through the existing `updateItem` / `createItem` actions. This keeps validation in one place and gives the user the final say.

---

## 4. Streaming vs non-streaming

| Feature          | Output size                        | Recommendation                                      |
| ---------------- | ---------------------------------- | --------------------------------------------------- |
| Auto-tag         | Tiny JSON                          | **Non-streaming**; JSON must be complete to parse   |
| Summary          | 2–4 sentences                      | **Non-streaming**                                   |
| Explain code     | A few paragraphs                   | Non-streaming to start; streaming is a nice-to-have |
| Prompt optimizer | About the size of the input prompt | Non-streaming to start; streaming is a nice-to-have |

**Start with non-streaming server actions for all four.** Reasons:

- It matches the `{ success, data, error }` pattern and the Vitest setup, where a mocked `generateContent` is trivial to test.
- With `thinkingLevel: LOW` and a small `maxOutputTokens`, Flash responses usually return within a few seconds, so a skeleton loading state is enough.
- Accept/reject UIs need the full result before the user can act on it.

**If streaming is added later** (explain and optimize only), the SDK supports it with `generateContentStream`:

```ts
const stream = await getAiClient().models.generateContentStream({
  model: AI_MODEL,
  contents,
  config,
});
for await (const chunk of stream) {
  // chunk.text is the next piece of text
}
```

There are two ways to deliver it to the browser:

1. **A Route Handler that returns a `ReadableStream`** (`text/plain`). This is the most reliable option. It adds an API route, which is an explicit exception to the server-actions rule, so it needs the user's approval.
2. **A server action that returns a `ReadableStream` or async iterable** to the client (React 19 Flight can serialize these). This keeps the server-actions pattern, but confirm current Next.js 16 support in the docs before using it.

In both cases, run the full auth, Pro and rate-limit checks _before_ opening the stream, and pass `abortSignal` so a closed drawer stops the generation.

---

## 5. Error handling and rate limiting

### Mapping Gemini errors to user messages

The SDK throws on non-2xx responses; its error carries the HTTP status. Map errors to friendly messages in one helper (`toAiErrorMessage` in `src/lib/ai.ts`) and log the raw error server-side:

| Condition                                                                              | User message                                                |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `429` / `RESOURCE_EXHAUSTED` (project quota hit)                                       | "AI is busy right now. Please try again in a minute."       |
| `400` (bad request, content too long)                                                  | "This item is too long for AI features."                    |
| `401` / `403` (bad or missing key)                                                     | Generic message; log loudly, since it's a config error      |
| `500` / `503` (model overloaded)                                                       | "AI is temporarily unavailable. Please try again."          |
| Timeout (`AbortSignal.timeout`)                                                        | "The AI took too long to respond. Please try again."        |
| Empty `response.text` or blocked (`promptFeedback.blockReason` / safety finish reason) | "The AI couldn't process this content."                     |
| Output fails the Zod schema                                                            | "The AI returned an unexpected response. Please try again." |

**Retries:** do at most one retry, with a short backoff, and only on `503` or a timeout. Do not retry `429`: that makes quota exhaustion worse.

### Per-user rate limits (Upstash)

Add AI entries to `RATE_LIMITS` in `src/lib/rate-limit.ts` and key them by **user ID** (not IP, since AI actions require a session):

```ts
ai: { limit: 20, window: "1 m" },      // burst protection
aiDaily: { limit: 200, window: "1 d" }, // cost ceiling per user
```

**Fail-open vs fail-closed:** `checkRateLimit` currently _fails open_ on purpose, so auth keeps working when Upstash is down. That is the wrong default for AI, where each call costs money. Options:

- Add an optional `failClosed` flag to `checkRateLimit` for the AI limiters, or
- Accept fail-open, and rely on Gemini's project-level quota and paid-tier spend limits as the backstop.

The first is safer and needs only a small change.

The client can reuse the existing `useRateLimitToast` hook, because `AiResult` carries `rateLimited` and `error`.

---

## 6. Pro gating

The existing central gate covers this: `hasProAccess(user)` in `src/lib/usage-limits.ts`, with `PRO_REQUIRED_ERROR` as the message.

- **Server (required):** every AI action calls `getSessionUser()` and then `hasProAccess(user)` **before** the rate limit and the Gemini call. This follows `createItem`'s Pro check on upload types. While `ENFORCE_PLANS` isn't `"true"`, everyone has access, which matches the development-mode rule.
- **Client (UX only):** `useHasProAccess()` from `PlanContext` decides whether AI buttons are enabled. For free users, show the button with a PRO badge that links to `/upgrade` (the same pattern as the disabled File/Image options in the type dropdown), or `ProUpgradePrompt` inside a popover. The server check is the real gate.
- **Tests:** in `ai.test.ts`, use `vi.stubEnv("ENFORCE_PLANS", "true")` with a non-Pro session and assert that `PRO_REQUIRED_ERROR` is returned and `generateContent` is never called.

A free-tier AI quota (for example, 5 AI calls a month as a teaser) is out of scope: the spec makes AI Pro-only.

---

## 7. Cost optimization

1. **Cap input.** Add `AI_LIMITS = { inputChars: 20_000 }` (about 5k tokens). `ITEM_LIMITS.content` allows 100,000 characters, which is too much to send on every click. Truncate long content to the head (and tail, for code) with a "[truncated]" marker, or reject it with a clear message.
2. **Cap output** with a `maxOutputTokens` per feature: tags about 150, summary about 300, explain about 800, optimizer about 1,000.
3. **Keep thinking low.** Thinking tokens are billed as output; the default is medium (section 2).
4. **Only call when asked.** Trigger AI on explicit clicks, never on keystrokes, drawer open or save. If auto-tag suggestions ever run automatically, debounce them heavily and run them only once per content change.
5. **Cache repeat results.** Hash `(feature, content)` and cache the result in Upstash Redis (already a dependency) with a TTL, so repeated "Explain" clicks on unchanged content are free. Optionally, store summaries in the database if the product wants them to persist (a schema change would need a migration and a spec decision).
6. **Use a cheaper model for tagging.** Tagging is the simplest task, so it can use `gemini-3.5-flash-lite` or `2.5-flash-lite` if 3.8 Flash costs add up.
7. **Log usage.** Log `response.usageMetadata` token counts per feature (server logs are enough at first) to see real costs before tuning.
8. **Watch the price change.** 3.8 Flash's introductory price ends Dec 31, 2026; review costs before then.

---

## 8. UI patterns

All AI UI lives in client components and calls the server actions. Suggested components go in `src/components/ai/`.

### Where each feature appears

| Feature          | Location                                                       | Trigger                                         |
| ---------------- | -------------------------------------------------------------- | ----------------------------------------------- |
| Auto-tag         | Tags field in `NewItemForm` / `ItemEditForm`                   | "✨ Suggest tags" button next to the tags input |
| Summary          | Item drawer, for notes, prompts and long content               | "Summarize" in `ItemDrawerActions`              |
| Explain code     | Item drawer, for snippets and commands (`LANGUAGE_TYPE_SLUGS`) | "Explain" in `ItemDrawerActions`                |
| Prompt optimizer | Prompt edit form, next to `MarkdownEditor`                     | "Optimize prompt" button                        |

### Loading states

- Disable the trigger button and show a spinner inside it (`useTransition` + `isPending`), so double clicks can't send duplicate paid requests.
- For panel results (summary, explanation), show a shadcn `Skeleton` block of the expected shape.
- Offer **Cancel** on longer calls; closing the drawer should also abandon the result (the existing `useIsMountedRef` hook helps avoid setting state after unmount).

### Accept / reject suggestions

AI output is always a _proposal_ the user has to accept:

- **Tags:** show suggestions as clickable, dashed-outline chips under the tags input. Clicking one adds it to the tag list; there's also "Add all" and a dismiss ✕. Don't show tags the item already has, and respect `ITEM_LIMITS.tags`.
- **Prompt optimizer:** show the rewritten prompt in a side-by-side or tabbed **Original / Optimized** view with **Accept**, **Reject** and **Copy** buttons. Accept replaces the editor content; nothing is saved until the user saves the form. Keep the original so Accept can be undone.
- **Summary:** show it in a collapsible panel in the drawer, with **Copy** and **Use as description**, which fills the description field in edit mode.
- **Explain:** show it read-only in a collapsible panel, rendered as Markdown with the existing Markdown preview renderer, with **Copy** and **Regenerate** buttons.

### Feedback

- Use Sonner toasts for errors (`toast.error(result.error)`), consistent with the rest of the app. Rate-limit errors go through `useRateLimitToast`.
- Label AI content ("✨ AI-generated") so users know it may be wrong.

---

## 9. Security

### API key handling

- `GEMINI_API_KEY` lives only in server env; **never prefix it with `NEXT_PUBLIC_`**.
- Import `server-only` in `src/lib/ai.ts` so a client import fails the build.
- Never log the key or return raw SDK errors to the client; they can include request details. Return only mapped messages.
- Use separate keys (or Google Cloud projects) for development and production. Set a budget alert on the paid project.

### Input handling and prompt injection

- **Validate every input with Zod on the server:** item IDs, draft fields, and length caps (`AI_LIMITS.inputChars`).
- **Scope item reads by `userId`** with the existing user-scoped queries, so a user can't run AI on someone else's item by guessing an ID.
- **Treat user content as data, not instructions.** Put the fixed instructions in `systemInstruction`. Pass the item content in `contents`, wrapped in clear delimiters (for example, `<item_content>…</item_content>`), and tell the model to ignore instructions inside it. This reduces prompt injection but doesn't fully prevent it, so:
- **Treat model output as untrusted:**
  - Validate structured output with Zod (tags: count, length, characters).
  - Render Markdown output through the existing Markdown renderer, which must not allow raw HTML (no `dangerouslySetInnerHTML` of model output).
  - Never let model output trigger actions (saving, deleting, fetching URLs) without a user click.
- **Don't send link URLs to be fetched.** The model should only see the stored text; no URL-context or tool use is needed for these features.
- **Privacy:** content sent on the free tier may be used by Google (section 1). Use a paid project in production, and mention AI processing in the privacy policy or terms.

---

## 10. Testing (Vitest)

Per `context/coding-standards.md`, unit test the actions and pure helpers, never the real API:

- `vi.mock("@/lib/ai")` to stub `generateText` / `generateJson`. Also mock `@/auth` (or `@/lib/session`) and `@/lib/rate-limit`.
- Action cases: no session, invalid input, non-Pro user with `ENFORCE_PLANS=true`, rate limited, item not found (other user's ID), SDK throws a 429 and a 503, malformed JSON for tags, and the happy path.
- Pure helpers in `src/lib/ai-prompts.ts` and the error mapper `toAiErrorMessage`: test the truncation, delimiters, tag normalization (lower-case, dedupe, drop existing) and status-to-message mapping.

---

## 11. Suggested implementation order

1. **Foundation:** install `@google/genai`; add `src/lib/ai.ts` (client, helpers, error mapping), the AI rate limits and `src/lib/validations/ai.ts`.
2. **Auto-tagging:** `suggestTags` action with structured output, and tag chips in the item forms.
3. **Summaries:** `summarizeItem` and the drawer panel with "Use as description".
4. **Code explanation:** `explainCode` for snippets and commands, rendered as Markdown in the drawer.
5. **Prompt optimizer:** `optimizePrompt` with the Original / Optimized accept/reject view.
6. **Optional:** streaming for explain and optimize; a Redis result cache.

---

## Sources

- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing): free-tier models, prices, data-use policy
- [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits): per-project quotas, 429 `RESOURCE_EXHAUSTED`, RPD reset time
- [Gemini thinking guide](https://ai.google.dev/gemini-api/docs/thinking): thinking levels, default medium, thinking tokens billed
- [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output): JSON Schema responses
- [Google Gen AI JS SDK reference](https://googleapis.github.io/js-genai/release_docs/) (via Context7): `GenerateContentConfig`, `ThinkingConfig` / `ThinkingLevel`, `generateContentStream`
- [Gemini free tier overview (third party)](https://aipromptshub.co/blog/gemini-api-free-tier-rate-limits): background on free-tier RPM/RPD ranges
- Codebase: `src/lib/usage-limits.ts`, `src/lib/rate-limit.ts`, `src/lib/session.ts`, `src/lib/stripe.ts`, `src/actions/items.ts`, `src/actions/collections.ts`, `src/lib/validations/items.ts`, `src/components/billing/PlanContext.tsx`, `src/hooks/useRateLimitToast.ts`
