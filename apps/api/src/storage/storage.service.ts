import { Injectable, InternalServerErrorException } from "@nestjs/common";
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import * as path from "path";
import type { Multer } from "multer";

@Injectable()
export class StorageService {
    private readonly client: S3Client;
    private readonly bucket: string;
    private readonly cdnBaseUrl: string;

    constructor() {
        const accountId = process.env.R2_ACCOUNT_ID;
        const accessKeyId = process.env.R2_ACCESS_KEY_ID;
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
        const bucket = process.env.R2_BUCKET_NAME;
        const cdnBaseUrl = process.env.CDN_BASE_URL;

        if (
            !accountId ||
            !accessKeyId ||
            !secretAccessKey ||
            !bucket ||
            !cdnBaseUrl
        ) {
            throw new InternalServerErrorException(
                "Missing R2 storage environment variables: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, CDN_BASE_URL"
            );
        }

        this.bucket = bucket;
        this.cdnBaseUrl = cdnBaseUrl.replace(/\/$/, "");

        this.client = new S3Client({
            region: "auto",
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId, secretAccessKey },
        });
    }

    async uploadFile(
        file: Express.Multer.File,
        folder = "uploads"
    ): Promise<{ url: string; key: string }> {
        const ext = path.extname(file.originalname).toLowerCase();
        const baseName = path
            .basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9._-]/g, "-")
            .toLowerCase();
        const key = `${folder}/${randomUUID()}-${baseName}${ext}`;

        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
                ContentLength: file.size,
            })
        );

        return { key, url: this.getPublicUrl(key) };
    }

    async deleteFile(key: string): Promise<void> {
        await this.client.send(
            new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
        );
    }

    async listFiles(prefix?: string): Promise<string[]> {
        const result = await this.client.send(
            new ListObjectsV2Command({
                Bucket: this.bucket,
                Prefix: prefix,
            })
        );
        return (result.Contents ?? [])
            .map((obj) => obj.Key as string)
            .filter(Boolean);
    }

    getPublicUrl(key: string): string {
        return `${this.cdnBaseUrl}/${key}`;
    }
}
