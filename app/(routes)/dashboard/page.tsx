"use client"

import AddNewSessionDialog from "@/app/(routes)/dashboard/_components/AddNewSessionDialog";
import {Button} from "@/components/ui/button.tsx";
import {useRouter} from "next/navigation";

function Dashboard() {

    const route = useRouter();
    const navigateToDashboard = ()=> {
        route.push("/playground");
    }
    return (

            <main className="flex items-center justify-between p-5">
                <h2 className="font-bold text-2xl">My Dashboard</h2>
                {/*<AddNewSessionDialog />*/}
                <Button onClick={navigateToDashboard}> Connect Now</Button>
            </main>
    )
}

export default Dashboard