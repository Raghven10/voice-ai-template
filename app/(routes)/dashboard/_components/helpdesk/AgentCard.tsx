"use client"

import Image from "next/image";
import { Button } from "@/components/ui/button.tsx";
import { IconArrowRight } from "@tabler/icons-react";

export type agent = {
    id: number;
    name: string;
    description: string;
    image: string;
    agentPrompt: string;
    voiceId: string;
}

type props = {
    agent: agent;
}

function AgentCard({ agent }: props) {
    return (

        <div className="relative">

            <Image src={agent.image} alt="doctor-image" width={220} height={320} className="rounded-2xl w-full h-[380px] object-cover" />
            <h2 className="font-bold text-2xl mt-5 text-foreground">{agent.name}</h2>
            <p className="text-muted-foreground text-sm line-clamp-2">
                {agent.description}
            </p>
            <Button className="w-full mt-5 font-bold">Connect<IconArrowRight /></Button>
        </div>
    )
}

export default AgentCard;