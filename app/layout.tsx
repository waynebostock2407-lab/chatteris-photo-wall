import type { Metadata } from "next";
import {
  Bebas_Neue,
  Great_Vibes,
  Caveat,
} from "next/font/google";

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

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-caveat",
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
      <body
        className={`${bebas.className} ${greatVibes.variable} ${caveat.variable}`}
      >
        {children}
      </body>
    </html>
  );
}