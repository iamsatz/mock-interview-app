import { sessionAverage, scoreTone } from "../score";
import type { Session } from "../types";

interface Props {
  sessions: Session[];
  onOpen: (s: Session) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export default function History({ sessions, onOpen, onDelete, onClearAll }: Props) {
  return (
    <div className="stack">
      <div className="page-head">
        <h1>History</h1>
        <p className="muted">Saved in this browser only.</p>
      </div>
      {sessions.length === 0 && <div className="empty">No sessions yet. Your first one will show up here.</div>}
      {sessions.map((s) => {
        const avg = sessionAverage(s);
        return (
          <div key={s.id} className="session-row">
            <button className="grow left" onClick={() => onOpen(s)}>
              <span className="cap">{s.round}</span> <span className="muted">· {s.role}</span>
              <br />
              <span className="muted small">{new Date(s.createdAt).toLocaleString()}</span>
            </button>
            {s.finished && avg !== null ? (
              <span className={`score-badge ${scoreTone(avg)}`}>{avg}</span>
            ) : (
              <span className="pill">In progress</span>
            )}
            <button className="link danger" onClick={() => onDelete(s.id)}>
              Delete
            </button>
          </div>
        );
      })}
      <hr />
      <button
        className="btn ghost danger"
        onClick={() => {
          if (confirm("Delete your resume profile and every session from this browser?")) onClearAll();
        }}
      >
        Reset everything
      </button>
    </div>
  );
}
