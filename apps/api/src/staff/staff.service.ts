import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
    AUTH_INSTANCE,
    PLATFORM_ADMIN_ROLE,
    PLATFORM_OWNER_ROLE,
    PLATFORM_ROLES,
} from "../auth/auth.constants";
import type { Auth } from "../auth/auth";
import type { CreateStaffDto } from "./dto/create-staff.dto";
import type { UpdateStaffDto } from "./dto/update-staff.dto";

/** Public-safe shape for the admin "Members" table. */
const staffSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    createdAt: true,
} as const;

@Injectable()
export class StaffService {
    constructor(
        @Inject(AUTH_INSTANCE) private readonly auth: Auth,
        private readonly prisma: PrismaService
    ) {}

    /** Every platform staff member (owner + admin-role users). */
    listStaff() {
        return this.prisma.user.findMany({
            where: { role: { in: [...PLATFORM_ROLES] } },
            orderBy: [{ role: "asc" }, { createdAt: "desc" }],
            select: staffSelect,
        });
    }

    /**
     * Create a platform staff member: a Better Auth user with the platform
     * `admin` role and an email/password login they can use immediately (no
     * verification flow). Authorization is enforced by our guards, so we call
     * `createUser` without a session — Better Auth's own admin-role check is
     * skipped, which lets the platform `owner` (not a Better Auth admin role)
     * create members too.
     */
    async createStaff(dto: CreateStaffDto) {
        const email = dto.email.toLowerCase();
        const existing = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existing) throw new ConflictException("Email already in use");

        const created = await this.auth.api.createUser({
            body: {
                name: dto.name,
                email,
                password: dto.password,
                role: PLATFORM_ADMIN_ROLE,
            },
        });

        const user = await this.prisma.user.findUnique({
            where: { id: created.user.id },
            select: staffSelect,
        });
        if (!user) {
            throw new InternalServerErrorException("Staff creation failed");
        }
        return user;
    }

    /** Edit a staff member's name + email (never the password or role). */
    async updateStaff(id: string, dto: UpdateStaffDto) {
        const member = await this.assertExists(id);
        const email = dto.email.toLowerCase();

        if (email !== member.email) {
            const clash = await this.prisma.user.findUnique({
                where: { email },
            });
            if (clash && clash.id !== id) {
                throw new ConflictException("Email already in use");
            }
        }

        return this.prisma.user.update({
            where: { id },
            data: { name: dto.name, email },
            select: staffSelect,
        });
    }

    /**
     * Delete a staff member. The platform owner can never be deleted, and a
     * member cannot delete their own account (to avoid locking themselves out).
     * Deleting cascades the user's sessions + accounts.
     */
    async deleteStaff(id: string, requesterId: string) {
        const member = await this.assertExists(id);

        if (member.role === PLATFORM_OWNER_ROLE) {
            throw new BadRequestException(
                "The platform owner cannot be deleted"
            );
        }
        if (id === requesterId) {
            throw new ForbiddenException("You cannot delete your own account");
        }

        await this.prisma.user.delete({ where: { id } });
        return { id, deleted: true };
    }

    private async assertExists(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, role: true },
        });
        if (
            !user ||
            !user.role ||
            !PLATFORM_ROLES.includes(user.role as never)
        ) {
            throw new NotFoundException("Member not found");
        }
        return user;
    }
}
