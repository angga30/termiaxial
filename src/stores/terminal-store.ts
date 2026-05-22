import { create } from "zustand";
import { SshOptions } from "../hooks/use-ssh";
import { invoke } from "@tauri-apps/api/core";

export interface TerminalSession {
  id: string;
  name: string;
  host: string;
  status: "connecting" | "connected" | "error" | "disconnected";
  options: SshOptions;
}

interface TerminalState {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  addSession: (name: string, options: SshOptions) => string;
  setActiveSession: (id: string) => void;
  updateSessionStatus: (id: string, status: TerminalSession["status"]) => void;
  removeSession: (id: string) => Promise<void>;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  sessions: [],
  activeSessionId: null,

  addSession: (name, options) => {
    const id = crypto.randomUUID();
    const newSession: TerminalSession = {
      id,
      name,
      host: options.host,
      status: "connecting",
      options,
    };

    set((state) => ({
      sessions: [...state.sessions, newSession],
      activeSessionId: id,
    }));

    return id;
  },

  setActiveSession: (id) => set({ activeSessionId: id }),

  updateSessionStatus: (id, status) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, status } : s)),
    })),

  removeSession: async (id) => {
    // 1. Backend Disconnect
    try {
      await invoke("disconnect_ssh", { sessionId: id });
    } catch (err) {
      console.warn("Failed to disconnect backend session:", err);
    }

    // 2. Frontend State Update
    set((state) => {
      const newSessions = state.sessions.filter((s) => s.id !== id);
      let newActiveId = state.activeSessionId;

      if (state.activeSessionId === id) {
        newActiveId =
          newSessions.length > 0
            ? newSessions[newSessions.length - 1].id
            : null;
      }

      return {
        sessions: newSessions,
        activeSessionId: newActiveId,
      };
    });
  },
}));
