"use client";
import DoctorAgentCard, {doctorAgent} from "@/app/(routes)/dashboard/_components/DoctorAgentCard";
import {
    Dialog, DialogClose,
    DialogContent,
    DialogDescription, DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button";
import {IconArrowRight} from "@tabler/icons-react";
import {Textarea} from "@/components/ui/textarea";
import {ArrowRight, Loader2} from "lucide-react";
import {useState} from "react";
import axios from "axios";
import {useRouter} from "next/navigation";
import SuggestedDoctorCard from "@/app/(routes)/dashboard/_components/SuggetsedDoctorCard";

function AddNewSessionDialog() {
    const [note, setNote] = useState<string>();
    const [loading, setLoading] = useState<boolean>(false);
    const [suggestedDoctors, setSuggestedDoctors] = useState<doctorAgent[]>()
    const [selectedDoctor, setSelectedDoctor] = useState<doctorAgent>();
    const router = useRouter();

    const onClickNext = async () => {
        setLoading(true);
        const result = await axios.post('/api/suggest-doctors',
            {
                notes: note,
            });
        console.log(result.data);
        setSuggestedDoctors(result.data);
        setLoading(false);
    }

    const onStartConsultation = async () => {
        setLoading(true);
        const result = await axios.post('/api/session-chat',
            {
                notes: note,
                selectedDoctor: selectedDoctor,
            });
        console.log(result.data);
        if(result.data?.sessionId) {
            console.log(result.data.sessionId);
            router.push(`/dashboard/medical-agent/${result.data.sessionId}`);
        }
        setLoading(false);
    }

    return (
        <Dialog>
            <DialogTrigger>
                <Button>Connect Now <IconArrowRight /></Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{!suggestedDoctors? 'Add Basic Details' : 'Select Doctor'}</DialogTitle>
                    <DialogDescription asChild>
                        {!suggestedDoctors?
                            <div>
                                <h2>Add Symptoms or any other details</h2>
                                <Textarea
                                    placeholder="Enter your symptoms..."
                                    className="h-[200px] mt-5"
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>
                            : <div>
                                <div className="grid grid-cols-3 gap-5">
                                        {suggestedDoctors.map((doctor, index)=> (
                                            <SuggestedDoctorCard doctorAgent={doctor} key={index}
                                                                 setSelectedDoctor={()=> setSelectedDoctor(doctor)}
                                                                 //@ts-ignore
                                                                 selectedDoctor={selectedDoctor}
                                            />
                                        ))}
                                </div>
                            </div>
                        }
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose><Button variant={'outline'}>Cancel</Button></DialogClose>

                    {!suggestedDoctors ? <Button disabled={!note || loading} onClick={onClickNext}>
                            Next {loading ? <Loader2 className="animate-spin" /> : <ArrowRight/> }</Button> :
                            <Button onClick={onStartConsultation} disabled={!selectedDoctor}>Start Consultation</Button>
                    }

                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default AddNewSessionDialog;