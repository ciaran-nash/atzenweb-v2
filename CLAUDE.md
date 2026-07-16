# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Atzengold Web** — marketing/webshop/B2B website + admin CMS for Atzengold Kellerbier (premium German street-brew from Franconia × Berlin).

**Tech Stack:**
- Frontend: React 19 + TypeScript + Vite (Tailwind v4 with OKLCH colors)
- Backend: Vercel Functions (Express) + Vercel KV (Redis via `@vercel/kv`)
- Hosting: Vercel
- Internationalization: i18next (DE, EN, de-BY)
- Payments: Stripe Checkout
- Email: Resend API
- Image storage: Vercel Blob
- Animation: `motion/react` (not framer-motion — package is `motion`)
- AI: `@google/genai` (Gemini)

## Development Commands

```bash
# Terminal 1 — API (Vercel Functions, port 3001)
vercel dev --listen 3001

# Terminal 2 — Frontend (Vite, proxies /api/* to 3001)
npm run dev
```

Frontend: `http://localhost:3000`. Admin: `http://localhost:3000/#admin` key `atzengold-admin-dev-key`.

```bash
npm run lint       # tsc --noEmit (run before commit)
npm run test:run   # Vitest single run (CI)
npm run test       # Vitest watch
npm run build      # vite build → dist/
npm run clean      # rm dist/ server.js
```

**Run a single test file:**
```bash
npx vitest run MerchShop      # matches src/components/__tests__/MerchShop.test.tsx
```

## Architecture

### Path Alias
`@` resolves to the **project root** (not `src/`). So `@/src/types` or `@/lib/api` — not `@/types`.

### Frontend (`src/`)
- **`App.tsx`** — Single-page router. Hash-based navigation (`#admin`, `#map`, etc.), language state, notification system. All admin routes are lazy-loaded here via `React.lazy`.
- **`components/`** — Feature components. Heavy ones (ThreeDMap, Bottle3D) are lazy-loaded in App.tsx.
- **`components/admin/`** — Admin CMS UI. `AdminCrud.tsx` is the shared generic CRUD form base; all other `Admin*.tsx` files extend it.
- **`components/__tests__/`** — All Vitest tests live here (not a top-level `tests/` directory).
- **`lib/`** — `api.ts` (fetch wrappers), `cart.ts` (localStorage cart), `stripe.ts`, `color-utils.ts`.
- **`constants/translations.ts`** — Hardcoded fallback translations for all 3 locales.
- **`types.ts`** — Single source of truth for all data schemas.

### API (`api/`)
Vercel Functions. Each file exports an Express handler; Vercel maps it to `/api/<filename>`.

- **`admin/`** — CRUD endpoints for all CMS collections (auth-gated via `api/_lib/auth.ts`)
- **`_lib/`** — Shared: `auth.ts` (bearer token check), `kv.ts` (KV client + collection helpers), `stripe-client.ts`, `resend-client.ts`, `blob.ts`

### Data Layer
- **Vercel KV** — Redis, namespaced by type: `venues:1`, `merch:order:123`, etc.
- **Schema** — `src/types.ts` defines shapes; `api/_lib/kv.ts` has validation and collection helpers.
- **Admin auth** — Bearer token (`ADMIN_API_KEY` env var) on all write endpoints.

### Key Architectural Flows
- **Translations**: fallback in `src/constants/translations.ts` → runtime KV overrides loaded from `/api/admin/translations` → DeepL auto-translate available in Admin UI.
- **Cart**: client-side localStorage only (`lib/cart.ts`), no backend until Stripe Checkout session created.
- **Images**: upload → `sharp` compress (WebP, max 800px, ≤100KB) → Vercel Blob URL stored in KV.
- **Admin**: lazy-loaded React UI at `#admin`. `AdminCrud.tsx` provides the generic form pattern all collection editors use.

## Design Constraints

### Colors — OKLCH only
```
❌  #921a22  rgb()  hsl()
✅  oklch(0.375 0.155 24.5)               (raw CSS)
✅  bg-[oklch(0.375_0.155_24.5)]          (Tailwind v4 arbitrary)
✅  bg-primary                             (semantic theme value)
```

Brand tokens:
- Primary Red: `oklch(0.375 0.155 24.5)`
- Gold Accent: `oklch(0.7 0.15 65)`
- Cream: `oklch(0.95 0.02 65)`

### Typography
- **UnifrakturMaguntia** — Display headings (h1/h2) only. Never `uppercase` or `letter-spacing`.
- **Plus Jakarta Sans** — Body copy, UI text.
- **JetBrains Mono** — Technical specs, metrics, tables. Always `font-variant-numeric: tabular-nums`.

## Key Patterns

### API calls — use wrappers, not raw fetch
```typescript
import { apiGet, apiPost } from '@/lib/api';
const venues = await apiGet('/admin/venues');
await apiPost('/send-email', { email, message });
```

### Admin endpoints — bearer auth
```typescript
import { verifyAuth } from '../_lib/auth';
if (!verifyAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
```

### Adding a new admin collection
1. Add type to `src/types.ts`
2. Add KV namespace helpers to `api/_lib/kv.ts`
3. Create `api/admin/[collection].ts` with CRUD handlers
4. Create `src/components/admin/Admin[Collection].tsx` using `AdminCrud` pattern
5. Add lazy import + route in `App.tsx`

## Environment Variables

**Required for dev** (`.env.local`):
- `ADMIN_API_KEY` — dev value: `atzengold-admin-dev-key`
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob (image uploads)

**Optional** (features degrade gracefully if missing):
- `RESEND_API_KEY` — email; fallback: stored in KV via Admin > Settings
- `STRIPE_SECRET_KEY` — payments; fallback: stored in KV via Admin > Settings
- `STRIPE_WEBHOOK_SECRET` — production Stripe webhooks only
- `INSTAGRAM_ACCESS_TOKEN` — real IG feed; default: mocked data

## Debugging

| Symptom | Cause |
|---|---|
| Admin blank/redirect loop | `ADMIN_API_KEY` mismatch; clear localStorage, try incognito |
| API 401 | Bearer token missing or wrong |
| Images not uploading | `BLOB_READ_WRITE_TOKEN` missing/invalid |
| Emails not sending | `RESEND_API_KEY` missing → Admin > Settings |
| Translations stale | KV cache; hard-refresh or restart Vite |
| Stripe errors | Check test mode key (`sk_test_...`) or webhook secret |

## Reference Files

- **`RULES.md`** — Karpathy coding guidelines: think before coding, surgical changes, no speculative abstractions.
- **`.cursorrules`** — Design constraints (OKLCH, typography) — duplicate of above but read before any styling work.
- **`PRODUCT.md`** — Feature docs, account setup instructions (Resend, Stripe, Instagram, DeepL).
- **`design.md`** — Brand tokens (reference; not yet fully wired into code).
