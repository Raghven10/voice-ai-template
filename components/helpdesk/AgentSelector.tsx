"use client";

import { useEffect, useState } from "react";
import { Loader2, Headset, Globe, Check, BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Language metadata for display
const LANGUAGE_META: Record<string, { label: string; flag: string }> = {
    en: { label: "English", flag: "🇺🇸" },
    hi: { label: "Hindi", flag: "🇮🇳" },
    mr: { label: "Marathi", flag: "🇮🇳" },
    bn: { label: "Bengali", flag: "🇮🇳" },
    te: { label: "Telugu", flag: "🇮🇳" },
    ta: { label: "Tamil", flag: "🇮🇳" },
    kn: { label: "Kannada", flag: "🇮🇳" },
    ml: { label: "Malayalam", flag: "🇮🇳" },
    gu: { label: "Gujarati", flag: "🇮🇳" },
    pa: { label: "Punjabi", flag: "🇮🇳" },
    or: { label: "Odia", flag: "🇮🇳" },
};

export type VoiceAgent = {
    id: string;
    name: string;
    description: string | null;
    language: string;
    baseVoiceId: string;
    systemPrompt: string | null;
    knowledgeBaseDocIds: string[];
};

type Props = {
    onSelect: (agent: VoiceAgent) => void;
};

export default function AgentSelector({ onSelect }: Props) {
    const [agents, setAgents] = useState<VoiceAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<VoiceAgent | null>(null);

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const res = await fetch("/api/voice-agents");
                if (res.ok) {
                    const data = await res.json();
                    setAgents(data);
                    if (data.length === 1) setSelected(data[0]); // auto-select if only one
                }
            } catch (e) {
                console.error("Failed to load agents", e);
            } finally {
                setLoading(false);
            }
        };
        fetchAgents();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                <span className="text-sm">Loading assistants…</span>
            </div>
        );
    }

    if (agents.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center">
                    <Headset className="w-8 h-8 text-slate-500" />
                </div>
                <div>
                    <p className="text-slate-200 font-semibold mb-1">No assistants configured</p>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Ask your administrator to configure a helpdesk assistant from the Admin → Agents page.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl flex flex-col gap-5">
            {/* Header */}
            <div className="text-center">
                <p className="text-slate-300 font-semibold text-base">Choose your assistant</p>
                <p className="text-slate-500 text-sm mt-1">Select the language and support area you need help with</p>
            </div>

            {/* Agent Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {agents.map((agent) => {
                    const lang = LANGUAGE_META[agent.language] ?? { label: agent.language, flag: "🌐" };
                    const isSelected = selected?.id === agent.id;

                    return (
                        <button
                            key={agent.id}
                            onClick={() => setSelected(agent)}
                            className={`group relative text-left rounded-2xl border p-4 transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-500/50 ${isSelected
                                ? "bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                                : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06] hover:border-white/[0.15]"
                                }`}
                        >
                            {/* Selected check */}
                            {isSelected && (
                                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                </span>
                            )}

                            {/* Icon + name */}
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${isSelected
                                        ? "bg-indigo-600/30"
                                        : "bg-white/[0.05] group-hover:bg-white/[0.1]"
                                        }`}
                                >
                                    {lang.flag}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-100 text-sm leading-tight">{agent.name}</p>
                                    <span
                                        className={`text-[11px] font-medium px-1.5 py-0.5 rounded mt-0.5 inline-block ${isSelected
                                            ? "bg-indigo-500/20 text-indigo-300"
                                            : "bg-white/[0.06] text-slate-500"
                                            }`}
                                    >
                                        {lang.label}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            {agent.description && (
                                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                    {agent.description}
                                </p>
                            )}

                            {/* KB badge */}
                            {agent.knowledgeBaseDocIds.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-3">
                                    <BookOpen className="w-3 h-3 text-emerald-500" />
                                    <span className="text-[10px] text-emerald-500 font-medium">
                                        {agent.knowledgeBaseDocIds.length} KB{" "}
                                        {agent.knowledgeBaseDocIds.length === 1 ? "document" : "documents"}
                                    </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Confirm Button */}
            <Button
                onClick={() => selected && onSelect(selected)}
                disabled={!selected}
                className="w-full gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full py-5 text-base font-semibold shadow-lg shadow-indigo-900/30 hover:shadow-indigo-900/50 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <Headset className="w-5 h-5" />
                Connect with {selected ? selected.name : "selected assistant"}
            </Button>
        </div>
    );
}
