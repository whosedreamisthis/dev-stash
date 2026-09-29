# Homepage

## Overview

Replace the placeholder `src/app/page.tsx` with the real marketing homepage, built from the mockup in `prototypes/homepage/` (`index.html`, `styles.css`, `script.js`). Match its layout, sections and animations, rebuilt with the project's stack.

## Requirements

- Public route `/` (not in the `src/proxy.ts` matcher), dark theme like the rest of the app
- Sections from the mockup: fixed nav, hero text, chaos → arrow → dashboard preview, 6 feature cards, Pro AI section with editor mockup and AI tags, pricing, closing CTA, footer
- Components in `src/components/homepage/`, one per section (e.g. `HomeNav`, `Hero`, `ChaosIcons`, `DashboardPreview`, `FeaturesSection`, `AiSection`, `PricingSection`, `CtaSection`, `HomeFooter`); `page.tsx` only composes them
- Static content (features, pricing plans, footer links, chaos icons) lives in data arrays in one file (e.g. `src/lib/homepage-content.ts`) and is mapped over, not repeated in JSX
- Page metadata (title and description) via Next.js `metadata`

## Server vs Client Components

- Server components by default: page, hero text, dashboard preview, features, AI section, CTA, footer
- Client components only where interactivity is needed, kept as small as possible:
  - `ChaosIcons`: `requestAnimationFrame` drift, wall bounce, rotation/scale pulse, cursor repel; clean up the frame loop and listeners on unmount; on resize scale positions to the new size instead of clamping them to the edge (avoids the mockup's icon bunching)
  - Nav scroll state (more opaque background and border after scrolling)
  - `PricingToggle`: monthly $8/mo ↔ yearly $72/yr (shows "$6/month, billed yearly"), using the shadcn `Switch`
  - `Reveal` wrapper: fade in on scroll with `IntersectionObserver`, reused by every section
  - AI tags appearing one by one when scrolled into view (can reuse the `Reveal` observer logic via a shared hook)
- Respect `prefers-reduced-motion`: no icon motion, arrow pulse or fade-ins
- Content must be visible without JavaScript before hydration (no blank sections if the observer never fires)

## Styling

- Tailwind v4 utilities and shadcn/ui (`Button`, `Badge`, `Switch`); no `styles.css` port, no inline styles
- Custom keyframes (arrow pulse, pulse pointing down on mobile) go in `src/app/globals.css`
- Use the app's item type colors and icons from `src/lib/item-type-icons.ts` (`ITEM_TYPE_TEXT_COLORS`, `ITEM_TYPE_BG_COLORS`, `ITEM_TYPE_BORDER_COLORS`, Lucide icons), not the mockup's palette
- Dashboard preview cards reuse the app's card border style (3px type-colored top border, colored outline on hover)
- Brand icons (Notion, GitHub, Slack, VS Code) as small inline SVG components; the rest use Lucide
- Responsive as in the mockup: hero stacks on mobile with the arrow pointing down, grids go single column, nav hides its links and Sign In

## Links & Buttons

- Logo → `/`
- Nav "Features" / "Pricing" → `#features` / `#pricing` (smooth scroll, offset for the fixed nav)
- Signed out: "Sign In" → `/sign-in`; "Get Started", "Start for Free", Free plan button and CTA button → `/register`
- Signed in (check the session in the server nav): replace Sign In / Get Started with "Go to Dashboard" → `/dashboard`; CTA and plan buttons also go to `/dashboard`
- "See Features" → `#features`
- "Upgrade to Pro" → `/register` when signed out, `/dashboard` when signed in (Stripe checkout isn't built yet)
- Footer: only links with real destinations (Features, Pricing, Sign In, Register); drop the mockup's placeholder links (Changelog, Docs, Blog, Support, About, Privacy, Terms)
- Footer copyright shows the current year

## Notes

- Pricing numbers match the project overview: Free $0 (50 items, 3 collections), Pro $8/mo or $72/yr
- No new server actions or database queries beyond reading the session
- Keep `prototypes/homepage/` as the reference; don't delete it
