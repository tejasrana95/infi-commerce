import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';

export class TwoFactorService {
    /**
     * Generate a new 2FA secret
     */
    static generateSecret(): string {
        return authenticator.generateSecret();
    }

    /**
     * Generate a Key URI for QR code
     */
    static generateKeyUri(email: string, issuer: string, secret: string): string {
        return authenticator.keyuri(email, issuer, secret);
    }

    /**
     * Generate a QR code data URL
     */
    static async generateQrCode(keyUri: string): Promise<string> {
        return QRCode.toDataURL(keyUri);
    }

    /**
     * Verify a 2FA code
     */
    static verifyCode(code: string, secret: string): boolean {
        return authenticator.verify({ token: code, secret });
    }

    /**
     * Generate backup codes
     */
    static generateBackupCodes(count: number = 8): string[] {
        const codes: string[] = [];
        for (let i = 0; i < count; i++) {
            codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }
        return codes;
    }
}
