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
    const [isLoading, setIsLoading] = useState(false);

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
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-4xl font-black text-emerald-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-emerald-400 dark:to-cyan-400 tracking-tight drop-shadow-sm">Developer API</h1>
                <p className="text-muted-foreground mt-2 text-lg font-light">
                    Integrate our advanced voice synthesis into your applications.
                </p>
            </div>

            <Tabs defaultValue="keys" className="space-y-6">
                <TabsList className="bg-muted border border-[var(--border)] p-1">
                    <TabsTrigger value="keys" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-300">API Keys</TabsTrigger>
                    <TabsTrigger value="agents" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-600 dark:data-[state=active]:text-pink-300">Voice Agents</TabsTrigger>
                    <TabsTrigger value="docs" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-300">Documentation</TabsTrigger>
                </TabsList>

                {/* --- AGENTS TAB --- */}
                <TabsContent value="agents" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link href="/dashboard/developer/agents/new" className="block focus:outline-none focus:ring-2 focus:ring-pink-500 rounded-xl">
                            <Card className="bg-[var(--card)] border-dashed border-[var(--border)] hover:border-pink-500/50 hover:bg-pink-500/5 transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[300px]">
                                <div className="p-6 text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                        <Plus className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground group-hover:text-pink-600 dark:group-hover:text-pink-300">Create New Agent</h3>
                                    <p className="text-muted-foreground text-sm max-w-[200px] mx-auto">Define a new persona with custom voice traits and prompts.</p>
                                </div>
                            </Card>
                        </Link>

                        {agents.map((agent) => (
                            <Card key={agent.id} className="bg-[var(--background)] border-[var(--border)] overflow-hidden relative group hover:border-indigo-500/30 transition-all min-h-[300px] flex flex-col shadow-sm">
                                <div className="absolute top-0 right-0 p-4">
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">{agent.isPublic ? "Public" : "Private"}</Badge>
                                </div>
                                <CardHeader>
                                    <div className="w-12 h-12 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    <CardTitle className="text-xl text-foreground truncate">{agent.name}</CardTitle>
                                    <CardDescription className="line-clamp-2">{agent.traits?.tone ? `Tone: ${agent.traits.tone}` : "Default Tone"}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-1 flex flex-col justify-end">
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-300 text-xs">
                                            {availableVoices.find(v => v.id === agent.baseVoiceId)?.name || agent.baseVoiceId}
                                        </Badge>
                                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-300 text-xs">{agent.language}</Badge>
                                    </div>
                                    <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4" /> 0 convos
                                        </div>
                                        <Button variant="ghost" size="sm" asChild className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-white hover:bg-indigo-500/10">
                                            <Link href={`/dashboard/developer/agents/edit/${agent.id}`}>
                                                Configure
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>



                    {/* KB CREATION MODAL REMOVED - Managed in dedicated page */}
                </TabsContent>

                {/* --- KEYS TAB --- */}
                <TabsContent value="keys" className="space-y-6">
                    <Card className="bg-[var(--card)] border-[var(--border)] backdrop-blur-sm">
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
                                    className="bg-muted/50 border-[var(--border)] text-foreground"
                                />
                                <Button onClick={createKey} disabled={isLoading || !newKeyName} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    <Plus className="w-4 h-4 mr-2" /> Create Key
                                </Button>
                            </div>

                            <Dialog open={isKeyModalOpen} onOpenChange={setIsKeyModalOpen}>
                                <DialogContent className="sm:max-w-md bg-[var(--card)] border-[var(--border)] text-foreground">
                                    <DialogHeader>
                                        <DialogTitle className="text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5" />
                                            API Key Created
                                        </DialogTitle>
                                        <DialogDescription className="text-muted-foreground">
                                            Your API key has been generated successfully. Please copy it now as you won't be able to see it again.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex items-center space-x-2 my-4">
                                        <div className="grid flex-1 gap-2">
                                            <div className="relative">
                                                <Input
                                                    readOnly
                                                    value={justCreatedKey || ""}
                                                    className="bg-[var(--background)] border-[var(--border)] text-foreground font-mono pr-10"
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="absolute right-1 top-1 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
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
                                    <div key={key.id} className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-sm">
                                        <div>
                                            <div className="font-semibold text-foreground">{key.name}</div>
                                            <div className="text-xs text-muted-foreground font-mono mt-1">{key.key}</div>
                                            <div className="text-[10px] text-muted-foreground mt-1">Created: {new Date(key.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-500/10" onClick={() => deleteKey(key.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {keys.length === 0 && (
                                    <div className="text-center py-10 text-muted-foreground">No API keys found. Create one to get started.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="docs" className="space-y-8">
                    <div className="grid lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <Card className="bg-[var(--card)] border-[var(--border)]">
                                <CardHeader>
                                    <CardTitle>Authentication</CardTitle>
                                    <CardDescription>
                                        Include your API key in the `X-API-KEY` header of every request.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-[var(--border)] font-mono text-sm text-slate-700 dark:text-slate-300 overflow-x-auto">
                                        <span className="text-indigo-600 dark:text-indigo-400">curl</span> https://your-app.com/api/v1/voices \<br />
                                        &nbsp;&nbsp;<span className="text-indigo-600 dark:text-indigo-400">-H</span> "X-API-KEY: sk_live_..."
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-[var(--card)] border-[var(--border)]">
                                <CardHeader>
                                    <CardTitle>List Voices</CardTitle>
                                    <CardDescription>GET /api/v1/voices</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">Returns a list of all available voices, including standard system voices and your personal cloned voices.</p>
                                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-[var(--border)] font-mono text-xs text-blue-700 dark:text-blue-300 overflow-x-auto">
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
                            <Card className="bg-[var(--card)] border-[var(--border)]">
                                <CardHeader>
                                    <CardTitle>Generate Audio (TTS)</CardTitle>
                                    <CardDescription>POST /api/v1/tts</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">Convert text to speech depending on the voice ID provided. Returns binary audio (MP3/WAV).</p>

                                    <h4 className="text-xs font-semibold text-foreground uppercase">Request Body</h4>
                                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-[var(--border)] font-mono text-sm text-slate-700 dark:text-slate-300 overflow-x-auto">
                                        {"{"}<br />
                                        &nbsp;&nbsp;<span className="text-emerald-600 dark:text-emerald-400">"text"</span>: "Hello world",<br />
                                        &nbsp;&nbsp;<span className="text-emerald-600 dark:text-emerald-400">"voice_id"</span>: "af_heart" <span className="text-muted-foreground">// or cloned-uuid</span><br />
                                        {"}"}
                                    </div>

                                    <h4 className="text-xs font-semibold text-foreground uppercase mt-4">Example (JavaScript)</h4>
                                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-[var(--border)] font-mono text-xs text-slate-700 dark:text-slate-300 overflow-x-auto">
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