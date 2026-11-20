const TAVUS_URL = "https://tavusapi.com/v2/conversations";

export function tavusEnabled() {
  return Boolean(process.env.TAVUS_API_KEY && process.env.TAVUS_REPLICA_ID);
}

export async function createTavusConversation(input: {
  round: string;
  role: string;
  questions: string[];
  candidateName: string;
}): Promise<{ conversationUrl: string; conversationId: string }> {
  if (!tavusEnabled()) {
    throw new Error("Video interviewer is off. Add TAVUS_API_KEY and TAVUS_REPLICA_ID to .env to turn it on.");
  }

  const context = `You are interviewing ${input.candidateName} for a ${input.role} role. This is the ${input.round} round. Ask these questions one at a time, listen fully, ask one short follow-up when an answer is vague, then move on:\n${input.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`;

  const res = await fetch(TAVUS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.TAVUS_API_KEY! },
    body: JSON.stringify({
      replica_id: process.env.TAVUS_REPLICA_ID,
      persona_id: process.env.TAVUS_PERSONA_ID || undefined,
      conversation_name: `Mock ${input.round} interview`,
      conversational_context: context,
      custom_greeting: `Hi ${input.candidateName}, thanks for joining. Ready to start?`,
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavus returned ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { conversation_url: string; conversation_id: string };
  return { conversationUrl: data.conversation_url, conversationId: data.conversation_id };
}
