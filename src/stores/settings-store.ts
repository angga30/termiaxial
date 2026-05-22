import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

interface AiSettings {
  provider: string;
  model: string;
  apiKey: string;
  customEndpoint: string;
}

interface SettingsState {
  ai: AiSettings;
  isLoading: boolean;
  setAiSetting: (key: keyof AiSettings, value: string) => Promise<void>;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  ai: {
    provider: "ollama",
    model: "llama3",
    apiKey: "",
    customEndpoint: "",
  },
  isLoading: true,

  loadSettings: async () => {
    console.log("[AI DEBUG] SettingsStore: Loading settings...");
    set({ isLoading: true });
    try {
      const provider = await invoke<string | null>("vault_get_metadata", {
        key: "ai_provider",
      });
      const model = await invoke<string | null>("vault_get_metadata", {
        key: "ai_model",
      });
      const apiKey = await invoke<string | null>("vault_get_metadata", {
        key: "ai_api_key",
      });
      const customEndpoint = await invoke<string | null>("vault_get_metadata", {
        key: "ai_custom_endpoint",
      });

      console.log("[AI DEBUG] SettingsStore: Settings loaded from database");
      set({
        ai: {
          provider: provider || "ollama",
          model: model || "llama3",
          apiKey: apiKey || "",
          customEndpoint: customEndpoint || "",
        },
        isLoading: false,
      });
    } catch (err) {
      console.error("[AI DEBUG] SettingsStore: Failed to load settings:", err);
      set({ isLoading: false });
    }
  },

  setAiSetting: async (key, value) => {
    console.log(`[AI DEBUG] SettingsStore: Updating ${key}...`);
    try {
      const dbKey =
        key === "apiKey"
          ? "ai_api_key"
          : key === "customEndpoint"
            ? "ai_custom_endpoint"
            : `ai_${key}`;

      await invoke("vault_set_metadata", { key: dbKey, value });
      console.log(`[AI DEBUG] SettingsStore: ${key} saved to database`);
      set((state) => ({
        ai: { ...state.ai, [key]: value },
      }));
    } catch (err) {
      console.error(`[AI DEBUG] SettingsStore: Failed to save ${key}:`, err);
      throw err;
    }
  },
}));
