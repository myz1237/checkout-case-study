import type { Metadata } from "next";
import { intlLocale } from "@/lib/locales";
import { serverLocale } from "@/lib/server-locale";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tri Case",
  description: "iPhone cases for Hong Kong and the Netherlands",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale } = await serverLocale();
  return (
    <html lang={intlLocale(locale)}>
      <body>{children}</body>
    </html>
  );
}
