"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false); // ideally fetch from session

  useEffect(() => {
    // Fetch Ticket
    fetch(`/api/tickets/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        setTicket(data);
        setLoading(false);
      })
      .catch(() => router.push("/dashboard/tickets"));

    // Check if staff (simple check, ideally use useSession)
    // For MVP transparency:
    fetch("/api/auth/session").then(r => r.json()).then(s => {
      if (["sysadmin", "developer", "executive"].includes(s?.user?.role)) {
        setIsStaff(true);
      }
    });
  }, [params.id, router]);

  const updateStatus = async (newStatus: string) => {
    await fetch(`/api/tickets/${params.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });
    setTicket({ ...ticket, status: newStatus });
  };

  if (loading || !ticket) return <div className="p-8 text-[var(--color-primary)] animate-pulse">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 neon-text text-white">{ticket.title}</h1>
          <p className="text-gray-400 font-mono text-sm">Created by: <span className="text-white">{ticket.createdByUserId}</span> on {new Date(ticket.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-3">
          <span className="px-4 py-1.5 rounded-full border border-[var(--color-primary)]/30 text-[var(--color-primary)] bg-[var(--color-primary)]/5 font-bold uppercase tracking-wider text-xs shadow-[0_0_10px_rgba(0,243,255,0.2)]">
            {ticket.status}
          </span>
          <span className="px-4 py-1.5 rounded-full border border-white/20 text-gray-300 bg-white/5 font-bold uppercase tracking-wider text-xs">
            {ticket.priority}
          </span>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-2xl mb-8 min-h-[200px] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-50" />
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Description</h3>
        <p className="whitespace-pre-wrap text-gray-200 leading-relaxed text-lg">{ticket.description}</p>
      </div>

      {isStaff && (
        <div className="glass-card p-6 rounded-xl border border-[var(--color-secondary)]/30 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-[var(--color-secondary)] opacity-10 blur-[50px] rounded-full pointer-events-none" />
          <h3 className="font-bold mb-4 text-[var(--color-secondary)] uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-secondary)] animate-pulse" /> Admin Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => updateStatus("in_progress")} className="px-6 py-2.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/50 rounded-lg hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all font-medium uppercase text-xs tracking-wider">Mark In Progress</button>
            <button onClick={() => updateStatus("resolved")} className="px-6 py-2.5 bg-green-600/20 hover:bg-green-600/40 text-green-300 border border-green-500/50 rounded-lg hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all font-medium uppercase text-xs tracking-wider">Resolve</button>
            <button onClick={() => updateStatus("closed")} className="px-6 py-2.5 bg-gray-600/20 hover:bg-gray-600/40 text-gray-300 border border-gray-500/50 rounded-lg hover:shadow-[0_0_15px_rgba(107,114,128,0.3)] transition-all font-medium uppercase text-xs tracking-wider">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
