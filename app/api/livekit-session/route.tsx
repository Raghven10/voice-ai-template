import {NextRequest, NextResponse} from "next/server";
import {db} from "@/db/db.ts";
import { getServerSession } from "next-auth";
import {v4 as uuid4} from "uuid";
import {desc, eq} from "drizzle-orm";
import {authOptions} from "@/app/api/auth/[...nextauth]/route.tsx";
import {sessionTable} from "@/db/schema.ts";

export async function POST(req: NextRequest) {
    try{
        const {notes, selectedAgent} = await req.json();
        const session = await getServerSession(authOptions);
        const sessionId = uuid4().toString();
        console.log("session :", session)
        const user = session?.user
        console.log("user:", user)

        //@ts-ignore
        const result = await db.insert(sessionTable).values({
            // @ts-ignore
            sessionId: sessionId!,
            notes: notes,
            selectedAgent: selectedAgent,
            createdAt: (new Date()).toString(),
            createdBy: user?.id,
                        // @ts-ignore
        }).returning({sessionTable})
        return NextResponse.json(result[0]?.sessionTable)
    }
    catch (e){
        return NextResponse.json({message: e})
    }
}

export async function GET(req: NextRequest) {
    const {searchParams} = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const session = await getServerSession(authOptions);
    const user = session?.user

   if(sessionId=='all') {
       const result = await db.select()
           .from(sessionTable)
           //@ts-ignore
           .where(eq(sessionTable.createdBy, user?.id))
           .orderBy(desc(sessionTable.id));

            console.log(result);
       return NextResponse.json(result)
   }else {
       const result = await db.select()
           .from(sessionTable)
           //@ts-ignore
           .where(eq(sessionTable.sessionId, sessionId));
       return NextResponse.json(result)
   }



}