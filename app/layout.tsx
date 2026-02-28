import React from 'react'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
    title: 'AuraWeather',
    description: 'A simple, fast, and easy-to-use weather dashboard.',
    manifest: '/manifest.json',
    icons: {
        icon: '/favicon_io/favicon.ico',
        apple: '/favicon_io/apple-touch-icon.png',
    },
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 5,
        userScalable: true,
    },
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
        <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} overflow-x-hidden`}>
        {children}
        <Analytics />
        </body>
        </html>
    )
}