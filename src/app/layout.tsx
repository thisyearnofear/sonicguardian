import type { Metadata, Viewport } from "next";
import { Outfit, Space_Mono } from "next/font/google";
import "./globals.css";
import { ClientOnlyStarknetProvider } from "@/components/ClientOnlyStarknetProvider";
import { MobileViewport } from "@/components/MobileViewport";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sonic Guardian | ZK-Acoustic Privacy",
  description: "Privacy-preserving sonic identity on Starknet",
  icons: {
    icon: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sonic Guardian",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${spaceMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (Object.getOwnPropertyDescriptor(window, 'ethereum')?.configurable !== false) {
                  var _eth = window.ethereum;
                  Object.defineProperty(window, 'ethereum', {
                    get: function() { return _eth; },
                    set: function(v) { _eth = v; },
                    configurable: true,
                  });
                }
              } catch {}
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-dvh">
        <MobileViewport>
          <ClientOnlyStarknetProvider>{children}</ClientOnlyStarknetProvider>
        </MobileViewport>
      </body>
    </html>
  );
}
