import * as agents from '@livekit/agents';
import { llm, voice } from '@livekit/agents';

console.log("Agents exports:", Object.keys(agents));
console.log("LLM exports:", Object.keys(llm));
console.log("Voice exports:", Object.keys(voice));

const session = new voice.AgentSession({} as any);
console.log("AgentSession prototype:", Object.getOwnPropertyNames(Object.getPrototypeOf(session)));
