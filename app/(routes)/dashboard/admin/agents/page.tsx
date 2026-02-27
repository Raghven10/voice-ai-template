"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    Save,
    X,
    Globe,
    BookOpen,
    Mic,
    Bot,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Language + Voice Options ───────────────────────────────────
const LANGUAGE_OPTIONS = [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "hi", label: "Hindi", flag: "🇮🇳" },
    { code: "mr", label: "Marathi", flag: "🇮🇳" },
    { code: "bn", label: "Bengali", flag: "🇮🇳" },
    { code: "te", label: "Telugu", flag: "🇮🇳" },
    { code: "ta", label: "Tamil", flag: "🇮🇳" },
    { code: "kn", label: "Kannada", flag: "🇮🇳" },
    { code: "ml", label: "Malayalam", flag: "🇮🇳" },
    { code: "gu", label: "Gujarati", flag: "🇮🇳" },
    { code: "pa", label: "Punjabi", flag: "🇮🇳" },
    { code: "or", label: "Odia", flag: "🇮🇳" },
];

// Voice options per language — offline only:
//   indic:*   → AI4Bharat IndicF5 (self-hosted port 8005, high quality, needs pre-downloaded model)
//   *         → Piper TTS ONNX (self-hosted port 8003, lightweight, always available)
const VOICE_OPTIONS: Record<string, { id: string; label: string }[]> = {
    en: [
        { id: "en_US-lessac-medium", label: "🔊 Lessac (M) – Piper US" },
        { id: "en_US-ryan-high", label: "🔊 Ryan (M) – Piper US High" },
        { id: "en_GB-alan-medium", label: "🔊 Alan (M) – Piper UK" },
    ],
    hi: [
        { id: "indic:hi_female", label: "🎙 IndicF5 Female – Hindi" },
        { id: "indic:hi_male", label: "🎙 IndicF5 Male – Hindi" },
        { id: "hi_IN-pratham-medium", label: "🔊 Pratham (M) – Piper" },
        { id: "hi_IN-priyamvada-medium", label: "🔊 Priyamvada (F) – Piper" },
    ],
    mr: [
        { id: "indic:mr_female", label: "🎙 IndicF5 Female – Marathi" },
        { id: "hi_IN-pratham-medium", label: "🔊 Pratham (M) – Piper Fallback" },
    ],
    bn: [
        { id: "indic:bn_female", label: "🎙 IndicF5 Female – Bengali" },
        { id: "hi_IN-pratham-medium", label: "🔊 Pratham (M) – Piper Fallback" },
    ],
    te: [
        { id: "indic:te_male", label: "🎙 IndicF5 Male – Telugu" },
        { id: "te_IN-padmavathi-medium", label: "🔊 Padmavathi (F) – Piper Telugu" },
        { id: "te_IN-maya-medium", label: "🔊 Maya (F) – Piper Telugu" },
        { id: "te_IN-venkatesh-medium", label: "🔊 Venkatesh (M) – Piper Telugu" },
    ],
    ta: [
        { id: "indic:ta_female", label: "🎙 IndicF5 Female – Tamil" },
        { id: "hi_IN-pratham-medium", label: "🔊 Pratham (M) – Piper (Fallback)" },
    ],
    kn: [
        { id: "indic:kn_male", label: "🎙 IndicF5 Male – Kannada" },
        { id: "hi_IN-pratham-medium", label: "🔊 Pratham (M) – Piper (Fallback)" },
    ],
    ml: [
        { id: "indic:ml_female", label: "🎙 IndicF5 Female – Malayalam" },
        { id: "ml_IN-maneesha-medium", label: "🔊 Maneesha (F) – Piper Malayalam" },
    ],
    gu: [
        { id: "indic:gu_male", label: "🎙 IndicF5 Male – Gujarati" },
        { id: "hi_IN-pratham-medium", label: "🔊 Pratham (M) – Piper Fallback" },
    ],
    pa: [
        { id: "indic:pa_female", label: "🎙 IndicF5 Female – Punjabi" },
        { id: "hi_IN-pratham-medium", label: "🔊 Pratham (M) – Piper Fallback" },
    ],
    or: [
        { id: "indic:or_female", label: "🎙 IndicF5 Female – Odia" },
        { id: "hi_IN-pratham-medium", label: "🔊 Pratham (M) – Piper Fallback" },
    ],
};

type VoiceAgent = {
    id: string;
    name: string;
    description: string | null;
    language: string;
    baseVoiceId: string;
    systemPrompt: string | null;
    knowledgeBaseDocIds: string[];
    createdAt: string;
};

type Document = {
    id: string;
    title: string;
    applicationId: string | null;
};

const DEFAULT_FORM = {
    id: "",
    name: "",
    description: "",
    language: "en",
    baseVoiceId: "en_US-lessac-medium",
    systemPrompt: "You are a helpful AI helpdesk assistant. Answer clearly and concisely.",
    knowledgeBaseDocIds: [] as string[],
};

// ─── Agent Form Modal ────────────────────────────────────────────
function AgentFormModal({
    initial,
    documents,
    onSave,
    onClose,
}: {
    initial: typeof DEFAULT_FORM;
    documents: Document[];
    onSave: (data: typeof DEFAULT_FORM) => Promise<void>;
    onClose: () => void;
}) {
    const [form, setForm] = useState(initial);
    const [saving, setSaving] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(!!initial.systemPrompt && initial.systemPrompt !== DEFAULT_FORM.systemPrompt);

    const voicesForLang = VOICE_OPTIONS[form.language] ?? VOICE_OPTIONS.en;

    const handleLangChange = (lang: string) => {
        const firstVoice = (VOICE_OPTIONS[lang] ?? VOICE_OPTIONS.en)[0].id;
        setForm((f) => ({ ...f, language: lang, baseVoiceId: firstVoice }));
    };

    const toggleDoc = (docId: string) => {
        setForm((f) => ({
            ...f,
            knowledgeBaseDocIds: f.knowledgeBaseDocIds.includes(docId)
                ? f.knowledgeBaseDocIds.filter((d) => d !== docId)
                : [...f.knowledgeBaseDocIds, docId],
        }));
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            toast.error("Agent name is required");
            return;
        }
        setSaving(true);
        try {
            await onSave(form);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-xl bg-[#0d0d18] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                    <h2 className="text-lg font-semibold text-slate-100">
                        {form.id ? "Edit Assistant" : "Create Assistant"}
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Assistant Name *
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            placeholder="e.g. HRMS Support – Hindi"
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Description
                        </label>
                        <input
                            type="text"
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            placeholder="Short description shown to users"
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                        />
                    </div>

                    {/* Language */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" /> Language
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {LANGUAGE_OPTIONS.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleLangChange(lang.code)}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${form.language === lang.code
                                        ? "bg-indigo-600/15 border-indigo-500/50 text-indigo-300"
                                        : "bg-white/[0.03] border-white/[0.07] text-slate-400 hover:bg-white/[0.07] hover:text-slate-300"
                                        }`}
                                >
                                    <span className="text-base">{lang.flag}</span>
                                    <span className="font-medium text-xs">{lang.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* TTS Voice */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Mic className="w-3.5 h-3.5" /> TTS Voice
                        </label>
                        <select
                            value={form.baseVoiceId}
                            onChange={(e) => setForm((f) => ({ ...f, baseVoiceId: e.target.value }))}
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                        >
                            {voicesForLang.map((v) => (
                                <option key={v.id} value={v.id} className="bg-slate-900">
                                    {v.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Knowledge Base */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" /> Knowledge Base Documents
                        </label>
                        {documents.length === 0 ? (
                            <p className="text-xs text-slate-600 bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3">
                                No documents found. Upload documents in the Knowledge Base section.
                            </p>
                        ) : (
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                {documents.map((doc) => {
                                    const isSelected = form.knowledgeBaseDocIds.includes(doc.id);
                                    return (
                                        <button
                                            key={doc.id}
                                            onClick={() => toggleDoc(doc.id)}
                                            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm transition-all ${isSelected
                                                ? "bg-emerald-600/10 border-emerald-500/30 text-emerald-300"
                                                : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:bg-white/[0.06]"
                                                }`}
                                        >
                                            <BookOpen className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-emerald-400" : "text-slate-600"}`} />
                                            <span className="truncate text-xs">{doc.title}</span>
                                            {isSelected && (
                                                <span className="ml-auto text-[10px] font-medium bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded shrink-0">
                                                    Selected
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Advanced: System Prompt */}
                    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
                        <button
                            onClick={() => setShowAdvanced((v) => !v)}
                            className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            <span className="flex items-center gap-1.5">
                                <Bot className="w-3.5 h-3.5" /> Advanced: System Prompt
                            </span>
                            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {showAdvanced && (
                            <div className="px-4 pb-4">
                                <textarea
                                    rows={5}
                                    value={form.systemPrompt}
                                    onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
                                    placeholder="System instructions for the AI agent…"
                                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none font-mono text-xs"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <Button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? "Saving…" : "Save Assistant"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function AdminAgentsPage() {
    const [agents, setAgents] = useState<VoiceAgent[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editAgent, setEditAgent] = useState<VoiceAgent | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [agentsRes, docsRes] = await Promise.all([
                fetch("/api/voice-agents"),
                fetch("/api/documents"),
            ]);
            if (agentsRes.ok) setAgents(await agentsRes.json());
            if (docsRes.ok) {
                const docsData = await docsRes.json();
                setDocuments(Array.isArray(docsData) ? docsData : docsData.documents ?? []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async (form: typeof DEFAULT_FORM) => {
        const isEdit = !!form.id;
        const res = await fetch("/api/voice-agents", {
            method: isEdit ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        if (res.ok) {
            toast.success(isEdit ? "Assistant updated!" : "Assistant created!");
            setShowModal(false);
            setEditAgent(null);
            fetchData();
        } else {
            const err = await res.json();
            toast.error(err.error || "Failed to save.");
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/voice-agents?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Assistant deleted.");
                fetchData();
            } else {
                toast.error("Failed to delete.");
            }
        } finally {
            setDeletingId(null);
        }
    };

    const openCreate = () => {
        setEditAgent(null);
        setShowModal(true);
    };

    const openEdit = (agent: VoiceAgent) => {
        setEditAgent(agent);
        setShowModal(true);
    };

    const modalInitial = editAgent
        ? {
            id: editAgent.id,
            name: editAgent.name,
            description: editAgent.description ?? "",
            language: editAgent.language ?? "en",
            baseVoiceId: editAgent.baseVoiceId,
            systemPrompt: editAgent.systemPrompt ?? "",
            knowledgeBaseDocIds: editAgent.knowledgeBaseDocIds,
        }
        : DEFAULT_FORM;

    const langMeta: Record<string, { label: string; flag: string }> = {
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

    return (
        <div className="h-full w-full p-6 space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 tracking-tight">
                        Helpdesk Assistants
                    </h1>
                    <p className="text-slate-400 mt-2 text-base font-light">
                        Configure AI agents with language, voice, and knowledge base for each support area.
                    </p>
                </div>
                <Button
                    onClick={openCreate}
                    className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-900/30"
                >
                    <Plus className="w-4 h-4" />
                    New Assistant
                </Button>
            </div>

            {/* Agent Cards */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Loading assistants…</span>
                </div>
            ) : agents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
                        <Bot className="w-8 h-8 text-slate-600" />
                    </div>
                    <div>
                        <p className="text-slate-300 font-semibold">No assistants yet</p>
                        <p className="text-slate-600 text-sm mt-1">Click "New Assistant" to create your first helpdesk agent.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {agents.map((agent) => {
                        const lang = langMeta[agent.language] ?? { label: agent.language, flag: "🌐" };
                        return (
                            <div
                                key={agent.id}
                                className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 hover:border-white/[0.15] hover:bg-white/[0.05] transition-all"
                            >
                                {/* Lang flag + name */}
                                <div className="flex items-start gap-3 mb-3">
                                    <span className="text-2xl">{lang.flag}</span>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-slate-100 text-sm leading-tight truncate">
                                            {agent.name}
                                        </h3>
                                        <span className="text-[11px] font-medium text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                            {lang.label}
                                        </span>
                                    </div>
                                </div>

                                {agent.description && (
                                    <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">
                                        {agent.description}
                                    </p>
                                )}

                                {/* Metadata */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-white/[0.04] px-2 py-1 rounded-md">
                                        <Mic className="w-3 h-3" />
                                        {agent.baseVoiceId}
                                    </span>
                                    {agent.knowledgeBaseDocIds.length > 0 && (
                                        <span className="flex items-center gap-1 text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
                                            <BookOpen className="w-3 h-3" />
                                            {agent.knowledgeBaseDocIds.length} doc{agent.knowledgeBaseDocIds.length !== 1 ? "s" : ""}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEdit(agent)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.05] border border-white/[0.07] text-xs text-slate-400 hover:text-slate-200 hover:bg-white/[0.1] transition-all"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(agent.id)}
                                        disabled={deletingId === agent.id}
                                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/5 border border-red-500/10 text-xs text-red-500 hover:bg-red-500/15 hover:border-red-500/30 transition-all disabled:opacity-50"
                                    >
                                        {deletingId === agent.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Hint box */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3 max-w-lg">
                <AlertTriangle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-300/70 leading-relaxed">
                    Each assistant is presented to users before they start a call. The selected agent's language, voice, and knowledge base are automatically loaded into the voice worker.
                </p>
            </div>

            {/* Modal */}
            {showModal && (
                <AgentFormModal
                    initial={modalInitial}
                    documents={documents}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditAgent(null); }}
                />
            )}
        </div>
    );
}
