import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

const client = new Anthropic();
const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";

type Content = Anthropic.Beta.Messages.BetaContentBlockParam[];

export async function askForJson<T extends z.ZodType>(opts: {
  system: string;
  content: Content;
  schema: T;
  effort?: "low" | "medium" | "high";
}): Promise<z.infer<T>> {
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: opts.system,
    output_config: {
      effort: opts.effort ?? "medium",
      format: betaZodOutputFormat(opts.schema),
    },
    messages: [{ role: "user", content: opts.content }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claude declined this request. Try rewording your answer or resume text.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("Claude's reply was cut off. Please try again.");
  }
  if (!response.parsed_output) {
    throw new Error("Claude returned an unexpected format. Please try again.");
  }
  return response.parsed_output as z.infer<T>;
}

export function describeError(err: unknown): { status: number; message: string } {
  if (err instanceof Anthropic.AuthenticationError) {
    return { status: 401, message: "Your ANTHROPIC_API_KEY is missing or invalid. Check the .env file." };
  }
  if (err instanceof Anthropic.RateLimitError) {
    return { status: 429, message: "Too many requests right now. Wait a minute and try again." };
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return { status: 502, message: "Couldn't reach the Claude API. Check your internet connection." };
  }
  if (err instanceof Anthropic.APIError) {
    return { status: err.status ?? 500, message: err.message };
  }
  if (err instanceof Error) return { status: 500, message: err.message };
  return { status: 500, message: "Something went wrong." };
}
