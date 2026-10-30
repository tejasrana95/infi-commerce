import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Cache the derived key for high performance
let cachedKey: Buffer | null = null;
const getDerivedKey = (): Buffer => {
    if (!ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY not set');
    }
    if (!cachedKey) {
        cachedKey = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    }
    return cachedKey;
};

/**
 * Checks if a string is encrypted in AES-256-GCM format (iv:tag:ciphertext)
 */
export const isEncrypted = (val: any): boolean => {
    if (typeof val !== 'string') return false;
    const parts = val.split(':');
    return (
        parts.length === 3 &&
        parts[0].length === IV_LENGTH * 2 &&
        parts[1].length === 32 &&
        parts[2].length > 0 &&
        /^[0-9a-fA-F]+$/.test(parts[0]) &&
        /^[0-9a-fA-F]+$/.test(parts[1]) &&
        /^[0-9a-fA-F]+$/.test(parts[2])
    );
};

/**
 * Determines whether a field name represents sensitive secret material
 */
export const isSecretField = (key: string): boolean => {
    const lower = key.toLowerCase();

    // Explicit non-secret identifiers & configuration flags
    if (
        lower.includes('keyid') ||
        lower.includes('clientid') ||
        lower.includes('publishable') ||
        lower.includes('mode') ||
        lower.includes('environment') ||
        lower.includes('merchantid') ||
        lower.includes('appid') ||
        lower === 'id' ||
        lower.endsWith('_id')
    ) {
        return false;
    }

    // Secrets, tokens, keys, passwords
    return (
        lower.includes('secret') ||
        lower.includes('private') ||
        lower.includes('token') ||
        lower.includes('password') ||
        lower.includes('auth') ||
        lower.includes('keysecret') ||
        lower.includes('secretkey')
    );
};

/**
 * Encrypts a string or object using AES-256-GCM
 * @param data The data to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData
 */
export const encrypt = (data: any): string => {
    if (!ENCRYPTION_KEY) {
        console.warn('ENCRYPTION_KEY not set, using insecure fallback for development');
        return typeof data === 'string' ? data : JSON.stringify(data);
    }

    const text = typeof data === 'string' ? data : JSON.stringify(data);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getDerivedKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts a string previously encrypted with AES-256-GCM
 * @param encryptedText The text to decrypt (iv:authTag:encryptedData)
 * @returns Decrypted data (string or parsed object)
 */
export const decrypt = (encryptedText: string): any => {
    if (!ENCRYPTION_KEY) {
        try {
            return JSON.parse(encryptedText);
        } catch {
            return encryptedText;
        }
    }

    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 3) {
            // Might be unencrypted JSON or plain string
            try {
                return JSON.parse(encryptedText);
            } catch {
                return encryptedText;
            }
        }

        const [ivHex, tagHex, encryptedData] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const key = getDerivedKey();

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        try {
            return JSON.parse(decrypted);
        } catch {
            return decrypted;
        }
    } catch (error) {
        console.error('Decryption failed:', error);
        // Fallback to raw if decryption fails (might be unencrypted)
        try {
            return JSON.parse(encryptedText);
        } catch {
            return encryptedText;
        }
    }
};

/**
 * Encrypts secret fields inside a credentials object (Field-Level Encryption).
 * - Non-secrets (keyId, publishableKey, clientId, mode) remain readable in plain text in DB.
 * - Sensitive secrets (keySecret, secretKey, webhookSecret, clientSecret) are encrypted.
 * - Skips fields that are already encrypted to prevent double encryption.
 */
export const encryptCredentials = (credentials: any): Record<string, any> => {
    if (!credentials || typeof credentials !== 'object') {
        return credentials;
    }

    const result: Record<string, any> = {};

    for (const [k, val] of Object.entries(credentials)) {
        if (typeof val === 'string' && val.trim()) {
            if (isSecretField(k)) {
                // Do not re-encrypt if already encrypted
                result[k] = isEncrypted(val) ? val : encrypt(val);
            } else {
                result[k] = val;
            }
        } else {
            result[k] = val;
        }
    }

    return result;
};

/**
 * Decrypts credentials with full backward compatibility:
 * 1. Legacy monolithic format: Single encrypted string representing the entire credentials JSON.
 * 2. Field-level encryption: Object where secret fields are individually encrypted.
 * 3. Plain object: Unencrypted credentials.
 */
export const decryptCredentials = (credentials: any): Record<string, any> => {
    if (!credentials) return {};

    // Legacy format: credentials was stored as a single encrypted string
    if (typeof credentials === 'string') {
        try {
            const decrypted = decrypt(credentials);
            if (typeof decrypted === 'object' && decrypted !== null) {
                return decrypted;
            }
            if (typeof decrypted === 'string') {
                try {
                    const parsed = JSON.parse(decrypted);
                    if (typeof parsed === 'object' && parsed !== null) {
                        return parsed;
                    }
                } catch {
                    return { apiKey: decrypted };
                }
            }
            return {};
        } catch {
            try {
                const parsed = JSON.parse(credentials);
                return typeof parsed === 'object' && parsed !== null ? parsed : {};
            } catch {
                return { apiKey: credentials };
            }
        }
    }

    // Field-level format: credentials is an object
    if (typeof credentials === 'object' && credentials !== null && !Array.isArray(credentials)) {
        const result: Record<string, any> = {};

        for (const [k, val] of Object.entries(credentials)) {
            if (typeof val === 'string' && isEncrypted(val)) {
                try {
                    const decryptedVal = decrypt(val);
                    result[k] = decryptedVal;
                } catch {
                    result[k] = val;
                }
            } else {
                result[k] = val;
            }
        }

        return result;
    }

    return {};
};

