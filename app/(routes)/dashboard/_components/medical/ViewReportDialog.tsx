import { Button } from "@/components/ui/button.tsx"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog.tsx"
import {SessionDetail} from "@/app/(routes)/medical/medical-agent/[sessionId]/page.tsx";
import moment from "moment";

type Props = {
    record: SessionDetail;
}
export function ViewReportDialog({record}:Props) {
    return (
        <Dialog>
                <DialogTrigger asChild>
                    <Button variant="ghost">View Report</Button>
                </DialogTrigger>
                <DialogContent className="md:max-w-[550px] lg:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            <h2 className={`text-center text-blue-500 font-bold text-xl`}>Medical AI Voice Agent Report </h2>
                            <p className={`text-xs font-medium text-gray-400 mt-2 text-center`}>ID: {record.sessionId}</p>
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className={`mt-5`}>
                                <h2 className={`font-bold text-blue-500 text-lg `}>Conversation Info:</h2>
                                <hr className={`font-bold text-blue-500 mb-5 bg-green-400`}/>
                                <div className={`mt-5 mb-5 grid grid-cols-2`}>
                                    <div className={`flex`}>
                                        <h2><span className={`font-bold`}>Specialisation:</span> {record?.selectedDoctor?.specialist}</h2>
                                    </div>
                                    <div className={`flex`}>
                                        <h2><span className={`font-bold`}>User:</span> {record?.createdBy || 'Anonymous'}</h2>
                                    </div>

                                    <div className={`flex`}>
                                        <h2><span className={`font-bold`}>Consultation On:</span> {moment(new Date(record?.createdAt)).fromNow()} </h2>
                                    </div>
                                    <div className={`flex`}>
                                        <h2><span className={`font-bold`}>Agent:</span> {record?.selectedDoctor?.voiceId} </h2>
                                    </div>
                                </div>


                                <h2 className={`font-bold text-blue-500 text-lg `}>Chief Complaint:</h2>
                                <hr className={`font-bold text-blue-500 mb-5`}/>
                                <div className={`mt-5 mb-5 grid`}>
                                    <div className={`flex`}>
                                        <h2>User reports <span className={`font-bold`}>{record?.notes}</span> </h2>
                                    </div>
                                </div>


                                {/*<h2 className={`font-bold text-blue-500 text-lg `}>Summary:</h2>*/}
                                {/*<hr className={`font-bold text-blue-500 mb-5`}/>*/}
                                {/*<div className={`mt-5 mb-5 grid grid-cols-2`}>*/}
                                {/*    <div className={`flex`}>*/}
                                {/*        <h2>{record?.report?.summary || 'N/A'}</h2>*/}
                                {/*    </div>*/}
                                {/*</div>*/}


                                {/*<h2 className={`font-bold text-blue-500 text-lg `}>Symptoms:</h2>*/}
                                {/*<hr className={`font-bold text-blue-500 mb-5`}/>*/}
                                {/*<div className={`mt-5 mb-5 grid grid-cols-2`}>*/}
                                {/*    <div className={`flex`}>*/}
                                {/*        <h2>{record?.report?.symptoms || 'N/A'}</h2>*/}
                                {/*    </div>*/}
                                {/*</div>*/}


                                {/*<h2 className={`font-bold text-blue-500 text-lg `}>Duration and Severity:</h2>*/}
                                {/*<hr className={`font-bold text-blue-500 mb-5`}/>*/}
                                {/*<div className={`mt-5 mb-5 grid grid-cols-2`}>*/}
                                {/*    <div className={`flex`}>*/}
                                {/*        <h2><span className={`font-bold`}>Duration:</span> {record?.report?.duration || 'Not Specified'}</h2>*/}
                                {/*    </div>*/}
                                {/*    <div className={`flex`}>*/}
                                {/*        <h2><span className={`font-bold`}>Severity:</span> {record?.report?.severity || 'Not Specified'}</h2>*/}
                                {/*    </div>*/}
                                {/*</div>*/}

                                {/*<h2 className={`font-bold text-blue-500 text-lg `}>Medications Mentioned:</h2>*/}
                                {/*<hr className={`font-bold text-blue-500 mb-5`}/>*/}
                                {/*<div className={`mt-5 mb-5 grid grid-cols-2`}>*/}
                                {/*    <div className={`flex`}>*/}
                                {/*        <h2>{record?.report?.medications || 'N/A'}</h2>*/}
                                {/*    </div>*/}
                                {/*</div>*/}

                                {/*<h2 className={`font-bold text-blue-500 text-lg `}>Recommendations:</h2>*/}
                                {/*<hr className={`font-bold text-blue-500 mb-5`}/>*/}
                                {/*<div className={`mt-5 mb-5 grid grid-cols-2`}>*/}
                                {/*    <div className={`flex`}>*/}
                                {/*        <h2>{record?.report?.recommendation || 'N/A'}</h2>*/}
                                {/*    </div>*/}
                                {/*</div>*/}

                                <hr className={`font-bold text-blue-500 mb-2`}/>
                                <h2 className={`text-sm italic text-muted font-bold`}>Note: This report was generated by an AI Medical agent for informational purpose only.</h2>
                                <hr className={`font-bold text-blue-500 mt-2`}/>
                            </div>

                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>

        </Dialog>
    )
}