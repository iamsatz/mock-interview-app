import { useRef, useState } from "react";
import { api, fileToBase64 } from "../api";
import type { Profile } from "../types";

interface Props {
  initialRole: string;
  hasProfile: boolean;
  onDone: (p: Profile, role: string) => void;
  onCancel: () => void;
}

export default function Setup({ initialRole, hasProfile, onDone, onCancel }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [role, setRole] = useState(initialRole);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setError("");
    if (f.type === "application/pdf") {
      setFile(f);
      setText("");
    } else if (f.type.startsWith("text/") || /\.(md|txt)$/i.test(f.name)) {
      setFile(null);
      setText(await f.text());
    } else {
      setError("Use a PDF, .txt or .md file. For Word files, save as PDF first.");
    }
  };

  const analyse = async () => {
    setBusy(true);
    setError("");
    try {
      const p = file ? await api.profile({ pdfBase64: await fileToBase64(file) }) : await api.profile({ resumeText: text });
      setProfile(p);
      if (!role && p.suggestedRoles[0]) setRole(p.suggestedRoles[0]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-head">
        <span className="step">Step 1 of 2</span>
        <h1>Add your resume</h1>
        <p className="muted">Claude reads it once and tailors every question to you. It stays in this browser.</p>
      </div>

      <div
        className="dropzone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files[0]);
        }}
      >
        <input ref={inputRef} type="file" accept=".pdf,.txt,.md" hidden onChange={(e) => pick(e.target.files?.[0])} />
        <div className="dz-icon">↑</div>
        <strong>{file ? file.name : "Drop your resume PDF here"}</strong>
        <span className="muted">{file ? "Click to choose a different file" : "or click to browse. PDF, TXT or MD."}</span>
      </div>

      <div className="or">or paste it</div>
      <textarea
        rows={6}
        placeholder="Paste your resume text…"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (e.target.value) setFile(null);
        }}
      />

      {error && <div className="error">{error}</div>}

      <div className="row">
        <button className="btn primary" disabled={busy || (!file && !text.trim())} onClick={analyse}>
          {busy ? "Reading resume…" : profile ? "Read again" : "Read my resume"}
        </button>
        {hasProfile && (
          <button className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>

      {profile && (
        <section className="card stack">
          <span className="step">Step 2 of 2</span>
          <div>
            <h2>{profile.name}</h2>
            <p className="muted">
              {profile.headline} · {profile.yearsOfExperience} yrs
            </p>
          </div>
          <div className="chips">
            {profile.skills.slice(0, 12).map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
          <ul className="list">
            {profile.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <label className="field">
            <span>Role you're interviewing for</span>
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Senior Product Designer" />
          </label>
          <div className="chips">
            {profile.suggestedRoles.map((r) => (
              <button key={r} className="chip action" onClick={() => setRole(r)}>
                {r}
              </button>
            ))}
          </div>
          <button className="btn primary" disabled={!role.trim()} onClick={() => onDone(profile, role.trim())}>
            Save and start practising
          </button>
        </section>
      )}
    </div>
  );
}
