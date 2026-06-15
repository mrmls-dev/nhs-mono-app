import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MaxLength,
    MinLength,
} from "class-validator";

/**
 * Admin-only: create a platform staff member = a Better Auth user with the
 * platform `admin` role and immediate email/password login (no verification).
 * Access control between staff is uniform for now; per-role permissions land later.
 */
export class CreateStaffDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(8)
    password!: string;
}
