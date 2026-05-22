import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { TerminalView } from "./components/terminal/TerminalView";
import { DualPanelExplorer } from "./components/sftp/DualPanelExplorer";
import { AiSettings } from "./components/settings/AiSettings";
import { AIChatModal } from "./components/ai/AIChatModal";
import { VaultAuth } from "./components/vault/VaultAuth";
import { CredentialsView } from "./components/vault/CredentialsView";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useVaultStore, Credential } from "./stores/vault-store";
import { useTerminalStore } from "./stores/terminal-store";
import { useTransferStore } from "./stores/transfer-store";
import {
  Plus,
  X,
  Shield,
  Lock,
  ChevronRight,
  ChevronLeft,
  HardDrive,
} from "lucide-react";
import { SshOptions } from "./hooks/use-ssh";

function App() {
  const [activeView, setActiveView] = useState<
    "terminal" | "sftp" | "credentials" | "settings"
  >("terminal");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(
    null,
  );
  const [isVaultCollapsed, setIsVaultCollapsed] = useState(false);
  const [aiContext, setAiContext] = useState<string | null>(null);

  const {
    status,
    refreshStatus,
    fetchCredentials,
    addCredential,
    updateCredential,
    searchTerm,
    setSearchTerm,
    getFilteredCredentials,
  } = useVaultStore();
  const {
    sessions,
    activeSessionId,
    setActiveSession,
    addSession,
    removeSession,
  } = useTerminalStore();
  const { initListener, transfers } = useTransferStore();

  const filteredCredentials = useMemo(
    () => getFilteredCredentials(),
    [getFilteredCredentials, searchTerm],
  );

  useEffect(() => {
    refreshStatus();
    const promise = initListener();
    return () => {
      promise.then((unlisten) => unlisten());
    };
  }, [refreshStatus, initListener]);

  useEffect(() => {
    if (status.initialized && !status.locked) {
      fetchCredentials();
    }
  }, [status, fetchCredentials]);

  const handleConnect = useCallback(
    (options: SshOptions, name: string) => {
      addSession(name, options);
      setActiveView("terminal");
    },
    [addSession],
  );

  const openAddModal = () => {
    setEditingCredential(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cred: Credential) => {
    setEditingCredential(cred);
    setIsModalOpen(true);
  };

  if (status.locked) {
    return <VaultAuth />;
  }

  return (
    <div className="app relative z-10 flex h-screen overflow-hidden text-fg">
      <div className="bg-grid" />
      <div className="bg-glow" />

      <Sidebar
        onTerminalClick={() => setActiveView("terminal")}
        onSftpClick={() => setActiveView("sftp")}
        onCredentialsClick={() => setActiveView("credentials")}
        onSettingsClick={() => setActiveView("settings")}
        activeView={activeView}
      />

      <main className="main flex-1 flex flex-col min-w-0">
        <Topbar
          onNewSession={openAddModal}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <div className="body flex-1 flex overflow-hidden relative">
          <section
            className={`term flex-1 flex flex-col min-w-0 ${activeView === "terminal" ? "flex" : "hidden"}`}
          >
            <div className="tabs flex bg-bg1 border-b border-white/5 px-2 pt-2 gap-1 overflow-x-auto no-scrollbar items-end">
              {sessions.length === 0 && (
                <TabItem
                  name="No Active Session"
                  host="Connect to a server"
                  status="off"
                  active
                />
              )}
              {sessions.map((s) => (
                <TabItem
                  key={s.id}
                  name={s.name}
                  host={s.host}
                  status={
                    s.status === "connected"
                      ? "ok"
                      : s.status === "connecting"
                        ? "warn"
                        : "off"
                  }
                  active={activeSessionId === s.id}
                  onClick={() => setActiveSession(s.id)}
                  onClose={() => removeSession(s.id)}
                />
              ))}
              <button
                onClick={openAddModal}
                className="tabadd h-9 px-3 flex items-center justify-center rounded-t-lg text-fg2 hover:bg-white/5 hover:text-fg transition-all mb-[-1px]"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="flex-1 relative bg-black">
              {sessions.map((s) => (
                <TerminalView
                  key={s.id}
                  sessionId={s.id}
                  active={activeSessionId === s.id}
                  options={s.options}
                  onAiRequest={(ctx) => setAiContext(ctx)}
                />
              ))}
              {sessions.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-muted font-mono text-sm gap-4">
                  <Shield size={48} strokeWidth={1} className="opacity-20" />
                  Select a credential to start a session
                </div>
              )}
            </div>

            <div className="statusbar flex items-center gap-4 px-4 py-1.5 bg-bg1 border-t border-white/5 text-[11px] text-muted font-mono">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-ok shadow-[0_0_6px_var(--ok)]" />
                Connected
              </div>
              <div className="ml-auto flex gap-4 text-[9px] uppercase tracking-tighter font-bold">
                <span className="text-cyan/50">Shortcut</span>
                <span className="text-fg2">Ctrl + Space to Analyze</span>
              </div>
            </div>
          </section>

          <div
            className={`flex-1 ${activeView === "sftp" ? "flex" : "hidden"}`}
          >
            <DualPanelExplorer />
          </div>

          <div
            className={`flex-1 ${activeView === "credentials" ? "flex" : "hidden"}`}
          >
            <CredentialsView onEdit={openEditModal} onAdd={openAddModal} />
          </div>

          <div
            className={`flex-1 ${activeView === "settings" ? "flex" : "hidden"}`}
          >
            <AiSettings />
          </div>

          {activeView === "terminal" && (
            <aside
              className={`rpanel bg-bg1 border-l border-white/5 flex flex-col overflow-hidden transition-all duration-300 ease-in-out relative ${isVaultCollapsed ? "w-0 border-l-0" : "w-[320px]"}`}
            >
              <button
                onClick={() => setIsVaultCollapsed(!isVaultCollapsed)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full bg-bg1 border border-white/5 border-r-0 p-1.5 rounded-l-xl text-muted hover:text-cyan transition-all z-20 shadow-xl"
              >
                {isVaultCollapsed ? (
                  <ChevronLeft size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>

              <div className="phdr p-4 border-b border-white/5 bg-white/[0.02]">
                <div className="ptitle text-sm font-semibold flex items-center gap-2">
                  <Shield size={18} className="text-cyan" /> Quick Vault
                </div>
              </div>

              <div className="pcontent flex-1 overflow-auto p-3">
                {filteredCredentials.map((cred) => (
                  <CredentialCard
                    key={cred.id}
                    name={cred.name}
                    type={cred.type}
                    active={activeSessionId === cred.id}
                    onClick={() => {
                      const secretStr = cred.secret
                        ? new TextDecoder().decode(new Uint8Array(cred.secret))
                        : undefined;

                      handleConnect(
                        {
                          host: cred.host || "",
                          port: 22,
                          user: cred.user || "",
                          password:
                            cred.type === "password" ? secretStr : undefined,
                          private_key:
                            cred.type === "ssh" ? secretStr : undefined,
                        },
                        cred.name,
                      );
                    }}
                  />
                ))}

                <button
                  onClick={openAddModal}
                  className="w-full mt-2 py-3 border-2 border-dashed border-white/5 rounded-xl text-xs text-muted hover:border-cyan/50 hover:text-cyan hover:bg-cyan/5 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> New Server
                </button>
              </div>
            </aside>
          )}
        </div>
      </main>

      {isModalOpen && (
        <AddCredentialModal
          initialData={editingCredential || undefined}
          onClose={() => setIsModalOpen(false)}
          onSave={async (data) => {
            try {
              if (editingCredential) {
                await updateCredential({ ...editingCredential, ...data });
              } else {
                await addCredential(data);
              }
              setIsModalOpen(false);
            } catch (err) {
              alert("Failed to save: " + err);
            }
          }}
        />
      )}

      {aiContext && (
        <AIChatModal context={aiContext} onClose={() => setAiContext(null)} />
      )}

      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-3 w-80 pointer-events-none">
        {Object.values(transfers).map((transfer) => (
          <div
            key={transfer.id}
            className="bg-bg2 border border-white/10 rounded-2xl p-4 shadow-2xl animate-slide-up backdrop-blur-md pointer-events-auto"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <HardDrive
                  size={14}
                  className={
                    transfer.status === "completed" ? "text-ok" : "text-cyan"
                  }
                />
                <span className="text-[11px] font-bold truncate">
                  {transfer.filename}
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted">
                {Math.round((transfer.bytes / transfer.total) * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${transfer.status === "completed" ? "bg-ok" : "bg-cyan shadow-[0_0_10px_var(--cyan)]"}`}
                style={{ width: `${(transfer.bytes / transfer.total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const AddCredentialModal = ({
  initialData,
  onClose,
  onSave,
}: {
  initialData?: Partial<Credential>;
  onClose: () => void;
  onSave: (data: any) => void;
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    type: (initialData?.type as any) || "ssh",
    host: initialData?.host || "",
    user: initialData?.user || "",
    secret: "",
  });

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-bg0/80 backdrop-blur-md p-4">
      <div className="w-full max-w-[480px] bg-bg1 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <h3 className="text-base font-semibold">
            {initialData ? "Edit Credential" : "Add New Credential"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/5 rounded-lg text-muted hover:text-fg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-fg2 ml-1">
              Credential Name
            </label>
            <input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. Production Web Server"
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-cyan/50 focus:ring-4 focus:ring-cyan/10 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-fg2 ml-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as any })
                }
                className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-3 text-sm outline-none focus:border-cyan/50 transition-all"
              >
                <option value="ssh">SSH Key</option>
                <option value="password">Password</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-fg2 ml-1">
                Username
              </label>
              <input
                value={formData.user}
                onChange={(e) =>
                  setFormData({ ...formData, user: e.target.value })
                }
                placeholder="admin"
                className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-cyan/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-fg2 ml-1">
              Host / IP Address
            </label>
            <input
              value={formData.host}
              onChange={(e) =>
                setFormData({ ...formData, host: e.target.value })
              }
              placeholder="192.168.1.100"
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-cyan/50 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-fg2 ml-1">
              Secret / Password {initialData && "(Leave empty to keep current)"}
            </label>
            <div className="relative">
              <Lock
                className={`absolute left-3.5 ${formData.type === "ssh" ? "top-3" : "top-1/2 -translate-y-1/2"} text-muted`}
                size={16}
              />
              {formData.type === "ssh" ? (
                <textarea
                  value={formData.secret}
                  onChange={(e) =>
                    setFormData({ ...formData, secret: e.target.value })
                  }
                  placeholder="Paste your private key..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-[11px] font-mono outline-none focus:border-cyan/50 transition-all resize-none"
                />
              ) : (
                <input
                  type="password"
                  value={formData.secret}
                  onChange={(e) =>
                    setFormData({ ...formData, secret: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-cyan/50 transition-all"
                />
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-medium text-fg2 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-6 py-2 bg-gradient-to-br from-cyan to-purple rounded-xl text-sm font-bold text-bg0 shadow-lg"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

interface TabItemProps {
  name: string;
  host: string;
  active?: boolean;
  status: "ok" | "warn" | "off";
  onClick?: () => void;
  onClose?: () => void;
}

const TabItem = ({
  name,
  host,
  active,
  status,
  onClick,
  onClose,
}: TabItemProps) => (
  <div
    onClick={onClick}
    className={`tab flex items-center gap-3 px-4 py-2.5 rounded-t-xl border-t border-x cursor-pointer transition-all min-w-[140px] max-w-[220px] group relative
    ${active ? "bg-bg0 border-cyan z-10 translate-y-[1px]" : "bg-white/[0.03] border-transparent hover:bg-white/[0.06] text-muted hover:text-fg"}`}
  >
    <div
      className={`w-2 h-2 rounded-full flex-shrink-0 ${
        status === "ok"
          ? "bg-ok shadow-[0_0_8px_var(--ok)]"
          : status === "warn"
            ? "bg-warn shadow-[0_0_8px_var(--warn)] animate-pulse"
            : "bg-muted"
      }`}
    />
    <div className="flex-1 min-w-0">
      <div className="text-xs font-semibold truncate leading-tight">{name}</div>
      <div className="text-[9px] opacity-60 truncate font-mono">{host}</div>
    </div>
    {onClose && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-md transition-all text-muted hover:text-err"
      >
        <X size={12} />
      </button>
    )}
  </div>
);

interface CredentialCardProps {
  name: string;
  type: string;
  active?: boolean;
  onClick?: () => void;
}

const CredentialCard = ({
  name,
  type,
  active,
  onClick,
}: CredentialCardProps) => (
  <div
    onClick={onClick}
    className={`ccard bg-white/[0.03] border border-white/5 rounded-xl p-3 mb-2 cursor-pointer transition-all relative overflow-hidden group
    ${active ? "border-cyan bg-cyan/[0.04]" : "hover:border-cyan/30 hover:bg-cyan/[0.02]"}`}
  >
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan group-hover:scale-110 transition-transform">
        <Lock size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate group-hover:text-cyan transition-colors">
          {name}
        </div>
        <div className="text-[9px] text-cyan/70 uppercase tracking-widest font-bold">
          {type}
        </div>
      </div>
    </div>
  </div>
);

export default App;
