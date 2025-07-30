"use client"

import dynamic from "next/dynamic"
import { Pose } from "@/lib/database"

const PlaygroundScene = dynamic(() => import("@/components/playground-scene"), {
    ssr: false,
})

export default function PlaygroundWrapper({ pose }: { pose: Pose | null }) {
    return <PlaygroundScene pose={pose} />
} 