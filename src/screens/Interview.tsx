import { useState } from "react";
import { api } from "../api";
import type { Profile, Session } from "../types";
import FeedbackCard from "./FeedbackCard";

interface Props {
  session: Session;
  profile: Profile;
  onChange: (s: Session) => void;
  onFinish: (s: Session) => void;
  onExit: () => void;
}

export default function Interview({ session, profile, onChange, onFinish, onExit }: Props) {
  const firstOpen = session.questions.findIndex((q) => !q.feedback);
  const [index, setIndex] = useState(firstOpen === -1 ? session.questions.length - 1 : firstOpen);
  const q = session.questions[index];
  const [draft, setDraft] = useState(q.answer ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showHint, setShowHint] = useState(false);
  const isLast = index === session.questions.length - 1;
  const words = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  const goTo = (i: number) => {
    setIndex(i);
    setDraft(session.questions[i].answer ?? "");
    setError("");
    setShowHint(false);
  };

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const feedback = await api.score({ profile, role: session.role, round: session.round, question: q.question, answer: draft });
      const questions = session.questions.map((item, i) => (i === index ? { ...item, answer: draft, feedback } : item));
      onChange({ ...session, questions });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <div className="row between">
        <button className="link" onClick={onExit}>
          ← Save and exit
        </button>
        <span className="muted cap">
          {session.round} · {session.role}
        </span>
      </div>

      <div className="progress">
        {session.questions.map((item, i) => (
          <button
            key={i}
            className={`dot ${i === index ? "current" : ""} ${item.feedback ? "done" : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Question ${i + 1}`}
          />
        ))}
      </div>

      <div className="card stack">
        <div className="row between">
          <span className="step">
            Question {index + 1} of {session.questions.length}
          </span>
          <span className="chip">{q.focus}</span>
        </div>
        <h2 className="question">{q.question}</h2>
        <button className="link" onClick={() => setShowHint((v) => !v)}>
          {showHint ? "Hide hint" : "What does a good answer cover?"}
        </button>
        {showHint && <p className="hint">{q.whatGoodLooksLike}</p>}

        <textarea
          rows={9}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type your answer as you'd say it out loud…"
          disabled={busy}
        />
        <div className="row between">
          <span className="muted">{words} words</span>
          <button className="btn primary" disabled={busy || !draft.trim()} onClick={submit}>
            {busy ? "Scoring…" : q.feedback ? "Re-score answer" : "Submit answer"}
          </button>
        </div>
        {error && <div className="error">{error}</div>}
      </div>

      {q.feedback && (
        <>
          <FeedbackCard feedback={q.feedback} />
          <div className="row end">
            {isLast ? (
              <button className="btn primary" onClick={() => onFinish({ ...session, finished: true })}>
                See results
              </button>
            ) : (
              <button className="btn primary" onClick={() => goTo(index + 1)}>
                Next question →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
