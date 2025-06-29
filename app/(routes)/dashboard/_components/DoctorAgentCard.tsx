
"use client"

import Image from "next/image";
import {Button} from "@/components/ui/button";
import {IconArrowRight} from "@tabler/icons-react";
import {Badge} from "@/components/ui/badge";
import {useAuth} from "@clerk/nextjs";


export type doctorAgent = {
    id: number;
    specialist: string;
    description: string;
    image: string;
    agentPrompt: string;
    voiceId: string;
    subscriptionRequired: boolean;
}

type props = {
    doctorAgent: doctorAgent;
}

function DoctorAgentCard({doctorAgent}:props) {

    const {has} = useAuth();
    //@ts-ignore
    const paidUser = has && has({plan: 'pro'})

    return(

        <div className="relative">
            {doctorAgent.subscriptionRequired && <Badge variant={"destructive"} className={`absolute m-2 right-0`}>Pro</Badge>}
            <Image src={doctorAgent.image} alt="doctor-image" width={220} height={320} className="rounded-2xl w-full h-[380px] object-cover" />
            <h2 className="font-bold text-2xl mt-5">{doctorAgent.specialist}</h2>
            <p className="text-gray-500 text-sm line-clamp-2">
                {doctorAgent.description}
            </p>
            <Button className="w-full mt-5 font-bold" disabled={!paidUser && doctorAgent.subscriptionRequired}>Start Consultation <IconArrowRight /></Button>
        </div>
    )
}

export default DoctorAgentCard;