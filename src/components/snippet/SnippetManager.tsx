import React, { useEffect, useState } from "react";
import { Plus, Trash2, Terminal, Tag } from "lucide-react";
import { useSnippetStore } from "../../stores/snippet-store";

export const SnippetManager: React.FC = () => {
  const { snippets, loadSnippets, addSnippet, deleteSnippet } = useSnippetStore();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    command: "",
    description: "",
    tags: "",
    host_id: null as string | null,
  });

  useEffect(() => {
    loadSnippets();
  }, [loadSnippets]);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.command.trim()) return;
    await addSnippet({
      name: formData.name.trim(),
      command: formData.command.trim(),
      description: formData.description.trim(),
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      host_id: formData.host_id,
    });
    setFormData({ name: "", command: "", description: "", tags: "", host_id: null });
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    await deleteSnippet(id);
    setDeleteId(null);
  };

  return (
    <div className="flex-1 overflow-auto p-8 max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Terminal className="text-cyan" size={28} /> Snippet Manager
        </h2>
        <p className="text-muted text-sm">
          Create and manage reusable command snippets.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">
          {snippets.length} snippet{snippets.length !== 1 && "s"}
        </span>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan/10 border border-cyan/20 rounded-xl text-sm text-cyan hover:bg-cyan/20 transition-all"
        >
          <Plus size={16} /> New Snippet
        </button>
      </div>

      {showForm && (
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-fg2 ml-1">Name</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Check Disk Usage"
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-cyan/50 focus:ring-4 focus:ring-cyan/10 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-fg2 ml-1">Command</label>
            <textarea
              value={formData.command}
              onChange={(e) => setFormData({ ...formData, command: e.target.value })}
              placeholder="df -h {MOUNT} && du -sh {DIR}"
              rows={3}
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-sm font-mono outline-none focus:border-cyan/50 focus:ring-4 focus:ring-cyan/10 transition-all resize-none"
            />
            <p className="text-[10px] text-muted ml-1 italic">
              Use {"{VAR}"} syntax for variable placeholders.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-fg2 ml-1">
              Description
            </label>
            <input
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Check disk usage on a mount point"
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-cyan/50 focus:ring-4 focus:ring-cyan/10 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-fg2 ml-1">
              Tags (comma-separated)
            </label>
            <input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="disk, monitoring"
              className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-cyan/50 focus:ring-4 focus:ring-cyan/10 transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2 rounded-xl text-sm font-medium text-fg2 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.name.trim() || !formData.command.trim()}
              className="px-6 py-2 bg-gradient-to-br from-cyan to-purple rounded-xl text-sm font-bold text-bg0 shadow-lg disabled:opacity-40 transition-all"
            >
              Add Snippet
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {snippets.map((snippet) => (
          <div
            key={snippet.id}
            className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-start gap-4 group hover:border-white/10 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center text-cyan flex-shrink-0 mt-0.5">
              <Terminal size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{snippet.name}</div>
              <div className="text-xs font-mono text-fg2 mt-1 break-all">
                {snippet.command}
              </div>
              {snippet.description && (
                <div className="text-[10px] text-muted mt-1">
                  {snippet.description}
                </div>
              )}
              {snippet.tags.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <Tag size={10} className="text-muted" />
                  {snippet.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-muted font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setDeleteId(snippet.id)}
              className="p-2 rounded-lg text-muted hover:text-err hover:bg-err/10 transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        {snippets.length === 0 && (
          <div className="p-8 text-center text-muted text-sm">
            No snippets yet. Click "New Snippet" to create one.
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-bg0/80 backdrop-blur-md p-6">
          <div className="w-full max-w-sm bg-bg1 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold">Delete Snippet</h3>
            <p className="text-sm text-muted">
              Are you sure you want to delete this snippet? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-5 py-2 rounded-xl text-sm font-medium text-fg2 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-5 py-2 bg-err/20 border border-err/30 rounded-xl text-sm font-bold text-err hover:bg-err/30 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
