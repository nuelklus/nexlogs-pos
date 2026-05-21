import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LocationProvider } from "@/contexts/LocationContext";

import "./globals.css";

export const metadata: Metadata = {
  title: "Hardware E-commerce",
  description: "Hardware E-commerce storefront",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/images/ASDLogo.png" as="image" type="image/png" />
        <link rel="preload" href="/images/no-image-available.svg" as="image" type="image/svg+xml" />
        <link rel="dns-prefetch" href="https://xachljqxtnhnmbpcnymt.supabase.co" />
        <link rel="preconnect" href="https://xachljqxtnhnmbpcnymt.supabase.co" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  console.log('[SW] Attempting to register service worker via script tag');
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('[SW] Service worker registered successfully:', registration.scope);
                    })
                    .catch(function(error) {
                      console.error('[SW] Service worker registration failed:', error);
                    });
                });
              } else {
                console.log('[SW] Service worker is not supported in this browser');
              }
            `,
          }}
        />
      </head>
      <body>
        <LocationProvider>
          <AuthProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </AuthProvider>
        </LocationProvider>
      </body>
    </html>
  );
}
