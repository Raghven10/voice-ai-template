"use client";

import { Play, Pause, Trash2, Check, MoreHorizontal, Mic, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect } from "react";
import { AudioVisualizer } from "../_components/AudioVisualizer";
import { toast } from "sonner";

interface Voice {
    id: string;
    name: string;
    date: string;
    isDefault: boolean;
    type: 'System' | 'Cloned';
    audioUrl?: string; // Mock audio URL
}

// Mock data (fallback)
const MOCK_VOICES: Voice[] = [
    { id: '1', name: 'Default Assistant', date: 'System Default', isDefault: true, type: 'System', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, // Placeholder MP3
];

export default function SavedVoicesPage() {
    const [voices, setVoices] = useState<Voice[]>(MOCK_VOICES);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Fetch voices
    useEffect(() => {
        const fetchVoices = async () => {
            try {
                const res = await fetch("/api/voice/clone");
                if (res.ok) {
                    const data = await res.json();
                    const newVoices: Voice[] = data.map((v: any) => ({
                        id: v.id,
                        name: v.name,
                        date: new Date(v.createdAt).toLocaleDateString(),
                        isDefault: false, // TODO: Check user selected voice
                        type: 'Cloned',
                        audioUrl: v.previewUrl
                    }));
                    setVoices([...MOCK_VOICES, ...newVoices]);
                }
            } catch (err) {
                console.error("Failed to fetch voices", err);
                toast.error("Could not load your voices.");
            } finally {
                setLoading(false);
            }
        };

        fetchVoices();
    }, []);

    // Stop audio when component unmounts
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    const handlePlay = (voice: Voice) => {
        if (playingId === voice.id) {
            // Pause
            audioRef.current?.pause();
            setPlayingId(null);
        } else {
            // Play new
            if (audioRef.current) {
                audioRef.current.pause();
            }
            // In a real app, you'd fetch the secure URL here
            const audio = new Audio(voice.audioUrl);
            audio.crossOrigin = "anonymous"; // Important for Web Audio API if crossing domains
            audioRef.current = audio;

            audio.addEventListener('ended', () => setPlayingId(null));
            audio.play().catch(e => {
                console.error("Play error", e);
                toast.error("Could not play audio. Use a local file for best results.");
            });

            setPlayingId(voice.id);
        }
    };

    const handleDelete = async (id: string) => {
        // Optimistic update
        const previousVoices = [...voices];
        setVoices(prev => prev.filter(v => v.id !== id));

        // Prevent deleting mock data
        if (id === '1') {
            toast.success("Voice deleted");
            return;
        }

        try {
            const res = await fetch("/api/voice/clone", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });

            if (!res.ok) {
                throw new Error("Failed to delete voice");
            }
            toast.success("Voice deleted successfully");
        } catch (error) {
            console.error(error);
            toast.error("Could not delete voice from server");
            // Revert optimistic update
            setVoices(previousVoices);
        }
    };

    const handleSetActive = (id: string) => {
        setVoices(prev => prev.map(v => ({
            ...v,
            isDefault: v.id === id
        })));
        toast.info("Active voice updated");
    };

    return (
        <div className="h-full w-full p-6 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-foreground tracking-tight">Saved Voices</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Manage and audition your voice library.
                </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-md overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50 border-b border-[var(--border)]">
                        <TableRow className="hover:bg-transparent border-[var(--border)]">
                            <TableHead className="w-[60px] text-center text-muted-foreground font-semibold uppercase text-xs tracking-wider">Status</TableHead>
                            <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Name</TableHead>
                            <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Type</TableHead>
                            <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Created</TableHead>
                            <TableHead className="text-right text-muted-foreground font-semibold uppercase text-xs tracking-wider w-[200px]">Preview</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {voices.map((voice) => (
                            <TableRow key={voice.id} className="group border-b border-[var(--border)] hover:bg-muted/30 transition-colors">
                                <TableCell>
                                    <div className="flex justify-center">
                                        {voice.isDefault ? (
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Mic className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium text-foreground">
                                        {voice.name}
                                        {voice.isDefault && <span className="ml-2 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-medium tracking-wide">ACTIVE</span>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="bg-muted hover:bg-muted/80 text-foreground border border-[var(--border)] font-normal">
                                        {voice.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">{voice.date}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-3 h-[40px]">
                                        {playingId === voice.id && audioRef.current && (
                                            <div className="animate-in fade-in zoom-in duration-300">
                                                <AudioVisualizer
                                                    isPlaying={true}
                                                    audioElement={audioRef.current}
                                                    barColor={voice.isDefault ? "rgb(16, 185, 129)" : "rgb(99, 102, 241)"}
                                                />
                                            </div>
                                        )}

                                        <Button
                                            variant={playingId === voice.id ? "default" : "secondary"}
                                            size="icon"
                                            className={`rounded-full shadow-sm transition-all border border-[var(--border)] ${playingId === voice.id
                                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                                                : 'bg-[var(--background)] hover:bg-muted text-foreground hover:text-indigo-600 dark:hover:text-indigo-400'
                                                }`}
                                            onClick={() => handlePlay(voice)}
                                        >
                                            {playingId === voice.id ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current pl-0.5" />}
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-[var(--card)] border-[var(--border)] text-foreground">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handlePlay(voice)} className="focus:bg-muted focus:text-foreground cursor-pointer">
                                                Preview Audio
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-[var(--border)]" />
                                            {!voice.isDefault && (
                                                <DropdownMenuItem onClick={() => handleSetActive(voice.id)} className="text-emerald-600 dark:text-emerald-500 focus:text-emerald-700 dark:focus:text-emerald-400 focus:bg-emerald-500/10 cursor-pointer">
                                                    <Check className="mr-2 h-4 w-4" /> Set as Active
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator className="bg-[var(--border)]" />
                                            <DropdownMenuItem className="text-red-600 dark:text-red-500 focus:text-red-700 dark:focus:text-red-400 focus:bg-red-500/10 cursor-pointer" onClick={() => handleDelete(voice.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {voices.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                    No voices found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

