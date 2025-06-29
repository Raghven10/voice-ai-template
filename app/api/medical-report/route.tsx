import {NextRequest, NextResponse} from "next/server";

import {openai} from '@/config/openAIModel'
import {consultationTable} from "@/config/schema";
import {db} from "@/config/db";
import {eq} from "drizzle-orm";

const REPORT_TEMPLATE=`You are a medical AI agent that just finished a voice conversation between AI medical agent and user. 
Depends on doctor AI agent info and Conversation between AI Medical agent and user, return medical report  with the following fields in JSON only:
1. sessionId: A unique session identifier
2. agent: the medical specialist name (e.g., "General Physician AI")
3. user: name of the patient or "Anonymous" if not provided 
4. timestamp: current date and time in ISO format
5. chiefComplaint: one sentence summary of the patient's main health concern
6. summary: a 2-3 sentence summary of the conversation, symptoms and recommendations
7. symptoms: a list of symptoms mentioned by user
8. duration: how long the user has experienced the symptoms
9. severity: mild, moderate, severe
10. medicationsMentioned: list of any medications mentioned 
11. recommendations: list of AI suggestions (e.g., "Take a rest, drink water, see the doctor")
Return the medical report in JSON format only:
{
"sessionId": "string",
"agent": "string",
"user": "string",
"timestamp": "string",
"chiefComplaint": "string",
"summary": "string",
"symptoms": [],
"duration": "string",
"severity": "string",
"medicationsMentioned": [],
"recommendations": []
}
 Only include the valid fields as mentioned above. Respond with nothing else.
 
`


export async  function POST(req: NextRequest){
    const {sessionId, sessionDetail, messages} = await req.json();

    try {
        const UserInput = "AI Doctor Agent Info:" + JSON.stringify(sessionDetail) + "Conversation: "+ JSON.stringify(messages);
        const completion = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {role: "system", content: REPORT_TEMPLATE},
                {role: "user", content: UserInput }
            ],
        });

        const rawResp = completion.choices[0].message;

        //@ts-ignore
        const Resp = rawResp.content.trim().replace('```json','').replace('```','');
        const JSONResp = JSON.parse(Resp);

        // Save to database
        const result = await db.update(consultationTable).set({
            report: JSONResp,
            conversation: messages

        }).where(eq(consultationTable.sessionId, sessionId));

        return NextResponse.json(JSONResp);
    }catch (e){
        return NextResponse.json({message: e})
    }
}