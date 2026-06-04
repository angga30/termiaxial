import React, { useState } from "react";
import {
  Lock,
  Unlock,
  KeyRound,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useVaultStore } from "../../stores/vault-store";

export const VaultAuth: React.FC = () => {
  const { status, setupVault, unlockVault } = useVaultStore();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError(null);
    try {
      if (!status.initialized) {
        await setupVault(password);
      } else {
        await unlockVault(password);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-bg0 overflow-hidden">
      <div className="bg-grid" />
      <div className="bg-glow" />

      <div className="w-full max-w-md p-8 relative z-10 animate-fade-in">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center">
            <img src="/icon.png" alt="Termiaxial" className="w-16 h-16" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {status.initialized ? "Unlock Termiaxial" : "Set Master Password"}
            </h1>
            <p className="text-muted text-sm px-4">
              {status.initialized
                ? "Your vault is encrypted. Enter your master password to access your credentials."
                : "Welcome! Create a strong master password to secure your SSH keys and server data locally."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4 pt-4">
            <div className="relative group">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-cyan transition-colors"
                size={20}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                placeholder="Enter master password..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-cyan/50 focus:ring-4 focus:ring-cyan/10 transition-all text-lg font-medium"
              />
            </div>

            {error && (
              <div className="text-err text-xs font-medium bg-err/10 border border-err/20 px-4 py-2 rounded-xl animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-gradient-to-br from-cyan to-purple rounded-2xl py-4 flex items-center justify-center gap-3 text-bg0 font-bold text-lg shadow-xl shadow-cyan/20 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 transition-all cursor-pointer"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  {status.initialized ? (
                    <Unlock size={24} />
                  ) : (
                    <KeyRound size={24} />
                  )}
                  <span>
                    {status.initialized ? "Unlock Vault" : "Initialize Vault"}
                  </span>
                  <ArrowRight size={20} className="ml-1" />
                </>
              )}
            </button>
          </form>

          {!status.initialized && (
            <p className="text-[10px] text-muted italic">
              * This password is never stored on disk. If you lose it, your data
              cannot be recovered.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
