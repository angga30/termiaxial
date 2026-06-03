import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface Snippet {
  id: string;
  name: string;
  command: string;
  description: string;
  tags: string[];
  host_id: string | null;
  created_at: string;
}

interface SnippetStore {
  snippets: Snippet[];
  searchQuery: string;
  selectedIndex: number;
  loading: boolean;
  setSearchQuery: (q: string) => void;
  setSelectedIndex: (i: number) => void;
  loadSnippets: () => Promise<void>;
  searchSnippets: (q: string) => Promise<void>;
  addSnippet: (s: Omit<Snippet, "id" | "created_at">) => Promise<void>;
  deleteSnippet: (id: string) => Promise<void>;
}

export const useSnippetStore = create<SnippetStore>((set, get) => ({
  snippets: [],
  searchQuery: "",
  selectedIndex: 0,
  loading: false,
  setSearchQuery: (q) => {
    set({ searchQuery: q, selectedIndex: 0 });
    get().searchSnippets(q);
  },
  setSelectedIndex: (i) => set({ selectedIndex: i }),
  loadSnippets: async () => {
    set({ loading: true });
    try {
      const snippets = await invoke<Snippet[]>("snippet_list");
      set({ snippets, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  searchSnippets: async (q) => {
    set({ loading: true });
    try {
      const snippets = q.trim()
        ? await invoke<Snippet[]>("snippet_search", { query: q })
        : await invoke<Snippet[]>("snippet_list");
      set({ snippets, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  addSnippet: async (s) => {
    await invoke("snippet_add", { snippet: s });
    get().loadSnippets();
  },
  deleteSnippet: async (id) => {
    await invoke("snippet_delete", { id });
    get().loadSnippets();
  },
}));
