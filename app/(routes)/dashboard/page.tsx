"use client"
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import AdminDashboard from "./_components/AdminDashboard.tsx";
import UserDashboard from "./_components/UserDashboard.tsx";

function DashboardContainer() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin h-10 w-10 text-pink-600" />
            </div>
        );
    }

    // Default to 'user' if role isn't explicitly set in session
    const userRole = (session?.user as any)?.role || "user";

    if (userRole === "user") {
        return <UserDashboard />;
    }

    // Admin, sysadmin, developer, dev_manager, etc.
    return <AdminDashboard />;
}

export default DashboardContainer;