import { useState } from "react";
import { scoreTone } from "../score";
import type { Feedback } from "../types";

export default function FeedbackCard({ feedback }: { feedback: Feedback }) {
  const [showModel, setShowModel] = useState(false);
  return (
    <div className="feedback stack">
      <div className="row">
        <span className={`score-big ${scoreTone(feedback.score)}`}>
          {feedback.score}
          <small>/10</small>
        </span>
        <p className="verdict">{feedback.verdict}</p>
      </div>
      <div className="two-col">
        <div>
          <h4>What worked</h4>
          <ul className="list list-good">
            {feedback.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Make it stronger</h4>
          <ul className="list list-low">
            {feedback.improvements.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
      <button className="link" onClick={() => setShowModel((v) => !v)}>
        {showModel ? "Hide" : "Show"} a stronger answer
      </button>
      {showModel && <p className="model-answer">{feedback.strongerAnswer}</p>}
    </div>
  );
}
