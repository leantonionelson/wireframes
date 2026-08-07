import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Scaffolds",
  description: "Collaborative sitemaps and wireframes. One scaffold per page; scaffolding is the work.",
  metadataBase: new URL("https://scaffolds.design"),
  openGraph: {
    title: "Scaffolds",
    description: "Collaborative sitemaps and wireframes. One scaffold per page; scaffolding is the work.",
    siteName: "Scaffolds",
    type: "website",
  },
};

const themeInit = `(function(){try{var t=localStorage.getItem("scaffold.theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInit }} /></head>
      <body className={`${sans.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
