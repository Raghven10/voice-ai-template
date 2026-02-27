"use client";

import { useEffect, useState } from "react";
import { VoiceAssistant } from "@/components/VoiceAssistant";

export default function VoiceHelpdeskPage() {
    const [token, setToken] = useState<string>("");

    useEffect(() => {
        let ignore = false;

        const fetchToken = async () => {
            try {
                // Ensure unique identity per connection attempt to avoid "Duplicate Identity" errors in Strict Mode
                const uniqueSuffix = Math.random().toString(36).substring(7);
                const resp = await fetch(`/api/livekit-token?sessionId=helpdesk-session&d=${uniqueSuffix}`);
                const data = await resp.json();
                if (!ignore) {
                    setToken(data.token);
                }
            } catch (e) {
                console.error("Failed to fetch token", e);
            }
        };

        fetchToken();

        return () => {
            ignore = true;
        };
    }, []);

    useEffect(() => {
        if (token) {
            console.log("VoiceAssistant Server URL:", process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://127.0.0.1:7880");
        }
    }, [token]);

    // Forced fallback to localhost based on connectivity tests
    const serverUrl = "ws://localhost:7880";

    useEffect(() => {
        console.log("VoiceHelpdeskPage mounted. Using Server URL:", serverUrl);
    }, []);

    if (!token) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-pulse">Loading Voice Assistant...</div>
            </div>
        );
    }

    return (
        <div className="h-full w-full p-4 flex flex-col gap-4">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Helpdesk Voice Assistant</h1>
            <p className="text-slate-600 dark:text-slate-400">
                Speak to our AI assistant to resolve your issues instantly.
            </p>

            <div className="flex-1 border rounded-xl overflow-hidden shadow-sm bg-black ">
                <VoiceAssistant token={token} serverUrl={serverUrl} />
            </div>
        </div>
    );
}
