"use client";

import { useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";

interface TranscriptEntry {
    id: string;
    text: string;
    isAi: boolean;
    timestamp: number;
}

export function TranscriptionOverlay() {
    const room = useRoomContext();
    const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!room) return;

        const handleTranscription = (segments: any[], participant?: any) => {
            setTranscripts(prev => {
                const updated = [...prev];
                for (const segment of segments) {
                    const isAi = participant?.identity !== room?.localParticipant?.identity;
                    const existingIdx = updated.findIndex(t => t.id === segment.id);
                    if (existingIdx >= 0) {
                        updated[existingIdx] = {
                            ...updated[existingIdx],
                            text: segment.text,
                        };
                    } else {
                        updated.push({
                            id: segment.id,
                            text: segment.text,
                            isAi,
                            timestamp: Date.now(),
                        });
                    }
                }
                return updated.slice(-50);
            });
        };

        room.on(RoomEvent.TranscriptionReceived, handleTranscription);
        return () => {
            room.off(RoomEvent.TranscriptionReceived, handleTranscription);
        };
    }, [room]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [transcripts]);

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/[0.06]">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.15em]">
                    Live Transcript
                </h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
                {transcripts.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                        <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3">
                            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                            </svg>
                        </div>
                        <p className="text-sm text-slate-500">Waiting for conversation...</p>
                        <p className="text-xs text-slate-600 mt-1">Messages will appear here in real-time</p>
                    </div>
                )}

                {transcripts.map((t) => (
                    <div
                        key={t.id}
                        className={`flex flex-col gap-1 max-w-[90%] ${t.isAi ? "self-start" : "self-end items-end"}`}
                    >
                        <div className="flex items-center gap-1.5 px-1">
                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                                {t.isAi ? "🤖 Agent" : "👤 You"}
                            </span>
                            <span className="text-[9px] text-slate-600">{formatTime(t.timestamp)}</span>
                        </div>
                        <div
                            className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${t.isAi
                                    ? "bg-white/[0.06] text-slate-200 rounded-tl-md border border-white/[0.04]"
                                    : "bg-indigo-500/20 text-indigo-100 rounded-tr-md border border-indigo-500/10"
                                }`}
                        >
                            {t.text}
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>
        </div>
    );
}
