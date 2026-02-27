"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import moment from "moment";

export default function NotificationsPage() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            const data = await res.json();
            if (Array.isArray(data)) {
                setNotifications(data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) fetchNotifications();
    }, [session]);

    const markAsRead = async (id?: string) => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                body: JSON.stringify({ id, isRead: true })
            });
            if (id) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            } else {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            }
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "success": return <CheckCircle className="w-5 h-5 text-green-400" />;
            case "warning": return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
            case "error": return <XCircle className="w-5 h-5 text-red-400" />;
            default: return <Info className="w-5 h-5 text-blue-400" />;
        }
    };

    if (loading) return <div className="p-8">Loading notifications...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)] mb-2 uppercase">
                        Center <span className="text-[var(--color-primary)]">Notifications</span>
                    </h1>
                    <p className="text-[var(--muted-foreground)] text-lg">Stay updated with ticket assignments and system alerts.</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => markAsRead()}
                    className="border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--foreground)]/5 font-bold uppercase text-xs"
                >
                    Mark all as read
                </Button>
            </header>

            <Card className="bg-[var(--card)]/30 backdrop-blur-xl border-[var(--border)] overflow-hidden">
                <CardHeader className="border-b border-[var(--border)] bg-[var(--foreground)]/[0.02]">
                    <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-[var(--color-primary)]" />
                        <CardTitle>Recent Activity</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                        {notifications.length === 0 ? (
                            <div className="p-12 text-center text-[var(--muted-foreground)] uppercase tracking-widest font-bold opacity-50">
                                No Notifications
                            </div>
                        ) : (
                            <div className="divide-y divide-[var(--border)]">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`p-6 transition-colors flex gap-6 items-start ${!notif.isRead ? 'bg-[var(--color-primary)]/[0.03]' : 'hover:bg-[var(--foreground)]/[0.02]'}`}
                                    >
                                        <div className="pt-1">
                                            {getTypeIcon(notif.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className={`text-lg font-bold ${!notif.isRead ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>
                                                    {notif.title}
                                                </h3>
                                                <span className="text-xs text-[var(--muted-foreground)] uppercase font-medium">
                                                    {moment(notif.createdAt).fromNow()}
                                                </span>
                                            </div>
                                            <p className={`text-sm leading-relaxed mb-4 ${!notif.isRead ? 'text-[var(--foreground)]/80' : 'text-[var(--muted-foreground)]'}`}>
                                                {notif.message}
                                            </p>
                                            {!notif.isRead && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => markAsRead(notif.id)}
                                                    className="text-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 p-0 h-auto font-bold uppercase text-[10px] tracking-widest"
                                                >
                                                    Mark as read
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
