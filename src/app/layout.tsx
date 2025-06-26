import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "PoPo - AI MMD Pose Generator",
  description:
    "Generate MMD poses and facial morphs directly from natural language. Specialized AI for MikuMikuDance bone control and character expressions.",
  keywords: ["MMD", "MikuMikuDance", "AI pose", "bone control", "facial morphs", "VMD", "PMX"],
  openGraph: {
    title: "PoPo - AI MMD Pose Generator",
    description:
      "Generate MMD poses and facial morphs directly from natural language. Specialized AI for MikuMikuDance bone control.",
    url: "https://popo.love",
    siteName: "PoPo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PoPo - AI MMD Pose Generator",
    description: "Generate MMD poses and facial morphs directly from natural language.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="select-none outline-none">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  )
}
