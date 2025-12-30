"use client"
import agentCard, { agent } from "@/app/(routes)/dashboard/_components/helpdesk/AgentCard.tsx";
import AddNewSessionDialog from "@/app/(routes)/dashboard/_components/helpdesk/AddNewSessionDialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useRouter} from "next/navigation";
import SuggestedApplicationCard from "@/app/(routes)/dashboard/_components/helpdesk/SuggestedApplicationCard.tsx";
import {useState} from "react";
import {AIApplicationAgents} from "@/shared/app_list.tsx";
import {Loader2} from "lucide-react";
import axios from "axios";
import {toast} from "sonner";


function Dashboard() {

    const route = useRouter();
    const navigateToDashboard = ()=> {
        route.push("/playground");
    }
    const [suggestedApplications, setSuggestedApplications] = useState<agent[]>();
    const [selectedAgent, setSelectedAgent] = useState<agent>();
    const [note, setNote] = useState<string>();
    const [loading, setLoading] = useState<boolean>(false);

    const router = useRouter();
    const onStartConversation = async () => {
        setLoading(true);

        try {
            const result = await axios.post("/api/session-chat", {
                notes: note,
                selectedAgent: selectedAgent,
            });

            if (result.data?.sessionId) {
                toast.success("Redirecting you to the conversation room.")
                router.push(`/dashboard/app-agent/${result.data.sessionId}`);
            }
            else {
                toast.error("Could not start conversation. Please try again. ")
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Could not start conversation. Please try again.")

        } finally {
            setLoading(false);
        }
    };

    return (

            <main className="flex flex-col p-4">
                <div className="flex items-center justify-between p-5">
                    <h2 className="font-bold text-2xl">My Dashboard</h2>
                    <AddNewSessionDialog />
                </div>

                <div className="grid grid-cols-3 gap-5">
                    {AIApplicationAgents.map((appln, index) => (
                        <div className="flex flex-col items-center gap-2">
                            <SuggestedApplicationCard
                                agent={appln}
                                key={index}
                                setSelectedAgent={() => setSelectedAgent(appln)}
                                //@ts-ignore
                                selectedAgent={selectedAgent}
                            />
                            <Button onClick={onStartConversation} disabled={!selectedAgent || loading}>
                                {loading ? <Loader2 className="animate-spin" /> : "Start Conversation"}
                            </Button>
                        </div>
                    ))}
                </div>

            </main>
    )
}

export default Dashboard