
"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format } from "timeago.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    createdAt: string;
    isRead: boolean;
}

export function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        // Connect to SSE endpoint
        const eventSource = new EventSource("/api/notifications/stream");

        eventSource.onmessage = (event) => {
            try {
                // Heartbeat check
                if (event.data === ": heartbeat") return;

                const newNotification = JSON.parse(event.data);

                // Add to list
                setNotifications((prev) => [newNotification, ...prev]);
                setUnreadCount((prev) => prev + 1);

                // Show toast
                toast(newNotification.title, {
                    description: newNotification.message,
                });
            } catch (error) {
                console.error("Error parsing notification:", error);
            }
        };

        eventSource.onerror = (err) => {
            console.error("SSE Error:", err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);


    return (
        <Popover>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <div className="relative cursor-pointer p-2 hover:bg-accent rounded-full transition-colors">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            )}
                        </div>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Notifications</p>
                </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No new notifications
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notif, i) => (
                                <div
                                    key={i} // using index as key for stream items if id duplicates
                                    className="p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                                >
                                    <div className="flex justify-between gap-2 mb-1">
                                        <span className="font-medium text-sm">{notif.title}</span>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {format(notif.createdAt || new Date())}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {notif.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
