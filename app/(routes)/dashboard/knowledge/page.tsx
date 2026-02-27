"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, FileText, Upload, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function KnowledgeBasePage() {
    const [docs, setDocs] = useState<any[]>([]);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [buckets, setBuckets] = useState<string[]>([]);
    const [selectedBucket, setSelectedBucket] = useState<string>("");
    const [newBucketName, setNewBucketName] = useState("");
    const [isCreatingBucket, setIsCreatingBucket] = useState(false);

    useEffect(() => {
        fetchDocs();
        fetchBuckets();
    }, []);

    const fetchDocs = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/developer/resources"); // Reusing this for now or dedicated endpoint
            if (res.ok) {
                const data = await res.json();
                setDocs(data.knowledgeBases || []);
            }
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const fetchBuckets = async () => {
        try {
            const res = await fetch("/api/knowledge/buckets");
            if (res.ok) {
                const data = await res.json();
                setBuckets(data);
                if (data.length > 0 && !selectedBucket) setSelectedBucket(data[0]);
            }
        } catch (e) { console.error(e); }
    };

    const createBucket = async () => {
        if (!newBucketName.trim()) return;
        try {
            const res = await fetch("/api/knowledge/buckets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bucketName: newBucketName })
            });
            if (res.ok) {
                toast.success("Bucket created");
                setBuckets([...buckets, newBucketName]);
                setSelectedBucket(newBucketName);
                setIsCreatingBucket(false);
                setNewBucketName("");
            } else {
                toast.error("Failed to create bucket");
            }
        } catch (e) { console.error(e); }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !selectedBucket) {
            toast.error("Please select a file and a bucket");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucketName", selectedBucket);

        try {
            const res = await fetch("/api/knowledge/upload", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                toast.success("File uploaded and indexed successfully");
                setIsUploadOpen(false);
                setFile(null);
                fetchDocs();
            } else {
                const err = await res.json();
                toast.error(err.error || "Upload failed");
            }
        } catch (e) {
            console.error(e);
            toast.error("Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will remove the document and its embeddings.")) return;
        try {
            const res = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Document deleted");
                fetchDocs();
            } else {
                toast.error("Failed to delete");
            }
        } catch (e) { toast.error("Error deleting document"); }
    };

    return (
        <div className="p-8 space-y-8 h-full overflow-y-auto animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight drop-shadow-sm">Knowledge Base</h1>
                    <p className="text-slate-400 mt-2 text-lg font-light">
                        Manage documents and resources for your AI agents.
                    </p>
                </div>
                <Button onClick={() => setIsUploadOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                    <Upload className="w-4 h-4 mr-2" /> Upload Document
                </Button>
            </div>

            <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="text-slate-200">Documents</CardTitle>
                    <CardDescription>Files available for RAG (Retrieval Augmented Generation).</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-10 text-slate-500 animate-pulse">Loading documents...</div>
                    ) : docs.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            No documents found. Upload a PDF or Text file to get started.
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {docs.map((doc: any) => (
                                <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg bg-black/40 border border-white/5 hover:border-emerald-500/30 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-200">{doc.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className={`text-[10px] uppercase border-0 
                                                    ${doc.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        doc.status === 'processing' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
                                                            doc.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                                                                'bg-yellow-500/20 text-yellow-400'}`}>
                                                    {doc.status || 'Unknown'}
                                                </Badge>
                                                <span className="text-xs text-slate-500">ID: {doc.id.substring(0, 8)}...</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(doc.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-emerald-400">Upload to Knowledge Base</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Upload a text file or PDF. It will be stored in Minio and indexed for search.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Storage Bucket</label>
                            {!isCreatingBucket ? (
                                <div className="flex gap-2">
                                    <select
                                        className="flex-1 h-10 rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={selectedBucket}
                                        onChange={(e) => setSelectedBucket(e.target.value)}
                                    >
                                        <option value="" disabled>Select a bucket</option>
                                        {buckets.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                    <Button variant="outline" onClick={() => setIsCreatingBucket(true)}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="New Bucket Name"
                                        value={newBucketName}
                                        onChange={(e) => setNewBucketName(e.target.value)}
                                        className="bg-black/50 border-white/10 text-slate-200"
                                    />
                                    <Button onClick={createBucket} disabled={!newBucketName} size="sm" className="bg-emerald-600">Create</Button>
                                    <Button variant="ghost" onClick={() => setIsCreatingBucket(false)}>Cancel</Button>
                                </div>
                            )}
                        </div>

                        <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-emerald-500/50 transition-colors bg-white/5 cursor-pointer relative">
                            <input
                                type="file"
                                accept=".txt,.pdf,.md"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {file ? (
                                <div className="text-emerald-400 font-medium flex flex-col items-center">
                                    <FileText className="w-8 h-8 mb-2" />
                                    {file.name}
                                    <span className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(2)} KB</span>
                                </div>
                            ) : (
                                <div className="text-slate-400 flex flex-col items-center">
                                    <Upload className="w-8 h-8 mb-2" />
                                    <span className="text-sm">Click to browse or drag file here</span>
                                    <span className="text-xs text-slate-600 mt-1">Supports PDF, TXT, MD</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpload} disabled={!file || isUploading} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                            {isUploading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing...
                                </>
                            ) : "Upload & Index"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
