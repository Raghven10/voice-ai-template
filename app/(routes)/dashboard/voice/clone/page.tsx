"use client";

import { Mic, Upload, Wand2, Square, Play, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export default function VoiceClonePage() {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPublic, setIsPublic] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                stream.getTracks().forEach(track => track.stop()); // Stop microphone access
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            toast.error("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const resetRecording = () => {
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const [voiceName, setVoiceName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!audioBlob) return;
        if (!voiceName.trim()) {
            toast.error("Please enter a name for your voice.");
            return;
        }

        try {
            setIsSaving(true);
            const formData = new FormData();
            formData.append("file", audioBlob, "recording.webm");
            formData.append("name", voiceName);

            const res = await fetch("/api/voice/clone", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            toast.success("Voice saved successfully!");
            setVoiceName("");
            setAudioBlob(null);
            setAudioUrl(null);
            setRecordingTime(0);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save voice. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full w-full p-6 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Voice Cloning Studio</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
                    Create a digital replica of your voice for the assistant to use.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">

                {/* Record Option */}
                <Card className={`transition-all border-dashed border-2 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm ${isRecording ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'hover:border-[var(--color-primary)]/50'}`}>
                    <CardHeader>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-red-100 dark:bg-red-900/20'}`}>
                            <Mic className={`w-6 h-6 ${isRecording ? 'text-white' : 'text-red-600 dark:text-red-400'}`} />
                        </div>
                        <CardTitle>{isRecording ? 'Recording...' : audioBlob ? 'Recording Complete' : 'Record Voice Sample'}</CardTitle>
                        <CardDescription>
                            {isRecording ? formatTime(recordingTime) : 'Read a short script to clone your voice.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!isRecording && !audioBlob && (
                            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={startRecording}>
                                Start Recording
                            </Button>
                        )}

                        {isRecording && (
                            <Button className="w-full" variant="destructive" onClick={stopRecording}>
                                <Square className="w-4 h-4 mr-2 fill-current" /> Stop Recording
                            </Button>
                        )}

                        {audioBlob && (
                            <div className="space-y-3">
                                <audio src={audioUrl!} controls className="w-full rounded-lg bg-slate-100 dark:bg-slate-800" />
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Voice Name</label>
                                    <input
                                        type="text"
                                        value={voiceName}
                                        onChange={(e) => setVoiceName(e.target.value)}
                                        placeholder="e.g. My Professional Voice"
                                        className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                </div>
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center space-x-2 border p-3 rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                        <Switch id="public-mode" checked={isPublic} onCheckedChange={setIsPublic} />
                                        <div className="flex-1">
                                            <Label htmlFor="public-mode" className="text-sm font-medium cursor-pointer">Make Public</Label>
                                            <p className="text-[10px] text-slate-500">
                                                {isPublic
                                                    ? "Visible to all users and via API."
                                                    : "Only visible to you."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" className="flex-1" onClick={resetRecording} disabled={isSaving}>
                                        <RotateCcw className="w-4 h-4 mr-2" /> Redo
                                    </Button>
                                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave} disabled={isSaving}>
                                        {isSaving ? (
                                            <>Saving...</>
                                        ) : (
                                            <><Save className="w-4 h-4 mr-2" /> Save Voice</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Upload Option */}
                <Card className="hover:shadow-lg transition-all border-dashed border-2 cursor-pointer group hover:border-[var(--color-primary)]/50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
                    <CardHeader>
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <CardTitle>Upload Audio File</CardTitle>
                        <CardDescription>Upload an existing recording of your voice.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full">Select File</Button>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-transparent border border-violet-500/20">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-violet-500/20 rounded-lg">
                        <Wand2 className="w-6 h-6 text-violet-600 dark:text-violet-300" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-violet-900 dark:text-violet-100 mb-1">How it works</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Our AI analyzes the unique characteristics of your voice from a short sample.
                            Once processed (usually in under a minute), you can set it as the default voice for your assistant.
                            All processing happens securely and your voice data is private.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
