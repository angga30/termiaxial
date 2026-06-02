import React, { useEffect } from "react";
import {
  X,
  Loader2,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Globe,
  User,
  Key,
  CheckSquare,
  Square,
} from "lucide-react";
import { useImportStore } from "../../stores/import-store";

interface ImportWizardProps {
  onClose: () => void;
}

const STEP_LABELS = ["Detect", "Review", "Import", "Summary"];

export const ImportWizard: React.FC<ImportWizardProps> = ({ onClose }) => {
  const store = useImportStore();

  useEffect(() => {
    if (store.step === 0) {
      store.detectSources();
    }
  }, []);

  const handleClose = () => {
    store.reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg0/80 backdrop-blur-md p-6">
      <div className="w-full max-w-2xl bg-bg1 border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan/10 flex items-center justify-center text-cyan shadow-[0_0_15px_rgba(0,240,255,0.1)]">
              <FileSearch size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Import Wizard</h3>
              <p className="text-[10px] text-muted uppercase tracking-wider font-bold">
                Step {store.step + 1} of 4 — {STEP_LABELS[store.step]}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-white/5 rounded-lg text-muted hover:text-fg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <StepIndicator step={store.step} />

        <div className="flex-1 overflow-auto">
          {store.step <= 1 && <StepDetect />}
          {store.step === 2 && <StepReview />}
          {store.step === 3 && <StepProgress />}
        </div>

        <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3">
          {(store.step === 1 || store.step === 3) && (
            <button
              onClick={handleClose}
              className="px-5 py-2 rounded-xl text-sm font-medium text-fg2 hover:bg-white/5 transition-all"
            >
              {store.step === 3 && store.result ? "Done" : "Cancel"}
            </button>
          )}
          {store.step === 2 && (
            <>
              <button
                onClick={handleClose}
                className="px-5 py-2 rounded-xl text-sm font-medium text-fg2 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => store.importSelected()}
                disabled={store.selectedEntries.size === 0 && !store.importKeys}
                className="px-6 py-2 bg-gradient-to-br from-cyan to-purple rounded-xl text-sm font-bold text-bg0 shadow-lg shadow-cyan/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-40 disabled:hover:translate-y-0 flex items-center gap-2"
              >
                Import <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const StepIndicator: React.FC<{ step: number }> = ({ step }) => (
  <div className="px-6 py-3 border-b border-white/5 flex items-center gap-2">
    {STEP_LABELS.map((label, i) => (
      <React.Fragment key={label}>
        {i > 0 && (
          <div
            className={`flex-1 h-0.5 rounded-full transition-all ${i <= step ? "bg-cyan" : "bg-white/5"}`}
          />
        )}
        <div
          className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${i <= step ? "text-cyan" : "text-muted"}`}
        >
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] ${i < step ? "bg-cyan/20 text-cyan" : i === step ? "bg-cyan text-bg0" : "bg-white/5 text-muted"}`}
          >
            {i < step ? <CheckCircle2 size={10} /> : i + 1}
          </div>
          {label}
        </div>
      </React.Fragment>
    ))}
  </div>
);

const StepDetect: React.FC = () => {
  const { sources, isLoading, error, loadEntries } = useImportStore();

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-cyan" size={32} />
        <p className="text-sm text-fg2 animate-pulse">
          Scanning for SSH configurations...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-err/10 border border-err/20 rounded-xl text-err text-sm flex flex-col gap-2">
          <span className="font-bold uppercase text-[10px]">
            Detection Failed
          </span>
          {error}
        </div>
      </div>
    );
  }

  const detectedCount = sources.filter((s) => s.detected).length;

  return (
    <div className="p-6 space-y-4">
      <h4 className="text-sm font-semibold">Detected Sources</h4>
      {sources.length === 0 && (
        <p className="text-muted text-sm">No import sources found.</p>
      )}
      <div className="space-y-2">
        {sources.map((source) => (
          <div
            key={source.kind}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${source.detected ? "bg-ok/5 border-ok/20" : "bg-white/[0.02] border-white/5 opacity-50"}`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${source.detected ? "bg-ok/10 text-ok" : "bg-white/5 text-muted"}`}
            >
              {source.kind === "ssh_config" ? (
                <Globe size={16} />
              ) : source.kind === "ssh_keys" ? (
                <Key size={16} />
              ) : (
                <FileSearch size={16} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {source.kind === "ssh_config"
                  ? "SSH Config"
                  : source.kind === "ssh_keys"
                    ? "SSH Keys"
                    : "Known Hosts"}
              </p>
              <p className="text-[11px] text-muted font-mono truncate">
                {source.path}
              </p>
            </div>
            {source.detected ? (
              <CheckCircle2 size={18} className="text-ok" />
            ) : (
              <span className="text-[10px] text-muted uppercase">
                Not found
              </span>
            )}
          </div>
        ))}
      </div>

      {detectedCount > 0 && (
        <button
          onClick={loadEntries}
          className="w-full py-3 bg-gradient-to-br from-cyan to-purple rounded-xl text-sm font-bold text-bg0 shadow-lg shadow-cyan/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
        >
          Continue <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
};

const StepReview: React.FC = () => {
  const {
    entries,
    keys,
    selectedEntries,
    importKeys,
    toggleEntry,
    toggleAllEntries,
    setImportKeys,
    isLoading,
  } = useImportStore();

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-cyan" size={32} />
        <p className="text-sm text-fg2 animate-pulse">Loading entries...</p>
      </div>
    );
  }

  const allSelected =
    entries.length > 0 && selectedEntries.size === entries.length;

  return (
    <div className="p-6 space-y-4">
      {entries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Globe size={16} className="text-cyan" />
              SSH Config Entries ({entries.length})
            </h4>
            <button
              onClick={() => toggleAllEntries(!allSelected)}
              className="flex items-center gap-1.5 text-xs text-fg2 hover:text-cyan transition-all"
            >
              {allSelected ? (
                <CheckSquare size={14} className="text-cyan" />
              ) : (
                <Square size={14} />
              )}
              {allSelected ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="space-y-2 max-h-[40vh] overflow-auto">
            {entries.map((entry, i) => {
              const checked = selectedEntries.has(i);
              return (
                <div
                  key={i}
                  onClick={() => toggleEntry(i)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked ? "bg-cyan/5 border-cyan/20" : "bg-white/[0.02] border-white/5 hover:border-white/10"}`}
                >
                  <div className="flex-shrink-0">
                    {checked ? (
                      <CheckSquare size={18} className="text-cyan" />
                    ) : (
                      <Square size={18} className="text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 grid gap-1.5">
                    <p className="text-sm font-semibold truncate">
                      {entry.host}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-muted">
                      <span className="flex items-center gap-1">
                        <Globe size={10} /> {entry.hostname}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={10} /> {entry.user}
                      </span>
                      <span className="font-mono">:{entry.port}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {keys.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Key size={16} className="text-purple" />
              SSH Keys ({keys.length})
            </h4>
            <button
              onClick={() => setImportKeys(!importKeys)}
              className="flex items-center gap-1.5 text-xs text-fg2 hover:text-cyan transition-all"
            >
              {importKeys ? (
                <CheckSquare size={14} className="text-cyan" />
              ) : (
                <Square size={14} />
              )}
              {importKeys ? "Included" : "Include Keys"}
            </button>
          </div>

          {importKeys && (
            <div className="space-y-2">
              {keys.map((key, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl border bg-purple/5 border-purple/20"
                >
                  <Key size={16} className="text-purple" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono truncate">{key.path}</p>
                    <p className="text-[10px] text-muted">
                      {key.key_type}
                      {key.fingerprint && (
                        <span className="ml-2 font-mono">
                          {key.fingerprint.slice(0, 24)}...
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StepProgress: React.FC = () => {
  const { result, isLoading, error } = useImportStore();

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-cyan" size={32} />
        <p className="text-sm text-fg2 animate-pulse">Importing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-err/10 border border-err/20 rounded-xl text-err text-sm flex flex-col gap-2">
          <span className="font-bold uppercase text-[10px]">Import Failed</span>
          {error}
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="p-6 space-y-4">
      <h4 className="text-sm font-semibold">Import Summary</h4>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 bg-ok/5 border border-ok/20 rounded-xl text-center">
          <p className="text-2xl font-bold text-ok">{result.imported}</p>
          <p className="text-[10px] text-muted uppercase tracking-wider font-bold mt-1">
            Imported
          </p>
        </div>
        <div className="p-4 bg-warn/5 border border-warn/20 rounded-xl text-center">
          <p className="text-2xl font-bold text-warn">{result.skipped}</p>
          <p className="text-[10px] text-muted uppercase tracking-wider font-bold mt-1">
            Skipped
          </p>
        </div>
        <div className="p-4 bg-err/5 border border-err/20 rounded-xl text-center">
          <p className="text-2xl font-bold text-err">{result.errors.length}</p>
          <p className="text-[10px] text-muted uppercase tracking-wider font-bold mt-1">
            Errors
          </p>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-err flex items-center gap-1.5">
            <AlertTriangle size={14} /> Errors
          </p>
          <div className="bg-err/5 border border-err/10 rounded-xl p-3 max-h-[20vh] overflow-auto">
            {result.errors.map((err, i) => (
              <p key={i} className="text-xs text-err/80 font-mono">
                {err}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
