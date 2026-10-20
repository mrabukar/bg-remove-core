import type { ReactNode } from "react";
import { Archivo, Space_Grotesk } from "next/font/google";
import "./globals.css";

const body = Archivo({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: "bg-remove-core",
  description: "Browser-side background removal. The image never leaves this tab.",
};

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
