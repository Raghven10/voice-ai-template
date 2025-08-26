import {Calendar, Home, Inbox, Search, Settings, Stethoscope} from "lucide-react"
import Image from "next/image";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import {ChatIcon} from "@livekit/components-react";

// Menu items.
const items = [
    {
        title: "New Query",
        url: "/playground",
        icon: ChatIcon,
    },
    {
        title: "Home",
        url: "/",
        icon: Home,
    },
    {
        title: "Dashboard",
        url: "/",
        icon: Home,
    },
    {
        title: "My Queries",
        url: "/dashboard/my-queries",
        icon: Inbox,
    },
    {
        title: "All Queries",
        url: "/admin/all-queries",
        icon: Inbox,
    },
    {
        title: "Search",
        url: "#",
        icon: Search,
    },
    {
        title: "Settings",
        url: "/admin/settings",
        icon: Settings,
    },
]

export function AppSidebar() {
    return (
        <Sidebar className={`bg-white items-center justify-center`}>
            <SidebarContent>
                <SidebarGroup>
                    <Image src={'/logo.jpg'} alt={'logo'} height={200} width={200} className={`m-auto shadow-sm bg-white bg-cover rounded-full p-2`}/>
                    <SidebarGroupLabel className={'mb-5 mt-4'}>

                        <h2 className="font-bold text-3xl px-5 text-blue-600">  AI <span className={`text-purple-400`}>Help Desk </span></h2>
                    </SidebarGroupLabel>
                    <SidebarGroupContent >
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title} className={`px-4 py-4 bold text-2xl gap-4  hover:bg-white hover:scale-125 rounded-md`}>
                                    <SidebarMenuButton asChild className={`font-semibold text-xl`}>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}