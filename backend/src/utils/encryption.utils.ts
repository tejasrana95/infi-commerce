import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

/**
 * Encrypts a string or object using AES-256-GCM
 * @param data The data to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData
 */
export const encrypt = (data: any): string => {
    if (!ENCRYPTION_KEY) {
        console.warn('ENCRYPTION_KEY not set, using insecure fallback for development');
        return JSON.stringify(data);
    }

    const text = typeof data === 'string' ? data : JSON.stringify(data);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
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
            // Might be old unencrypted data
            try { return JSON.parse(encryptedText); } catch { return encryptedText; }
        }

        const [ivHex, tagHex, encryptedData] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);

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
        try { return JSON.parse(encryptedText); } catch { return encryptedText; }
    }
};
