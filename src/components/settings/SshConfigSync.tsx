import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  FileText,
  RefreshCw,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface SyncStatus {
  config_path: string;
  exists: boolean;
  last_modified: string | null;
  managed_count: number;
}

interface DetectedChange {
  host: string;
  user: string;
  port: number;
  identity_file: string | null;
}

export const SshConfigSync: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [writing, setWriting] = useState(false);
  const [changes, setChanges] = useState<DetectedChange[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await invoke<SyncStatus>("ssh_config_sync_status");
      setStatus(s);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleDetect = async () => {
    setDetecting(true);
    setError(null);
    try {
      const result = await invoke<DetectedChange[]>("ssh_config_detect_changes");
      setChanges(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setDetecting(false);
    }
  };

  const handleSyncFromConfig = async () => {
    setSyncing(true);
    setError(null);
    try {
      await invoke("ssh_config_sync_from_config");
      setLastSync(new Date().toISOString());
      setChanges([]);
      await loadStatus();
    } catch (err) {
      setError(String(err));
    } finally {
      setSyncing(false);
    }
  };

  const handleWriteAll = async () => {
    setWriting(true);
    setError(null);
    try {
      const creds = await invoke<{ id: string }[]>("vault_list_credentials");
      for (const cred of creds) {
        await invoke("ssh_config_write_credential", { id: cred.id });
      }
      setLastSync(new Date().toISOString());
      await loadStatus();
    } catch (err) {
      setError(String(err));
    } finally {
      setWriting(false);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "Never";
    return new Date(iso).toLocaleString();
  };

  return (
    <div className="flex-1 overflow-auto p-8 max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <FileText className="text-cyan" size={28} /> SSH Config Sync
        </h2>
        <p className="text-muted text-sm">
          Synchronize your ~/.ssh/config with the Tmax vault.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-err/10 border border-err/20 rounded-xl flex items-center gap-3 text-err text-sm">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-fg2">
          Sync Status
        </h3>

        {loading && !status ? (
          <div className="text-muted animate-pulse font-mono text-sm">
            Loading status...
          </div>
        ) : status ? (
          <div className="space-y-3">
            <StatusRow
              icon={<FileText size={16} />}
              label="Config Path"
              value={status.config_path}
            />
            <StatusRow
              icon={status.exists ? <CheckCircle size={16} /> : <XCircle size={16} />}
              label="File Exists"
              value={status.exists ? "Yes" : "No"}
              valueClass={status.exists ? "text-ok" : "text-err"}
            />
            <StatusRow
              icon={<Clock size={16} />}
              label="Last Modified"
              value={formatDate(status.last_modified)}
            />
            <StatusRow
              icon={<FileText size={16} />}
              label="Tmax-Managed Entries"
              value={String(status.managed_count)}
              valueClass={status.managed_count > 0 ? "text-cyan" : "text-muted"}
            />
          </div>
        ) : null}
      </div>

      <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-fg2">
          Actions
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <ActionButton
            icon={<RefreshCw size={16} />}
            label="Detect Changes"
            description="Scan SSH config for new entries not in vault"
            loading={detecting}
            onClick={handleDetect}
          />
          <ActionButton
            icon={<Download size={16} />}
            label="Sync to Vault"
            description="Import new SSH config entries into the vault"
            loading={syncing}
            onClick={handleSyncFromConfig}
            disabled={changes.length === 0}
          />
          <ActionButton
            icon={<Upload size={16} />}
            label="Write All to Config"
            description="Write all vault credentials to SSH config file"
            loading={writing}
            onClick={handleWriteAll}
          />
        </div>
      </div>

      {changes.length > 0 && (
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-fg2">
            Detected Changes ({changes.length})
          </h3>
          <div className="space-y-2">
            {changes.map((change, i) => (
              <div
                key={i}
                className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan/10 flex items-center justify-center text-cyan text-xs font-bold">
                  {change.host.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {change.host}
                  </div>
                  <div className="text-[10px] text-muted font-mono">
                    {change.user}@{change.host}:{change.port}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lastSync && (
        <div className="text-[11px] text-muted font-mono text-center">
          Last sync: {formatDate(lastSync)}
        </div>
      )}
    </div>
  );
};

const StatusRow = ({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) => (
  <div className="flex items-center gap-3 text-sm">
    <span className="text-muted">{icon}</span>
    <span className="text-fg2 w-40">{label}</span>
    <span className={`font-mono text-xs ${valueClass || "text-fg"}`}>
      {value}
    </span>
  </div>
);

const ActionButton = ({
  icon,
  label,
  description,
  loading,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  loading: boolean;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={loading || disabled}
    className="w-full flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] hover:border-cyan/20 transition-all disabled:opacity-40 disabled:hover:bg-white/[0.02] disabled:hover:border-white/5 text-left"
  >
    <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center text-cyan">
      {loading ? (
        <RefreshCw size={16} className="animate-spin" />
      ) : (
        icon
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-[10px] text-muted">{description}</div>
    </div>
  </button>
);
