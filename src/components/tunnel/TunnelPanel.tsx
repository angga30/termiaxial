import React, { useEffect, useState } from "react";
import { Plus, X, Cable, Loader2, ArrowRight } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useTerminalStore } from "../../stores/terminal-store";

interface TunnelInfo {
  id: string;
  name: string;
  tunnel_type: string;
  local_port: number;
  remote_host: string;
  remote_port: number;
  session_id: string;
  active: boolean;
}

export const TunnelPanel: React.FC = () => {
  const [tunnels, setTunnels] = useState<TunnelInfo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const sessions = useTerminalStore((s) => s.sessions);

  const [form, setForm] = useState({
    name: "",
    local_port: "",
    remote_host: "127.0.0.1",
    remote_port: "",
    session_id: "",
  });

  const refresh = async () => {
    try {
      const list = await invoke<TunnelInfo[]>("list_tunnels");
      setTunnels(list);
    } catch (err) {
      console.error("Failed to list tunnels:", err);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.local_port || !form.remote_port || !form.session_id) return;
    setLoading(true);
    try {
      await invoke("create_tunnel", {
        config: {
          id: crypto.randomUUID(),
          name: form.name,
          tunnel_type: "Local",
          local_port: parseInt(form.local_port),
          remote_host: form.remote_host,
          remote_port: parseInt(form.remote_port),
          session_id: form.session_id,
          credential_id: null,
        },
      });
      setForm({ name: "", local_port: "", remote_host: "127.0.0.1", remote_port: "", session_id: "" });
      setShowForm(false);
      await refresh();
    } catch (err) {
      alert("Failed to create tunnel: " + err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (id: string) => {
    try {
      await invoke("close_tunnel", { tunnelId: id });
      await refresh();
    } catch (err) {
      console.error("Failed to close tunnel:", err);
    }
  };

  const connectedSessions = sessions.filter((s) => s.status === "connected");

  return (
    <div className="flex-1 overflow-auto p-8 max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Cable className="text-cyan" size={28} /> SSH Tunnels
        </h2>
        <p className="text-muted text-sm">
          Local port forwarding — route traffic through your SSH connections.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">
          {tunnels.length} active tunnel{tunnels.length !== 1 && "s"}
        </span>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={connectedSessions.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-cyan/10 border border-cyan/20 rounded-xl text-sm text-cyan hover:bg-cyan/20 transition-all disabled:opacity-40"
        >
          <Plus size={16} /> New Tunnel
        </button>
      </div>

      {connectedSessions.length === 0 && (
        <div className="p-4 bg-warn/10 border border-warn/20 rounded-xl text-sm text-warn">
          Connect to a server first to create tunnels.
        </div>
      )}

      {showForm && (
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-fg2 ml-1">Tunnel Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. MySQL Prod"
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-cyan/50 focus:ring-4 focus:ring-cyan/10 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-fg2 ml-1">SSH Session</label>
            <select
              value={form.session_id}
              onChange={(e) => setForm({ ...form, session_id: e.target.value })}
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-3 text-sm outline-none focus:border-cyan/50 transition-all"
            >
              <option value="">Select connected session…</option>
              {connectedSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.host})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-medium text-fg2 ml-1">Local Port</label>
              <input
                value={form.local_port}
                onChange={(e) => setForm({ ...form, local_port: e.target.value })}
                placeholder="3306"
                type="number"
                className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-sm font-mono outline-none focus:border-cyan/50 transition-all"
              />
            </div>
            <ArrowRight size={20} className="text-muted mt-6" />
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-medium text-fg2 ml-1">Remote Host</label>
              <input
                value={form.remote_host}
                onChange={(e) => setForm({ ...form, remote_host: e.target.value })}
                placeholder="127.0.0.1"
                className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-sm font-mono outline-none focus:border-cyan/50 transition-all"
              />
            </div>
            <div className="w-28 space-y-1.5">
              <label className="text-xs font-medium text-fg2 ml-1">Port</label>
              <input
                value={form.remote_port}
                onChange={(e) => setForm({ ...form, remote_port: e.target.value })}
                placeholder="3306"
                type="number"
                className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-sm font-mono outline-none focus:border-cyan/50 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2 rounded-xl text-sm font-medium text-fg2 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || !form.name || !form.local_port || !form.remote_port || !form.session_id}
              className="px-6 py-2 bg-gradient-to-br from-cyan to-purple rounded-xl text-sm font-bold text-bg0 shadow-lg disabled:opacity-40 transition-all flex items-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Create Tunnel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {tunnels.map((t) => (
          <div
            key={t.id}
            className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-4 group hover:border-white/10 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center text-cyan flex-shrink-0">
              <Cable size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold flex items-center gap-2">
                {t.name}
                <span className="px-1.5 py-0.5 bg-ok/10 text-ok rounded text-[9px] font-bold uppercase">Active</span>
              </div>
              <div className="text-xs font-mono text-fg2 mt-0.5">
                localhost:{t.local_port} → {t.remote_host}:{t.remote_port}
              </div>
            </div>
            <button
              onClick={() => handleClose(t.id)}
              className="p-2 rounded-lg text-muted hover:text-err hover:bg-err/10 transition-all opacity-0 group-hover:opacity-100"
              title="Close tunnel"
            >
              <X size={16} />
            </button>
          </div>
        ))}

        {tunnels.length === 0 && !showForm && (
          <div className="p-8 text-center text-muted text-sm">
            No active tunnels. Click "New Tunnel" to create one.
          </div>
        )}
      </div>
    </div>
  );
};
