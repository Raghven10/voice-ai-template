import Image from "next/image";
import {UserButton} from "@clerk/nextjs";
import Link from "next/link";
import {AmbulanceIcon, BriefcaseMedical, HospitalIcon, Stethoscope, StethoscopeIcon} from "lucide-react";
import {IconMedicalCross, IconMedicalCrossCircle, IconReportMedical} from "@tabler/icons-react";

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
        href: "/profile",
    },
];

function AppHeader() {
    return (
        <div className="flex justify-between shadow py-4 items-center px-10 md:px-20 lg:px-40">
            {/*<Image src="/logo.svg" alt="Logo" width={220} height={120} />*/}
            <div className={`flex items-center text-2xl`}>
                <Stethoscope  className={`text-blue-600-400 font-bold text-4xl`}/>
                <h2 className="font-bold text-2xl px-5 text-blue-600">  Medical <span className={`text-purple-400`}>AI Voice Agent</span></h2>
            </div>

            <div className="hidden md:flex gap-12 items-center">
                {menuOptions.map((option, index) => (
                    <Link key={index} href={option.href}>
                        <h2 className="hover:font-bold">{option.name}</h2>
                    </Link>
                ))}
            </div>
            <UserButton />

        </div>
    )
}

export default AppHeader