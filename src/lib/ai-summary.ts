import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateBillSummary(
  title: string,
  description: string,
  actions: string[],
  state: string | null
): Promise<string> {
  const jurisdiction = state ? `${state} state` : "federal";
  const recentActions = actions.slice(0, 5).join("\n- ");

  const prompt = `You are a nonpartisan legislative analyst helping everyday Americans understand government legislation.

Please write a clear, plain-English summary of the following ${jurisdiction} bill. Your summary should:
- Be 2-4 paragraphs long
- Explain what the bill does in simple terms anyone can understand
- Describe who it affects and how
- Be completely neutral — no political spin or opinion
- Avoid legal jargon; use everyday language

Bill Title: ${title}

Description: ${description || "No official description provided."}

Recent Legislative Actions:
- ${recentActions || "No actions recorded yet."}

Write your plain-English summary:`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Anthropic API");
  }

  return content.text.trim();
}

export async function generateBillTeaser(title: string, summary: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: `Write ONE sentence (under 20 words) summarizing this bill for a card preview. Be specific and factual. No opinion.

Bill: ${title}
Summary: ${summary.slice(0, 500)}

One sentence:`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") return title;
  return content.text.trim();
}
