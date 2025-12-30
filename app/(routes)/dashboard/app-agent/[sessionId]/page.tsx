"use client"

import {useParams, useRouter} from "next/navigation";
import axios from "axios";
import {useEffect, useState} from "react";
import Vapi from "@vapi-ai/web";
import {agent} from "@/app/(routes)/dashboard/_components/helpdesk/AgentCard.tsx";
import Image from "next/image";
import {Button} from "@/components/ui/button";
import {Circle, Loader2, PhoneCall, PhoneOff} from "lucide-react";
import {toast} from "sonner";

export type SessionDetail = {
    id: number,
    sessionId: string,
    notes: string,
    report: JSON,
    selectedAgent: agent,
    createdAt: string;
    createdBy: string;
}

type Messages = {
    role: string,
    text: string
}

function ApplicationVoiceAgent() {
    const {sessionId} = useParams();
    const [sessionDetail, setSessionDetail] = useState<SessionDetail>();
    const [vapiInstance, setVapiInstance] = useState<any>();
    const [callStarted, setCallStarted] = useState<boolean>(false);
    const [liveTranscript, setLiveTranscript] = useState<string>();
    const [currentRole, setCurrentRole] = useState<string | null>();
    const [messages, setMessages] = useState<Messages[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();

    useEffect(()=>{
        sessionId && GetSessionDetails();
    }, [sessionId])

    const GetSessionDetails = async () => {
        const result = await axios.get('/api/session-chat?sessionId=' + sessionId);
        console.log("result: ",result.data[0]);
        setSessionDetail(result.data[0]);
        console.log("sessionDetail : ",sessionDetail);
    }

    const StartCall = () => {
        setLoading(true);
        const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_API_KEY!); // PUBLIC_API_KEY
        setVapiInstance(vapi);

        const VapiAgentConfig = {
            name: 'AI Voice Assistant',
            firstMessage: 'Jai Hind Sir, welcome to AI HelpDesk. How can I help you today?',
            transcriber: {
                provider: 'assembly-ai',
                language: 'en',
            },
            voice: {
                provider: 'playht',
                voiceId: sessionDetail?.selectedAgent?.voiceId,
            },
            model:{
                provider: 'openai',
                model: 'gpt-3.5-turbo',
                messages: [{
                    role:'system',
                    content: sessionDetail?.selectedAgent?.agentPrompt,
                }]
            }
        }

        //@ts-ignore
        vapi.start(VapiAgentConfig);

        // Listen for events
        vapi.on('call-start', () => {
            setLoading(false)
            console.log('Call started')
            setCallStarted(true);
        });
        vapi.on('call-end', () => {
            console.log('Call ended')
            setCallStarted(false);
        });
        vapi.on('message', (message) => {
            if (message.type === 'transcript') {
                const {role, transcriptType, transcript } = message;
                console.log(`${message.role}: ${message.transcript}`);
                if (transcriptType =='partial') {
                    setLiveTranscript(transcript);
                    setCurrentRole(role);
                }
                else if (transcriptType =='final'){
                    // Final Transcript
                    setMessages((prev: any)=> [...prev, {role:role, text: transcript}])
                    setLiveTranscript("");
                    setCurrentRole(null);
                }

            }
        });

        vapiInstance.on('speech-start', () => {
            console.log('Assistant started speaking');
            // setIsSpeaking(true);
            setCurrentRole('assistant');
        });
        vapiInstance.on('speech-end', () => {
            console.log('Assistant stopped speaking');
            // setIsSpeaking(false);
            setCurrentRole('user');
        });

    }

    const endCall = async () => {
        const result = await GenerateReport();
        if(!vapiInstance) return;

        vapiInstance.stop();
        vapiInstance.off('call-start')
        vapiInstance.off('call-end')
        vapiInstance.off('message')
        vapiInstance.off('speech-start')
        vapiInstance.off('speech-end')
        setCallStarted(false);
        setVapiInstance(null);
        toast.success('Your report is generated successfully. Thank you for using our service.');
        router.replace('/dashboard');

    }

    const GenerateReport = async () => {
        const result = await axios.post('/api/medical-report', {
            messages: messages,
            sessionDetail: sessionDetail,
            sessionId: sessionId
        })
        console.log(result.data);
        return result.data;
    }

    return (
        <div className="p-5 border rounded-3xl bg-secondary m-4 w-1/3">
            <div className="flex items-center justify-between">
                <h2 className="p-1 px-2 border rounded-md flex gap-2 items-center">
                    <Circle className={`h-4 w-4 rounded-full ${callStarted ? 'bg-green-400' : 'bg-red-400'}`}/>{callStarted ? 'Connected...': 'Not Connected'}</h2>
                <h2 className="font-bold text-xl text-gray-400">00:00</h2>
            </div>
            {sessionDetail &&
                <div className="flex items-center flex-col mt-10">
                    <Image src={sessionDetail?.selectedAgent?.image}
                           alt={sessionDetail?.selectedAgent?.name}
                           width={220}
                           height={120}
                           className="h-[100px] w-[100px] object-cover rounded-full"
                    />
                    <h2>{sessionDetail?.selectedAgent?.name}</h2>
                    <p className="text-sm text-gray-400">AI Voice Agent</p>
                    <div className="mt-32 overflow-y-auto h-[400px]">
                        {messages && messages?.slice(-4).map((message, index) => (
                            <h2 className="text-gray-400 p-2" key={index}>{message.role}: {message.text}</h2>
                        ))
                        }

                        {liveTranscript && liveTranscript?.length >0  && <h2 className="text-lg">{currentRole}: {liveTranscript}</h2>}

                    </div> {
                    !callStarted ?
                        <Button onClick={StartCall} className="mt-20 cursor-pointer hover:scale-110 shimmer hover:bg-green-600" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin"/> :<PhoneCall />} Start Call
                        </Button>:
                        <Button variant={'destructive'} onClick={endCall} className="mt-20" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin"/> :<PhoneOff />}  Disconnect
                        </Button>
                }
                </div>}
        </div>
    )
}

export default ApplicationVoiceAgent;