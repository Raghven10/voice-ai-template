"use client";
import { signIn, useSession } from "next-auth/react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Headset,
    Mic,
    Globe,
    Zap,
    Shield,
    BarChart3,
    Languages,
    BrainCircuit,
    Clock,
    ChevronDown,
} from "lucide-react";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "AI HelpDesk";
const COPYRIGHT = process.env.NEXT_PUBLIC_COPYRIGHT_TEXT ?? "© 2025 AI HelpDesk. Powered by LLM.";

const FEATURES = [
    {
        icon: <Mic className="h-7 w-7 text-indigo-600" />,
        title: "Voice-First Interface",
        desc: "Transform your support experience with our cutting-edge voice interface. Users can speak naturally in their preferred language to resolve issues instantly. Our AI seamlessly transcribes, understands intent, and acts on verbal commands without requiring any typing or complex navigation. Whether they are driving or multi-tasking, help is just a voice command away.",
    },
    {
        icon: <Languages className="h-7 w-7 text-indigo-600" />,
        title: "11 Indic Languages",
        desc: "Break down language barriers with native support for India's diverse linguistic landscape. Our application comes tightly integrated with advanced neuro-linguistic models for Hindi, Telugu, Tamil, Kannada, Malayalam, Gujarati, Punjabi, Odia, Marathi, Bengali, and English. Engage users in the language they understand best, ensuring higher satisfaction and dramatically fewer geographical support bottlenecks.",
    },
    {
        icon: <BrainCircuit className="h-7 w-7 text-indigo-600" />,
        title: "LLM-Powered Intelligence",
        desc: "At the core of AI Helpdesk is a massive context-aware Large Language Model layer. Not only does it hold fluent conversations, but it also executes internal tool calls dynamically. From scanning knowledge bases to identifying critical sentiment and routing high-severity issues to human supervisors, the AI acts as a genuinely intelligent first line of support for your entire organization.",
    },
    {
        icon: <Globe className="h-7 w-7 text-indigo-600" />,
        title: "100% Offline Capable",
        desc: "Deploy with absolute peace of mind regarding data privacy and infrastructure independence. Our entire Text-to-Speech (Piper) and Speech-to-Text (Whisper) pipeline can be hosted locally. Once configured, you have zero cloud dependency for core voice operations, meaning lower latency, zero external API costs, and complete compliance with strict on-premise security architectures.",
    },
    {
        icon: <Zap className="h-7 w-7 text-indigo-600" />,
        title: "Real-Time Transcription",
        desc: "Maintain perfect transparency and compliance with our live transcription engines. Every single word uttered by the user and responded to by the AI is transcribed and displayed live in the user interface. These automated logs create an instant, highly searchable audit trail for every support query, completely eliminating the need for manual note-taking and wrap-up time.",
    },
    {
        icon: <Shield className="h-7 w-7 text-indigo-600" />,
        title: "Secure & Role-Based",
        desc: "Built from the ground up for enterprise environments, access is federated through Keycloak SSO. Establish comprehensive granular role-based access control (RBAC) across your domains. Segregate end-users, agents, and administrators effortlessly so that sensitive ticketing backend features and knowledge base configurations remain strictly protected against unauthorized access.",
    },
    {
        icon: <BarChart3 className="h-7 w-7 text-indigo-600" />,
        title: "Automated Ticket Management",
        desc: "Say goodbye to scattered emails and lost support requests. The system automatically categorizes transcripts, extracts context, and generates tightly structured support tickets. Using semantic routing, issues are intelligently assigned priorities—such as marking infrastructure failures as 'High'—and then routed flawlessly to the correct department's queue without any human intervention required.",
    },
    {
        icon: <Clock className="h-7 w-7 text-indigo-600" />,
        title: "Available 24 × 7",
        desc: "Empower your business with perpetual uptime. There are no hold times, no shifting hours, and no frustrating queues. Whether it is a late-night critical failure or a weekend query, your AI helpdesk agent is perpetually online and ready. Handle infinite simultaneous conversations securely, scaling your support capacity phenomenally without the massive overhead of overnight staffing.",
    },
];

export default function Home() {
    const { data: session } = useSession();
    const router = useRouter();
    const featuresRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (session?.user) {
            router.push("/dashboard");
        }
    }, [session, router]);

    const handleConnect = () => {
        // If already logged in, push to dashboard (handled by useEffect above)
        // Otherwise trigger Keycloak login and redirect to dashboard after
        signIn("keycloak", { callbackUrl: "/dashboard" });
    };

    const scrollToFeatures = () => {
        featuresRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        // Force light background across the entire page regardless of OS/browser dark mode
        <div className="flex flex-col min-h-screen bg-white text-gray-900" style={{ colorScheme: "light" }}>
            {/* ── Navbar ─────────────────────────────────────────────────── */}
            <nav className="flex w-full items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <Headset className="h-7 w-7 text-indigo-600" />
                    <span className="text-xl font-bold text-gray-900">{APP_NAME}</span>
                </div>
                <button
                    onClick={handleConnect}
                    className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-95"
                >
                    Sign In
                </button>
            </nav>

            {/* ── Hero Section ───────────────────────────────────────────── */}
            <section className="flex flex-col items-center justify-center gap-8 px-4 py-20 text-center">
                {/* Animated headline */}
                <motion.h1
                    className="max-w-4xl text-4xl font-extrabold leading-tight text-gray-900 md:text-6xl lg:text-7xl"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    Enterprise Support,{" "}
                    <span className="text-indigo-600">Reimagined</span>{" "}
                    with Voice AI
                </motion.h1>

                {/* Sub-headline */}
                <motion.p
                    className="max-w-2xl text-lg text-gray-500 md:text-xl"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                >
                    Speak in <strong>any of 11 Indic or English languages</strong>. Our AI resolves queries,
                    raises tickets, and escalates issues — 24 × 7, fully offline-capable.
                </motion.p>

                {/* Hero image */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
                    className="rounded-2xl overflow-hidden max-w-sm w-full"
                >
                    <Image
                        src="/logo.jpg"
                        alt="AI Helpdesk assistant"
                        width={480}
                        height={480}
                        className="w-full object-cover"
                        priority
                    />
                </motion.div>

                {/* Single CTA */}
                <motion.div
                    className="flex flex-col items-center gap-4"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.55, ease: "easeOut" }}
                >
                    <button
                        onClick={handleConnect}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95"
                    >
                        <Headset className="h-5 w-5" />
                        Connect to AI Assistance
                    </button>
                    <p className="text-sm text-gray-400">Secure login required · End-to-end encrypted</p>
                </motion.div>

                {/* Scroll cue */}
                <motion.button
                    onClick={scrollToFeatures}
                    className="flex flex-col items-center gap-1 text-gray-400 hover:text-indigo-600 transition mt-4"
                    animate={{ y: [0, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    aria-label="Scroll to features"
                >
                    <span className="text-xs font-medium tracking-wide uppercase">See Features</span>
                    <ChevronDown className="h-5 w-5" />
                </motion.button>
            </section>

            {/* ── Features Section ───────────────────────────────────────── */}
            <section
                ref={featuresRef}
                className="bg-gray-50 py-20"
            >
                <div className="mx-auto w-full px-6 md:px-12 lg:px-24">
                    <div className="mb-14 text-center">
                        <motion.h2
                            className="text-3xl font-extrabold text-gray-900 md:text-4xl"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            Everything you need in one platform
                        </motion.h2>
                        <motion.p
                            className="mt-3 text-gray-500 text-lg"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.15 }}
                        >
                            Built for enterprises that value privacy, speed, and multilingual reach.
                        </motion.p>
                    </div>

                    <div className="grid gap-y-16 gap-x-0 md:grid-cols-2 w-full max-w-7xl mx-auto py-10">
                        {FEATURES.map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                className="relative flex flex-col max-w-lg mx-auto w-full aspect-[4/5] rounded-none p-10 lg:p-14 transition-all duration-300 ease-in-out bg-transparent border-[0.5px] border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-2xl hover:scale-[1.03] hover:z-10 cursor-pointer"
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: (i % 2) * 0.1 }}
                            >
                                <div className="flex flex-col gap-8 items-start h-full h-full">
                                    <div className="flex-shrink-0 flex h-20 w-20 lg:h-24 lg:w-24 items-center justify-center rounded-none bg-indigo-50">
                                        {feature.icon}
                                    </div>
                                    <div className="flex flex-col gap-6 mt-auto mb-auto">
                                        <h3 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">{feature.title}</h3>
                                        <p className="text-lg lg:text-xl text-gray-600 leading-relaxed font-medium">{feature.desc}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Banner ─────────────────────────────────────────────── */}
            <section className="bg-indigo-600 px-6 py-16 text-center">
                <motion.h2
                    className="text-3xl font-extrabold text-white md:text-4xl"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    Ready to transform your helpdesk?
                </motion.h2>
                <motion.p
                    className="mt-3 text-indigo-200 text-lg"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                >
                    Sign in and start your first voice conversation in under 30 seconds.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.25 }}
                    className="mt-8"
                >
                    <button
                        onClick={handleConnect}
                        className="rounded-xl bg-white px-8 py-4 text-lg font-bold text-indigo-600 shadow transition hover:bg-indigo-50 hover:-translate-y-0.5 active:scale-95"
                    >
                        Connect to AI Assistance
                    </button>
                </motion.div>
            </section>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <footer className="bg-white border-t border-gray-100 px-6 py-6 text-center text-sm text-gray-400">
                {COPYRIGHT}
            </footer>
        </div>
    );
}
