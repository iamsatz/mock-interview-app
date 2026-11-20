import { sessionAverage, scoreTone } from "../score";
import type { Session } from "../types";
import FeedbackCard from "./FeedbackCard";

export default function Summary({ session, onHome }: { session: Session; onHome: () => void }) {
  const avg = sessionAverage(session);
  const answered = session.questions.filter((q) => q.feedback).length;
  return (
    <div className="stack">
      <div className="page-head center">
        <span className="step cap">{session.round} round · {session.role}</span>
        {avg !== null && (
          <span className={`score-hero ${scoreTone(avg)}`}>
            {avg}
            <small>/10</small>
          </span>
        )}
        <p className="muted">
          {answered} of {session.questions.length} answered · {new Date(session.createdAt).toLocaleString()}
        </p>
        <button className="btn primary" onClick={onHome}>
          Practise again
        </button>
      </div>
      {session.questions.map((q, i) => (
        <details key={i} className="card">
          <summary className="row between">
            <span>
              <span className="muted">Q{i + 1}.</span> {q.question}
            </span>
            {q.feedback && <span className={`score-badge ${scoreTone(q.feedback.score)}`}>{q.feedback.score}</span>}
          </summary>
          <div className="stack pad-top">
            <h4>Your answer</h4>
            <p className="answer">{q.answer || "Not answered"}</p>
            {q.feedback && <FeedbackCard feedback={q.feedback} />}
          </div>
        </details>
      ))}
    </div>
  );
}
