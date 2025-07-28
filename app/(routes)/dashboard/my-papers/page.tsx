import {ChartArea} from "lucide-react";
import PapersList from "@/app/(routes)/dashboard/my-papers/_components/PaperList";




function MayPapersPage() {
    return (
        <div className={`px-10 md:px-20 lg:px-10 py-10`}>
            <h2 className={`font-bold text-3xl mb-10`}>My Papers</h2>

            <div className={`flex flex-wrap justify-between gap-2`}>
                <div className={'shadow-lg hover:shadow-2xl border-2 border-accent p-2 w-1/2 rounded-md h-[300px]'}>Chart 1</div>
                <div className={'shadow-xl border-2 border-accent p-2 w-1/3 rounded-md'}>Chart 1</div>
            </div>

            <div className={'shadow'}>
                <PapersList />
            </div>

        </div>
    )
}

export default MayPapersPage;