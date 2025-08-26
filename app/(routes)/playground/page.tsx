"use client"

import {
    LiveKitRoom,
    RoomAudioRenderer,
    StartAudio,
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { Inter } from "next/font/google";
import Head from "next/head";
import { useCallback } from "react";

import { PlaygroundConnect } from "@/components/PlaygroundConnect.tsx";
import Playground from "@/components/playground/Playground.tsx";
import { PlaygroundToast, ToastType } from "@/components/toast/PlaygroundToast.tsx";
import { ConfigProvider, useConfig } from "@/hooks/useConfig.tsx";
import {
    ConnectionMode,
    ConnectionProvider,
    useConnection,
} from "@/hooks/useConnection.tsx";
import { useMemo } from "react";
import { ToastProvider, useToast } from "@/components/toast/ToasterProvider.tsx";

const themeColors = [
    "cyan",
    "green",
    "amber",
    "blue",
    "violet",
    "rose",
    "pink",
    "teal",
];

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
    return (
        <ToastProvider>
            <ConfigProvider>
                <ConnectionProvider>
                    <HomeInner />
                </ConnectionProvider>
            </ConfigProvider>
        </ToastProvider>
    );
}

export function HomeInner() {
    const { shouldConnect, wsUrl, token, mode, connect, disconnect } =
        useConnection();

    const { config } = useConfig();
    const { toastMessage, setToastMessage } = useToast();

    const handleConnect = useCallback(
        async (c: boolean, mode: ConnectionMode) => {
            c ? connect(mode) : disconnect();
        },
        [connect, disconnect],
    );

    const showPG = useMemo(() => {
        if (process.env.NEXT_PUBLIC_LIVEKIT_URL) {
            return true;
        }
        if (wsUrl) {
            return true;
        }
        return false;
    }, [wsUrl]);

    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    return (
        <>
            <Head>
                <title>{config.title}</title>
                <meta name="description" content={config.description} />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
                />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black" />

                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main className="relative flex flex-col justify-center px-4 items-center h-full w-full repeating-square-background">
                <AnimatePresence>
                    {toastMessage && (
                        <motion.div
                            className="left-0 right-0 top-0 absolute z-10"
                            initial={{ opacity: 0,  }}
                            animate={{ opacity: 1,  }}
                            exit={{ opacity: 0 }}
                        >
                            <PlaygroundToast />
                        </motion.div>
                    )}
                </AnimatePresence>
                {showPG ? (
                    <LiveKitRoom
                        className="flex flex-col h-full w-full"
                        serverUrl={wsUrl}
                        token={token}
                        connect={shouldConnect}
                        onError={(e) => {
                            setToastMessage({ message: e.message, type: "error" });
                            console.error(e);
                        }}
                    >
                        <Playground
                            themeColors={themeColors}
                            onConnect={(c) => {
                                const m = process.env.NEXT_PUBLIC_LIVEKIT_URL ? "env" : mode;
                                handleConnect(c, m);
                            }}
                        />
                        <RoomAudioRenderer />
                        <StartAudio label="Click to enable audio playback" />
                    </LiveKitRoom>
                ) : (
                    <PlaygroundConnect
                        accentColor={themeColors[0]}
                        onConnectClicked={(mode) => {
                            handleConnect(true, mode);
                        }}
                    />
                )}
            </main>
        </>
    );
}
