
"use client";
import { signIn, signOut, useSession } from "next-auth/react"
import { motion } from "motion/react";
import {FlowBentoGrid} from "@/app/_components/BentoGrid";

import {Button} from "@/components/ui/button";
import Link from "next/link";
import { Headset} from "lucide-react";
import Image from "next/image";

export default function Home() {
    const { data: session } = useSession()


    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />

            <div className="m-auto text-center">
                <h1 className="z-10 mx-auto max-w-4xl text-center text-2xl font-bold text-pink-600 md:text-4xl lg:text-7xl dark:text-slate-300 shimmer">
                    {"Welcome to AI HelpDesk"
                        .split(" ")
                        .map((word, index) => (
                            <motion.span
                                key={index}
                                initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                                transition={{
                                    duration: 0.3,
                                    delay: index * 0.1,
                                    ease: "easeInOut",
                                }}
                                className="mr-2 inline-block"
                            >
                                {word}
                            </motion.span>
                        ))}
                </h1>
                <motion.p
                    initial={{
                        opacity: 0,
                    }}
                    animate={{
                        opacity: 1,
                    }}
                    transition={{
                        duration: 0.3,
                        delay: 0.8,
                    }}
                    className="relative z-10 mx-auto max-w-xl py-4 text-center text-xl font-semibold text-teal-500 dark:text-neutral-200"
                >
                    Meet our latest <span className={'text-purple-600 text-2xl'}>AI based </span>  <span className={'text-purple-600 text-2xl'}> voice assistant</span>  available 24*7 to
                    resolve all your Helpdesk related queries.
                </motion.p>
                <motion.div
                    initial={{
                        opacity: 0,
                    }}
                    animate={{
                        opacity: 1,
                    }}
                    transition={{
                        duration: 0.3,
                        delay: 1,
                    }}
                    className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4">
                    <Image src={ '/logo.jpg'} alt={'customer care'} height={400} width={400} />

                </motion.div>
                <motion.div
                    initial={{
                        opacity: 0,
                    }}
                    animate={{
                        opacity: 1,
                    }}
                    transition={{
                        duration: 0.3,
                        delay: 1,
                    }}
                    className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4"
                >
                    <Link
                        className="w-40 transform rounded-lg text-center bg-red-400 px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                        href={"/playground"}>
                        Connect Now
                    </Link>

                    <Link
                        className="w-40 transform rounded-lg text-center bg-cyan-400 px-2 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                        href={"/dashboard"}>
                        Dashboard
                    </Link>

                </motion.div>

            </div>

            <footer className="flex items-center justify-center sticky-top relative p-5">
                <h2 className="font-bold text-2xl px-5 text-pink-600"> Copyright 2025 @ RK Jha <span className={`text-cyan-400 text-lg font-light`}> powered by LLM</span></h2>
            </footer>

        </div>


    );
}

const Navbar = () => {
    const { data: session } = useSession()

    return (
        <nav className="flex w-full items-center justify-between border-t border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
            <div className={`flex items-center text-2xl`}>
                <Headset  className={`text-blue-600-400 font-bold text-4xl`}/>
                <h2 className="font-bold text-2xl px-5 text-pink-600">  AI HelpDesk </h2>
            </div>

            <div className={`flex items-center`}>
                {session?.user?.email ?
                    <div className={`flex gap-2`}>
                        <p>Signed in as {session?.user?.email}</p>
                        <button onClick={() => signOut()}>Sign out</button>
                    </div>
                     :
                    <button onClick={() => signIn("keycloak")}>Sign In</button>
                }
            </div>


        </nav>
    );
};
