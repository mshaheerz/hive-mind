"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [config, setConfig] = useState({
    totalSkillBudget: 12000,
    perSkillLimit: 6000,
    contextLimit: 20000,
  });
  const [provider, setProvider] = useState("groq");
  const [localModel, setLocalModel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.config) setConfig(data.config);
        if (data.provider) setProvider(data.provider);
        if (data.localModel) setLocalModel(data.localModel);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, provider, localModel }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Settings saved! Changes take effect on next agent cycle.");
      } else {
        setMessage("Error: " + (data.error || "Failed to save"));
      }
    } catch {
      setMessage("Failed to connect to API");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-20 text-center font-display tracking-widest text-[#ffd93d]">
        LOADING CONFIG...
      </div>
    );

  return (
    <main className="min-h-screen p-8 md:p-20 font-mono text-(--text-primary)">
      <div className="mx-auto max-w-2xl bg-black/40 p-8 rounded-2xl border border-(--border-dim) backdrop-blur-xl shadow-2xl relative overflow-hidden group">
        {/* Glow effect */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-(--atlas-color)/10 rounded-full blur-[100px] group-hover:bg-(--atlas-color)/20 transition-all duration-1000" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-(--nova-color)/10 rounded-full blur-[100px] group-hover:bg-(--nova-color)/20 transition-all duration-1000" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-3xl font-extrabold font-display tracking-[0.1em] text-(--text-primary) flex items-center gap-4">
              <span className="w-3 h-10 bg-(--atlas-color) rounded-full shadow-[0_0_15px_var(--atlas-color)]" />
              SETTINGS
            </h1>
            <Link
              href="/"
              className="px-4 py-2 bg-(--border-dim) hover:bg-(--text-dim)/20 rounded-lg text-sm font-bold tracking-widest transition-all"
            >
              BACK TO HIVE
            </Link>
          </div>

          <form onSubmit={handleSave} className="space-y-10">
            {/* === Provider Section === */}
            <div className="space-y-4">
              <label className="text-sm font-bold tracking-[0.2em] text-(--text-dim) block">
                LLM PROVIDER
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["groq", "openrouter", "local"] as const).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`py-3 rounded-xl font-display font-black tracking-[0.12em] text-sm transition-all border ${
                      provider === p
                        ? "bg-(--atlas-color)/20 border-(--atlas-color) text-(--atlas-color) shadow-[0_0_15px_var(--atlas-color)]/20"
                        : "bg-black/20 border-(--border-dim) text-(--text-dim) hover:bg-white/5"
                    }`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-[0.7rem] text-(--text-dim) italic opacity-70">
                groq = Free cloud API | openrouter = Free multi-model | local =
                Ollama on your machine
              </p>
            </div>

            {/* === Local Model === */}
            {provider === "local" && (
              <div className="space-y-4 p-5 rounded-xl border border-[#ffd93d]/20 bg-[#ffd93d]/5">
                <label className="text-sm font-bold tracking-[0.2em] text-[#ffd93d] block">
                  🖥️ OLLAMA MODEL NAME
                </label>
                <input
                  type="text"
                  value={localModel}
                  onChange={(e) => setLocalModel(e.target.value)}
                  placeholder="e.g. deepseek-coder-v2, qwen2.5-coder:7b"
                  className="w-full px-4 py-3 bg-black/40 border border-(--border-dim) rounded-xl text-sm font-mono text-(--text-primary) placeholder:text-(--text-dim)/40 focus:outline-none focus:border-[#ffd93d]/50"
                />
                <p className="text-[0.7rem] text-[#ffd93d]/60 italic">
                  All agents will use the same model to prevent Ollama from
                  reloading. Model stays loaded for 30 minutes between calls.
                </p>
              </div>
            )}

            {/* === Skill Budget === */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold tracking-[0.2em] text-(--text-dim)">
                  SKILL BUDGET (CHARS)
                </label>
                <span className="text-xs text-(--atlas-color) font-bold">
                  {config.totalSkillBudget.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={config.totalSkillBudget}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    totalSkillBudget: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-(--atlas-color) border border-white/5"
              />
            </div>

            {/* === Per-Skill Limit === */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold tracking-[0.2em] text-(--text-dim)">
                  PER-SKILL LIMIT (CHARS)
                </label>
                <span className="text-xs text-(--nova-color) font-bold">
                  {config.perSkillLimit.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="30000"
                step="500"
                value={config.perSkillLimit}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    perSkillLimit: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-(--nova-color) border border-white/5"
              />
            </div>

            {/* === Context Limit === */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold tracking-[0.2em] text-(--text-dim)">
                  CONTEXT WINDOW (CHARS)
                </label>
                <span className="text-xs text-(--scout-color) font-bold">
                  {config.contextLimit.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="60000"
                step="1000"
                value={config.contextLimit}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    contextLimit: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-(--scout-color) border border-white/5"
              />
              <p className="text-[0.7rem] text-(--text-dim) italic opacity-70">
                Max workspace code sent to agents. Lower = faster + cheaper.
                Higher = more context.
              </p>
            </div>

            {/* === Save === */}
            <div className="pt-6 border-t border-white/5">
              <button
                type="submit"
                disabled={saving}
                className={`w-full py-4 rounded-xl font-display font-black tracking-[0.15em] transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] ${
                  saving
                    ? "bg-(--text-dim) cursor-not-allowed opacity-50"
                    : "bg-linear-to-r from-(--atlas-color) to-(--nova-color) hover:scale-[1.02] hover:shadow-[0_15px_40px_rgba(30,144,255,0.4)] active:scale-[0.98]"
                }`}
              >
                {saving ? "UPDATING WORKSPACE..." : "SAVE SETTINGS"}
              </button>
              {message && (
                <p
                  className={`mt-6 text-center text-sm font-bold tracking-widest ${message.includes("Error") ? "text-(--pulse-color)" : "text-(--scout-color)"}`}
                >
                  {message.toUpperCase()}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
