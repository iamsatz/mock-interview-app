import type { Feedback, Profile, QuestionItem, Round } from "./types";

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export const api = {
  config: () =>
    fetch("/api/config")
      .then((r) => r.json() as Promise<{ claudeReady: boolean; tavusEnabled: boolean }>)
      .catch(() => ({ claudeReady: false, tavusEnabled: false })),
  profile: (input: { resumeText?: string; pdfBase64?: string }) => post<Profile>("/api/profile", input),
  questions: (input: { profile: Profile; role: string; round: Round; count: number; notes?: string }) =>
    post<{ questions: QuestionItem[] }>("/api/questions", input),
  score: (input: { profile: Profile; role: string; round: Round; question: string; answer: string }) =>
    post<Feedback>("/api/score", input),
  tavus: (input: { round: string; role: string; questions: string[]; candidateName: string }) =>
    post<{ conversationUrl: string; conversationId: string }>("/api/tavus/conversation", input),
};

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
