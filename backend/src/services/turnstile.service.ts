import axios from 'axios';

export interface TurnstileVerifyResponse {
    success: boolean;
    'error-codes'?: string[];
    challenge_ts?: string;
    hostname?: string;
    action?: string;
    cdata?: string;
}

/**
 * Verifies a Cloudflare Turnstile token with Cloudflare siteverify API.
 */
export async function verifyTurnstileToken(
    token: string,
    remoteIp?: string
): Promise<{ success: boolean; errorCodes?: string[] }> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    // If secret key is not configured, ignore/bypass verification
    if (!secretKey) {
        return { success: true };
    }

    if (!token) {
        return { success: false, errorCodes: ['missing-input-response'] };
    }

    try {
        const formData = new URLSearchParams();
        formData.append('secret', secretKey);
        formData.append('response', token);
        if (remoteIp) {
            formData.append('remoteip', remoteIp);
        }

        const response = await axios.post<TurnstileVerifyResponse>(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            formData.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                timeout: 5000,
            }
        );

        return {
            success: response.data.success === true,
            errorCodes: response.data['error-codes'],
        };
    } catch (error) {
        console.error('Turnstile verification request error:', error);
        return { success: false, errorCodes: ['verification-request-failed'] };
    }
}
