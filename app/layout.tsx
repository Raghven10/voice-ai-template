import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import {Toaster} from "@/components/ui/sonner";

import { SessionProvider } from "next-auth/react"
import {Providers} from "@/provider.tsx";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Helpdesk",
  description: "customer care ai voice assistance - powered by VayuGPT",
};

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
              <Toaster />
          </Providers>
          </body>
        </html>

  );
}
