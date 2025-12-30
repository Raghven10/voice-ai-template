"use client";
import React, {useEffect, useState} from "react";
import Image from "next/image";
import {Button} from "@/components/ui/button.tsx";
import AddNewSessionDialog from "@/app/(routes)/dashboard/_components/medical/AddNewSessionDialog.tsx";
import axios from "axios";
import HistoryTable from "@/app/(routes)/dashboard/_components/common/HistoryTable.tsx";


function HistoryList() {

    const [historyList, setHistoryList] = useState([]);
    useEffect(()=>{
        GetHistoryList()
    },[])
    const GetHistoryList = async () => {
        const result = await axios.get('/api/session-chat?sessionId=all');
        console.log("all sessions: ", result);
        setHistoryList(result.data);
    }
    return (
        <div className="m-10 ">
            { historyList.length > 0 ?

                <div className={`m-4 border-2 shadow-xl`}>
                    <HistoryTable historyList={historyList} />
                </div>

                 :
                <div className="p-[1px] relative rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 lg:mx-40 md:mx-20 my-10 sm:m-4">
                    <div className="flex items-center justify-center flex-col p-7 bg-white rounded-lg">
                        <Image src="/consult.png" alt="Logo" width={220} height={120} />
                        <h2 className="font-bold text-2xl mt-5">No Tickets Raised!</h2>
                        <p className="text-accent-foreground text-lg">
                            It seems you have no tickets raised till now.
                        </p>
                        <AddNewSessionDialog />
                    </div>
                </div>

            }
        </div>
    )
}

export default HistoryList;