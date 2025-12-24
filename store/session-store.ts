import { create } from "zustand";

interface SessionStore {
  activeSessionId: string | null;
  setActiveSession: (id: string | null) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  activeSessionId: null,
  setActiveSession: (id) => set({ activeSessionId: id }),
}));
