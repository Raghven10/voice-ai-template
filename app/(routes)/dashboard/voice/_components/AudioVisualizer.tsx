"use client";

import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
    stream?: MediaStream;
    audioElement?: HTMLAudioElement;
    isPlaying: boolean;
    barColor?: string;
}

export function AudioVisualizer({ stream, audioElement, isPlaying, barColor = "rgb(99, 102, 241)" }: AudioVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);

    useEffect(() => {
        if (!isPlaying || (!stream && !audioElement)) {
            if (audioContextRef.current && audioContextRef.current.state === 'running') {
                // audioContextRef.current.suspend();
            }
            cancelAnimationFrame(animationRef.current);
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext("2d");
                if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            return;
        }

        const initAudio = () => {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }

            const ctx = audioContextRef.current;

            // Create analyser if not exists
            if (!analyserRef.current) {
                analyserRef.current = ctx.createAnalyser();
                analyserRef.current.fftSize = 64; // Low FFT size for simple bars
            }

            // Create source if not exists
            if (!sourceRef.current) {
                if (stream) {
                    sourceRef.current = ctx.createMediaStreamSource(stream);
                } else if (audioElement) {
                    // Important: Element source can only be created once per element usually
                    try {
                        // Check if the element already has a source attached in another context or way.
                        // For simplicity in this demo, we assume we control the element.
                        // However, re-using the same element with createMediaElementSource often throws errors if done multiple times.
                        // A workaround is to store the source on the element itself or manage it globally.
                        // For this 'row' based usage, we might create new elements.
                        sourceRef.current = ctx.createMediaElementSource(audioElement);
                        sourceRef.current.connect(ctx.destination); // Connect to output so we can hear it
                    } catch (e) {
                        console.warn("Source already created or error:", e);
                        return;
                    }
                }

                if (sourceRef.current && analyserRef.current) {
                    sourceRef.current.connect(analyserRef.current);
                }
            }

            draw();
        };

        const draw = () => {
            if (!canvasRef.current || !analyserRef.current) return;

            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const renderFrame = () => {
                animationRef.current = requestAnimationFrame(renderFrame);
                analyserRef.current!.getByteFrequencyData(dataArray);

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const width = canvas.width;
                const height = canvas.height;
                const barWidth = (width / bufferLength) * 2.5;
                let barHeight;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    barHeight = (dataArray[i] / 255) * height;

                    ctx.fillStyle = barColor;

                    // Draw rounded bars
                    // ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                    // Simpler rectangle for performance
                    ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                    x += barWidth + 1;
                }
            };

            renderFrame();
        };

        initAudio();

        return () => {
            cancelAnimationFrame(animationRef.current);
            // Ideally we don't close the context constantly, but for this cleanup it's safe to suspend
            // content.suspend();
        };
    }, [stream, audioElement, isPlaying, barColor]);

    return <canvas ref={canvasRef} width={120} height={40} className="w-[120px] h-[40px]" />;
}
