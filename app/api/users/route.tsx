import {NextRequest, NextResponse} from "next/server";
import {currentUser} from "@clerk/nextjs/server";
import {db} from "@/db/db.tsx";
import {usersTable} from "@/config/schema";
import {eq} from "drizzle-orm";

export async function POST(req: NextRequest) {
    const user = await currentUser();

    // check if a user already exists, if not Create new user
    try{
        const users = await db.select().from(usersTable).where(eq(usersTable.email, user?.primaryEmailAddress?.emailAddress!));

        // if a user doesn't exist, create a new user
        if(users?.length == 0){

            // @ts-ignore
            const result= await db.insert(usersTable).values({
                // @ts-ignore
                name: user?.fullName,
                email: user?.primaryEmailAddress?.emailAddress,
                credits:10
                // @ts-ignore
            }).returning({usersTable})
            return NextResponse.json(result[0]?.usersTable)
        }
        return NextResponse.json(users[0])
    }catch (e){
        return NextResponse.json({message: e})
    }
}