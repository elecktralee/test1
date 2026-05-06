import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { adminApi } from "../../utils/api";
import { storage, STORAGE_KEYS } from "../../utils/storage";
import { User, Lock, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = storage.get<string>(STORAGE_KEYS.ADMIN_TOKEN);
    if (token) navigate("/admin/dashboard");
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.login(username.trim(), password);
      storage.set(STORAGE_KEYS.ADMIN_TOKEN, res.token);
      navigate("/admin/dashboard");
    } catch (_err: any) {
      setError("Usuário ou senha incorretos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      {/* Background subtle gradient */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.35) 0%, transparent 60%), " +
            "radial-gradient(ellipse at 75% 80%, rgba(16,185,129,0.2) 0%, transparent 55%)",
        }}
      />

      <div className="relative max-w-sm w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            <span className="text-white text-xl font-black">CS</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CyberStudy</h1>
          <p className="text-slate-400 text-sm mt-1">Painel de Análise de Dados</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl p-7 border border-slate-700 shadow-2xl">
          <h2 className="text-white font-bold text-lg mb-1">Acesso Restrito</h2>
          <p className="text-slate-400 text-xs mb-6">
            Área exclusiva da equipe de pesquisa
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Usuário
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 select-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  placeholder="nome de usuário"
                  autoComplete="username"
                  autoFocus
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 select-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl pl-9 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-xs font-medium select-none"
                  tabIndex={-1}
                >
                  {showPassword ? "ocultar" : "ver"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-900/40 border border-red-700/60 text-red-300 rounded-xl p-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Entrando...
                </span>
              ) : (
                "Entrar →"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          Acesso restrito à equipe de pesquisa · USP Ribeirão Preto
        </p>
      </div>
    </div>
  );
}