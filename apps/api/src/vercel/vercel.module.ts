import { Module } from "@nestjs/common";
import { VercelDomainsService } from "./vercel.service";

@Module({
    providers: [VercelDomainsService],
    exports: [VercelDomainsService],
})
export class VercelModule {}
