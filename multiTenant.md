# Multi-Tenant White-Label System

## Context

National House Search is a white-label real estate platform: we resell the same site + GoHighLevel CRM to multiple agents, each getting a **branded site on their own domain**. The codebase already has a NestJS API (Prisma/Postgres, R2 storage) and a Next.js 16 web app (marketing site + an **unprotected** dashboard with a placeholder user). What's missing is the multi-tenancy itself.

Decisions locked with the user:

- **Communities are a shared global catalog.** Every agent's site shows the same platform-managed communities — only branding/domain differ. **No `tenantId` on Community/County/Region.** Tenancy = branding + domain + (future) lead routing.
- **Hosting:** Next.js app on **Vercel**; agent custom domains via **Cloudflare for SaaS** (custom hostnames → SSL → Vercel origin).
- **Auth:** **Better Auth** with the **organization** plugin (each agent = one organization) + **admin** plugin (platform super-admin = "us").
- **Agents cannot add communities.** Agents customize: **logo, brand color(s), site name/title, contact/footer, and a GHL schedule embed**. The same branding tooling is available to platform admins (for any tenant) and to agents (for their own org).
- **Subscription access control (not a "ban"):** each tenant has a `serviceStatus` (`active` / `suspended`). A team member toggles it from the admin section after manually checking payment in GHL. **Suspended ≠ blocked login** — the agent can still log in and sees a **payment-required warning**, but their **public site (custom domain + marketing pages) is no longer served**. This is org-level, distinct from any user-level state.
- **Admin-driven onboarding:** admins add agents directly (create user + org + owner membership). **No public signup form. No forgot-password flow** for now. Only a `/login` page.
- **Email verification:** keep the `emailVerified` field, but **no verification flow now** (admin-created agents are created already-verified).
- **Build order:** **all UI first** (login page, agent dashboard, super-admin dashboard) with mock data, then wire the backend.

**Architectural decision (please confirm at approval):** Better Auth is mounted **inside the NestJS API**, reusing the existing `PrismaService`. Rationale: one DB schema + one migration source; NestJS guards validate sessions in-process (no JWT/JWKS); the web app remains a pure API client. The **dashboard is served on a canonical domain** (e.g. `app.nationalhousesearch.com`); **agent custom domains serve only the public site**, which avoids cross-domain auth-cookie issues.

---

## Tenant model

Tenant data lives on the Better Auth `organization` table, extended via the org plugin's `additionalFields` (skill: `organization-best-practices` lines 351–384) — no separate Tenant table. A default "National House Search" org (current logo/colors) is seeded and bound to the canonical domain.

---

## Prisma schema changes

All additions go into [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma). The Better Auth CLI (`npx @better-auth/cli generate`) produces the base auth models; we then add `additionalFields`, the unique index, and relations. **No changes to `Community`, `County`, `Region`, `FloorPlanModel`, etc.** (catalog stays global). New models (sketch — exact columns finalized from CLI output):

```prisma
model User {
  id            String       @id @default(cuid())
  name          String
  email         String       @unique
  emailVerified Boolean      @default(true)  // field kept; no verification flow now (admin-created = verified)
  image         String?
  role          String?      // admin plugin: "admin" = platform super-admin (us); else agent
  banned        Boolean?     // admin plugin (present but UNUSED — access control is org.serviceStatus, not user ban)
  banReason     String?
  banExpires    DateTime?
  sessions      Session[]
  accounts      Account[]
  members       Member[]
  invitations   Invitation[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

model Session {
  id                   String   @id @default(cuid())
  token                String   @unique
  userId               String
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  activeOrganizationId String?  // org plugin: which tenant the user is acting on
  impersonatedBy       String?  // admin plugin
  ipAddress            String?
  userAgent            String?
  expiresAt            DateTime
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

model Account {
  id                    String    @id @default(cuid())
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  password              String?   // email/password hash
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model Organization {           // == the Tenant
  id               String       @id @default(cuid())
  name             String
  slug             String       @unique   // subdomain / identifier
  logo             String?                 // R2 URL  (built-in)
  metadata         String?                 // (built-in, JSON string)
  // --- additionalFields (white-label branding + access) ---
  serviceStatus    String       @default("active")  // "active" | "suspended" (payment gate)
  customDomain     String?      @unique     // agent domain for Host lookup
  domainStatus     String?                  // "pending" | "active" (Cloudflare)
  brandColor       String?                  // primary theme color (hex)
  siteName         String?                  // site name + <title>/SEO
  contactPhone     String?
  footerText       String?
  ghlScheduleEmbed String?      @db.Text    // per-tenant /schedule embed
  members          Member[]
  invitations      Invitation[]
  createdAt        DateTime     @default(now())
}

model Member {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  userId         String
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  role           String       // "owner" | "admin" | "member" (org-scoped)
  createdAt      DateTime     @default(now())
  @@unique([organizationId, userId])
}

model Invitation {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  email          String
  role           String?
  status         String       // "pending" | "accepted" | "canceled"
  expiresAt      DateTime
  inviterId      String
  inviter        User         @relation(fields: [inviterId], references: [id], onDelete: Cascade)
}
```

Migration steps: `npx @better-auth/cli generate` → reconcile the generated models into the schema above (cuid ids, `@db.Text`, the `customDomain` unique index, relations) → `npx prisma migrate dev --name add_auth_and_tenants` → `npx prisma generate`.

---

## Implementation (phased)

### Phase 1 — Full UI build first (design-complete, mock data, no backend)

Goal: every screen looks and navigates correctly against local mock data, so design is signed off before wiring. Use React Hook Form + Zod, Lucide icons, shadcn semantic tokens ([AGENTS.md](AGENTS.md)). A temporary `apps/web/lib/mock-session.ts` exposes a switchable role (`platform-admin` | `agent`) so both dashboards can be previewed without auth.

- **Auth page** (single, public): `apps/web/app/(auth)/login` — form, validation, loading/error states. No real submit yet. **No signup, no forgot-password.**
- **Role-aware shell:** make [apps/web/app/dashboard/\_components/DashboardSidebar.tsx](apps/web/app/dashboard/_components/DashboardSidebar.tsx) + [DashboardTopbar.tsx](apps/web/app/dashboard/_components/DashboardTopbar.tsx) read the mock role.
    - **Super-admin nav:** Overview, Communities, Regions, Counties, Floor Plans (existing) **+ Agents** (list / add agent / suspend) **+ Branding** (for a selected agent) **+ Domains**. (The "Agents" section manages tenant orgs — one org per agent.)
    - **Agent nav:** Overview (their site stats placeholder), **Branding**, **Domain**, **Schedule Embed**, **Settings** — no Communities/Regions/Counties.
- **Suspension UX:** a `PaymentWarningBanner` shown across the agent dashboard when their `serviceStatus === "suspended"` (mock toggle) — agent still navigates the dashboard, just sees the warning.
- **New dashboard pages (mock-backed):**
    - `dashboard/agents/` — table of orgs with a **service on/off toggle** + status chip (`active`/`suspended`), and an **"Add agent" dialog** (agent name, email, initial password, org name, slug). No self-signup anywhere. (Route/label is "Agents"; each row is a tenant org.)
    - `dashboard/branding/` — shared `BrandingForm`: logo upload preview, brand-color picker, site name, contact phone, footer text. Admin variant takes a tenant selector; agent variant is fixed to "your site".
    - `dashboard/domain/` — domain input, generated DNS-records card, `pending → active` status chip (mock).
    - `dashboard/schedule-embed/` — textarea + live preview pane.
    - `dashboard/settings/` — agent profile + **change password** (since there's no forgot-password flow).
- **Public-site branding preview:** a `BrandThemeProvider`/`<style>` token-override component + tenant logo/footer from a mock tenant, plus a **"site suspended / payment required"** placeholder page shown when the mock tenant is suspended.

### Phase 2 — Better Auth in NestJS + schema (foundation)

- Add `better-auth` to `apps/api`; create `apps/api/src/auth/auth.ts` (`betterAuth`) using the **Prisma adapter** over the existing `PrismaService` ([apps/api/src/prisma/prisma.service.ts](apps/api/src/prisma/prisma.service.ts)). Enable `emailAndPassword`, `organization({ additionalFields })`, `admin()`; set `advanced.crossSubDomainCookies` for the `*.nationalhousesearch.com` parent and `session.cookieCache`.
- Mount `toNodeHandler(auth)` at `/api/auth/*` in [apps/api/src/main.ts](apps/api/src/main.ts) **before** Nest's JSON body parser (`rawBody`/exclude path). Keep CORS `credentials: true`, origin = canonical app domain.
- Apply the **Prisma schema changes** above; migrate; add `CurrentSessionGuard` + `@Roles()` in `apps/api/src/auth/` using `auth.api.getSession({ headers })`.

### Phase 3 — Wire auth into the web UI

- `apps/web/lib/auth-client.ts` (`organizationClient()` + `adminClient()`, `baseURL = NEXT_PUBLIC_API_URL`); replace `mock-session` with `useSession`. Real submit on the Phase-1 auth pages; real `signOut` in topbar.
- `apps/web/middleware.ts`: read Better Auth cookie cache → gate `/dashboard/*`; redirect unauthenticated to `/login`.
- Update `apps/web/api/*.ts` protected calls to `credentials: "include"` (reuse existing error pattern).

### Phase 4 — Tenant branding + onboarding + service status wired to API

- `apps/web/api/tenant.ts` (get my org, update branding, admin: list orgs, add agent, set service status) → TanStack Query (provider in [apps/web/components/providers.tsx](apps/web/components/providers.tsx)).
- **Add agent (admin-only, server-side):** admin plugin `auth.api.createUser` (name, email, initial password, `emailVerified: true`) → `auth.api.createOrganization({ userId })` (owner) with initial branding defaults. No invite email needed.
- **Service status toggle (admin-only):** `PATCH /tenants/:id/service-status` setting `serviceStatus` to `active`/`suspended`. Drives the Phase-1 toggle + status chip.
- Point Phase-1 `BrandingForm`/tenants/domain/settings pages at real endpoints; logo upload **reuses** `uploadFile` in [apps/web/api/storage.ts](apps/web/api/storage.ts) (folder `tenants/{slug}`). Agent `settings` change-password → `auth.api.changePassword`.

### Phase 5 — Public-site theming wired to real tenant

- Resolve tenant by Host in [apps/web/app/(marketing)/layout.tsx](<apps/web/app/(marketing)/layout.tsx>) via `headers()` → `GET /tenants/by-domain`; canonical host → default org. **If the resolved tenant is `suspended`, render the "site suspended / payment required" page instead of the marketing content** (the agent dashboard stays reachable on the canonical host).
- Connect the Phase-1 `BrandThemeProvider` (override `--primary`/`--ring`/`--sidebar-primary` from `brandColor`; tokens in [packages/ui/src/styles/globals.css](packages/ui/src/styles/globals.css)) + tenant logo/siteName/footer/contact in nav/footer and root metadata ([apps/web/app/layout.tsx](apps/web/app/layout.tsx)).
- Replace the hardcoded Mostro360 iframe in `apps/web/app/(marketing)/schedule/page.tsx` with the tenant `ghlScheduleEmbed` (iframe `src`/sanitized).

### Phase 6 — Custom domains (Cloudflare for SaaS)

- `apps/api/src/cloudflare/cloudflare.service.ts` → CF **Custom Hostnames API** (`POST/DELETE /zones/{zone}/custom_hostnames`) with env `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`, `CF_SAAS_FALLBACK_ORIGIN`. (No SaaS-specific skill reference exists; use the CF API directly. One-time ops: SaaS fallback origin → Vercel domain; add domain in Vercel.)
- Tenant endpoints: add/verify/remove domain → create hostname, persist `customDomain` + `domainStatus`, return DNS instructions; status-refresh endpoint feeds the Phase-1 domain page.
- Middleware: requests on a **custom domain** hitting `/dashboard/*` redirect to canonical login.

### Phase 7 — Guards, roles, seed

- NestJS guards: Community/Region/County `POST`/`DELETE` → **platform admin only**; tenant branding/domain + `service-status` → **platform admin OR owner/admin of target org** (service-status toggle is **admin-only**); public `GET`s open.
- Public tenant resolution endpoint returns `serviceStatus` so the marketing layout can gate suspended sites.
- Seed: default platform org (current branding, `serviceStatus: "active"`) + a platform-admin user.

---

## Files (representative)

- **API:** `apps/api/src/auth/` (auth.ts, guard, roles), `apps/api/src/tenant/`, `apps/api/src/cloudflare/`; edits to [apps/api/src/main.ts](apps/api/src/main.ts), [apps/api/src/app.module.ts](apps/api/src/app.module.ts), [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma), guards on community/region/county controllers.
- **Web:** `apps/web/app/(auth)/`, `apps/web/app/dashboard/{agents,branding,domain,schedule-embed,settings}/`, `apps/web/middleware.ts`, `apps/web/lib/{auth-client,mock-session}.ts`, `apps/web/api/tenant.ts`, `BrandThemeProvider`, `BrandingForm`; edits to dashboard topbar/sidebar, marketing layout/footer, root metadata, schedule page.

## Reuse

- `PrismaService` for the Better Auth Prisma adapter (no second DB client).
- `uploadFile`/`deleteFile` in [apps/web/api/storage.ts](apps/web/api/storage.ts) for logo upload.
- TanStack Query provider + the `apps/web/api/*.ts` fetch/error pattern.
- shadcn semantic tokens — only `--primary` is overridden per tenant; everything else inherits.

## Verification

1. **After Phase 1:** `npx turbo dev --filter=web`; click through every screen with the mock-role switch (admin vs agent); confirm both dashboards, the login page, branding/domain/schedule/settings editors, the suspended-tenant payment banner + suspended public page, and the themed public preview render correctly. Design sign-off here.
2. **After Phase 2:** `GET {API}/api/auth/ok` → `{status:"ok"}`; new Prisma tables exist.
3. Seed a platform-admin; log in on the canonical host → full dashboard; **add an agent** (creates user + org) from the Agents page; log in as that agent → only branding/domain nav; community `POST` → **403**.
4. Set the agent's brand color/logo/site name/footer/GHL embed; simulate their domain (`curl -H "Host: agent.com" localhost:3000` or hosts file) → public site shows agent branding/theme; `/schedule` shows their embed; `/dashboard` on that host redirects to canonical login.
5. **Suspension:** as admin, toggle the agent's service to `suspended` → agent can still log in and sees the payment warning, but their public site/domain now serves the "payment required" page; toggle back to `active` → site returns.
6. Add a custom domain → DNS instructions + `pending`; (prod) status → `active` via Cloudflare; mock the CF call in dev.
7. `npm run typecheck` and `npm run lint` clean.

## Out of scope (note for later)

GoHighLevel **lead routing** to each tenant's sub-account (only the schedule embed is in scope now); teams; 2FA. Skills if pursued: `email-and-password-best-practices`, `two-factor-authentication-best-practices`, `better-auth-security-best-practices`.
