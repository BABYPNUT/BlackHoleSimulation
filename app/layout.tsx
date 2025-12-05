import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Galactic Black Hole Simulation",
  description:
    "Interactive 3D black hole visualization with accretion disk, gravitational lensing, and disk echo effects",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#000003",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Analytics />

        <Script id="remove-branding" strategy="afterInteractive">
          {`
            (function() {
              const selectors = [
                'a[href*="v0.app"]',
                'a[href*="built-with-v0"]',
                'a[href*="vercel.com"]',
                '[aria-label*="v0"]',
                '[aria-label*="Vercel"]',
                '#vercel-toolbar',
                '#__vercel_toolbar',
                'vercel-toolbar',
                '[data-vercel]',
                '[data-v0]'
              ].join(',');

              function removeBranding() {
                document.querySelectorAll(selectors).forEach(el => el.remove());
              }

              removeBranding();

              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', removeBranding);
              }

              const observer = new MutationObserver(removeBranding);
              observer.observe(document.body, { 
                childList: true, 
                subtree: true 
              });

              let attempts = 0;
              const interval = setInterval(() => {
                removeBranding();
                if (++attempts > 20) clearInterval(interval);
              }, 500);
            })();
          `}
        </Script>
      </body>
    </html>
  )
}
