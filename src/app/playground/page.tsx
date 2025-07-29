"use client"

import dynamic from "next/dynamic"

const PlaygroundScene = dynamic(() => import("@/components/playground-scene"), {
    ssr: false,
})

export default function Home() {
    return (
        <div className="w-full h-screen">
            <PlaygroundScene />
        </div>
    )
}
