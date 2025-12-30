"use client";

import { agent } from "@/app/(routes)/dashboard/_components/helpdesk/AgentCard.tsx";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { IconArrowRight } from "@tabler/icons-react";
import { Textarea } from "@/components/ui/textarea.tsx";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner"
import SuggestedApplicationCard from "@/app/(routes)/dashboard/_components/helpdesk/SuggestedApplicationCard.tsx";


function AddNewSessionDialog() {
    const [note, setNote] = useState<string>();
    const [loading, setLoading] = useState<boolean>(false);
    const [suggestedApplications, setSuggestedApplications] = useState<agent[]>();
    const [selectedAgent, setSelectedAgent] = useState<agent>();
    const router = useRouter();

    const onClickNext = async () => {
        setLoading(true);
        try {
            const result = await axios.post("/api/suggest-applications", { notes: note });
            setSuggestedApplications(result.data);

            toast.success("Applications added successfully.");
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to suggest applications. Please try again.")
        } finally {
            setLoading(false);
        }
    };

    const onStartConversation = async () => {
        setLoading(true);

        try {
            const result = await axios.post("/api/session-chat", {
                notes: note,
                selectedAgent: selectedAgent,
            });

            if (result.data?.sessionId) {
               toast.success("Redirecting you to the conversation room.")
                router.push(`/dashboard/livekit-agent/${result.data.sessionId}`);
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
        <Dialog>
            <DialogTrigger>
                <Button>
                    Connect Now <IconArrowRight />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{!suggestedApplications ? "Add Basic Details" : "Select Application"}</DialogTitle>
                    <DialogDescription asChild>
                        {!suggestedApplications ? (
                            <div>
                                <h2>Add application name or any other details</h2>
                                <Textarea
                                    placeholder="Enter your query or name of the application..."
                                    className="h-[200px] mt-5"
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>
                        ) : (
                            <div>
                                <div className="grid grid-cols-3 gap-5">
                                    {suggestedApplications.map((appln, index) => (
                                        <SuggestedApplicationCard
                                            agent={appln}
                                            key={index}
                                            setSelectedAgent={() => setSelectedAgent(appln)}
                                            //@ts-ignore
                                            selectedAgent={selectedAgent}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose>
                        <Button variant={"outline"}>Cancel</Button>
                    </DialogClose>

                    {!suggestedApplications ? (
                        <Button disabled={!note || loading} onClick={onClickNext}>
                            Next {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                        </Button>
                    ) : (
                        <Button onClick={onStartConversation} disabled={!selectedAgent || loading}>
                            {loading ? <Loader2 className="animate-spin" /> : "Start Conversation"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default AddNewSessionDialog;
