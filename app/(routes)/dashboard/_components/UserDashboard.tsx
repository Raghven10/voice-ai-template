"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    LiveKitRoom,
    RoomAudioRenderer,
    StartAudio,
    useVoiceAssistant,
    useConnectionState,
    useLocalParticipant,
    BarVisualizer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { TranscriptionOverlay } from "./TranscriptionOverlay";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    Headset,
    Mic,
    MicOff,
    PhoneOff,
    Wifi,
    WifiOff,
    Clock,
    ArrowLeft,
} from "lucide-react";
import { useSession } from "next-auth/react";
import AgentSelector, { VoiceAgent } from "@/components/helpdesk/AgentSelector";

// ─── Call Timer ────────────────────────────────────────────────
function CallTimer() {
    const [seconds, setSeconds] = useState(0);
    const connectionState = useConnectionState();

    useEffect(() => {
        if (connectionState !== "connected") return;
        const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
        return () => clearInterval(interval);
    }, [connectionState]);

    const fmt = (n: number) => String(n).padStart(2, "0");
    const mm = fmt(Math.floor(seconds / 60));
    const ss = fmt(seconds % 60);

    return (
        <div className="flex items-center gap-1.5 text-sm font-mono text-slate-400 tabular-nums">
            <Clock className="w-3.5 h-3.5" />
            <span>{mm}:{ss}</span>
        </div>
    );
}

// ─── Connection Badge ──────────────────────────────────────────
function ConnectionBadge() {
    const connectionState = useConnectionState();

    const config: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
        connected: {
            color: "text-emerald-400",
            bg: "bg-emerald-500/10 border-emerald-500/20",
            icon: <Wifi className="w-3 h-3" />,
            label: "Connected",
        },
        connecting: {
            color: "text-amber-400",
            bg: "bg-amber-500/10 border-amber-500/20",
            icon: <Loader2 className="w-3 h-3 animate-spin" />,
            label: "Connecting…",
        },
        reconnecting: {
            color: "text-amber-400",
            bg: "bg-amber-500/10 border-amber-500/20",
            icon: <Loader2 className="w-3 h-3 animate-spin" />,
            label: "Reconnecting…",
        },
        disconnected: {
            color: "text-red-400",
            bg: "bg-red-500/10 border-red-500/20",
            icon: <WifiOff className="w-3 h-3" />,
            label: "Disconnected",
        },
    };

    const c = config[connectionState] || config.disconnected;

    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${c.bg} ${c.color}`}>
            {c.icon}
            {c.label}
        </div>
    );
}

// ─── Agent State Orb ───────────────────────────────────────────
function AgentOrb() {
    const { state, audioTrack } = useVoiceAssistant();

    const stateStyles: Record<string, { glow: string; ring: string; gradient: string; label: string }> = {
        idle: {
            glow: "bg-slate-500/10",
            ring: "border-slate-500/20 shadow-slate-500/5",
            gradient: "from-slate-700 to-slate-900",
            label: "Idle",
        },
        listening: {
            glow: "bg-blue-500/20 animate-pulse",
            ring: "border-blue-400/30 shadow-blue-500/20",
            gradient: "from-blue-600 to-indigo-700",
            label: "Listening…",
        },
        thinking: {
            glow: "bg-purple-500/25 animate-pulse",
            ring: "border-purple-400/30 shadow-purple-500/20",
            gradient: "from-purple-600 to-pink-700",
            label: "Thinking…",
        },
        speaking: {
            glow: "bg-cyan-400/20",
            ring: "border-cyan-400/30 shadow-cyan-500/20",
            gradient: "from-cyan-500 to-blue-600",
            label: "Speaking",
        },
    };

    const s = stateStyles[state] || stateStyles.idle;

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Ambient glow */}
            <div className="relative flex items-center justify-center">
                <div className={`absolute w-52 h-52 rounded-full blur-[80px] opacity-60 transition-all duration-700 ${s.glow}`} />

                {/* Outer ring */}
                <div className={`relative w-36 h-36 rounded-full border-2 flex items-center justify-center transition-all duration-500 shadow-2xl ${s.ring}`}>
                    {/* Inner gradient orb */}
                    <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${s.gradient} flex items-center justify-center transition-all duration-500`}>
                        {/* Bar visualizer inside orb when speaking */}
                        {state === "speaking" && audioTrack ? (
                            <div className="opacity-80 mix-blend-overlay">
                                <BarVisualizer
                                    state={state}
                                    barCount={5}
                                    trackRef={audioTrack}
                                    className="h-12 w-20"
                                    options={{ minHeight: 6 }}
                                />
                            </div>
                        ) : (
                            <Headset className="w-10 h-10 text-white/60" />
                        )}
                    </div>
                </div>
            </div>

            {/* State label */}
            <span className={`text-xs font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${state === "listening" ? "text-blue-400" :
                state === "thinking" ? "text-purple-400" :
                    state === "speaking" ? "text-cyan-400" :
                        "text-slate-500"
                }`}>
                {s.label}
            </span>
        </div>
    );
}

// ─── Call Controls ─────────────────────────────────────────────
function CallControls({ onDisconnect }: { onDisconnect: () => void }) {
    const { localParticipant } = useLocalParticipant();
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        if (!localParticipant) return;
        const pub = localParticipant.getTrackPublication(Track.Source.Microphone);
        setIsMuted(pub?.isMuted ?? false);
    }, [localParticipant]);

    const toggleMute = async () => {
        if (!localParticipant) return;
        if (isMuted) {
            await localParticipant.setMicrophoneEnabled(true);
            setIsMuted(false);
        } else {
            await localParticipant.setMicrophoneEnabled(false);
            setIsMuted(true);
        }
    };

    return (
        <div className="flex items-center gap-3">
            {/* Mute button */}
            <button
                onClick={toggleMute}
                className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${isMuted
                    ? "bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20"
                    : "bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] border border-white/[0.06]"
                    }`}
                title={isMuted ? "Unmute" : "Mute"}
            >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* End call button */}
            <button
                onClick={onDisconnect}
                className="group w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all duration-200 shadow-lg shadow-red-900/30 hover:shadow-red-900/50 hover:scale-105 active:scale-95"
                title="End Call"
            >
                <PhoneOff className="w-6 h-6" />
            </button>
        </div>
    );
}

// ─── Active Call View (inside LiveKitRoom) ─────────────────────
function ActiveCallView({ onDisconnect }: { onDisconnect: () => void }) {
    return (
        <div className="flex h-full w-full rounded-2xl border border-white/[0.06] bg-[#0a0a12] shadow-2xl overflow-hidden">
            {/* Left: Main Call Area */}
            <div className="flex-1 flex flex-col relative overflow-y-auto">
                {/* Top bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                        <ConnectionBadge />
                        <span className="text-xs text-slate-500 font-medium">AI Helpdesk Agent</span>
                    </div>
                    <CallTimer />
                </div>

                {/* Center: Agent Orb */}
                <div className="flex-1 flex items-center justify-center">
                    <AgentOrb />
                </div>

                {/* Bottom: Controls */}
                <div className="flex justify-center pb-8">
                    <CallControls onDisconnect={onDisconnect} />
                </div>

                <RoomAudioRenderer />
                <StartAudio
                    label="Click to enable audio"
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full font-semibold shadow-xl animate-bounce cursor-pointer"
                />

                {/* Subtle background aura */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-indigo-600/[0.04] blur-[100px] rounded-full" />
                    <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-purple-600/[0.04] blur-[100px] rounded-full" />
                </div>
            </div>

            {/* Right: Transcript Sidebar */}
            <div className="w-80 lg:w-96 border-l border-white/[0.04] bg-[#07070d]/80 backdrop-blur-sm hidden md:flex flex-col">
                <TranscriptionOverlay />
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────
export default function UserDashboard() {
    const { data: session } = useSession();
    const [token, setToken] = useState("");
    const [connecting, setConnecting] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<VoiceAgent | null>(null);
    const [step, setStep] = useState<"select" | "ready">("select");

    const connectToAgent = useCallback(async (agent: VoiceAgent) => {
        setConnecting(true);
        try {
            const res = await fetch(`/api/livekit-token?agentId=${encodeURIComponent(agent.id)}`);
            const data = await res.json();
            if (data.token) {
                setSelectedAgent(agent);
                setToken(data.token);
            }
        } catch (error) {
            console.error("Error connecting to agent:", error);
        } finally {
            setConnecting(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        setToken("");
        setSelectedAgent(null);
        setStep("select");
    }, []);

    const handleAgentSelected = useCallback((agent: VoiceAgent) => {
        setSelectedAgent(agent);
        setStep("ready");
    }, []);

    const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";

    // ── Active call screen ──
    if (token) {
        return (
            <div className="h-[calc(100vh-10rem)] w-full">
                <LiveKitRoom
                    token={token}
                    serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://localhost:7880"}
                    connect={true}
                    audio={true}
                    video={false}
                    onDisconnected={disconnect}
                    onError={(e) => console.error("LiveKit Error:", e)}
                    className="h-full w-full"
                >
                    <ActiveCallView onDisconnect={disconnect} />
                </LiveKitRoom>
            </div>
        );
    }

    // ── Agent selector step ──
    if (step === "select") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
                {/* Ambient glow */}
                <div className="absolute w-80 h-80 bg-indigo-600/[0.06] blur-[120px] rounded-full pointer-events-none" />

                <div className="relative flex flex-col items-center gap-8 text-center w-full max-w-2xl">
                    {/* Header */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-xl shadow-indigo-900/30">
                            <Headset className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-100 mb-1">Welcome, {userName}</h1>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Select your preferred assistant and language to begin
                            </p>
                        </div>
                    </div>

                    {/* Agent Selector */}
                    <AgentSelector onSelect={handleAgentSelected} />
                </div>
            </div>
        );
    }

    // ── Ready-to-connect screen ──
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="absolute w-80 h-80 bg-indigo-600/[0.06] blur-[120px] rounded-full pointer-events-none" />

            <div className="relative flex flex-col items-center gap-6 text-center max-w-md">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-xl shadow-indigo-900/30">
                    <Headset className="w-10 h-10 text-white" />
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-slate-100 mb-1">
                        {selectedAgent?.name}
                    </h1>
                    <p className="text-slate-400 text-[15px] leading-relaxed">
                        Ready to connect. The conversation will be voice-powered and fully transcribed.
                    </p>
                </div>

                <div className="flex flex-col gap-3 w-full">
                    <Button
                        onClick={() => selectedAgent && connectToAgent(selectedAgent)}
                        disabled={connecting}
                        className="gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 py-6 text-base font-semibold shadow-lg shadow-indigo-900/30 hover:shadow-indigo-900/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {connecting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Headset className="w-5 h-5" />
                        )}
                        {connecting ? "Connecting…" : "Start Conversation"}
                    </Button>

                    <button
                        onClick={() => setStep("select")}
                        className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Change assistant
                    </button>
                </div>

                <p className="text-xs text-slate-600 mt-1">
                    Requires microphone access · End-to-end encrypted
                </p>
            </div>
        </div>
    );
}
