
"use client";

import { useVoiceAssistant, BarVisualizer } from "@livekit/components-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function AgentVisualizer() {
    const { state, audioTrack } = useVoiceAssistant();
    const [agentState, setAgentState] = useState<string>("idle");

    useEffect(() => {
        setAgentState(state);
    }, [state]);

    return (
        <div className="relative flex items-center justify-center w-64 h-64 md:w-96 md:h-96">
            {/* Ambient Glow */}
            <div className={cn(
                "absolute inset-0 rounded-full blur-[60px] opacity-20 transition-all duration-1000",
                state === "listening" && "bg-blue-500 opacity-30",
                state === "thinking" && "bg-purple-500 opacity-40 animate-pulse",
                state === "speaking" && "bg-cyan-400 opacity-40",
                state === "idle" && "bg-white opacity-10"
            )} />

            {/* Core Orb */}
            <div className={cn(
                "relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl glass-orb",
                state === "listening" && "scale-110 shadow-blue-500/50",
                state === "thinking" && "scale-90 shadow-purple-500/50 animate-bounce-slow",
                state === "speaking" && "scale-105 shadow-cyan-500/50",
                state === "idle" && "scale-100 shadow-white/10"
            )}>
                {/* Inner Gradient */}
                <div className={cn(
                    "absolute inset-0 rounded-full bg-gradient-to-br opacity-80",
                    state === "listening" && "from-blue-600 to-indigo-600 animate-spin-slow",
                    state === "thinking" && "from-purple-600 to-pink-600 animate-pulse",
                    state === "speaking" && "from-cyan-500 to-blue-500",
                    state === "idle" && "from-slate-700 to-slate-900"
                )} />

                {/* Visualizer overlay (only when speaking) */}
                {state === "speaking" && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-80 mix-blend-overlay">
                        <BarVisualizer
                            state={state}
                            barCount={5}
                            trackRef={audioTrack}
                            className="h-16 w-32"
                            options={{ color: "white", minHeight: 10 }}
                        />
                    </div>
                )}
            </div>

            {/* Status Text */}
            <div className="absolute -bottom-16 text-center">
                <p className={cn(
                    "text-lg font-medium tracking-wide transition-colors duration-300 uppercase",
                    state === "listening" && "text-blue-400",
                    state === "thinking" && "text-purple-400",
                    state === "speaking" && "text-cyan-400",
                    state === "idle" && "text-slate-400"
                )}>
                    {state}
                </p>
            </div>

            <style jsx global>{`
                .glass-orb {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: scale(0.9); }
                    50% { transform: scale(0.95); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 2s infinite ease-in-out;
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 10s linear infinite;
                }
            `}</style>
        </div>
    );
}
