"use client";

import {
    LiveKitRoom,
    RoomAudioRenderer,
    StartAudio,
    useConnectionState,
    useVoiceAssistant,
    useRoomContext,
} from "@livekit/components-react";
import { AgentVisualizer } from "@/app/(routes)/dashboard/voice/_components/AgentVisualizer";
import { TranscriptSidebar } from "@/app/(routes)/dashboard/voice/_components/TranscriptSidebar";
import { VoiceControls } from "@/app/(routes)/dashboard/voice/_components/VoiceControls";
import { useEffect, useState } from "react";

export interface VoiceAssistantProps {
    token: string;
    serverUrl: string;
}

function ConnectionStatus({ error }: { error: Error | null }) {
    const connectionState = useConnectionState();

    return (
        <div className="flex flex-col">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full animate-pulse ${connectionState === 'connected' ? 'bg-green-500' :
                    connectionState === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                <span className="text-sm font-medium text-slate-400 uppercase tracking-widest">
                    {connectionState === 'connected' ? 'Live Session' :
                        connectionState === 'connecting' ? 'Connecting...' : connectionState}
                </span>
            </div>
            {error && (
                <span className="text-[10px] text-red-500 font-mono mt-1 max-w-[200px] break-words">
                    {error.message || JSON.stringify(error)}
                </span>
            )}
        </div>
    );
}

function ConnectionLogger() {
    const connectionState = useConnectionState();
    const room = useRoomContext();

    useEffect(() => {
        console.log(`📡 Connection State Changed: ${connectionState}`);
        if (room) {
            console.log("Room State:", room.state);
            console.log("Local Participant:", room.localParticipant.identity);

            // Try to force expose errors
            room.on('disconnected', (reason) => console.log('❌ Room Disconnected:', reason));
            room.on('connected', () => console.log('✅ Room Connected'));
            room.on('reconnecting', () => console.log('🔄 Room Reconnecting'));
        }
    }, [connectionState, room]);

    return null;
}

function DebugOverlay({ token, serverUrl, error }: { token: string, serverUrl: string, error: Error | null }) {
    const connectionState = useConnectionState();
    const room = useRoomContext();
    const { state: agentState } = useVoiceAssistant();

    return (
        <div className="absolute top-20 left-4 z-50 p-4 bg-black/80 text-green-400 font-mono text-xs rounded border border-green-500/30 pointer-events-none max-w-sm overflow-hidden">
            <p>Connection: {connectionState}</p>
            <p>Room State: {room?.state}</p>
            <p>Agent State: {agentState}</p>
            <p>Token: {token?.substring(0, 10)}...</p>
            <p>Server: {serverUrl}</p>
            <p>Error: {error?.message || "None"}</p>
        </div>
    );
}

export function VoiceAssistant({ token, serverUrl }: VoiceAssistantProps) {
    const [connectError, setConnectError] = useState<Error | null>(null);

    return (
        <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connect={true}
            audio={true}
            video={false}
            data-lk-theme="default"
            onError={(e) => {
                console.error("LiveKit Error:", e);
                setConnectError(e);
            }}
            onConnected={() => console.log("✅ LiveKit Room Connected (Callback)!")}
            onDisconnected={() => console.log("❌ LiveKit Room Disconnected (Callback)")}
            className="flex w-full h-full bg-black relative pt-10"
        >
            <ConnectionLogger />
            {/* Main Area: Visualizer & Controls */}
            <div className="flex-1 flex flex-col relative z-10 pt-2 pb-4">
                {/* Top Bar / Header */}
                <div className="px-6 py-8 flex justify-between items-center z-20 min-h-[60px]">
                    <ConnectionStatus error={connectError} />
                    <div className="text-xs text-slate-500 font-mono bg-black/40 px-2 py-1 rounded border border-white/10">
                        {serverUrl}
                    </div>
                </div>

                {/* Center Stage - Use justify-around to space things out better */}
                <div className="flex-1 flex flex-col items-center justify-around pb-8 relative w-full">
                    {/* Visualizer Container */}
                    <div className="w-full flex-1 flex items-center justify-center min-h-[200px]">
                        <AgentVisualizer />
                    </div>

                    {/* Controls Container */}
                    <div className="w-full flex justify-center pt-8">
                        <VoiceControls />
                    </div>
                </div>

                <RoomAudioRenderer />
                {/* Remove hidden class to allow user to click if autoplay fails */}
                <StartAudio label="Click to Start Audio" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold shadow-xl animate-bounce" />

                <DebugOverlay token={token} serverUrl={serverUrl} error={connectError} />
            </div>

            {/* Right Sidebar: Transcript */}
            <div className="w-80 md:w-96 h-full absolute right-0 top-0 bottom-0 md:relative z-20 border-l border-white/5 bg-black/20 backdrop-blur-3xl hidden md:block">
                <TranscriptSidebar />
            </div>

            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>
        </LiveKitRoom>
    );
}
