import React, { useEffect } from "react";
import { Sparkles, ShieldCheck, Globe, Cpu } from "lucide-react";
import { useSettingsStore } from "../../stores/settings-store";

export const AiSettings: React.FC = () => {
  const { ai, loadSettings, setAiSetting, isLoading } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (isLoading)
    return (
      <div className="p-8 text-muted animate-pulse font-mono text-sm">
        Loading metadata...
      </div>
    );

  return (
    <div className="flex-1 overflow-auto p-8 max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Sparkles className="text-cyan" size={28} /> AI Assistant Settings
        </h2>
        <p className="text-muted text-sm">
          Configure your Bring-Your-Own-Key (BYOK) providers for terminal
          analysis.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Provider Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-fg2 ml-1">
            LLM Provider
          </label>
          <div className="grid grid-cols-2 gap-3">
            <ProviderCard
              active={ai.provider === "openai"}
              onClick={() => setAiSetting("provider", "openai")}
              title="OpenAI"
              desc="GPT-4o, GPT-3.5"
            />
            <ProviderCard
              active={ai.provider === "openai-compatible"}
              onClick={() => setAiSetting("provider", "openai-compatible")}
              title="OpenAI Compatible"
              desc="LM Studio, Groq, vLLM"
            />
            <ProviderCard
              active={ai.provider === "ollama"}
              onClick={() => setAiSetting("provider", "ollama")}
              title="Ollama"
              desc="Local Llama3, Mistral"
            />
            <ProviderCard
              active={ai.provider === "anthropic"}
              onClick={() => setAiSetting("provider", "anthropic")}
              title="Anthropic"
              desc="Claude 3.5 Sonnet"
            />
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-fg2">Model Name</label>
            <div className="relative">
              <Cpu
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                size={16}
              />
              <input
                value={ai.model}
                onChange={(e) => setAiSetting("model", e.target.value)}
                placeholder={ai.provider === "ollama" ? "llama3" : "gpt-4o"}
                className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-cyan/50 focus:ring-4 focus:ring-cyan/10 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-fg2">API Key</label>
            <div className="relative">
              <ShieldCheck
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                size={16}
              />
              <input
                type="password"
                value={ai.apiKey}
                onChange={(e) => setAiSetting("apiKey", e.target.value)}
                placeholder="sk-..."
                className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-cyan/50 focus:ring-4 focus:ring-cyan/10 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-fg2">
              Custom Endpoint (Optional)
            </label>
            <div className="relative">
              <Globe
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                size={16}
              />
              <input
                value={ai.customEndpoint}
                onChange={(e) => setAiSetting("customEndpoint", e.target.value)}
                placeholder="http://localhost:1234/v1"
                className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-cyan/50 focus:ring-4 focus:ring-cyan/10 transition-all"
              />
            </div>
            <p className="text-[10px] text-muted ml-1 italic">
              * Leave empty to use official provider endpoints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProviderCard = ({ active, onClick, title, desc }: any) => (
  <div
    onClick={onClick}
    className={`p-4 rounded-xl border cursor-pointer transition-all ${
      active
        ? "bg-cyan/10 border-cyan text-cyan"
        : "bg-white/5 border-white/5 hover:bg-white/10"
    }`}
  >
    <div className="text-sm font-bold">{title}</div>
    <div className={`text-[10px] ${active ? "text-cyan/70" : "text-muted"}`}>
      {desc}
    </div>
  </div>
);
