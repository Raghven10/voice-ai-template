
import Link from "next/link";
import {SidebarTrigger} from "@/components/ui/sidebar";

const menuOptions = [
    {
        id:1,
        name: "Home",
        href: "/",
    },
    {
        id:2,
        name: "Dashboard",
        href: "/dashboard",
    },
    {
        id:3,
        name: "History",
        href: "/dashboard/history",
    },
    {
        id:4,
        name: "Pricing",
        href: "/dashboard/pricing",
    },
    {
        id:5,
        name: "Profile",
        href: "/dashboard/profile",
    },
];

function AppHeader() {
    return (
        <div className="flex justify-between shadow py-4 items-center md:px-0 lg:px-5 min-w-full">
            {/*<Image src="/logo.svg" alt="Logo" width={220} height={120} />*/}
            <div className={`flex items-center text-4xl`}>
                <SidebarTrigger />

            </div>

            <div className="hidden md:flex gap-12 items-center">
                {menuOptions.map((option, index) => (
                    <Link key={index} href={option.href}>
                        <h2 className="hover:font-bold font-semibold dark:text-white">{option.name}</h2>
                    </Link>
                ))}
            </div>


        </div>
    )
}

export default AppHeader