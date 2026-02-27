"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Square, Upload, Play, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export function VoiceLabClient() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
                setAudioBlob(blob);
                setPreviewUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(t => t.stop());
            };

            recorder.start();
            setIsRecording(true);
        } catch (e) {
            toast.error("Failed to access microphone");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSave = async () => {
        if (!audioBlob || !name) return;
        setIsSaving(true);

        try {
            const formData = new FormData();
            formData.append("file", audioBlob, "recording.wav");
            formData.append("name", name);

            const res = await fetch("/api/voice/clone", {
                method: "POST",
                body: formData
            });

            if (!res.ok) throw new Error("Failed to clone voice");

            toast.success("Voice cloned successfully!");
            // Reset
            setAudioBlob(null);
            setPreviewUrl(null);
            setName("");
        } catch (e) {
            toast.error("Error creating voice clone");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Voice Cloning Lab</h2>
                <p className="text-muted-foreground">Record a sample of your voice to use as the AI agent.</p>
            </div>

            <div className="border rounded-xl p-6 space-y-6 bg-card">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Voice Name</label>
                    <Input
                        placeholder="e.g. My Custom Voice"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/50 gap-4">
                    {previewUrl ? (
                        <div className="w-full flex items-center gap-4">
                            <audio src={previewUrl} controls className="w-full" />
                            <Button variant="ghost" size="icon" onClick={() => { setAudioBlob(null); setPreviewUrl(null); }}>X</Button>
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-colors ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-primary'}`}>
                                <Mic className="h-8 w-8 text-primary-foreground" />
                            </div>
                            <div>
                                {isRecording ? (
                                    <Button variant="destructive" onClick={stopRecording}>Stop Recording</Button>
                                ) : (
                                    <Button onClick={startRecording}>Start Recording</Button>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">Record at least 10 seconds of clear speech.</p>
                        </div>
                    )}
                </div>

                <Button className="w-full" disabled={!audioBlob || !name || isSaving} onClick={handleSave}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Voice Clone
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                    By cloning a voice, you agree to our terms of service. Only clone voices you have permission to use.
                </p>
            </div>
        </div>
    );
}
