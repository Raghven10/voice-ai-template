import {DevelopersList} from "@/shared/list";
import AppDeveloperCard from "@/app/(routes)/dashboard/_components/helpdesk/AppDeveloperCard";

function DeveloperList() {
    return (
        <div className="mt-10 flex gap-5 flex-col">
            <h2 className="font-bold text-xl">App Developers</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 ">
                <p>List of App Developers</p>
                {DevelopersList.map(item => (
                    <div key={item.id}>
                        <AppDeveloperCard appDeveloper={item} />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default DeveloperList;