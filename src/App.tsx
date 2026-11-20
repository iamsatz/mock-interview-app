import { useEffect, useState } from "react";
import { api } from "./api";
import { store } from "./storage";
import type { Profile, Session } from "./types";
import Setup from "./screens/Setup";
import Home from "./screens/Home";
import Interview from "./screens/Interview";
import Summary from "./screens/Summary";
import History from "./screens/History";

type View =
  | { name: "setup" }
  | { name: "home" }
  | { name: "interview"; sessionId: string }
  | { name: "summary"; sessionId: string }
  | { name: "history" };

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(() => store.getProfile());
  const [role, setRole] = useState(() => store.getRole());
  const [sessions, setSessions] = useState<Session[]>(() => store.getSessions());
  const [view, setView] = useState<View>(() => (store.getProfile() ? { name: "home" } : { name: "setup" }));
  const [config, setConfig] = useState({ claudeReady: true, tavusEnabled: false });

  useEffect(() => {
    api.config().then(setConfig);
  }, []);

  useEffect(() => store.setSessions(sessions), [sessions]);

  const saveProfile = (p: Profile, r: string) => {
    setProfile(p);
    setRole(r);
    store.setProfile(p);
    store.setRole(r);
    setView({ name: "home" });
  };

  const upsertSession = (s: Session) =>
    setSessions((all) => {
      const i = all.findIndex((x) => x.id === s.id);
      if (i === -1) return [s, ...all];
      const next = [...all];
      next[i] = s;
      return next;
    });

  const findSession = (id: string) => sessions.find((s) => s.id === id);

  let body: React.ReactNode;
  if (view.name === "setup" || !profile) {
    body = <Setup initialRole={role} hasProfile={!!profile} onDone={saveProfile} onCancel={() => setView({ name: "home" })} />;
  } else if (view.name === "home") {
    body = (
      <Home
        profile={profile}
        role={role}
        sessions={sessions}
        tavusEnabled={config.tavusEnabled}
        onStart={(s) => {
          upsertSession(s);
          setView({ name: "interview", sessionId: s.id });
        }}
        onOpen={(s) => setView(s.finished ? { name: "summary", sessionId: s.id } : { name: "interview", sessionId: s.id })}
        onEditProfile={() => setView({ name: "setup" })}
      />
    );
  } else if (view.name === "interview") {
    const s = findSession(view.sessionId);
    body = s ? (
      <Interview
        session={s}
        profile={profile}
        onChange={upsertSession}
        onFinish={(done) => {
          upsertSession(done);
          setView({ name: "summary", sessionId: done.id });
        }}
        onExit={() => setView({ name: "home" })}
      />
    ) : null;
  } else if (view.name === "summary") {
    const s = findSession(view.sessionId);
    body = s ? <Summary session={s} onHome={() => setView({ name: "home" })} /> : null;
  } else {
    body = (
      <History
        sessions={sessions}
        onOpen={(s) => setView(s.finished ? { name: "summary", sessionId: s.id } : { name: "interview", sessionId: s.id })}
        onDelete={(id) => setSessions((all) => all.filter((s) => s.id !== id))}
        onClearAll={() => {
          store.clearAll();
          setSessions([]);
          setProfile(null);
          setRole("");
          setView({ name: "setup" });
        }}
      />
    );
  }

  return (
    <div className="shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView(profile ? { name: "home" } : { name: "setup" })}>
          <span className="brand-mark">MI</span> Mock Interview
        </button>
        {profile && (
          <nav className="nav">
            <button className={view.name === "home" ? "active" : ""} onClick={() => setView({ name: "home" })}>
              Practice
            </button>
            <button className={view.name === "history" ? "active" : ""} onClick={() => setView({ name: "history" })}>
              History
            </button>
          </nav>
        )}
      </header>
      {!config.claudeReady && (
        <div className="banner">
          The server has no ANTHROPIC_API_KEY. Copy <code>.env.example</code> to <code>.env</code>, add your key and
          restart.
        </div>
      )}
      <main className="main">{body}</main>
    </div>
  );
}
