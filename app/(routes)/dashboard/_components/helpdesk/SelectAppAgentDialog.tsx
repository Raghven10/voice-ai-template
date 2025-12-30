"use client"

import {Button} from "@/components/ui/button.tsx";
import axios from "axios";

type SelectedApplication = {
    id: number;
    specialist: string;
    description: string;
    image: string;
    agentPrompt: string;
    voiceId: string;
}

function SelectAppAgentDialog() {

    const onSelectApp = async () => {

        const result = await axios.get('/api/session-chat', {
            // @ts-ignore
            notes:note,
            selectedDoctor: {}
        });
    }

    return (
        <div>
            Select Application
            <Button onClick={onSelectApp}>Select Application</Button>
        </div>
    )
}

export default SelectAppAgentDialog;