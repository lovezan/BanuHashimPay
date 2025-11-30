import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import ThemeLanguageProvider from '@/components/theme-language-provider'
import PWAInstallPrompt from '@/components/pwa-install-prompt'
import PWAServiceWorker from '@/components/pwa-service-worker'
import './globals.css'

const _playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' })
const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Banuhashim Society Payment Book',
  description: 'Beautiful, minimal payment tracking system for your society',
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#1a1a2e" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0f0f1e" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Banuhashim" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
      </head>
      <body className={`font-sans antialiased ${_playfair.variable}`}>
        <ThemeLanguageProvider>
          {children}
          <PWAInstallPrompt />
          <PWAServiceWorker />
          <Analytics />
        </ThemeLanguageProvider>
      </body>
    </html>
  )
}
