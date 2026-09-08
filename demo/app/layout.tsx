import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tri Case",
  description: "iPhone cases for Hong Kong and the Netherlands",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
