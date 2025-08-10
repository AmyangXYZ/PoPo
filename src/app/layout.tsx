import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"
import { ClerkProvider } from "@clerk/nextjs"
import Header from "@/components/header"

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
    "Generate MMD poses and facial morphs directly from natural language. Fine-tuned LLM for MikuMikuDance bone control and character expressions.",
  keywords: ["MMD", "MikuMikuDance", "AI pose", "text to pose", "ai companion", "waifu", "pose generation"],
  openGraph: {
    title: "PoPo - AI MMD Pose Generator",
    description:
      "Generate MMD poses and facial morphs directly from natural language. Fine-tuned LLM for MikuMikuDance bone control.",
    url: "https://popo.love",
    siteName: "PoPo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PoPo - AI MMD Pose Generator",
    description:
      "Generate MMD poses and facial morphs directly from natural language. Fine-tuned LLM for MikuMikuDance bone control.",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="select-none outline-none">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#FC70A8]`}>
          <Header />
          {children}
        </body>
        <Analytics />
      </html>
    </ClerkProvider>
  )
}
