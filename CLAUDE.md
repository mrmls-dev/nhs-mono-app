# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**National House Search** — A multi-tenant white-label real estate platform. The platform has two layers:

Main site — showcases DR Horton SE Florida communities and models
White-label SaaS — We resells the platform + GoHighLevel CRM to other real estate agents/brokers, each getting their own branded site on their own domain.

The core public experience is a map + community listing view, community detail pages, and model detail pages with lead capture. Leads are pushed to the tenant's GoHighLevel sub-account automatically.

## Commands

All commands run from the repo root unless noted.

```bash
npm run dev        # Start all apps in dev mode
npm run build      # Build all packages and apps
npm run lint       # ESLint across the workspace
npm run format     # Prettier with Tailwind class sorting
npm run typecheck  # TypeScript strict check (no emit)
```

Scoped to `apps/web` only (faster during development):

```bash
npx turbo dev --filter=web
npx turbo build --filter=web
```

## Architecture

### Monorepo Layout

```
apps/web/          — Next.js app (main product)
packages/ui/       — Shared shadcn/ui component library
packages/eslint-config/
packages/typescript-config/
```

`packages/ui` exports components via `@workspace/ui/components/*`. The app imports these alongside its own components in `apps/web/components/`.

### Next.js Version Warning

This project uses **Next.js 16** (not v14/v15). APIs, conventions, and file structure differ from training data. Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`.

### Routing (App Router)

```
/                                → Home — community listing with map
/communities/[id]                → Community detail with gallery and map
/communities/[id]/plans/[planId] → Floor plan detail
/schedule                        → Embedded scheduling iframe (Mostro360)
```

Community and plan pages use `generateStaticParams()` for static generation and `generateMetadata()` for per-page SEO.

### Data Layer

Static JSON files power the app — no database yet:

- `apps/web/data/regions.json` — hierarchy: State → Regions → Counties → Communities → Floor Plans / Schools / Gallery
- `apps/web/data/communities.json` — flattened community index

For future server data fetching: fetch inside `apps/web/api/*.ts` (reusable functions), then hydrate components with **TanStack Query**. Do not fetch directly inside components.

### Key Components

| Component             | Role                                                  |
| --------------------- | ----------------------------------------------------- |
| `CommunitiesSection`  | Main listing view — map + sidebar with filters        |
| `ListingMap`          | Mapbox GL map for the listing page (client component) |
| `CommunityMap`        | Mapbox GL map for community detail (school markers)   |
| `CommunityGallery`    | yet-another-react-lightbox with image/video support   |
| `NavDropdown`         | Radix UI dropdown for county URL-param filtering      |
| `ScheduleVisitButton` | CTA linking to `/schedule` with context params        |
| `MobileTabBar`        | Tab navigation (map ↔ list) on mobile                 |

Maps default to SE Florida: `[-80.3, 26.35]`, zoom `7.75`.

### Environment Variables

`NEXT_PUBLIC_MAPBOX_TOKEN` is required for all map components. Set it in `apps/web/.env.local`.

`MAPBOX_SERVER_TOKEN` (server-only, **no** `NEXT_PUBLIC_` prefix) powers the `/api/mapbox/[...path]` proxy. Because tenants run on arbitrary custom domains/subdomains, a URL-restricted public token would 403 the map on every new domain. Instead, the map's `transformRequest` (`apps/web/lib/mapbox.ts`) reroutes all `*.mapbox.com` traffic through the proxy, which injects this unrestricted token server-side. It needs scopes `styles:read`, `styles:tiles`, `fonts:read` and **no URL restrictions**. Set it in `apps/web/.env.local` locally and in the Vercel project env for production.

GoHighLevel credentials for the internal marketing feature are configured in the dashboard at `/dashboard/integrations` (preferred) and stored **encrypted** in the `GhlIntegration` row. `GHL_API_TOKEN` + `GHL_LOCATION_ID` env vars (API only, server-only, **no** `NEXT_PUBLIC_` prefix) are an optional fallback when no integration has been saved.

### Internal Marketing Contacts (platform-staff only)

`/dashboard/contacts` is an **internal-only** page (not for white-label agent tenants) for our own marketing team. "Fetch latest" pulls engaged contacts (tagged `opened`/`clicked`/`replied`) from **our single GHL location** into the global `MarketingContact` table — upserted by `ghlContactId` so repeated fetches never duplicate, and re-syncs never clobber the team's local phone/status/outreach/note. The team edits a phone, Lead Status, Last Outreach, and Note per row; only a changed phone is pushed back to GHL. API: `apps/api/src/marketing-contacts/` (guarded `@Roles("admin")`) over the `apps/api/src/ghl/` client; web fetcher at `apps/web/lib/api/marketing-contacts.ts`. Unlike `AgentCounty`/`AgentHiddenCommunity`, this table is **not** tenant-scoped.

**GHL connection** — managed at `/dashboard/integrations` (`apps/api/src/integrations/`, `@Roles("admin")`). The Private Integration Token is verified live on save, then stored AES-256-GCM encrypted (`GhlIntegration.tokenCipher`) via `CryptoService` (`apps/api/src/common/crypto.ts`, key derived from `BETTER_AUTH_SECRET`). The token is **write-only** — the API only ever returns a masked `tokenLast4`. `GhlService` reads creds from this row, falling back to env vars.

## Coding Conventions & Agent Skills

See [AGENTS.md](AGENTS.md) for all coding requirements and the full list of agent skill files to read before writing code.
