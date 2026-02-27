"use client";

import { useEffect, useState } from "react";

interface Ticket {
    id: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
}

export default function TicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/tickets")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setTickets(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-8 text-[var(--color-primary)] animate-pulse">Loading Tickets...</div>;

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-8 neon-text tracking-wide">MY TICKETS</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tickets.map((ticket) => (
                    <div key={ticket.id} className="glass-card p-6 rounded-xl relative group">
                        <div className="absolute top-4 right-4">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${ticket.status === 'open' ? 'border-green-500/50 text-green-400 bg-green-500/10' :
                                    ticket.status === 'resolved' ? 'border-[var(--color-primary)]/50 text-[var(--color-primary)] bg-[var(--color-primary)]/10' :
                                        'border-gray-500/50 text-gray-400 bg-gray-500/10'
                                } uppercase tracking-wider shadow-[0_0_10px_rgba(0,0,0,0.5)]`}>
                                {ticket.status}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">{ticket.title}</h3>

                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                            <span className="flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${ticket.priority === 'high' ? 'bg-red-500 shadow-[0_0_8px_red]' :
                                        ticket.priority === 'medium' ? 'bg-yellow-500 shadow-[0_0_8px_yellow]' : 'bg-blue-500 shadow-[0_0_8px_blue]'
                                    }`} />
                                {ticket.priority}
                            </span>
                            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>

                        <a href={`/dashboard/tickets/${ticket.id}`} className="inline-block w-full text-center py-2 rounded-lg bg-white/5 hover:bg-[var(--color-primary)]/20 hover:text-[var(--color-primary)] border border-white/10 hover:border-[var(--color-primary)]/50 transition-all font-medium">
                            View Details
                        </a>
                    </div>
                ))}
            </div>

            {tickets.length === 0 && (
                <div className="glass-panel p-12 text-center text-gray-500 rounded-xl">
                    No tickets found.
                </div>
            )}
        </div>
    );
}
