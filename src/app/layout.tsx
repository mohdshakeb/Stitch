import type { Metadata } from "next";
import "./globals.css";


import { ToastProvider } from "@/contexts/ToastContext";
import { StorageProvider } from "@/contexts/StorageContext";
import { ThemeProvider } from "@/components/ThemeProvider";


export const metadata: Metadata = {
  title: "Stitch",
  description: "Your internet highlights, organized.",
};

import { ViewTransitions } from 'next-view-transitions';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      <html lang="en" suppressHydrationWarning>
        <head>

          <meta name="theme-color" content="#ffffff" />
        </head>
        <body>
          <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
            <StorageProvider>
              <ToastProvider>

                {children}
              </ToastProvider>
            </StorageProvider>
          </ThemeProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
