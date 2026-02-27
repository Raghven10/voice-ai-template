"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Bot, Key, Trash2, Edit2, Copy, CheckCircle, Upload, FileText, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface ApiKey {
    id: string;
    name: string;
    key: string;
    lastUsedAt: string | null;
    createdAt: string;
}

export default function DeveloperPage() {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [newKeyName, setNewKeyName] = useState("");
    const [justCreatedKey, setJustCreatedKey] = useState<string | null>(null);
    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

    // Agent State
    const [agents, setAgents] = useState<any[]>([]);
    const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Agent Form
    const [agentName, setAgentName] = useState("");
    const [agentBaseVoice, setAgentBaseVoice] = useState("af_heart");
    const [agentTone, setAgentTone] = useState("");
    const [agentKBs, setAgentKBs] = useState<string[]>([]);

    // KB State
    const [isKBModalOpen, setIsKBModalOpen] = useState(false);
    const [kbTitle, setKbTitle] = useState("");
    const [kbContent, setKbContent] = useState("");

    // Resources
    const [availableVoices, setAvailableVoices] = useState<any[]>([]);
    const [knowledgeBases, setKnowledgeBases] = useState<any[]>([]);

    useEffect(() => {
        fetchKeys();
        fetchAgents();
        fetchResources();
    }, []);

    const fetchKeys = async () => {
        try {
            const res = await fetch("/api/developer/keys");
            if (res.ok) setKeys(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchAgents = async () => {
        try {
            const res = await fetch("/api/developer/agents");
            if (res.ok) setAgents(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchResources = async () => {
        try {
            const res = await fetch("/api/developer/resources");
            if (res.ok) {
                const data = await res.json();
                setAvailableVoices(data.voices || []);
                setKnowledgeBases(data.knowledgeBases || []);
            }
        } catch (e) { console.error(e); }
    };

    const createKey = async () => {
        if (!newKeyName.trim()) return;
        setIsLoading(true);
        try {
            const res = await fetch("/api/developer/keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newKeyName })
            });
            if (res.ok) {
                const data = await res.json();
                setJustCreatedKey(data.key);
                setIsKeyModalOpen(true);
                setNewKeyName("");
                fetchKeys();
                toast.success("API Key created");
            }
        } catch (e) { toast.error("Failed to create key"); }
        finally { setIsLoading(false); }
    };

    const deleteKey = async (id: string) => {
        try {
            await fetch(`/api/developer/keys?id=${id}`, { method: "DELETE" });
            fetchKeys();
            toast.success("API Key revoked");
        } catch (e) { toast.error("Failed to delete key"); }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    // ... (State variables are at the top) ...


    // ... (keys logic kept implies we skip lines if I target correctly) ...
    // Actually I should be careful not to overwrite `deleteKey` etc.
    // I will target from `openCreateAgent` downwards.

    const openCreateAgent = () => {
        setSelectedAgent(null);
        setAgentName("");
        setAgentBaseVoice("af_heart");
        setAgentTone("");
        setAgentKBs([]);
        setIsAgentModalOpen(true);
    };

    const openEditAgent = (agent: any) => {
        setSelectedAgent(agent);
        setAgentName(agent.name);
        setAgentBaseVoice(agent.baseVoiceId);
        setAgentTone(agent.traits?.tone || "");
        setAgentKBs(agent.knowledgeBaseIds || []);
        setIsAgentModalOpen(true);
    };

    const saveAgent = async () => {
        if (!agentName.trim()) return;
        setIsLoading(true);
        try {
            const method = selectedAgent ? "PUT" : "POST";
            const body: any = {
                name: agentName,
                baseVoiceId: agentBaseVoice,
                description: "Custom AI Agent",
                knowledgeBaseIds: agentKBs,
                tone: agentTone
            };
            if (selectedAgent) body.id = selectedAgent.id;

            const res = await fetch("/api/developer/agents", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setIsAgentModalOpen(false);
                fetchAgents();
                toast.success(`Agent ${selectedAgent ? "updated" : "created"} successfully`);
            } else {
                toast.error("Failed to save agent");
            }
        } catch (e) {
            toast.error("Error saving agent");
        } finally {
            setIsLoading(false);
        }
    };

    const createKB = async () => {
        if (!kbTitle.trim() || !kbContent.trim()) return;
        setIsLoading(true);
        try {
            const res = await fetch("/api/developer/kb", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: kbTitle, content: kbContent })
            });
            if (res.ok) {
                setIsKBModalOpen(false);
                setKbTitle("");
                setKbContent("");
                fetchResources(); // Refresh list
                toast.success("Knowledge Base created");
            } else {
                toast.error("Failed to create KB");
            }
        } catch (e) {
            toast.error("Error creating KB");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 h-full overflow-y-auto animate-in fade-in duration-500">
            <div>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight drop-shadow-sm">Developer API</h1>
                <p className="text-slate-400 mt-2 text-lg font-light">
                    Integrate our advanced voice synthesis into your applications.
                </p>
            </div>

            <Tabs defaultValue="keys" className="space-y-6">
                <TabsList className="bg-white/5 border border-white/10 p-1">
                    <TabsTrigger value="keys" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300">API Keys</TabsTrigger>
                    <TabsTrigger value="agents" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-300">Voice Agents</TabsTrigger>
                    <TabsTrigger value="docs" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">Documentation</TabsTrigger>
                </TabsList>

                {/* --- AGENTS TAB --- */}
                <TabsContent value="agents" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card onClick={openCreateAgent} className="bg-white/5 border-dashed border-white/10 hover:border-pink-500/50 hover:bg-pink-500/5 transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[300px]">
                            <div className="p-6 text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                    <Plus className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-200 group-hover:text-pink-300">Create New Agent</h3>
                                <p className="text-slate-500 text-sm max-w-[200px] mx-auto">Define a new persona with custom voice traits and prompts.</p>
                            </div>
                        </Card>

                        {agents.map((agent) => (
                            <Card key={agent.id} className="bg-black/40 border-white/10 overflow-hidden relative group hover:border-indigo-500/30 transition-all min-h-[300px] flex flex-col">
                                <div className="absolute top-0 right-0 p-4">
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{agent.isPublic ? "Public" : "Private"}</Badge>
                                </div>
                                <CardHeader>
                                    <div className="w-12 h-12 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    <CardTitle className="text-xl text-slate-200 truncate">{agent.name}</CardTitle>
                                    <CardDescription className="line-clamp-2">{agent.traits?.tone ? `Tone: ${agent.traits.tone}` : "Default Tone"}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-1 flex flex-col justify-end">
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-300 text-xs">
                                            {availableVoices.find(v => v.id === agent.baseVoiceId)?.name || agent.baseVoiceId}
                                        </Badge>
                                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-300 text-xs">{agent.language}</Badge>
                                    </div>
                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-sm text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4" /> 0 convos
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => openEditAgent(agent)} className="text-indigo-400 hover:text-white hover:bg-indigo-500/20">
                                            Configure
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* AGENT MODAL */}
                    <Dialog open={isAgentModalOpen} onOpenChange={setIsAgentModalOpen}>
                        <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-slate-200">
                            <DialogHeader>
                                <DialogTitle className="text-pink-400 flex items-center gap-2">
                                    <Bot className="w-5 h-5" />
                                    {selectedAgent ? "Edit Voice Agent" : "Create Voice Agent"}
                                </DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    Configure your AI persona with specific voice and knowledge.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Agent Name</label>
                                    <Input
                                        placeholder="e.g. Sales Representative"
                                        value={agentName}
                                        onChange={(e) => setAgentName(e.target.value)}
                                        className="bg-black/50 border-white/10 text-slate-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Voice</label>
                                    <select
                                        className="w-full h-10 rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                                        value={agentBaseVoice}
                                        onChange={(e) => setAgentBaseVoice(e.target.value)}
                                    >
                                        {availableVoices.map(v => (
                                            <option key={v.id} value={v.id} className="bg-zinc-900">{v.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-slate-300">Knowledge Bases</label>
                                        <Link href="/dashboard/knowledge" className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline">
                                            Manage / Add New
                                        </Link>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto border border-white/10 rounded-md p-3 space-y-2 bg-black/50">
                                        {knowledgeBases.length === 0 && (
                                            <p className="text-xs text-slate-500 text-center py-2">No documents found.</p>
                                        )}
                                        {knowledgeBases.map((kb) => (
                                            <div key={kb.id} className="flex items-center space-x-2 p-1 hover:bg-white/5 rounded transition-colors">
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
                                                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-offset-0 focus:ring-1 focus:ring-emerald-500"
                                                />
                                                <label htmlFor={`kb-${kb.id}`} className="text-sm text-slate-300 cursor-pointer flex-1 truncate select-none">
                                                    {kb.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Tone / Personality</label>
                                    <Input
                                        placeholder="e.g. Friendly, Professional, Sarcastic"
                                        value={agentTone}
                                        onChange={(e) => setAgentTone(e.target.value)}
                                        className="bg-black/50 border-white/10 text-slate-200"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsAgentModalOpen(false)}>Cancel</Button>
                                <Button onClick={saveAgent} disabled={!agentName || isLoading} className="bg-pink-600 hover:bg-pink-500 text-white">
                                    {isLoading ? "Saving..." : (selectedAgent ? "Update Agent" : "Create Agent")}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* KB CREATION MODAL REMOVED - Managed in dedicated page */}
                </TabsContent>

                {/* --- KEYS TAB --- */}
                <TabsContent value="keys" className="space-y-6">
                    <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Manage Keys</CardTitle>
                            <CardDescription>Create keys to authenticate your API requests. Keep them secret!</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex gap-4">
                                <Input
                                    placeholder="Key Name (e.g. My Next.js App)"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    className="bg-white/5 border-white/10 text-slate-200"
                                />
                                <Button onClick={createKey} disabled={isLoading || !newKeyName} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                                    <Plus className="w-4 h-4 mr-2" /> Create Key
                                </Button>
                            </div>

                            <Dialog open={isKeyModalOpen} onOpenChange={setIsKeyModalOpen}>
                                <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-slate-200">
                                    <DialogHeader>
                                        <DialogTitle className="text-emerald-400 flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5" />
                                            API Key Created
                                        </DialogTitle>
                                        <DialogDescription className="text-slate-400">
                                            Your API key has been generated successfully. Please copy it now as you won't be able to see it again.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex items-center space-x-2 my-4">
                                        <div className="grid flex-1 gap-2">
                                            <div className="relative">
                                                <Input
                                                    readOnly
                                                    value={justCreatedKey || ""}
                                                    className="bg-black/50 border-white/10 text-slate-200 font-mono pr-10"
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="absolute right-1 top-1 h-7 w-7 p-0 text-slate-400 hover:text-white"
                                                    onClick={() => copyToClipboard(justCreatedKey || "")}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter className="sm:justify-end">
                                        <Button type="button" variant="secondary" onClick={() => setIsKeyModalOpen(false)}>
                                            Close
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <div className="space-y-4">
                                {keys.map(key => (
                                    <div key={key.id} className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-white/5">
                                        <div>
                                            <div className="font-semibold text-slate-200">{key.name}</div>
                                            <div className="text-xs text-slate-500 font-mono mt-1">{key.key}</div>
                                            <div className="text-[10px] text-slate-600 mt-1">Created: {new Date(key.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {/* <Badge variant="outline" className="text-xs border-white/10 text-slate-500">Active</Badge> */}
                                            <Button variant="ghost" size="icon" className="text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={() => deleteKey(key.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {keys.length === 0 && (
                                    <div className="text-center py-10 text-slate-500">No API keys found. Create one to get started.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="docs" className="space-y-8">
                    <div className="grid lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <Card className="bg-black/40 border-white/10">
                                <CardHeader>
                                    <CardTitle>Authentication</CardTitle>
                                    <CardDescription>
                                        Include your API key in the `X-API-KEY` header of every request.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-slate-950 p-4 rounded-lg border border-white/5 font-mono text-sm text-slate-300 overflow-x-auto">
                                        <span className="text-indigo-400">curl</span> https://your-app.com/api/v1/voices \<br />
                                        &nbsp;&nbsp;<span className="text-indigo-400">-H</span> "X-API-KEY: sk_live_..."
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-black/40 border-white/10">
                                <CardHeader>
                                    <CardTitle>List Voices</CardTitle>
                                    <CardDescription>GET /api/v1/voices</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-slate-400">Returns a list of all available voices, including standard system voices and your personal cloned voices.</p>
                                    <div className="bg-slate-950 p-4 rounded-lg border border-white/5 font-mono text-xs text-blue-300 overflow-x-auto">
                                        {"{"}<br />
                                        &nbsp;&nbsp;"voices": [<br />
                                        &nbsp;&nbsp;&nbsp;&nbsp;{"{"} "voice_id": "af_heart", "name": "Heart (F)", "category": "premade" {"}"},<br />
                                        &nbsp;&nbsp;&nbsp;&nbsp;{"{"} "voice_id": "c3a...", "name": "My Clone", "category": "cloned" {"}"}<br />
                                        &nbsp;&nbsp;]<br />
                                        {"}"}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="bg-black/40 border-white/10">
                                <CardHeader>
                                    <CardTitle>Generate Audio (TTS)</CardTitle>
                                    <CardDescription>POST /api/v1/tts</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-slate-400">Convert text to speech depending on the voice ID provided. Returns binary audio (MP3/WAV).</p>

                                    <h4 className="text-xs font-semibold text-slate-300 uppercase">Request Body</h4>
                                    <div className="bg-slate-950 p-4 rounded-lg border border-white/5 font-mono text-sm text-slate-300 overflow-x-auto">
                                        {"{"}<br />
                                        &nbsp;&nbsp;<span className="text-emerald-400">"text"</span>: "Hello world",<br />
                                        &nbsp;&nbsp;<span className="text-emerald-400">"voice_id"</span>: "af_heart" <span className="text-slate-500">// or cloned-uuid</span><br />
                                        {"}"}
                                    </div>

                                    <h4 className="text-xs font-semibold text-slate-300 uppercase mt-4">Example (JavaScript)</h4>
                                    <div className="bg-slate-950 p-4 rounded-lg border border-white/5 font-mono text-xs text-slate-300 overflow-x-auto">
                                        <pre>{`const res = await fetch('https://app.com/api/v1/tts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': 'sk_live_...'
  },
  body: JSON.stringify({
    text: 'Hello from the API!',
    voice_id: 'af_heart' 
  })
});

const audioBlob = await res.blob();
const audioUrl = URL.createObjectURL(audioBlob);
new Audio(audioUrl).play();`}</pre>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}