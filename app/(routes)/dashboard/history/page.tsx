"use client";

import { useEffect, useState, useRef } from "react";
import { Mic, Clock, Play, Pause, FileText, Ticket, X, User, Bot, Volume2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Message {
    id: string;
    senderKind: string;
    text: string;
    createdAt: string;
}

interface Conversation {
    id: string;
    livekitRoomName: string;
    status: string;
    currentLevel: string;
    startedAt: string;
    endedAt: string | null;
    messages?: Message[];
    tickets?: { id: string; status: string }[];
}

export default function HistoryPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
    const [transcriptData, setTranscriptData] = useState<{ conversation: Conversation, messages: Message[] } | null>(null);
    const [transcriptLoading, setTranscriptLoading] = useState(false);

    // Audio Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTimeSec, setCurrentTimeSec] = useState(0);
    const totalTimeSec = 300; // Mock 5 minute length
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetch("/api/conversations")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setConversations(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load conversations:", err);
                setLoading(false);
            });
    }, []);

    // Fetch transcript details and reset audio player when a modal is opened
    useEffect(() => {
        if (!selectedConvoId) {
            setTranscriptData(null);
            setIsPlaying(false);
            setCurrentTimeSec(0);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        setTranscriptLoading(true);
        fetch(`/api/conversations/${selectedConvoId}`)
            .then((res) => res.json())
            .then((data) => {
                setTranscriptData(data);
                setTranscriptLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setTranscriptLoading(false);
            });
    }, [selectedConvoId]);

    // Mock Audio Player Ticker
    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setCurrentTimeSec((prev) => {
                    if (prev >= totalTimeSec) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPlaying, totalTimeSec]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (Math.floor(seconds) % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        setCurrentTimeSec(percent * totalTimeSec);
    };

    const getMessageTimeStr = (msgStartIso: string, convoStartIso: string) => {
        const startMs = new Date(convoStartIso).getTime();
        const msgMs = new Date(msgStartIso).getTime();
        const diffSec = Math.max(0, Math.floor((msgMs - startMs) / 1000));
        return formatTime(diffSec);
    };

    const handleRowPlay = (convoId: string) => {
        setSelectedConvoId(convoId);
        setIsPlaying(true);
    };

    if (loading) {
        return <div className="p-8 text-[var(--color-primary)] animate-pulse font-medium">Loading History Table...</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            <h1 className="text-3xl font-extrabold mb-8 neon-text tracking-wide uppercase flex-shrink-0">Conversation History</h1>

            <div className="glass-panel rounded-2xl overflow-hidden flex-grow flex flex-col border border-white/10 relative shadow-2xl">
                <div className="overflow-auto flex-grow rounded-2xl">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-black/40 border-b border-white/10 text-gray-400 text-[11px] uppercase pt-sans tracking-[0.15em] backdrop-blur-md sticky top-0 z-10">
                                <th className="p-5 font-bold w-[25%] pl-8">Agent / Session Name</th>
                                <th className="p-5 font-bold w-[15%]">Date</th>
                                <th className="p-5 font-bold w-[10%]">Level</th>
                                <th className="p-5 font-bold w-[15%] text-center">Ticket Status</th>
                                <th className="p-5 font-bold w-[20%] text-center">Listen</th>
                                <th className="p-5 font-bold w-[15%] text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {conversations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-16 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <Mic className="w-12 h-12 mb-4 text-gray-600 opacity-50" />
                                            <h3 className="text-xl font-bold text-gray-300 mb-2">No conversations found</h3>
                                            <p>It looks like you haven't spoken to an AI agent yet.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                conversations.map((convo) => (
                                    <tr
                                        key={convo.id}
                                        onClick={() => setSelectedConvoId(convo.id)}
                                        className="border-b border-white/5 bg-white/[0.02] hover:bg-white/[0.06] transition-all cursor-pointer group"
                                    >
                                        <td className="p-5 pl-8">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20 flex-shrink-0 group-hover:scale-110 transition-transform">
                                                    <Mic className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white mb-1 line-clamp-1">{convo.livekitRoomName || "Voice Session"}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {convo.messages && convo.messages.length > 0 ? (
                                                            <span className="italic line-clamp-1">&quot;{convo.messages[0].text}&quot;</span>
                                                        ) : (
                                                            <span className="italic">No transcript</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-sm text-gray-400 font-medium">
                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                <Clock className="w-3.5 h-3.5 text-gray-500" />
                                                {formatDistanceToNow(new Date(convo.startedAt), { addSuffix: true })}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className="capitalize text-xs font-bold text-gray-300 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10 shadow-inner">
                                                {convo.currentLevel}
                                            </span>
                                        </td>
                                        <td className="p-5 text-center">
                                            {convo.tickets && convo.tickets.length > 0 ? (
                                                <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 text-[10px] uppercase font-black rounded-full border tracking-widest
                                                    ${convo.tickets[0].status === 'open' ? 'border-green-500/50 text-green-400 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]' :
                                                        convo.tickets[0].status === 'resolved' ? 'border-[var(--color-primary)]/50 text-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-[0_0_10px_rgba(59,130,246,0.2)]' :
                                                            'border-gray-500/50 text-gray-400 bg-gray-500/10'}`}>
                                                    <Ticket className="w-3 h-3" />
                                                    {convo.tickets[0].status}
                                                </span>
                                            ) : (
                                                <span className="text-gray-600/50 text-xs font-semibold tracking-wider">—</span>
                                            )}
                                        </td>
                                        <td className="p-5 text-center">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRowPlay(convo.id); }}
                                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-[var(--color-primary)] hover:text-white flex items-center justify-center mx-auto text-gray-300 transition-colors shadow-lg border border-white/10 hover:border-[var(--color-primary)]"
                                                title="Play Session Audio"
                                            >
                                                <Play className="w-4 h-4 fill-current ml-1" />
                                            </button>
                                        </td>
                                        <td className="p-5 text-right pr-8">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedConvoId(convo.id); }}
                                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all shadow-lg"
                                            >
                                                <FileText className="w-4 h-4" />
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Combined Audio & Transcript Modal */}
            {selectedConvoId && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedConvoId(null)}
                >
                    <div
                        className="bg-[#0f1115] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/60">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                    <Volume2 className="w-5 h-5 text-[var(--color-primary)]" />
                                    Session Playback
                                </h2>
                                {transcriptData && (
                                    <p className="text-sm text-gray-400 mt-1">
                                        <span className="text-gray-200 font-medium">{transcriptData.conversation.livekitRoomName || 'Voice Session'}</span> • {formatDistanceToNow(new Date(transcriptData.conversation.startedAt), { addSuffix: true })}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setSelectedConvoId(null)}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Audio Player Toolbar */}
                        <div className="bg-[#141720] border-b border-white/5 p-6 shadow-inner flex flex-col gap-4 relative overflow-hidden">
                            {/* Animated Background Glow when playing */}
                            <div className={`absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/0 via-[var(--color-primary)]/10 to-[var(--color-primary)]/0 transition-opacity duration-1000 ${isPlaying ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />

                            <div className="flex items-center gap-6 relative z-10">
                                {/* Play/Pause Button */}
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="w-14 h-14 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white flex flex-shrink-0 items-center justify-center shadow-[0_0_20px_var(--color-primary)_inset] transition-all hover:scale-105"
                                >
                                    {isPlaying ? (
                                        <Pause className="w-6 h-6 fill-current" />
                                    ) : (
                                        <Play className="w-6 h-6 fill-current ml-1" />
                                    )}
                                </button>

                                {/* Progress Bar */}
                                <div className="flex-grow flex flex-col gap-2">
                                    <div className="flex justify-between text-xs font-bold text-gray-400 font-mono">
                                        <span className={isPlaying ? 'text-[var(--color-primary)]' : ''}>{formatTime(currentTimeSec)}</span>
                                        <span>{formatTime(totalTimeSec)}</span>
                                    </div>
                                    <div
                                        className="h-2.5 bg-black/50 rounded-full overflow-hidden cursor-pointer relative"
                                        onClick={handleProgressClick}
                                    >
                                        <div
                                            className="absolute top-0 left-0 h-full bg-[var(--color-primary)] transition-all duration-300 ease-linear rounded-full"
                                            style={{ width: `${(currentTimeSec / totalTimeSec) * 100}%` }}
                                        />
                                        {/* Visualization Dots overlay on progress bar */}
                                        {isPlaying && (
                                            <div className="absolute top-0 left-0 w-full h-full flex gap-1 px-1 items-center opacity-30 mix-blend-overlay">
                                                {[...Array(50)].map((_, i) => (
                                                    <div key={i} className="w-1 bg-white rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body: Transcript with Timings */}
                        <div className="flex-grow p-6 sm:p-8 overflow-y-auto bg-[#0a0c0f] scroll-smooth">
                            {transcriptLoading ? (
                                <div className="flex flex-col items-center justify-center h-48 text-[var(--color-primary)] animate-pulse font-medium">
                                    Loading transcript messages...
                                </div>
                            ) : transcriptData?.messages && transcriptData.messages.length > 0 ? (
                                <div className="flex flex-col gap-6">
                                    {transcriptData.messages.map((msg) => {
                                        const isUser = msg.senderKind === 'user';
                                        const msgTimeStr = getMessageTimeStr(msg.createdAt, transcriptData.conversation.startedAt);
                                        const msgSecs = parseInt(msgTimeStr.split(':')[0]) * 60 + parseInt(msgTimeStr.split(':')[1]);

                                        // Highlight current message based on mocked audio time
                                        const isActiveMsg = isPlaying && currentTimeSec >= msgSecs && currentTimeSec < msgSecs + 15; // mock active duration

                                        return (
                                            <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} transition-all duration-300 ${isActiveMsg ? 'scale-[1.02]' : ''}`}>
                                                <div className={`flex max-w-[85%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <div className="flex-shrink-0 mt-6">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-lg
                                                            ${isUser ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400'
                                                                : 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400'}
                                                            ${isActiveMsg ? 'shadow-[0_0_15px_currentColor]' : ''}`}>
                                                            {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                                        </div>
                                                    </div>

                                                    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                                        <div className="flex items-center gap-2 mb-1 px-1">
                                                            {!isUser && (
                                                                <span className="text-[10px] text-[var(--color-primary)] font-mono font-bold bg-[var(--color-primary)]/10 px-1.5 py-0.5 rounded border border-[var(--color-primary)]/20">
                                                                    {msgTimeStr}
                                                                </span>
                                                            )}
                                                            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider select-none">
                                                                {isUser ? 'You' : 'AI Assistant'}
                                                            </span>
                                                            {isUser && (
                                                                <span className="text-[10px] text-gray-400 font-mono font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                                                                    {msgTimeStr}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className={`px-5 py-4 rounded-2xl shadow-xl text-sm sm:text-base leading-relaxed
                                                            ${isUser ? 'bg-indigo-600/80 text-white rounded-tr-sm border border-indigo-500/50'
                                                                : 'bg-[#161920] border border-white/5 text-gray-200 rounded-tl-sm'}
                                                            ${isActiveMsg && !isUser ? 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10 text-white' : ''}
                                                            ${isActiveMsg && isUser ? 'bg-indigo-500 brightness-110' : ''}`}>
                                                            {msg.text || <em className="text-white/50">&lt;Empty Message&gt;</em>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-500 opacity-70">
                                    <FileText className="w-10 h-10 mb-3 opacity-50" />
                                    <p>No transcript recorded for this session.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}