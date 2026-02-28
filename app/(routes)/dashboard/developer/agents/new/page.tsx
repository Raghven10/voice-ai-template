"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Bot, ArrowLeft, ChevronDown } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CreateAgentPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Agent Form State
    const [agentName, setAgentName] = useState("");
    const [agentBaseVoice, setAgentBaseVoice] = useState("");
    const [agentTone, setAgentTone] = useState("");
    const [agentKBs, setAgentKBs] = useState<string[]>([]);
    const [isKBSelectOpen, setIsKBSelectOpen] = useState(false);

    // Resources State
    const [availableVoices, setAvailableVoices] = useState<any[]>([]);
    const [knowledgeBases, setKnowledgeBases] = useState<any[]>([]);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const res = await fetch("/api/developer/resources");
            if (res.ok) {
                const data = await res.json();
                setAvailableVoices(data.voices || []);
                // Set default voice if available
                if (data.voices && data.voices.length > 0) {
                    setAgentBaseVoice(data.voices[0].id);
                }
                setKnowledgeBases(data.knowledgeBases || []);
            }
        } catch (e) {
            console.error("Failed to load resources:", e);
            toast.error("Could not load available voices and knowledge bases");
        }
    };

    const saveAgent = async () => {
        if (!agentName.trim()) {
            toast.error("Agent name is required");
            return;
        }
        if (!agentBaseVoice) {
            toast.error("Please select a base voice");
            return;
        }

        setIsLoading(true);
        try {
            const body = {
                name: agentName,
                baseVoiceId: agentBaseVoice,
                description: "Custom AI Agent",
                knowledgeBaseIds: agentKBs,
                tone: agentTone
            };

            const res = await fetch("/api/developer/agents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                toast.success("Agent created successfully");
                // Navigate back to the developer page, agents tab
                router.push("/dashboard/developer?tab=agents");
            } else {
                const errorText = await res.text();
                toast.error(`Failed to save agent: ${errorText}`);
            }
        } catch (e) {
            console.error(e);
            toast.error("An unexpected error occurred while saving the agent");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 w-full">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/developer?tab=agents")} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                        <Bot className="w-8 h-8 text-pink-500" />
                        Create Voice Agent
                    </h1>
                    <p className="text-muted-foreground mt-1 text-base">
                        Configure a new AI persona with dedicated voice features, knowledge contexts, and instructions.
                    </p>
                </div>
            </div>

            <Card className="bg-[var(--card)] border-none shadow-sm">
                <CardHeader>
                    <CardTitle>Agent Configuration</CardTitle>
                    <CardDescription>All fields can be altered later.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Agent Name <span className="text-red-500">*</span></label>
                        <Input
                            placeholder="e.g. Sales Representative, Technical Support"
                            value={agentName}
                            onChange={(e) => setAgentName(e.target.value)}
                            className="bg-[var(--background)] border-[var(--border)] text-foreground w-full"
                            autoFocus
                        />
                    </div>

                    {/* Voice Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Base Voice <span className="text-red-500">*</span></label>
                        <select
                            className="block w-full h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-pink-500 focus:outline-none"
                            value={agentBaseVoice}
                            onChange={(e) => setAgentBaseVoice(e.target.value)}
                        >
                            <option value="" disabled>Select a voice...</option>
                            {availableVoices.map(v => {
                                let label = "System";
                                if (v.category === 'cloned') label = "Custom Clone";
                                else if (v.category === 'indic') label = "Indic";

                                return (
                                    <option key={v.id} value={v.id} className="bg-[var(--card)]">
                                        {v.name} ({label})
                                    </option>
                                );
                            })}
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">
                            Choose from pre-made system voices, advanced Indic voices, or your own cloned voices.
                        </p>
                    </div>

                    {/* Tone */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Tone & Personality Instructions</label>
                        <Input
                            placeholder="e.g. Friendly and enthusiastic, Professional and concise, Sarcastic and funny"
                            value={agentTone}
                            onChange={(e) => setAgentTone(e.target.value)}
                            className="bg-[var(--background)] border-[var(--border)] text-foreground w-full"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Guides the language model on how to phrase its text responses before synthesis.
                        </p>
                    </div>

                    {/* Knowledge Bases */}
                    <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                        <div className="flex items-center justify-between w-full">
                            <label className="text-sm font-semibold text-foreground">Knowledge Bases</label>
                            <Link href="/dashboard/knowledge" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                                Manage Documents ↗
                            </Link>
                        </div>
                        <p className="text-xs text-muted-foreground w-full">
                            Select the documents this agent should have context about when conversing. If none are selected, it will rely solely on its base LLM knowledge.
                        </p>

                        <div className="relative w-full">
                            <button
                                type="button"
                                onClick={() => setIsKBSelectOpen(!isKBSelectOpen)}
                                className="flex w-full items-center justify-between rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-pink-500 hover:border-pink-500/50 transition-colors"
                            >
                                <span className="truncate flex-1 text-left">
                                    {agentKBs.length === 0
                                        ? "Select knowledge bases..."
                                        : `${agentKBs.length} document${agentKBs.length > 1 ? 's' : ''} selected`}
                                </span>
                                <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${isKBSelectOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isKBSelectOpen && (
                                <div className="absolute z-10 w-full mt-1 rounded-md border border-[var(--border)] bg-[var(--card)] shadow-xl max-h-64 overflow-y-auto">
                                    {knowledgeBases.length === 0 ? (
                                        <div className="p-6 text-center text-sm text-muted-foreground">
                                            No knowledge bases found.
                                            <Link href="/dashboard/knowledge" className="block text-indigo-500 hover:underline mt-2">
                                                Upload document
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="p-1">
                                            {knowledgeBases.map((kb) => (
                                                <div key={kb.id} className="flex items-start space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer group">
                                                    <div className="flex items-center h-5 mt-0.5">
                                                        <input
                                                            type="checkbox"
                                                            id={`kb-${kb.id}`}
                                                            checked={agentKBs.includes(kb.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setAgentKBs([...agentKBs, kb.id]);
                                                                } else {
                                                                    setAgentKBs(agentKBs.filter(id => id !== kb.id));
                                                                }
                                                            }}
                                                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-pink-600 focus:ring-pink-500 flex-shrink-0 cursor-pointer"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <label htmlFor={`kb-${kb.id}`} className="text-sm font-medium text-foreground cursor-pointer truncate select-none block group-hover:text-pink-600 transition-colors">
                                                            {kb.name}
                                                        </label>
                                                        <span className="text-xs text-muted-foreground truncate">{kb.createdAt ? new Date(kb.createdAt).toLocaleDateString() : "Uploaded previously"}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="flex justify-between border-t border-[var(--border)] bg-muted/10 p-6">
                    <Button variant="outline" onClick={() => router.push("/dashboard/developer?tab=agents")} className="border-[var(--border)] bg-[var(--background)]">
                        Cancel
                    </Button>
                    <Button
                        onClick={saveAgent}
                        disabled={!agentName || !agentBaseVoice || isLoading}
                        className="bg-pink-600 hover:bg-pink-700 text-white min-w-[150px]"
                    >
                        {isLoading ? "Saving..." : "Create Voice Agent"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
