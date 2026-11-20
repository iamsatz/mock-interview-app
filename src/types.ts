export type Round = "screening" | "technical" | "behavioral";

export interface Profile {
  name: string;
  headline: string;
  yearsOfExperience: number;
  skills: string[];
  highlights: string[];
  suggestedRoles: string[];
}

export interface Feedback {
  score: number;
  verdict: string;
  strengths: string[];
  improvements: string[];
  strongerAnswer: string;
}

export interface QuestionItem {
  question: string;
  focus: string;
  whatGoodLooksLike: string;
  answer?: string;
  feedback?: Feedback;
}

export interface Session {
  id: string;
  createdAt: string;
  round: Round;
  role: string;
  questions: QuestionItem[];
  finished: boolean;
}

export const ROUNDS: { id: Round; label: string; blurb: string; icon: string }[] = [
  { id: "screening", label: "Screening", blurb: "Recruiter call. Your story, motivation and fit.", icon: "☎" },
  { id: "technical", label: "Technical", blurb: "Hiring manager. Depth in your craft and past work.", icon: "⚙" },
  { id: "behavioral", label: "Behavioral", blurb: "Real situations, answered with STAR.", icon: "◎" },
];
