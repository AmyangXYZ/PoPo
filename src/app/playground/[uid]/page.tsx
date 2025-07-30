import { getPose } from "@/lib/database"

import PlaygroundWrapper from "@/components/playground-wrapper"

export default async function Page({ params }: { params: Promise<{ uid: string }> }) {
    const { uid } = await params
    const pose = await getPose(uid)

    return (
        <div className="w-full h-screen">
            {pose ? <PlaygroundWrapper pose={JSON.parse(JSON.stringify(pose))} /> : <div className="flex justify-center items-center h-full">Pose not found</div>}
        </div>
    )
}