"use client"

import dynamic from "next/dynamic"

const LabelingScene = dynamic(() => import("@/components/labeling-scene"), {
    ssr: false,
})

export default function Home() {
    return (
        <div className="w-full h-screen">
            <LabelingScene />
        </div>
    )
}
