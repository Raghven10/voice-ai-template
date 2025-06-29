import {AIDoctorAgents} from "@/shared/list";
import DoctorAgentCard from "@/app/(routes)/dashboard/_components/DoctorAgentCard";

function DoctorsAgentList() {
    return (
        <div className="mt-10 flex gap-5 flex-col">
            <h2 className="font-bold text-xl">AI Doctor Agents</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 ">
                {AIDoctorAgents.map((doctor, index) => (
                    <div key={index} >
                        <DoctorAgentCard doctorAgent={doctor} />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default DoctorsAgentList;