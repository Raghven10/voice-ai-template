import DeveloperList from "@/app/(routes)/dashboard/_components/helpdesk/DeveloperList.tsx";


function DeveloperPage() {
    return (
        <div className={`bg-gray-100 flex flex-col items-center justify-center m-5 px-4`}>
            <DeveloperList />
        </div>
    )
}

export default DeveloperPage;