import type { Metadata } from "next";
import enMessages from "@/messages/en.json";
import { LanguageProvider } from "./language-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: enMessages.app.name,
  description: enMessages.app.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
