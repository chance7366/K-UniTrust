export type AiStatus = "connected" | "idle" | "error";

export function resolveAiStatus(): AiStatus {
  if (process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY) {
    return "connected";
  }
  return "idle";
}
