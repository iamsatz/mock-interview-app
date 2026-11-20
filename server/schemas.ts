import { z } from "zod";

export const Profile = z.object({
  name: z.string(),
  headline: z.string(),
  yearsOfExperience: z.number(),
  skills: z.array(z.string()),
  highlights: z.array(z.string()),
  suggestedRoles: z.array(z.string()),
});

export const QuestionSet = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      focus: z.string(),
      whatGoodLooksLike: z.string(),
    }),
  ),
});

export const Feedback = z.object({
  score: z.number(),
  verdict: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  strongerAnswer: z.string(),
});

export const Rounds = ["screening", "technical", "behavioral"] as const;
export type Round = (typeof Rounds)[number];
