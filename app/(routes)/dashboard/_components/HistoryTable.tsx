import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {SessionDetail} from "@/app/(routes)/dashboard/medical-agent/[sessionId]/page";
import moment from "moment";
import {ViewReportDialog} from "@/app/(routes)/dashboard/_components/ViewReportDialog";

type Props = {
    historyList: SessionDetail[]
}

function HistoryTable({historyList}: Props) {
    return (
        <Table>
            <TableCaption>Previous Consultation Reports</TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead>AI Specialist</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {historyList.map((history, index) => (
                    <TableRow>
                        <TableCell className="font-medium">{history?.selectedDoctor?.specialist}</TableCell>
                        <TableCell>{history?.notes}</TableCell>
                        <TableCell>{ moment(new Date(history?.createdAt)).fromNow()}</TableCell>
                        <TableCell className="text-right">
                            <ViewReportDialog record={history}/>
                        </TableCell>
                    </TableRow>
                ))}

            </TableBody>
        </Table>
    )
}

export default HistoryTable;