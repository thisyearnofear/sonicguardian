import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import { ClientOnlyStarknetProvider } from "@/components/ClientOnlyStarknetProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Sonic Guardian | ZK-Acoustic Privacy",
  description: "Immutable Identity Verification via Sonic Strudel DNA on Starknet",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceMono.variable} antialiased`}
      >
        <ClientOnlyStarknetProvider>
          {children}
        </ClientOnlyStarknetProvider>
      </body>
    </html>
  );
}
