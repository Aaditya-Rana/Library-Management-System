import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/services/prisma.service';
import { EmailService } from '../common/services/email.service';
import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
    let service: AuthService;
    let _prismaService: PrismaService;
    let _jwtService: JwtService;

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    };

    const mockJwtService = {
        sign: jest.fn(),
    };

    const mockEmailService = {
        sendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
        sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
        sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: EmailService,
                    useValue: mockEmailService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        _prismaService = module.get<PrismaService>(PrismaService);
        _jwtService = module.get<JwtService>(JwtService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        const registerDto = {
            email: 'test@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
        };

        it('should successfully register a new user', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

            const createdUser = {
                id: '1',
                email: registerDto.email,
                firstName: registerDto.firstName,
                lastName: registerDto.lastName,
                role: UserRole.USER,
                status: UserStatus.PENDING_APPROVAL,
                createdAt: new Date(),
            };

            mockPrismaService.user.create.mockResolvedValue(createdUser);

            const result = await service.register(registerDto);

            expect(result.success).toBe(true);
            expect(result.message).toContain('Registration successful');
            expect(result.data.user.email).toBe(registerDto.email);
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { email: registerDto.email },
            });
            expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
        });

        it('should throw ConflictException if email already exists', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({ id: '1' });

            await expect(service.register(registerDto)).rejects.toThrow(
                ConflictException,
            );
        });
    });

    describe('login', () => {
        const loginDto = {
            email: 'test@example.com',
            password: 'password123',
        };

        const mockUser = {
            id: '1',
            email: loginDto.email,
            password: 'hashedPassword',
            firstName: 'John',
            lastName: 'Doe',
            role: UserRole.USER,
            status: UserStatus.ACTIVE,
            membershipType: 'FREE',
            profileImageUrl: null,
        };

        it('should successfully login a user', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockPrismaService.user.update.mockResolvedValue(mockUser);
            mockJwtService.sign.mockReturnValue('token');

            const result = await service.login(loginDto);

            expect(result.success).toBe(true);
            expect(result.data.user.email).toBe(loginDto.email);
            expect(result.data.tokens).toBeDefined();
            expect(result.data.tokens.accessToken).toBe('token');
        });

        it('should throw UnauthorizedException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException if password is invalid', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login(loginDto)).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw ForbiddenException if account is pending approval', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({
                ...mockUser,
                status: UserStatus.PENDING_APPROVAL,
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await expect(service.login(loginDto)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should throw ForbiddenException if account is suspended', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({
                ...mockUser,
                status: UserStatus.SUSPENDED,
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await expect(service.login(loginDto)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('validateUser', () => {
        it('should return user if valid and active', async () => {
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: UserRole.USER,
                status: UserStatus.ACTIVE,
                membershipType: 'FREE',
                profileImageUrl: null,
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await service.validateUser('1');

            expect(result).toEqual(mockUser);
        });

        it('should throw UnauthorizedException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.validateUser('1')).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException if user is not active', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({
                id: '1',
                status: UserStatus.SUSPENDED,
            });

            await expect(service.validateUser('1')).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });
});
