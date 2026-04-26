import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CJ Expertos',
  description: 'Plataforma de gestión para carpinteros de aluminio',
  // manifest disabled until Serwist supports Turbopack — see next.config.ts
  // manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CJ Expertos',
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: 'CJ Expertos',
    description: 'Gestioná tus obras de aluminio desde el celular',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f2940',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full bg-surface text-slate-900 antialiased">
        {children}
        {/* Unregister stale Service Workers from previous Serwist builds */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if('serviceWorker' in navigator){
                navigator.serviceWorker.getRegistrations().then(function(regs){
                  regs.forEach(function(r){r.unregister()})
                });
                caches.keys().then(function(names){
                  names.forEach(function(n){caches.delete(n)})
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
