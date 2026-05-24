import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface Workspace {
  id: string;
  name: string;
  created_at: string;
}

export interface Credential {
  id: string;
  name: string;
  type: "ssh" | "token" | "password";
  host?: string;
  user?: string;
  secret?: number[]; // Encrypted bytes from backend
  added_at: string;
  workspace_id?: string;
}

interface VaultStatus {
  initialized: boolean;
  locked: boolean;
}

interface VaultState {
  status: VaultStatus;
  credentials: Credential[];
  workspaces: Workspace[];
  activeWorkspaceId: string;
  searchTerm: string;
  isLoading: boolean;

  refreshStatus: () => Promise<void>;
  setupVault: (password: string) => Promise<void>;
  unlockVault: (password: string) => Promise<void>;
  lockVault: () => Promise<void>;

  setSearchTerm: (term: string) => void;
  getFilteredCredentials: () => Credential[];

  fetchCredentials: () => Promise<void>;
  addCredential: (cred: Omit<Credential, "id" | "added_at">) => Promise<void>;
  updateCredential: (cred: Credential) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;

  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (name: string) => Promise<void>;
  setActiveWorkspace: (id: string) => void;
  getActiveWorkspace: () => Workspace | undefined;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  status: { initialized: false, locked: true },
  credentials: [],
  workspaces: [],
  activeWorkspaceId: "",
  searchTerm: "",
  isLoading: true,

  refreshStatus: async () => {
    try {
      const status = await invoke<VaultStatus>("vault_status");
      set({ status });
    } catch (err) {
      console.error("Failed to get vault status:", err);
    }
  },

  setupVault: async (password) => {
    try {
      await invoke("vault_setup", { password });
      await get().refreshStatus();
    } catch (err) {
      console.error("Failed to setup vault:", err);
      throw err;
    }
  },

  unlockVault: async (password) => {
    try {
      await invoke("vault_unlock", { password });
      await get().refreshStatus();
      await get().fetchCredentials();
    } catch (err) {
      console.error("Failed to unlock vault:", err);
      throw err;
    }
  },

  lockVault: async () => {
    try {
      await invoke("vault_lock");
      set({ credentials: [], status: { ...get().status, locked: true } });
    } catch (err) {
      console.error("Failed to lock vault:", err);
    }
  },

  setSearchTerm: (term) => set({ searchTerm: term }),

  getFilteredCredentials: () => {
    const { credentials, searchTerm } = get();
    if (!searchTerm) return credentials;
    const lowerTerm = searchTerm.toLowerCase();
    return credentials.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerTerm) ||
        c.host?.toLowerCase().includes(lowerTerm) ||
        c.user?.toLowerCase().includes(lowerTerm),
    );
  },

  fetchCredentials: async () => {
    if (get().status.locked) return;

    set({ isLoading: true });
    try {
      const creds = await invoke<Credential[]>("vault_list_credentials");
      set({ credentials: creds, isLoading: false });
    } catch (err) {
      console.error("Failed to fetch credentials:", err);
      set({ isLoading: false });
    }
  },

  addCredential: async (newCred) => {
    try {
      const cred: Credential = {
        ...newCred,
        id: crypto.randomUUID(),
        added_at: new Date().toISOString(),
        secret: newCred.secret
          ? Array.from(new TextEncoder().encode(String(newCred.secret)))
          : undefined,
      };
      await invoke("vault_add_credential", { cred });
      await get().fetchCredentials();
    } catch (err) {
      console.error("Failed to add credential:", err);
      throw err;
    }
  },

  updateCredential: async (updatedCred) => {
    try {
      // If secret is a string, convert to byte array. If it's already an array (or empty), keep it.
      // This logic depends on how the Edit Modal passes the data.
      await invoke("vault_update_credential", { cred: updatedCred });
      await get().fetchCredentials();
    } catch (err) {
      console.error("Failed to update credential:", err);
      throw err;
    }
  },

  deleteCredential: async (id) => {
    try {
      await invoke("vault_delete_credential", { id });
      await get().fetchCredentials();
    } catch (err) {
      console.error("Failed to delete credential:", err);
      throw err;
    }
  },

  fetchWorkspaces: async () => {
    if (get().status.locked) return;
    
    try {
      const workspaces = await invoke<Workspace[]>("vault_list_workspaces");
      set({ workspaces });
      
      if (workspaces.length > 0 && !get().activeWorkspaceId) {
        set({ activeWorkspaceId: workspaces[0].id });
      }
    } catch (err) {
      console.error("Failed to fetch workspaces:", err);
    }
  },

  createWorkspace: async (name) => {
    try {
      const workspace: Workspace = {
        id: crypto.randomUUID(),
        name,
        created_at: new Date().toISOString(),
      };
      await invoke("vault_create_workspace", { workspace });
      await get().fetchWorkspaces();
    } catch (err) {
      console.error("Failed to create workspace:", err);
      throw err;
    }
  },

  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

  getActiveWorkspace: () => {
    const { workspaces, activeWorkspaceId } = get();
    return workspaces.find((w) => w.id === activeWorkspaceId);
  },
}));
