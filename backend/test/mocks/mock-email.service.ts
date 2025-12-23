import { Injectable } from '@nestjs/common';

/**
 * Mock Email Service for E2E Testing
 * Prevents actual emails from being sent during tests
 */
@Injectable()
export class MockEmailService {
    async sendVerificationEmail(
        email: string,
        token: string,
        _name: string,
    ): Promise<{ success: boolean }> {
        console.log(`[MOCK] Verification email would be sent to: ${email}`);
        console.log(`[MOCK] Verification token: ${token}`);
        return { success: true };
    }

    async sendPasswordResetEmail(
        email: string,
        token: string,
        _name: string,
    ): Promise<{ success: boolean }> {
        console.log(`[MOCK] Password reset email would be sent to: ${email}`);
        console.log(`[MOCK] Reset token: ${token}`);
        return { success: true };
    }

    async sendWelcomeEmail(
        email: string,
        _name: string,
    ): Promise<{ success: boolean }> {
        console.log(`[MOCK] Welcome email would be sent to: ${email}`);
        return { success: true };
    }
}
