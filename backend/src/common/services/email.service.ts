import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: Transporter;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('SMTP_HOST'),
            port: this.configService.get('SMTP_PORT'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASSWORD'),
            },
        });
    }

    async sendVerificationEmail(email: string, token: string, name: string) {
        const verificationUrl = `${this.configService.get('FRONTEND_URL') || 'http://localhost:3001'}/verify-email?token=${token}`;

        const mailOptions = {
            from: this.configService.get('SMTP_FROM'),
            to: email,
            subject: 'Verify Your Email - Library Management System',
            html: this.getVerificationEmailTemplate(name, verificationUrl),
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error('Error sending verification email:', error);
            throw new Error('Failed to send verification email');
        }
    }

    async sendPasswordResetEmail(email: string, token: string, name: string) {
        const resetUrl = `${this.configService.get('FRONTEND_URL') || 'http://localhost:3001'}/reset-password?token=${token}`;

        const mailOptions = {
            from: this.configService.get('SMTP_FROM'),
            to: email,
            subject: 'Reset Your Password - Library Management System',
            html: this.getPasswordResetEmailTemplate(name, resetUrl),
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error('Error sending password reset email:', error);
            throw new Error('Failed to send password reset email');
        }
    }

    async sendWelcomeEmail(email: string, name: string) {
        const mailOptions = {
            from: this.configService.get('SMTP_FROM'),
            to: email,
            subject: 'Welcome to Library Management System',
            html: this.getWelcomeEmailTemplate(name),
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error('Error sending welcome email:', error);
            // Don't throw error for welcome email
            return { success: false };
        }
    }

    private getVerificationEmailTemplate(name: string, verificationUrl: string): string {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 Library Management System</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Thank you for registering with Library Management System!</p>
            <p>Please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2025 Library Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    private getPasswordResetEmailTemplate(name: string, resetUrl: string): string {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #DC2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 30px; background: #DC2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>We received a request to reset your password.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #DC2626;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          </div>
          <div class="footer">
            <p>© 2025 Library Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    private getWelcomeEmailTemplate(name: string): string {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Welcome to Library Management System! Your email has been verified successfully.</p>
            <p>You can now enjoy all the features of our library system:</p>
            <ul>
              <li>Browse and search our extensive book collection</li>
              <li>Reserve books online</li>
              <li>Request home delivery</li>
              <li>Track your borrowing history</li>
              <li>Write reviews and ratings</li>
            </ul>
            <p>Happy reading! 📖</p>
          </div>
          <div class="footer">
            <p>© 2025 Library Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
}
