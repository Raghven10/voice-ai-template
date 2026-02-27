"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Download, Upload, FileText, Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { AudioVisualizer } from "../_components/AudioVisualizer";

interface Voice {
    id: string;
    name: string;
    type: 'System' | 'Cloned' | 'Community';
    previewUrl?: string; // We might use this for initial check
    is_owner?: boolean;
}

export default function VoiceLabPage() {
    const [text, setText] = useState("");
    const [engine, setEngine] = useState<'xtts' | 'piper'>('piper');
    const [selectedVoice, setSelectedVoice] = useState<string>("hi_IN-pratham-medium");

    // Voice Lists
    const [clonedVoices, setClonedVoices] = useState<Voice[]>([]);
    const [piperVoices, setPiperVoices] = useState<Voice[]>([
        { id: "hi_IN-pratham-medium", name: "Indic (True Hindi)", type: "System" },
        { id: "af_heart", name: "Heart (F) - US", type: "System" },
        { id: "af_alloy", name: "Alloy (F) - US", type: "System" },
        { id: "af_aoede", name: "Aoede (F) - US", type: "System" },
        { id: "af_bella", name: "Bella (F) - US", type: "System" },
        { id: "af_jessica", name: "Jessica (F) - US", type: "System" },
        { id: "af_kore", name: "Kore (F) - US", type: "System" },
        { id: "af_nicole", name: "Nicole (F) - US", type: "System" },
        { id: "af_nova", name: "Nova (F) - US", type: "System" },
        { id: "af_river", name: "River (F) - US", type: "System" },
        { id: "af_sarah", name: "Sarah (F) - US", type: "System" },
        { id: "af_sky", name: "Sky (F) - US", type: "System" },
        { id: "am_adam", name: "Adam (M) - US", type: "System" },
        { id: "am_echo", name: "Echo (M) - US", type: "System" },
        { id: "am_eric", name: "Eric (M) - US", type: "System" },
        { id: "am_fenrir", name: "Fenrir (M) - US", type: "System" },
        { id: "am_liam", name: "Liam (M) - US", type: "System" },
        { id: "am_michael", name: "Michael (M) - US", type: "System" },
        { id: "am_onyx", name: "Onyx (M) - US", type: "System" },
        { id: "am_puck", name: "Puck (M) - US", type: "System" },
        { id: "am_santa", name: "Santa (M) - US", type: "System" },
        { id: "bf_alice", name: "Alice (F) - UK", type: "System" },
        { id: "bf_emma", name: "Emma (F) - UK", type: "System" },
        { id: "bf_isabella", name: "Isabella (F) - UK", type: "System" },
        { id: "bf_lily", name: "Lily (F) - UK", type: "System" },
        { id: "bm_daniel", name: "Daniel (M) - UK", type: "System" },
        { id: "bm_fable", name: "Fable (M) - UK", type: "System" },
        { id: "bm_george", name: "George (M) - UK", type: "System" },
        { id: "bm_lewis", name: "Lewis (M) - UK", type: "System" },
    ]);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Derived available voices based on engine
    const availableVoices = engine === 'xtts' ? clonedVoices : piperVoices;

    // Fetch voices on load
    useEffect(() => {
        const fetchVoices = async () => {
            try {
                // Fetch saved cloned voices
                // Fetch saved cloned voices
                const res = await fetch("/api/voice/clone");

                // Wait, previous code was calling `/api/voice/clone`. I should check that file.
                // Assuming `/api/voice/clone` returns list of voices.
                if (res.ok) {
                    const data = await res.json();
                    // If data is array (old behavior) or object (new behavior if I change it).
                    // Let's check `api/voice/clone` content again.
                    const myVoices = Array.isArray(data) ? data.map((v: any) => ({
                        id: v.id,
                        name: v.name,
                        type: (v.is_owner ? 'Cloned' : 'Community') as 'Cloned' | 'Community',
                        is_owner: v.is_owner
                    })) : [];

                    setClonedVoices(myVoices);
                    if (myVoices.length > 0) setSelectedVoice(myVoices[0].id);
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load voices");
            }
        };
        fetchVoices();
    }, []);

    // Auto-select first voice when engine changes
    useEffect(() => {
        if (availableVoices.length > 0) {
            setSelectedVoice(availableVoices[0].id);
        }
    }, [engine, availableVoices]);

    // Handle Generation
    const handleGenerate = async () => {
        if (!text.trim()) {
            toast.error("Please enter some text to generate audio.");
            return;
        }
        if (!selectedVoice) {
            toast.error("Please select a voice.");
            return;
        }

        setIsGenerating(true);
        setGeneratedAudioUrl(null);
        setIsPlaying(false);

        try {
            const selectedVoiceObj = availableVoices.find(v => v.id === selectedVoice);
            const isCloned = selectedVoiceObj?.type === 'Cloned';

            const res = await fetch("/api/voice/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    voiceId: selectedVoice,
                    isCloned,
                    engine // Pass the selected engine to backend
                })
            });

            if (!res.ok) throw new Error("Generation failed");

            const data = await res.json();
            setGeneratedAudioUrl(data.audioUrl);

            if (data.mock) {
                toast.success("Audio generated (Simulated - XTTS path pending)");
            } else {
                toast.success("Audio generated successfully!");
            }

        } catch (error) {
            console.error(error);
            toast.error("Failed to generate audio.");
        } finally {
            setIsGenerating(false);
        }
    };

    const togglePlay = () => {
        if (!audioRef.current || !generatedAudioUrl) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simple text file reader for demo
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setText(event.target.result as string);
                toast.success("Text loaded from file");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="h-full w-full p-6 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 tracking-tight drop-shadow-sm">Voice Lab</h1>
                <p className="text-slate-400 mt-2 text-lg font-light">
                    Experiment with your cloned voices using our advanced synthesis engine.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Input Section */}
                    <div className="group relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden transition-all hover:border-white/20">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />

                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-200">Text Input</h3>
                                    <p className="text-xs text-slate-500">Enter text or upload a script</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    accept=".txt,.md"
                                    onChange={handleFileUpload}
                                />
                                <label htmlFor="file-upload">
                                    <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer">
                                        <Upload className="w-4 h-4 mr-2" /> Upload Text
                                    </Button>
                                </label>
                            </div>
                        </div>

                        <div className="p-6">
                            <Textarea
                                placeholder="Type something here for the AI to read..."
                                className="min-h-[300px] text-lg leading-relaxed bg-transparent border-none focus-visible:ring-0 text-slate-300 placeholder:text-slate-600 resize-none font-light"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />
                        </div>

                        <div className="bg-white/5 px-6 py-3 flex justify-between items-center text-xs text-slate-500 font-mono border-t border-white/5">
                            <span>Markdown Supported</span>
                            <span>{text.length} characters</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Controls Section */}
                    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden h-fit sticky top-6">
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                                    <Wand2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-200">Control Panel</h3>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Synthesis Engine</label>
                                <Select value={engine} onValueChange={(val: 'xtts' | 'piper') => setEngine(val)}>
                                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-slate-200 focus:ring-indigo-500/50 h-10">
                                        <SelectValue placeholder="Select Engine" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                        <SelectItem value="piper">Indic / Standard (High Quality TTS)</SelectItem>
                                        <SelectItem value="xtts">XTTS (Voice Cloning — GPU Required)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Voice Model</label>
                                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-slate-200 focus:ring-indigo-500/50 h-10">
                                        <SelectValue placeholder="Choose a voice" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                        {availableVoices.map(voice => (
                                            <SelectItem key={voice.id} value={voice.id} className="focus:bg-white/10 focus:text-white">
                                                <div className="flex items-center justify-between w-full gap-4">
                                                    <span>{voice.name}</span>
                                                    {voice.type === 'Cloned' && (
                                                        <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded font-medium tracking-wide">CLONE</span>
                                                    )}
                                                    {voice.type === 'System' && (
                                                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-medium tracking-wide">SYSTEM</span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                onClick={handleGenerate}
                                disabled={isGenerating || !text.trim()}
                            >
                                {isGenerating ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Synthesizing...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5" />
                                        <span>Generate Audio</span>
                                    </div>
                                )}
                            </Button>

                            {generatedAudioUrl && (
                                <div className="pt-6 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Result</h4>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-indigo-400 hover:bg-transparent">
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div className="bg-black/40 rounded-xl p-4 flex items-center gap-4 justify-between border border-white/5 shadow-inner">
                                            <Button
                                                size="icon"
                                                className={`h-12 w-12 rounded-full shadow-lg shrink-0 transition-all ${isPlaying ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.4)]'}`}
                                                onClick={togglePlay}
                                            >
                                                {isPlaying ? <Pause className="w-5 h-5 text-white fill-current" /> : <Play className="w-5 h-5 text-white pl-1 fill-current" />}
                                            </Button>

                                            <div className="flex-1 overflow-hidden h-10 flex items-center justify-center">
                                                {isPlaying ? (
                                                    <AudioVisualizer isPlaying={true} audioElement={audioRef.current!} barColor="rgb(99, 102, 241)" />
                                                ) : (
                                                    <div className="flex items-center gap-1 h-3 w-full justify-center opacity-30">
                                                        {[...Array(20)].map((_, i) => (
                                                            <div key={i} className="w-1 bg-white rounded-full" style={{ height: `${Math.random() * 100}%` }} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <audio
                                            ref={audioRef}
                                            src={generatedAudioUrl}
                                            onEnded={() => setIsPlaying(false)}
                                            className="hidden"
                                            controls
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tips Card */}
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
                        <div className="flex gap-3">
                            <div className="mt-1">
                                <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-blue-200 mb-1">Pro Tip</h4>
                                <p className="text-xs text-blue-300/70 leading-relaxed">
                                    For best results with cloned voices, try to match the emotion and pacing of your original recording in the text you provide.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
