import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { AppModule } from "./app.module";
import { AUTH_INSTANCE } from "./auth/auth.constants";
import type { Auth } from "./auth/auth";

async function bootstrap() {
    // Disable Nest's global body parser so the Better Auth handler receives the
    // raw request stream; we re-add JSON parsing for every other route below.
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        bodyParser: false,
    });

    // CORS must be registered FIRST so it handles the browser's preflight
    // OPTIONS for the Better Auth routes (otherwise the auth handler below
    // swallows the preflight and the browser reports "Failed to fetch").
    app.enableCors({
        origin: (process.env.CORS_ORIGIN ?? "http://localhost:3000")
            .split(",")
            .map((o) => o.trim()),
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: true,
    });

    // Mount Better Auth on the raw Express instance BEFORE the JSON body parser
    // (and before Nest's router, which is wired during listen()).
    const auth = app.get<Auth>(AUTH_INSTANCE);
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.all("/api/auth/*splat", toNodeHandler(auth));

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        })
    );

    await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
