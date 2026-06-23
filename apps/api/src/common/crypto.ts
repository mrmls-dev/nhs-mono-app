import { Injectable, InternalServerErrorException } from "@nestjs/common";
import {
    createCipheriv,
    createDecipheriv,
    randomBytes,
    scryptSync,
} from "node:crypto";

/** AES-256-GCM: 12-byte IV (GCM standard), 16-byte auth tag. */
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
/** Domain-separation salt so this key can't collide with other derivations. */
const KEY_SALT = "nhs-secret-encryption-v1";

/**
 * Symmetric encryption for secrets we must store (e.g. the GHL Private
 * Integration Token). The key is derived from `BETTER_AUTH_SECRET` so no extra
 * env var is needed; rotating that secret invalidates stored ciphertexts (they
 * must be re-entered), which is acceptable for a handful of integration tokens.
 *
 * Format: base64( iv(12) ++ authTag(16) ++ ciphertext ).
 */
@Injectable()
export class CryptoService {
    private readonly key = this.deriveKey();

    private deriveKey(): Buffer {
        const secret = process.env.BETTER_AUTH_SECRET;
        if (!secret) {
            throw new InternalServerErrorException(
                "BETTER_AUTH_SECRET is required to encrypt integration secrets."
            );
        }
        return scryptSync(secret, KEY_SALT, KEY_LENGTH);
    }

    /** Encrypt UTF-8 plaintext → base64 envelope. */
    encrypt(plaintext: string): string {
        const iv = randomBytes(IV_LENGTH);
        const cipher = createCipheriv("aes-256-gcm", this.key, iv);
        const ciphertext = Buffer.concat([
            cipher.update(plaintext, "utf8"),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();
        return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
    }

    /** Decrypt a base64 envelope produced by {@link encrypt}. */
    decrypt(payload: string): string {
        const buf = Buffer.from(payload, "base64");
        const iv = buf.subarray(0, IV_LENGTH);
        const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
        const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
        const decipher = createDecipheriv("aes-256-gcm", this.key, iv);
        decipher.setAuthTag(authTag);
        return (
            decipher.update(ciphertext).toString("utf8") +
            decipher.final("utf8")
        );
    }
}
