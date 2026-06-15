import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";

/**
 * Admin-only: edit a platform staff member's profile. Name + email only —
 * passwords are never changed from the platform admin (members manage their
 * own password after signing in).
 */
export class UpdateStaffDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name!: string;

    @IsEmail()
    email!: string;
}
