import type { Viewport } from "next";
import { Outfit, Space_Mono } from "next/font/google";
import "./globals.css";
import { ClientOnlyStarknetProvider } from "@/components/ClientOnlyStarknetProvider";
import { MobileViewport } from "@/components/MobileViewport";
import { createSiteMetadata } from "@/lib/metadata";
import { GITHUB_URL, HACKATHON_URL, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

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

export const metadata = createSiteMetadata();

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Zero-knowledge sonic identity",
    "STRK20 private recovery authority",
    "Bitcoin recovery authorization",
    "Agent validation via MCP and chain API",
  ],
  sameAs: [GITHUB_URL, HACKATHON_URL],
  slogan: SITE_TAGLINE,
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
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
