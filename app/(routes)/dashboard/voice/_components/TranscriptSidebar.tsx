
"use client";

import { useChat } from "@livekit/components-react";
import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function TranscriptSidebar() {
    const { chatMessages } = useChat();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages]);

    return (
        <div className="h-full flex flex-col glass-panel border-l border-white/5 bg-black/20 backdrop-blur-md">
            <div className="p-4 border-b border-white/5">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Transcript</h3>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-4">
                    {chatMessages.length === 0 && (
                        <div className="text-center text-slate-500 text-sm mt-10 italic">
                            Conversation started...
                        </div>
                    )}
                    {chatMessages.map((msg) => {
                        const isAgent = !msg.from?.identity; // Agent usually has no identity or generic one in some setups, but better check sender
                        // Actually standard LiveKit chat: msg.from.identity === localParticipant.identity for user
                        // We can just rely on 'from' being undefined or 'agent' string if set.
                        // Let's assume standard behavior: if it's from us, it's user.

                        // Wait, for VoiceAssistant, 'active' transcription might separate logic. 
                        // useChat typically handles Data messages. Voice Assistant transcriptions appear as ChatMessages if configured.

                        return (
                            <div key={msg.timestamp} className={cn(
                                "flex flex-col gap-1 max-w-[85%]",
                                msg.from?.isLocal ? "self-end items-end" : "self-start items-start"
                            )}>
                                <span className="text-[10px] text-slate-500 uppercase">
                                    {msg.from?.name || (msg.from?.isLocal ? "You" : "Agent")}
                                </span>
                                <div className={cn(
                                    "px-4 py-2 rounded-2xl text-sm leading-relaxed",
                                    msg.from?.isLocal
                                        ? "bg-[var(--color-primary)] text-white rounded-tr-none"
                                        : "bg-white/10 text-slate-200 rounded-tl-none"
                                )}>
                                    {msg.message}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>
        </div>
    );
}
