import React, { useEffect, useState } from "react";
import {
  Sparkles,
  X,
  Loader2,
  Command,
  Terminal as TerminalIcon,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "../../stores/settings-store";

interface AIChatModalProps {
  context: string;
  onClose: () => void;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({
  context,
  onClose,
}) => {
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const aiSettings = useSettingsStore((state) => state.ai);

  useEffect(() => {
    const analyze = async () => {
      console.log("[AI DEBUG] AIChatModal: Requesting analysis...");
      console.log("[AI DEBUG] Context length:", context.length, "characters");
      setLoading(true);
      setError(null);
      try {
        const result = await invoke<string>("ai_analyze", {
          request: {
            provider: aiSettings.provider,
            model: aiSettings.model,
            api_key: aiSettings.apiKey || null,
            custom_endpoint: aiSettings.customEndpoint || null,
            context,
          },
        });
        console.log("[AI DEBUG] AIChatModal: Analysis received successfully");
        setResponse(result);
      } catch (err) {
        console.error("[AI DEBUG] AIChatModal: Analysis failed:", err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    analyze();
  }, [context, aiSettings]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg0/80 backdrop-blur-md p-6">
      <div className="w-full max-w-2xl bg-bg1 border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden scale-in-center">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan/10 flex items-center justify-center text-cyan shadow-[0_0_15px_rgba(0,240,255,0.1)]">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">AI Assistant</h3>
              <p className="text-[10px] text-muted uppercase tracking-wider font-bold">
                Analyzing Terminal Output
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/5 rounded-lg text-muted hover:text-fg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-cyan" size={32} />
              <p className="text-sm text-fg2 animate-pulse">
                Consulting the oracle...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-err/10 border border-err/20 rounded-xl text-err text-sm flex flex-col gap-2">
              <span className="font-bold uppercase text-[10px]">
                Error occurred
              </span>
              {error}
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-sans text-fg/90">
              {response}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] text-muted">
            <div className="flex items-center gap-1.5">
              <TerminalIcon size={12} /> {aiSettings.provider}
            </div>
            <div className="flex items-center gap-1.5">
              <Command size={12} /> {aiSettings.model}
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
