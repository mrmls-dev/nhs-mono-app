import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization, admin } from "better-auth/plugins";
import type { PrismaClient } from "../../prisma/generated/prisma/client";

/**
 * White-label branding + access-control fields that live on the Better Auth
 * `organization` table (one organization == one **agent**). The org table is a
 * Better Auth requirement; everything we surface to users calls it an "agent".
 *
 * Keep this in sync with the `Organization` model in prisma/schema.prisma.
 */
export const agentAdditionalFields = {
    serviceStatus: {
        type: "string",
        required: false,
        defaultValue: "active",
        input: false, // payment gate — only togglable via the admin service-status endpoint
    },
    customDomain: { type: "string", required: false },
    domainStatus: { type: "string", required: false },
    brandColor: { type: "string", required: false },
    // JSON-serialized ThemeConfig; written via the custom /branding endpoint, not the BA API.
    theme: { type: "string", required: false, input: false },
    siteName: { type: "string", required: false },
    contactPhone: { type: "string", required: false },
    footerText: { type: "string", required: false },
    ghlScheduleEmbed: { type: "string", required: false },
} as const;

/**
 * Build the Better Auth instance over the shared NestJS {@link PrismaClient}
 * (one DB schema, one migration source). Constructed inside a Nest provider so
 * it reuses the injected `PrismaService` — see auth.module.ts.
 */
export function createAuth(prisma: PrismaClient) {
    const trustedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);

    // Share the auth cookie across `*.nationalhousesearch.com` in production so
    // the canonical dashboard host and public sites see the same session.
    const cookieDomain = process.env.AUTH_COOKIE_DOMAIN;

    return betterAuth({
        database: prismaAdapter(prisma, { provider: "postgresql" }),
        trustedOrigins,
        emailAndPassword: {
            enabled: true,
            // Admin-created agents are verified up front; no signup/forgot-password flow.
            requireEmailVerification: false,
            minPasswordLength: 8,
        },
        session: {
            // Cache the session in a signed cookie so middleware can gate routes
            // without a DB round-trip on every request.
            cookieCache: { enabled: true, maxAge: 5 * 60 },
        },
        advanced: {
            ...(cookieDomain
                ? {
                      crossSubDomainCookies: {
                          enabled: true,
                          domain: cookieDomain,
                      },
                  }
                : {}),
            useSecureCookies: process.env.NODE_ENV === "production",
        },
        plugins: [
            organization({
                // Agents are created by platform admins only — never self-serve.
                allowUserToCreateOrganization: false,
                schema: {
                    organization: {
                        additionalFields: agentAdditionalFields,
                    },
                },
            }),
            admin(),
        ],
    });
}

export type Auth = ReturnType<typeof createAuth>;
