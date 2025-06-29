"use client";
import React, {useEffect, useState} from "react";
import Image from "next/image";
import {Button} from "@/components/ui/button";
import AddNewSessionDialog from "@/app/(routes)/dashboard/_components/AddNewSessionDialog";
import axios from "axios";
import HistoryTable from "@/app/(routes)/dashboard/_components/HistoryTable";


function HistoryList() {

    const [historyList, setHistoryList] = useState([]);
    useEffect(()=>{
        GetHistoryList();
    },[])
    const GetHistoryList = async () => {
        const result = await axios.get('/api/session-chat?sessionId=all');
        setHistoryList(result.data);
    }
    return (
        <div className="mt-10">
            { historyList.length > 0 ?

                <div>
                    <HistoryTable historyList={historyList} />
                </div>

                 :
                <div className="p-[1px] relative rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
                    <div className="flex items-center justify-center flex-col p-7 bg-white rounded-lg">
                        <Image src="/consult.png" alt="Logo" width={220} height={120} />
                        <h2 className="font-bold text-2xl mt-5">No Recent Consultations!</h2>
                        <p className="text-accent-foreground text-lg">
                            It seems you have no recent consultations.
                        </p>
                        <AddNewSessionDialog />
                    </div>
                </div>

            }
        </div>
    )
}

export default HistoryList;