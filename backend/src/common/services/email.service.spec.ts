import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');

describe('EmailService', () => {
    let service: EmailService;
    let configService: ConfigService;
    let mockTransporter: any;

    beforeEach(async () => {
        // Create mock transporter
        mockTransporter = {
            sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
        };

        // Mock nodemailer.createTransport
        (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EmailService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            const config: Record<string, string> = {
                                SMTP_HOST: 'smtp.test.com',
                                SMTP_PORT: '587',
                                SMTP_USER: 'test@test.com',
                                SMTP_PASSWORD: 'testpass',
                                SMTP_FROM: 'Test <test@test.com>',
                                FRONTEND_URL: 'http://localhost:3001',
                            };
                            return config[key];
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<EmailService>(EmailService);
        configService = module.get<ConfigService>(ConfigService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('sendVerificationEmail', () => {
        it('should send verification email successfully', async () => {
            const email = 'user@test.com';
            const token = 'test-token';
            const name = 'Test User';

            const result = await service.sendVerificationEmail(email, token, name);

            expect(result).toEqual({ success: true });
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: email,
                    subject: 'Verify Your Email - Library Management System',
                    html: expect.stringContaining(token),
                }),
            );
        });

        it('should throw error when email sending fails', async () => {
            mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

            await expect(
                service.sendVerificationEmail('user@test.com', 'token', 'Test'),
            ).rejects.toThrow('Failed to send verification email');
        });
    });

    describe('sendPasswordResetEmail', () => {
        it('should send password reset email successfully', async () => {
            const email = 'user@test.com';
            const token = 'reset-token';
            const name = 'Test User';

            const result = await service.sendPasswordResetEmail(email, token, name);

            expect(result).toEqual({ success: true });
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: email,
                    subject: 'Reset Your Password - Library Management System',
                    html: expect.stringContaining(token),
                }),
            );
        });

        it('should throw error when email sending fails', async () => {
            mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

            await expect(
                service.sendPasswordResetEmail('user@test.com', 'token', 'Test'),
            ).rejects.toThrow('Failed to send password reset email');
        });
    });

    describe('sendWelcomeEmail', () => {
        it('should send welcome email successfully', async () => {
            const email = 'user@test.com';
            const name = 'Test User';

            const result = await service.sendWelcomeEmail(email, name);

            expect(result).toEqual({ success: true });
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: email,
                    subject: 'Welcome to Library Management System',
                    html: expect.stringContaining(name),
                }),
            );
        });

        it('should return success false when email sending fails', async () => {
            mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

            const result = await service.sendWelcomeEmail('user@test.com', 'Test');

            expect(result).toEqual({ success: false });
        });
    });
});
