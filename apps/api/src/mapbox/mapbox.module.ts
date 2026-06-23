import { Module } from "@nestjs/common";
import { MapboxTokensService } from "./mapbox-tokens.service";

@Module({
    providers: [MapboxTokensService],
    exports: [MapboxTokensService],
})
export class MapboxModule {}
