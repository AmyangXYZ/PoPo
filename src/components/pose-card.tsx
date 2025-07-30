import Image from "next/image";
import { Card, CardTitle, CardHeader, CardContent, CardDescription } from "./ui/card";
import { Pose } from "@/lib/database";

export default function PoseCard(pose: Pose) {
    return (
        <Card className="hover:shadow-lg transition-shadow duration-200 gap-2">
            <CardHeader>
                <CardTitle>{pose.name}</CardTitle>
                <CardDescription>@{pose.author}</CardDescription>
            </CardHeader>
            <CardContent className="aspect-[4/4] w-full rounded overflow-hidden">
                <Image
                    src={pose.preview_url}
                    alt={pose.name}
                    width={240}
                    height={240}
                    className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-200"
                />
            </CardContent>
        </Card>
    )
}