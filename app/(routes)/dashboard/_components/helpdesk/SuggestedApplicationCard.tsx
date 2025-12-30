import {agent} from "@/app/(routes)/dashboard/_components/helpdesk/AgentCard.tsx";
import Image from "next/image";

type Props = {
    agent: agent,
    setSelectedAgent: any,
    selectedAgent: agent,
}

function SuggestedApplicationCard({agent, setSelectedAgent,selectedAgent }: Props) {
    return (
        <div className={`flex items-center flex-col border rounded-2xl shadow p-5 mt-5
        hover:border-blue-500 cursor-pointer ${selectedAgent && selectedAgent.id==agent.id && 'border-blue-500'}`} onClick={()=> setSelectedAgent(agent)}>
            <Image src={agent.image} alt="appln-image"
                   width={70} height={70}
                   className="rounded-full h-[50px] w-[50px] object-cover" />
            <h2 className="font-bold text-sm text-center">{agent.name}</h2>
            <p className="text-gray-500 text-xs line-clamp-2 text-center">
                {agent.description}
            </p>
        </div>
    )
}

export default SuggestedApplicationCard;