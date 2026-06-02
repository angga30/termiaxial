import React, { useState, useMemo } from "react";
import {
  X,
  Terminal,
  ChevronRight,
} from "lucide-react";
import {
  extractVariables,
  interpolateSnippet,
} from "../../utils/snippet";

interface VariablePromptProps {
  template: string;
  onSubmit: (interpolated: string) => void;
  onCancel: () => void;
}

export const VariablePrompt: React.FC<VariablePromptProps> = ({
  template,
  onSubmit,
  onCancel,
}) => {
  const variables = useMemo(() => extractVariables(template), [template]);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const v of variables) {
      init[v] = "";
    }
    return init;
  });

  const allFilled = variables.every((v) => values[v].trim().length > 0);

  const handleSubmit = () => {
    if (!allFilled) return;
    onSubmit(interpolateSnippet(template, values));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg0/80 backdrop-blur-md p-6">
      <div className="w-full max-w-lg bg-bg1 border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan/10 flex items-center justify-center text-cyan shadow-[0_0_15px_rgba(0,240,255,0.1)]">
              <Terminal size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Snippet Variables</h3>
              <p className="text-[10px] text-muted uppercase tracking-wider font-bold">
                Fill in {variables.length} variable{variables.length !== 1 && "s"}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-white/5 rounded-lg text-muted hover:text-fg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
            <p className="text-[10px] text-muted uppercase tracking-wider font-bold mb-1">
              Template
            </p>
            <p className="text-xs font-mono text-fg2 break-all">
              {template}
            </p>
          </div>

          <div className="space-y-3">
            {variables.map((name) => (
              <div key={name} className="space-y-1.5">
                <label className="text-xs font-medium text-fg2 ml-1 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-cyan/10 text-cyan rounded text-[10px] font-mono">
                    {name}
                  </span>
                </label>
                <input
                  value={values[name]}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [name]: e.target.value }))
                  }
                  placeholder={`Value for ${name}`}
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-cyan/50 focus:ring-4 focus:ring-cyan/10 transition-all font-mono"
                  autoFocus={variables[0] === name}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && allFilled) handleSubmit();
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-xl text-sm font-medium text-fg2 hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!allFilled}
            className="px-6 py-2 bg-gradient-to-br from-cyan to-purple rounded-xl text-sm font-bold text-bg0 shadow-lg shadow-cyan/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:hover:translate-y-0 flex items-center gap-2"
          >
            Run <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
