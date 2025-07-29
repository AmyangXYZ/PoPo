import Image from "next/image";
import { Card, CardTitle, CardHeader, CardContent, CardDescription } from "./ui/card";
import { Pose } from "@/lib/database";

export default function PoseCard(pose: Pose) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{pose.name}</CardTitle>
                <CardDescription>Created by {pose.author}</CardDescription>
            </CardHeader>
            <CardContent className="w-full h-[240px]">
                <Image src={pose.preview_url} alt={pose.name} width={240} height={240} />
            </CardContent>
        </Card>
    )
}