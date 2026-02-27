"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Bot, Settings, Users, ArrowRight } from "lucide-react";

export default function AgentsPage() {
    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight drop-shadow-sm">Voice Agents</h1>
                <p className="text-slate-400 mt-2 text-lg font-light">
                    Configure your AI personas, traits, and voice settings.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Create New Card */}
                <Card className="bg-white/5 border-dashed border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[300px]">
                    <div className="p-6 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            <Plus className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-200 group-hover:text-emerald-300">Create New Agent</h3>
                        <p className="text-slate-500 text-sm max-w-[200px] mx-auto">Define a new persona with custom voice traits and prompts.</p>
                    </div>
                </Card>

                {/* Example Active Agent */}
                <Card className="bg-black/40 border-white/10 overflow-hidden relative group hover:border-indigo-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-4">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active</Badge>
                    </div>
                    <CardHeader>
                        <div className="w-12 h-12 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                            <Bot className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-xl text-slate-200">Support Specialist</CardTitle>
                        <CardDescription>Default customer service agent.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-300">Professional</Badge>
                            <Badge variant="secondary" className="bg-purple-500/10 text-purple-300">English (US)</Badge>
                            <Badge variant="secondary" className="bg-rose-500/10 text-rose-300">Empathetic</Badge>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" /> 1.2k conversations
                            </div>
                            <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-white hover:bg-indigo-500/20">
                                Configure <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
