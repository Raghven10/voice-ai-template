import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import {AppSidebar} from "@/app/(routes)/dashboard/_components/AppSidebar";
import AppHeader from "@/app/(routes)/dashboard/_components/AppHeader";


export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <div className={'w-full'}>
                <AppHeader/>

                {children}
            </div>
        </SidebarProvider>
    )
}