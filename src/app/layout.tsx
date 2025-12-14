import type { Metadata } from "next";
import "./globals.css";


import { ToastProvider } from "@/contexts/ToastContext";
import { StorageProvider } from "@/contexts/StorageContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PwaLifecycle } from "@/components/PwaLifecycle";

export const metadata: Metadata = {
  title: "Highlight",
  description: "Your internet highlights, organized.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          <StorageProvider>
            <ToastProvider>
              <PwaLifecycle />
              {children}
            </ToastProvider>
          </StorageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
