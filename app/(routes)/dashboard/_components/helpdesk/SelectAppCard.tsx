
import Image from "next/image";
import {Button} from "@/components/ui/button.tsx";
import {IconArrowRight} from "@tabler/icons-react";
import {doctorAgent} from "@/app/(routes)/dashboard/_components/medical/DoctorAgentCard.tsx";


type props = {
    doctorAgent: doctorAgent,
    setSelectedDoctor: any
    selectedDoctor: doctorAgent
}

function SuggestedDoctorCard({doctorAgent, setSelectedDoctor, selectedDoctor}:props) {
    return(
        <div className={`flex items-center flex-col border rounded-2xl shadow p-5 mt-5
        hover:border-blue-500 cursor-pointer ${selectedDoctor && selectedDoctor.id==doctorAgent.id && 'border-blue-500'}`} onClick={()=> setSelectedDoctor(doctorAgent)}>
            <Image src={doctorAgent.image} alt="doctor-image"
                   width={70} height={70}
                   className="rounded-full h-[50px] w-[50px] object-cover" />
            <h2 className="font-bold text-sm text-center">{doctorAgent.specialist}</h2>
            <p className="text-gray-500 text-xs line-clamp-2 text-center">
                {doctorAgent.description}
            </p>
        </div>
    )
}

export default SuggestedDoctorCard;