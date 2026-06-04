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
  updateSnippet: (s: Snippet) => Promise<void>;
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
    const snippet: Snippet = {
      ...s,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    try {
      await invoke("snippet_add", { snippet });
    } catch (err) {
      console.error("Failed to add snippet:", err);
      throw err;
    }
    get().loadSnippets();
  },
  updateSnippet: async (snippet) => {
    try {
      await invoke("snippet_update", { snippet });
    } catch (err) {
      console.error("Failed to update snippet:", err);
      throw err;
    }
    get().loadSnippets();
  },
  deleteSnippet: async (id) => {
    await invoke("snippet_delete", { id });
    get().loadSnippets();
  },
}));
