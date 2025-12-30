"use client"

import Image from "next/image";
import {Button} from "@/components/ui/button.tsx";
import {IconArrowRight} from "@tabler/icons-react";

export type appDeveloper = {
    id: number;
    specialist: string;
    description: string;
    image: string;
    agentPrompt: string;
    voiceId: string;
    subscriptionRequired: boolean;
}

type props = {
    appDeveloper: appDeveloper;
}

function AppDeveloperCard({appDeveloper}:props) {
    return(

        <div className="relative">

            <Image src={appDeveloper.image} alt="doctor-image" width={220} height={320} className="rounded-2xl w-full h-[380px] object-cover" />
            <h2 className="font-bold text-2xl mt-5">{appDeveloper.specialist}</h2>
            <p className="text-gray-500 text-sm line-clamp-2">
                {appDeveloper.description}
            </p>
            <Button className="w-full mt-5 font-bold">Connect<IconArrowRight /></Button>
        </div>
    )
}

export default AppDeveloperCard;