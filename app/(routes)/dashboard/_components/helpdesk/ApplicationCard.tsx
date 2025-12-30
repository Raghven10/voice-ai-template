
"use client"

import Image from "next/image";
import {Button} from "@/components/ui/button.tsx";
import {IconArrowRight} from "@tabler/icons-react";
import {Badge} from "@/components/ui/badge.tsx";

export type application = {
    id: number,
    name: string,
    description: string,
    image: string,
    agentPrompt: string,
    voiceId: string,
    isEngaged: boolean,
    knowledgeId: string,
}

type props = {
    application: application;
}

function ApplicationCard({application}:props) {
    return(

        <div className="relative">
            {application.isEngaged && <Badge variant={"destructive"} className={`absolute m-2 right-0`}>Engaged</Badge>}
            <Image src={application.image} alt="app-image" width={220} height={320} className="rounded-2xl w-full h-[380px] object-cover" />
            <h2 className="font-bold text-2xl mt-5">{application.name}</h2>
            <p className="text-gray-500 text-sm line-clamp-2">
                {application.description}
            </p>
            <Button className="w-full mt-5 font-bold" disabled={application.isEngaged}>Start Conversation <IconArrowRight /></Button>
        </div>
    )
}

export default ApplicationCard;