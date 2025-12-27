import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Library Management System",
    template: "%s | Library Management System"
  },
  description: "A comprehensive library management system for managing books, users, borrowing requests, and transactions efficiently.",
  keywords: ["library", "book management", "borrowing system", "digital library", "student library"],
  authors: [{ name: "Library Management Team" }],
  creator: "Library Management System",
  publisher: "Library Management System",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('http://localhost:3001'),
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon.png', type: 'image/png', sizes: '16x16' },
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'http://localhost:3001',
    title: 'Library Management System',
    description: 'A comprehensive library management system for managing books, users, and transactions.',
    siteName: 'Library Management System',
    images: [{
      url: '/favicon.png',
      width: 512,
      height: 512,
    }],
  },
  twitter: {
    card: 'summary',
    title: 'Library Management System',
    description: 'A comprehensive library management system for managing books, users, and transactions.',
    images: ['/favicon.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
