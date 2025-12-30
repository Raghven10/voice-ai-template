import {NextRequest, NextResponse} from "next/server";
import {openai} from "@/config/openAIModel.tsx";
import {AIApplicationAgents} from "@/shared/app_list.tsx";

export async function POST(req: NextRequest){
    const {notes} = await req.json();
    const userPrompt = "User Notes: " + notes + ", Depends on  user notes, suggest list of applications, return only list of object in json format, return nothing else."
    try {
        const completion = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {role: "system", content: JSON.stringify(AIApplicationAgents)},
                {role: "user", content: userPrompt},
            ]
        })
        const rawResp = completion.choices[0].message;
        const resp = rawResp.content?.trim().replace('```json','').replace('```','');
        const JSONResp = JSON.parse(resp as string)

        return NextResponse.json(JSONResp);
    }
    catch (e) {
        return NextResponse.json({message: e});

    }
}