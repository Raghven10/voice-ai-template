
import AddNewSessionDialog from "@/app/(routes)/dashboard/_components/AddNewSessionDialog";

function Dashboard() {
    return (

            <main className="flex items-center justify-between p-5">
                <h2 className="font-bold text-2xl">My Dashboard</h2>
                <AddNewSessionDialog />
            </main>
    )
}

export default Dashboard