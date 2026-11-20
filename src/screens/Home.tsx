import { useState } from "react";
import { api } from "../api";
import { sessionAverage, scoreTone } from "../score";
import { ROUNDS, type Profile, type Round, type Session } from "../types";

interface Props {
  profile: Profile;
  role: string;
  sessions: Session[];
  tavusEnabled: boolean;
  onStart: (s: Session) => void;
  onOpen: (s: Session) => void;
  onEditProfile: () => void;
}

export default function Home({ profile, role, sessions, tavusEnabled, onStart, onOpen, onEditProfile }: Props) {
  const [round, setRound] = useState<Round>("screening");
  const [count, setCount] = useState(5);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<"" | "text" | "video">("");
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const generate = async () => {
    const { questions } = await api.questions({ profile, role, round, count, notes: notes.trim() || undefined });
    return questions;
  };

  const startText = async () => {
    setBusy("text");
    setError("");
    try {
      const questions = await generate();
      onStart({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), round, role, questions, finished: false });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  const startVideo = async () => {
    setBusy("video");
    setError("");
    try {
      const questions = await generate();
      const { conversationUrl } = await api.tavus({
        round,
        role,
        questions: questions.map((q) => q.question),
        candidateName: profile.name.split(" ")[0] || "there",
      });
      setVideoUrl(conversationUrl);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  const recent = sessions.slice(0, 3);

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Hi {profile.name.split(" ")[0]}, ready to practise?</h1>
        <p className="muted">
          Interviewing for <strong>{role}</strong> ·{" "}
          <button className="link" onClick={onEditProfile}>
            change resume or role
          </button>
        </p>
      </div>

      <div className="rounds">
        {ROUNDS.map((r) => (
          <button key={r.id} className={`round ${round === r.id ? "selected" : ""}`} onClick={() => setRound(r.id)}>
            <span className="round-icon">{r.icon}</span>
            <strong>{r.label}</strong>
            <span className="muted">{r.blurb}</span>
          </button>
        ))}
      </div>

      <div className="card stack">
        <label className="field">
          <span>Number of questions</span>
          <div className="seg">
            {[3, 5, 8].map((n) => (
              <button key={n} className={count === n ? "on" : ""} onClick={() => setCount(n)}>
                {n}
              </button>
            ))}
          </div>
        </label>
        <label className="field">
          <span>Anything to focus on? (optional)</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. company is Stripe, they care about design systems"
          />
        </label>
        {error && <div className="error">{error}</div>}
        <div className="row">
          <button className="btn primary" disabled={!!busy} onClick={startText}>
            {busy === "text" ? "Writing questions…" : "Start text interview"}
          </button>
          <button
            className="btn ghost"
            disabled={!!busy || !tavusEnabled}
            onClick={startVideo}
            title={tavusEnabled ? "" : "Add TAVUS_API_KEY and TAVUS_REPLICA_ID to .env to turn this on"}
          >
            {busy === "video" ? "Starting video…" : "Video interviewer"}
            {!tavusEnabled && <span className="pill">Soon</span>}
          </button>
        </div>
      </div>

      {videoUrl && (
        <div className="card stack">
          <div className="row between">
            <strong>Video interview</strong>
            <button className="link" onClick={() => setVideoUrl("")}>
              Close
            </button>
          </div>
          <iframe className="video" src={videoUrl} allow="camera; microphone; fullscreen; display-capture" />
        </div>
      )}

      {recent.length > 0 && (
        <section className="stack">
          <h3>Recent sessions</h3>
          {recent.map((s) => {
            const avg = sessionAverage(s);
            return (
              <button key={s.id} className="session-row" onClick={() => onOpen(s)}>
                <span className="cap">{s.round}</span>
                <span className="muted">{new Date(s.createdAt).toLocaleDateString()}</span>
                <span className="grow" />
                {s.finished ? (
                  avg !== null && <span className={`score-badge ${scoreTone(avg)}`}>{avg}</span>
                ) : (
                  <span className="pill">In progress</span>
                )}
              </button>
            );
          })}
        </section>
      )}
    </div>
  );
}
