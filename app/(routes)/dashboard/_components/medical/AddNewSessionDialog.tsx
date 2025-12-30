"use client";

import { doctorAgent } from "@/app/(routes)/dashboard/_components/medical/DoctorAgentCard.tsx";
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
import SuggestedDoctorCard from "@/app/(routes)/dashboard/_components/medical/SuggetsedDoctorCard.tsx";
import { toast } from "sonner"


function AddNewSessionDialog() {
    const [note, setNote] = useState<string>();
    const [loading, setLoading] = useState<boolean>(false);
    const [suggestedDoctors, setSuggestedDoctors] = useState<doctorAgent[]>();
    const [selectedDoctor, setSelectedDoctor] = useState<doctorAgent>();
    const router = useRouter();

    const onClickNext = async () => {
        setLoading(true);
        try {
            const result = await axios.post("/api/suggest-doctors", { notes: note });
            setSuggestedDoctors(result.data);

            toast.success("Doctors added successfully.");
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to suggest doctors. Please try again.")
        } finally {
            setLoading(false);
        }
    };

    const onStartConsultation = async () => {
        setLoading(true);

        try {
            const result = await axios.post("/api/session-chat", {
                notes: note,
                selectedDoctor: selectedDoctor,
            });

            if (result.data?.sessionId) {
               toast.success("Redirecting you to the consultation room.")
                router.push(`/dashboard/medical-agent/${result.data.sessionId}`);
            }
            else {
                toast.error("Could not start consultation. Please try again. ")
            }
        } catch (error: any) {
            console.error(error);
            toast.error("Could not start consultation. Please try again.")

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
                    <DialogTitle>{!suggestedDoctors ? "Add Basic Details" : "Select Doctor"}</DialogTitle>
                    <DialogDescription asChild>
                        {!suggestedDoctors ? (
                            <div>
                                <h2>Add Symptoms or any other details</h2>
                                <Textarea
                                    placeholder="Enter your symptoms..."
                                    className="h-[200px] mt-5"
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>
                        ) : (
                            <div>
                                <div className="grid grid-cols-3 gap-5">
                                    {suggestedDoctors.map((doctor, index) => (
                                        <SuggestedDoctorCard
                                            doctorAgent={doctor}
                                            key={index}
                                            setSelectedDoctor={() => setSelectedDoctor(doctor)}
                                            //@ts-ignore
                                            selectedDoctor={selectedDoctor}
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

                    {!suggestedDoctors ? (
                        <Button disabled={!note || loading} onClick={onClickNext}>
                            Next {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                        </Button>
                    ) : (
                        <Button onClick={onStartConsultation} disabled={!selectedDoctor || loading}>
                            {loading ? <Loader2 className="animate-spin" /> : "Start Consultation"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default AddNewSessionDialog;
