import type { Metadata } from "next";
import arMessages from "@/messages/ar.json";
import { LanguageProvider } from "./language-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: arMessages.app.name,
  description: arMessages.app.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
