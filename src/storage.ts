import type { Profile, Session } from "./types";

const KEYS = { profile: "mi.profile", role: "mi.role", sessions: "mi.sessions" };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: app keeps working in memory */
  }
}

export const store = {
  getProfile: () => read<Profile | null>(KEYS.profile, null),
  setProfile: (p: Profile | null) => write(KEYS.profile, p),
  getRole: () => read<string>(KEYS.role, ""),
  setRole: (r: string) => write(KEYS.role, r),
  getSessions: () => read<Session[]>(KEYS.sessions, []),
  setSessions: (s: Session[]) => write(KEYS.sessions, s),
  clearAll: () => Object.values(KEYS).forEach((k) => localStorage.removeItem(k)),
};
