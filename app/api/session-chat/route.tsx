import {NextRequest, NextResponse} from "next/server";
import {db} from "@/config/db";
import {consultationTable} from "@/config/schema";
import {currentUser} from "@clerk/nextjs/server";
import {v4 as uuid4} from "uuid";
import {desc, eq} from "drizzle-orm";

export async function POST(req: NextRequest) {
    try{
        const {notes, selectedDoctor} = await req.json();
        const user = await currentUser();
        const sessionId = uuid4();
        console.log("user:", user)

        const result = await db.insert(consultationTable).values({
            // @ts-ignore
            sessionId: sessionId,
            notes: notes,
            selectedDoctor: selectedDoctor,
            createdAt: (new Date()).toString(),
            createdBy: user?.primaryEmailAddress?.emailAddress,
            // @ts-ignore
        }).returning({consultationTable})
        return NextResponse.json(result[0]?.consultationTable)
    }
    catch (e){
        return NextResponse.json({message: e})
    }
}

export async function GET(req: NextRequest) {
    const {searchParams} = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const user = await currentUser();

   if(sessionId=='all') {
       const result = await db.select()
           .from(consultationTable)
           //@ts-ignore
           .where(eq(consultationTable.createdBy, user?.primaryEmailAddress?.emailAddress))
           .orderBy(desc(consultationTable.id));

            console.log(result);
       return NextResponse.json(result)
   }else {
       const result = await db.select()
           .from(consultationTable)
           //@ts-ignore
           .where(eq(consultationTable.sessionId, sessionId));
       return NextResponse.json(result)
   }



}