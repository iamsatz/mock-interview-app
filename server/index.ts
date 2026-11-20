import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { askForJson, describeError } from "./claude.js";
import { Feedback, Profile, QuestionSet, Rounds } from "./schemas.js";
import { PROFILE_SYSTEM, questionSystem, scoreSystem } from "./prompts.js";
import { createTavusConversation, tavusEnabled } from "./tavus.js";

const app = express();
app.use(express.json({ limit: "15mb" }));

const ProfileInput = Profile.extend({}).partial();

app.get("/api/config", (_req, res) => {
  res.json({ claudeReady: Boolean(process.env.ANTHROPIC_API_KEY), tavusEnabled: tavusEnabled() });
});

app.post("/api/profile", async (req, res) => {
  try {
    const body = z
      .object({ resumeText: z.string().optional(), pdfBase64: z.string().optional() })
      .parse(req.body);
    if (!body.resumeText?.trim() && !body.pdfBase64) {
      return res.status(400).json({ error: "Add a PDF or paste your resume text." });
    }
    const content = body.pdfBase64
      ? [
          {
            type: "document" as const,
            source: { type: "base64" as const, media_type: "application/pdf" as const, data: body.pdfBase64 },
          },
          { type: "text" as const, text: "Summarise this resume." },
        ]
      : [{ type: "text" as const, text: `Summarise this resume:\n\n${body.resumeText}` }];
    const profile = await askForJson({ system: PROFILE_SYSTEM, content, schema: Profile, effort: "low" });
    res.json(profile);
  } catch (err) {
    const { status, message } = describeError(err);
    res.status(status).json({ error: message });
  }
});

app.post("/api/questions", async (req, res) => {
  try {
    const body = z
      .object({
        profile: ProfileInput,
        role: z.string().min(1),
        round: z.enum(Rounds),
        count: z.number().int().min(1).max(10).default(5),
        notes: z.string().optional(),
      })
      .parse(req.body);
    const text = `Target role: ${body.role}
Number of questions: exactly ${body.count}
${body.notes ? `Extra context from the candidate: ${body.notes}\n` : ""}
Candidate profile:
${JSON.stringify(body.profile, null, 2)}`;
    const set = await askForJson({
      system: questionSystem(body.round),
      content: [{ type: "text", text }],
      schema: QuestionSet,
    });
    res.json({ questions: set.questions.slice(0, body.count) });
  } catch (err) {
    const { status, message } = describeError(err);
    res.status(status).json({ error: message });
  }
});

app.post("/api/score", async (req, res) => {
  try {
    const body = z
      .object({
        profile: ProfileInput,
        role: z.string(),
        round: z.enum(Rounds),
        question: z.string(),
        answer: z.string(),
      })
      .parse(req.body);
    const text = `Target role: ${body.role}
Candidate profile:
${JSON.stringify(body.profile, null, 2)}

Question: ${body.question}

Candidate's answer:
${body.answer.trim() || "(no answer given)"}`;
    const feedback = await askForJson({
      system: scoreSystem(body.round),
      content: [{ type: "text", text }],
      schema: Feedback,
    });
    feedback.score = Math.max(1, Math.min(10, Math.round(feedback.score)));
    res.json(feedback);
  } catch (err) {
    const { status, message } = describeError(err);
    res.status(status).json({ error: message });
  }
});

app.post("/api/tavus/conversation", async (req, res) => {
  try {
    const body = z
      .object({
        round: z.string(),
        role: z.string(),
        questions: z.array(z.string()),
        candidateName: z.string().default("there"),
      })
      .parse(req.body);
    res.json(await createTavusConversation(body));
  } catch (err) {
    res.status(tavusEnabled() ? 502 : 400).json({ error: err instanceof Error ? err.message : "Tavus error" });
  }
});

if (process.env.NODE_ENV === "production") {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

const port = Number(process.env.PORT) || 8787;
app.listen(port, () => {
  console.log(`API ready on http://localhost:${port}`);
  if (!process.env.ANTHROPIC_API_KEY) console.warn("ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add it.");
});
