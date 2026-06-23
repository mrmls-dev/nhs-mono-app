import { Global, Module } from "@nestjs/common";
import { CryptoService } from "./crypto";

/** Global so any module can inject {@link CryptoService}. */
@Global()
@Module({
    providers: [CryptoService],
    exports: [CryptoService],
})
export class CryptoModule {}
