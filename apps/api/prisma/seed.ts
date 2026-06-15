import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createAuth } from "../src/auth/auth";

/**
 * Seeds the platform owner ("us") + the default "National House Search"
 * organization (the canonical-host agent). Idempotent — safe to re-run, and
 * self-healing if ADMIN_EMAIL changes: the user matching ADMIN_EMAIL is made
 * the single platform owner AND the owner of the default org, while any stale
 * previous owner is demoted to a regular `admin` staff member.
 *
 *   ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME override the defaults below.
 *
 * Run: `npm run db:seed --workspace api`
 */
async function main() {
    const adapter = new PrismaPg({
        connectionString: process.env.DATABASE_URL as string,
    });
    const prisma = new PrismaClient({ adapter });
    const auth = createAuth(prisma);

    const email = process.env.ADMIN_EMAIL ?? "rootrixai@gmail.com";
    const password = process.env.ADMIN_PASSWORD ?? "simon@admin123";
    const name = process.env.ADMIN_NAME ?? "Platform Admin";
    const [ownerFirstName, ...ownerLastParts] = name.trim().split(/\s+/);
    const ownerLastName = ownerLastParts.join(" ");

    // 1) Platform-owner user (email/password via Better Auth so it hashes).
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        await auth.api.signUpEmail({ body: { email, password, name } });
        user = await prisma.user.findUnique({ where: { email } });
        console.log(`Created admin user ${email} (password: ${password})`);
    } else {
        console.log(`Admin user ${email} already exists`);
    }
    if (!user) throw new Error("Failed to create admin user");

    // Elevate to platform owner (super-admin that can never be deleted) +
    // ensure verified. The owner is a superset of the "admin" staff role.
    await prisma.user.update({
        where: { id: user.id },
        data: { role: "owner", emailVerified: true },
    });

    // Single-owner invariant: demote any *other* lingering platform owners to
    // regular `admin` staff (e.g. a previous ADMIN_EMAIL). They stay as staff
    // and can be removed from the dashboard Members page if no longer needed.
    const demoted = await prisma.user.updateMany({
        where: { role: "owner", id: { not: user.id } },
        data: { role: "admin" },
    });
    if (demoted.count > 0) {
        console.log(
            `Demoted ${demoted.count} previous owner(s) to admin staff`
        );
    }

    // 2) Default platform organization (the canonical-host agent).
    const slug = process.env.DEFAULT_AGENT_SLUG ?? "national-house-search";
    const org = await prisma.organization.upsert({
        where: { slug },
        update: { ownerFirstName, ownerLastName },
        create: {
            name: "National House Search",
            slug,
            logo: "/images/logo.png",
            serviceStatus: "active",
            brandColor: "#1d4ed8",
            siteName: "National House Search",
            contactPhone: "561-704-0091",
            footerText: "New Construction Agent Partnership Program",
            ownerFirstName,
            ownerLastName,
            customDomain: process.env.DEFAULT_AGENT_DOMAIN ?? null,
            domainStatus: process.env.DEFAULT_AGENT_DOMAIN ? "active" : null,
        },
    });

    // Reconcile org ownership so the default org is owned by the current
    // platform owner (fixes a stale owner left behind by an email change).
    const currentMember = await prisma.member.findFirst({
        where: { organizationId: org.id, userId: user.id },
    });
    const ownerMember = await prisma.member.findFirst({
        where: { organizationId: org.id, role: "owner" },
    });
    if (currentMember) {
        if (currentMember.role !== "owner") {
            await prisma.member.update({
                where: { id: currentMember.id },
                data: { role: "owner" },
            });
        }
    } else if (ownerMember) {
        // Re-point the existing owner row at the current platform owner.
        await prisma.member.update({
            where: { id: ownerMember.id },
            data: { userId: user.id },
        });
    } else {
        await prisma.member.create({
            data: { organizationId: org.id, userId: user.id, role: "owner" },
        });
    }
    // Ensure no second owner remains on the default org.
    await prisma.member.updateMany({
        where: {
            organizationId: org.id,
            role: "owner",
            userId: { not: user.id },
        },
        data: { role: "admin" },
    });
    console.log(`Default organization "${org.name}" owned by ${email}`);

    await prisma.$disconnect();
    console.log("Seed complete.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
