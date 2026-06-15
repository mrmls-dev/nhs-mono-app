import { IsIn } from "class-validator";

/** Admin-only: flip an agent's subscription/payment gate. */
export class ServiceStatusDto {
    @IsIn(["active", "suspended"])
    serviceStatus!: "active" | "suspended";
}
