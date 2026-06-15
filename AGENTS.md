<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Agent Skills

The `.agents/skills/` directory contains project-specific rule files that **must be read at the start of every session** before writing or editing any code. These are not optional references — they are enforced conventions.

### Turborepo & Build System

| Skill       | Path                       | When to use                                                                                                                                                             |
| ----------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `turborepo` | `.agents/skills/turborepo` | Configuring `turbo.json` task pipelines, `dependsOn`, caching, `--filter`/`--affected`, remote cache, CI optimization, monorepo structure, internal package boundaries. |

### Next.js

| Skill                 | Path                                 | When to use                                                                                                                                                                                             |
| --------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `next-best-practices` | `.agents/skills/next-best-practices` | All Next.js code: file conventions, RSC/client boundaries, async APIs, data-fetching patterns, metadata, error handling, image/font optimization, route handlers, bundling. Auto-applied to `apps/web`. |

### React

| Skill                         | Path                                         | When to use                                                                                                                                                                    |
| ----------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `vercel-react-best-practices` | `.agents/skills/vercel-react-best-practices` | Writing, reviewing, or refactoring React/Next.js code for performance: components, data fetching, bundle optimization, re-render reduction, server components, async patterns. |

### shadcn/ui

| Skill    | Path                    | When to use                                                                                                                                                                       |
| -------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shadcn` | `.agents/skills/shadcn` | Adding, searching, or composing shadcn components; using the `npx shadcn@latest` CLI; styling with semantic color tokens; working with `components.json` or component registries. |

### Frontend Design

| Skill             | Path                             | When to use                                                                                                                                                                           |
| ----------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend-design` | `.agents/skills/frontend-design` | Building web pages, dashboards, components, or any UI that needs high visual quality and production-grade aesthetics. Provides design thinking guidelines to avoid generic AI output. |

### Prisma ORM

| Skill                                  | Path                                                  | When to use                                                                                                                                               |
| -------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prisma-database-setup`                | `.agents/skills/prisma-database-setup`                | Initializing Prisma with a new database provider (Postgres, MySQL, SQLite, MongoDB), configuring `schema.prisma`, connection strings, and `PrismaClient`. |
| `prisma-cli`                           | `.agents/skills/prisma-cli`                           | Running any Prisma CLI command: `prisma init`, `prisma generate`, `prisma migrate`, `prisma db push/pull`, `prisma studio`.                               |
| `prisma-client-api`                    | `.agents/skills/prisma-client-api`                    | Writing queries with `PrismaClient`: `findMany`, `create`, `update`, `delete`, filtering, relations, `$transaction`.                                      |
| `prisma-postgres`                      | `.agents/skills/prisma-postgres`                      | Creating and managing Prisma Postgres databases via Console, `create-db` CLI, or Management API/SDK.                                                      |
| `prisma-postgres-setup`                | `.agents/skills/prisma-postgres-setup`                | Provisioning a new Prisma Postgres database and connecting it to a local project via the Management API.                                                  |
| `prisma-driver-adapter-implementation` | `.agents/skills/prisma-driver-adapter-implementation` | Implementing a custom Prisma v7 driver adapter (`SqlDriverAdapter`, transaction lifecycle protocol, error mapping).                                       |

### Authentication (Better Auth)

| Skill                                      | Path                                                      | When to use                                                                                                                                               |
| ------------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create-auth-skill`                        | `.agents/skills/create-auth-skill`                        | Scaffolding full authentication from scratch: framework detection, database adapter setup, route handler wiring, OAuth providers, auth UI pages.          |
| `better-auth-best-practices`               | `.agents/skills/better-auth-best-practices`               | Configuring the Better Auth server and client: `auth.ts`, database adapters, session management, plugins, environment variables.                          |
| `better-auth-security-best-practices`      | `.agents/skills/better-auth-security-best-practices`      | Hardening a Better Auth deployment: rate limiting, CSRF protection, trusted origins, secure session/cookie config, OAuth token encryption, audit logging. |
| `email-and-password-best-practices`        | `.agents/skills/email-and-password-best-practices`        | Email verification flows, password reset, password policies, and hashing algorithm configuration for Better Auth email/password auth.                     |
| `two-factor-authentication-best-practices` | `.agents/skills/two-factor-authentication-best-practices` | Setting up TOTP, email/SMS OTP, backup codes, trusted devices, and 2FA sign-in flows with Better Auth's `twoFactor` plugin.                               |
| `organization-best-practices`              | `.agents/skills/organization-best-practices`              | Multi-tenant org setup with Better Auth: member management, invitations, custom roles/permissions, teams, RBAC using the `organization` plugin.           |

# Coding Requirements

- Use Typescript Strict mode
- When using form always use React Hook Form
- Use Zod for form validation
- Use Lucide React Icons only
- For server data fetching Do NOT fetch directly inside components repeatedly. Instead fetch inside the fetcher layer at `apps/web/lib/api/*.ts`, imported via the `@/api/*` alias (e.g. `import { getMyAgent } from "@/api/agent"`) — this becomes reusable everywhere. After that inside the component or page hydrate with Tanstack Query. NOTE: the files live in `lib/api/`, not a root-level `apps/web/api/`, because Vercel treats a project-root `api/` folder as zero-config Serverless Functions (compiled without tsconfig paths), which breaks the build. The `@/api/*` import path is unchanged by the move.
