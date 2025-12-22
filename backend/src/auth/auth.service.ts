import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/services/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole, UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { email, password, firstName, lastName, phone, dateOfBirth, role } =
            registerDto;

        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                role: role || UserRole.USER,
                status: UserStatus.PENDING_APPROVAL,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });

        return {
            success: true,
            message: 'Registration successful. Awaiting admin approval.',
            data: { user },
        };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Find user
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Check user status
        if (user.status === UserStatus.PENDING_APPROVAL) {
            throw new ForbiddenException('Your account is pending approval');
        }

        if (user.status === UserStatus.SUSPENDED) {
            throw new ForbiddenException('Your account has been suspended');
        }

        if (user.status === UserStatus.INACTIVE) {
            throw new ForbiddenException('Your account is inactive');
        }

        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email, user.role);

        return {
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    status: user.status,
                    membershipType: user.membershipType,
                    profileImageUrl: user.profileImageUrl,
                },
                tokens,
            },
        };
    }

    async refreshToken(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const tokens = await this.generateTokens(user.id, user.email, user.role);

        return {
            success: true,
            data: tokens,
        };
    }

    async validateUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                membershipType: true,
                profileImageUrl: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (user.status !== UserStatus.ACTIVE) {
            throw new UnauthorizedException('User account is not active');
        }

        return user;
    }

    private async generateTokens(
        userId: string,
        email: string,
        role: UserRole,
    ) {
        const payload = { sub: userId, email, role };

        const accessToken = this.jwtService.sign(payload);

        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: '30d',
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: 604800, // 7 days in seconds
        };
    }

    async refreshTokenFromToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken);
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user || user.status !== UserStatus.ACTIVE) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const tokens = await this.generateTokens(user.id, user.email, user.role);

            return {
                success: true,
                data: {
                    accessToken: tokens.accessToken,
                    expiresIn: tokens.expiresIn,
                },
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async forgotPassword(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        // Don't reveal if user exists or not for security
        if (!user) {
            return {
                success: true,
                message: 'Password reset link sent to your email',
            };
        }

        // Generate reset token (valid for 1 hour)
        const resetToken = this.jwtService.sign(
            { sub: user.id, type: 'password-reset' },
            { expiresIn: '1h' },
        );

        // TODO: Send email with reset link
        // For now, we'll just return the token (in production, send via email)
        console.log(`Password reset token for ${email}: ${resetToken}`);

        return {
            success: true,
            message: 'Password reset link sent to your email',
            // Remove this in production - only for testing
            data: { resetToken },
        };
    }

    async resetPassword(token: string, newPassword: string) {
        try {
            const payload = this.jwtService.verify(token);

            if (payload.type !== 'password-reset') {
                throw new UnauthorizedException('Invalid reset token');
            }

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user) {
                throw new UnauthorizedException('Invalid reset token');
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password
            await this.prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword },
            });

            return {
                success: true,
                message: 'Password reset successful',
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired reset token');
        }
    }
}
