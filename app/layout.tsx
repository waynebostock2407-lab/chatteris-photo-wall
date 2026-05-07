import type { Metadata } from "next";
import { Bebas_Neue, Great_Vibes } from "next/font/google";
import "./globals.css";

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-great-vibes",
});

export const metadata: Metadata = {
  title: "Chatteris Town Presentation Day",
  description: "Live Event Photo Wall",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bebas.className} ${greatVibes.variable}`}>
        {children}
      </body>
    </html>
  );
}