import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hypixel Shard Recipes Profit Guide",
  description: "Track and analyze profitable shard recipes in Hypixel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This would typically come from your API or database
  const lastUpdated = new Date().toLocaleString();

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen pb-24">{children}</div>
        <Footer lastUpdated={lastUpdated} />
      </body>
    </html>
  );
}
