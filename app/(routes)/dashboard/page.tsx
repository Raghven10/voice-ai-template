import HistoryList from "@/app/(routes)/dashboard/_components/HistoryList";
import {Button} from "@/components/ui/button";
import DoctorsAgentList from "@/app/(routes)/dashboard/_components/DoctorsAgentList";
import AddNewSessionDialog from "@/app/(routes)/dashboard/_components/AddNewSessionDialog";

function Dashboard() {
    return (
        <div>

            <div className="flex items-center justify-between">
                <h2 className="font-bold text-2xl">My Dashboard</h2>
                <AddNewSessionDialog />
            </div>
            <HistoryList />
            <DoctorsAgentList />
        </div>
    )
}

export default Dashboard