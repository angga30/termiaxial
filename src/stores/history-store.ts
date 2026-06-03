import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface CommandHistoryEntry {
  id: string;
  session_id: string;
  command: string;
  timestamp: string;
  exit_code: number | null;
}

interface HistoryStore {
  entries: CommandHistoryEntry[];
  searchQuery: string;
  selectedSessionId: string | null;
  loading: boolean;
  setSearchQuery: (q: string) => void;
  setSelectedSessionId: (id: string | null) => void;
  loadHistory: () => Promise<void>;
  searchHistory: (query: string) => Promise<void>;
  clearHistory: (sessionId?: string) => Promise<void>;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  entries: [],
  searchQuery: "",
  selectedSessionId: null,
  loading: false,

  setSearchQuery: (q) => {
    set({ searchQuery: q });
    get().searchHistory(q);
  },

  setSelectedSessionId: (id) => set({ selectedSessionId: id }),

  loadHistory: async () => {
    set({ loading: true });
    try {
      const entries = await invoke<CommandHistoryEntry[]>("history_list", {
        sessionId: null,
        limit: 500,
      });
      set({ entries, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  searchHistory: async (query) => {
    set({ loading: true });
    try {
      const entries = query.trim()
        ? await invoke<CommandHistoryEntry[]>("history_search", {
            query,
            limit: 100,
          })
        : await invoke<CommandHistoryEntry[]>("history_list", {
            sessionId: null,
            limit: 500,
          });
      set({ entries, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  clearHistory: async (sessionId) => {
    await invoke("history_clear", { sessionId: sessionId || null });
    get().loadHistory();
  },
}));
