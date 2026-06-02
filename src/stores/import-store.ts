import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type {
  ImportSource,
  SshConfigEntry,
  SshKeyInfo,
  ImportSelection,
  ImportResult,
} from "../types/import";

interface ImportState {
  sources: ImportSource[];
  entries: SshConfigEntry[];
  keys: SshKeyInfo[];
  selectedEntries: Set<number>;
  importKeys: boolean;
  step: number;
  result: ImportResult | null;
  isLoading: boolean;
  error: string | null;

  detectSources: () => Promise<void>;
  loadEntries: () => Promise<void>;
  toggleEntry: (index: number) => void;
  toggleAllEntries: (selected: boolean) => void;
  setImportKeys: (value: boolean) => void;
  importSelected: () => Promise<void>;
  reset: () => void;
}

export const useImportStore = create<ImportState>((set, get) => ({
  sources: [],
  entries: [],
  keys: [],
  selectedEntries: new Set(),
  importKeys: false,
  step: 0,
  result: null,
  isLoading: false,
  error: null,

  detectSources: async () => {
    set({ isLoading: true, error: null });
    try {
      const sources = await invoke<ImportSource[]>("import_detect_sources");
      set({ sources, step: 1, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  loadEntries: async () => {
    set({ isLoading: true, error: null });
    try {
      const hasSshConfig = get().sources.some(
        (s) => s.kind === "ssh_config" && s.detected,
      );
      const hasKeys = get().sources.some(
        (s) => s.kind === "ssh_keys" && s.detected,
      );

      const promises: Promise<void>[] = [];

      if (hasSshConfig) {
        promises.push(
          invoke<SshConfigEntry[]>("import_ssh_config").then((entries) =>
            set({ entries }),
          ),
        );
      }

      if (hasKeys) {
        promises.push(
          invoke<SshKeyInfo[]>("import_keys").then((keys) => set({ keys })),
        );
      }

      await Promise.all(promises);

      const allIndices = new Set(
        Array.from({ length: get().entries.length }, (_, i) => i),
      );
      set({ selectedEntries: allIndices, step: 2, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  toggleEntry: (index) => {
    set((state) => {
      const next = new Set(state.selectedEntries);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return { selectedEntries: next };
    });
  },

  toggleAllEntries: (selected) => {
    if (selected) {
      set((state) => ({
        selectedEntries: new Set(
          Array.from({ length: state.entries.length }, (_, i) => i),
        ),
      }));
    } else {
      set({ selectedEntries: new Set() });
    }
  },

  setImportKeys: (value) => set({ importKeys: value }),

  importSelected: async () => {
    set({ isLoading: true, error: null, step: 3 });
    try {
      const { selectedEntries, importKeys } = get();
      const selection: ImportSelection = {
        ssh_config_entries: Array.from(selectedEntries),
        import_keys: importKeys,
      };
      const result = await invoke<ImportResult>("import_selected", {
        selection,
      });
      set({ result, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  reset: () =>
    set({
      sources: [],
      entries: [],
      keys: [],
      selectedEntries: new Set(),
      importKeys: false,
      step: 0,
      result: null,
      isLoading: false,
      error: null,
    }),
}));
