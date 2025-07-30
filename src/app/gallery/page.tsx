// import { useUser } from '@clerk/nextjs'

import PoseCard from "@/components/pose-card";
import { getPoses, Pose } from "@/lib/database";
import Link from "next/link";

export default async function Page() {
    const poses = await getPoses()
    return <div className="max-w-7xl mx-auto w-full h-full p-4 pt-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {poses.map((pose: Pose) => (
                <Link href={`/playground/${pose.uid}`} key={pose.id}>
                    <div>
                        <PoseCard {...pose} />
                    </div>
                </Link>
            ))}
            {poses.length === 0 && <div className="text-center">No poses found</div>}
        </div>
    </div>
}
