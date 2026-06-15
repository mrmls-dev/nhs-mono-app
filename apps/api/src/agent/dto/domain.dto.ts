import { IsString, Matches } from "class-validator";

/** Set/replace an agent's custom domain (resolved by Host on the public site). */
export class SetDomainDto {
    @IsString()
    @Matches(/^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/, {
        message: "must be a valid bare domain (e.g. agent.com)",
    })
    domain!: string;
}
