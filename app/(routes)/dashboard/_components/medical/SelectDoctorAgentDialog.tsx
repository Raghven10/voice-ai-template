"use client"

import {Button} from "@/components/ui/button.tsx";
import axios from "axios";

type SelectedDoctor = {
    id: number;
    specialist: string;
    description: string;
    image: string;
    agentPrompt: string;
    voiceId: string;
}

function SelectDoctorAgentDialog() {

    const onSelectDoctor = async () => {

        const result = await axios.get('/api/session-chat', {
            // @ts-ignore
            notes:note,
            selectedDoctor: {}
        });
    }

    return (
        <div>
            Select Doctor Agent
            <Button onClick={onSelectDoctor}>Select Doctor</Button>
        </div>
    )
}

export default SelectDoctorAgentDialog;