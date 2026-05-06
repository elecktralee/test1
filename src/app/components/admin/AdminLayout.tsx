import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { storage, STORAGE_KEYS } from "../../utils/storage";

interface NavItem {
  path: string;
  label: string;
  icon: string;
  group?: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/admin/dashboard", label: "Dashboard", icon: "📊", group: "geral" },
  { path: "/admin/participants", label: "Participantes", icon: "👥", group: "dados" },
  { path: "/admin/sociodemografico", label: "Sociodemográfico", icon: "📋", group: "dados" },
  { path: "/admin/css33", label: "CSS-33", icon: "🌐", group: "escalas" },
  { path: "/admin/bai", label: "BAI", icon: "💭", group: "escalas" },
  { path: "/admin/gse", label: "GSE", icon: "💪", group: "escalas" },
  { path: "/admin/igt", label: "IGT — Visualizador", icon: "🎴", group: "igt" },
  { path: "/admin/igt-summary", label: "IGT — Resumo", icon: "🃏", group: "igt" },
  { path: "/admin/igt-trials", label: "IGT — Tentativas", icon: "🎯", group: "igt" },
];

const GROUP_LABELS: Record<string, string> = {
  geral: "Geral",
  dados: "Dados dos Participantes",
  escalas: "Escalas Psicológicas",
  igt: "Iowa Gambling Task",
};

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = storage.get<string>(STORAGE_KEYS.ADMIN_TOKEN);
    if (!token) navigate("/admin");
  }, [navigate]);

  const handleLogout = () => {
    storage.remove(STORAGE_KEYS.ADMIN_TOKEN);
    navigate("/admin");
  };

  const groups = [...new Set(NAV_ITEMS.map(i => i.group!))];

  const Sidebar = () => (
    <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            CS
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">CyberStudy</p>
            <p className="text-slate-400 text-xs">Painel de Dados</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {groups.map(group => {
          const items = NAV_ITEMS.filter(i => i.group === group);
          return (
            <div key={group} className="mb-4">
              <p className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider px-3 mb-1">
                {GROUP_LABELS[group]}
              </p>
              {items.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-0.5 transition-all text-left ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition-all"
        >
          <span>🚪</span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - desktop */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar - mobile */}
      {sidebarOpen && (
        <div className="fixed inset-y-0 left-0 z-50 flex lg:hidden">
          <Sidebar />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <button
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <h1 className="text-lg font-semibold text-slate-800">
            {NAV_ITEMS.find(i => i.path === location.pathname)?.label || "Dashboard"}
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Admin
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}