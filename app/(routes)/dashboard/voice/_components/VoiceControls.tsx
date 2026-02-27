
"use client";

import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { Mic, MicOff, PhoneOff, Settings2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Track } from "livekit-client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function VoiceControls() {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        if (!localParticipant) return;
        const checkMute = () => {
            const publication = localParticipant.getTrackPublication(Track.Source.Microphone);
            setIsMuted(publication?.isMuted ?? false);
        };

        checkMute();
        // Listeners could be added here for track mute events
    }, [localParticipant]);

    const toggleMute = async () => {
        if (!localParticipant) return;
        const publication = localParticipant.getTrackPublication(Track.Source.Microphone);
        if (publication) {
            if (isMuted) {
                await localParticipant.setMicrophoneEnabled(true);
                setIsMuted(false);
            } else {
                await localParticipant.setMicrophoneEnabled(false);
                setIsMuted(true);
            }
        } else {
            // If no track, enable it
            await localParticipant.setMicrophoneEnabled(true);
            setIsMuted(false);
        }
    };

    const disconnect = () => {
        room.disconnect();
    };

    return (
        <div className="flex items-center gap-4 p-2 rounded-full glass-panel border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl transition-all hover:scale-105">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                            "rounded-full w-12 h-12 transition-all duration-300",
                            isMuted
                                ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                                : "bg-white/10 text-white hover:bg-white/20"
                        )}
                        onClick={toggleMute}
                    >
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isMuted ? "Unmute Microphone" : "Mute Microphone"}</p>
                </TooltipContent>
            </Tooltip>

            <div className="w-px h-8 bg-white/10" />

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full w-12 h-12 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                    >
                        <Settings2 className="w-5 h-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Audio Settings</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        size="icon"
                        variant="destructive"
                        className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20"
                        onClick={disconnect}
                    >
                        <PhoneOff className="w-6 h-6" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>End Call</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
