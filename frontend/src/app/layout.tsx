import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AGENT DRAFT COACH - LoadoutAi",
  description: "LoadoutAi Draft Coach for VALORANT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`}>
      <body>
        <svg style={{ width: 0, height: 0, position: "absolute" }}>
          <defs>
            <linearGradient id="synergyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff4655" />
              <stop offset="50%" stopColor="#ffd000" />
              <stop offset="100%" stopColor="#00ff9d" />
            </linearGradient>
          </defs>
        </svg>
        {children}
      </body>
    </html>
  );
}
