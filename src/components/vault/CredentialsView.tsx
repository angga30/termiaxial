import React, { useState } from "react";
import {
  Key,
  User,
  Globe,
  Edit2,
  Trash2,
  Shield,
  Plus,
  Search,
  ChevronRight,
} from "lucide-react";
import { useVaultStore, Credential } from "../../stores/vault-store";

interface CredentialsViewProps {
  onEdit: (cred: Credential) => void;
  onAdd: () => void;
}

export const CredentialsView: React.FC<CredentialsViewProps> = ({
  onEdit,
  onAdd,
}) => {
  const { credentials, deleteCredential } = useVaultStore();
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = credentials.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.host?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.user?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteCredential(id);
      } catch (err) {
        alert("Failed to delete: " + err);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-bg0 overflow-hidden animate-fade-in">
      <header className="p-8 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Shield className="text-cyan" size={28} /> Managed Credentials
          </h2>
          <p className="text-muted text-sm mt-1">
            Add, edit, or remove your secure server configurations.
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-cyan to-purple rounded-xl text-sm font-bold text-bg0 shadow-lg shadow-cyan/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          <Plus size={18} /> Add New
        </button>
      </header>

      <div className="px-8 py-2">
        <div className="relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-cyan transition-colors"
            size={18}
          />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, host or username..."
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-cyan/50 focus:ring-4 focus:ring-cyan/10 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8 pt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-max">
        {filtered.map((cred) => (
          <div
            key={cred.id}
            className="bg-bg1 border border-white/5 rounded-2xl p-5 hover:border-cyan/30 hover:bg-white/[0.02] transition-all group relative overflow-hidden flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${cred.type === "ssh" ? "bg-purple/10 text-purple" : "bg-cyan/10 text-cyan"}`}
                >
                  <Key size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm truncate max-w-[150px]">
                    {cred.name}
                  </h4>
                  <span className="text-[10px] uppercase tracking-wider text-muted font-bold">
                    {cred.type}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(cred)}
                  className="p-2 hover:bg-white/5 rounded-lg text-muted hover:text-cyan transition-all"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(cred.id, cred.name)}
                  className="p-2 hover:bg-white/5 rounded-lg text-muted hover:text-err transition-all"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="grid gap-2 bg-black/20 p-3 rounded-xl border border-white/[0.02]">
              <div className="flex items-center gap-3 text-[11px]">
                <Globe size={14} className="text-muted" />
                <span className="text-muted w-12">Host</span>
                <span className="font-mono text-fg2 truncate">
                  {cred.host || "-"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <User size={14} className="text-muted" />
                <span className="text-muted w-12">User</span>
                <span className="font-mono text-fg2 truncate">
                  {cred.user || "-"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto pt-2 text-[10px] text-muted font-mono">
              <span>Added: {new Date(cred.added_at).toLocaleDateString()}</span>
              <ChevronRight size={12} />
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted">
            <Search size={48} strokeWidth={1} className="mb-4 opacity-20" />
            <p>No matching credentials found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
