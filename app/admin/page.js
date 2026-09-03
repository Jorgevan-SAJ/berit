"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("ADMIN");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <p className="text-navy font-semibold mb-4">Você precisa entrar na Área da Igreja.</p>
          <a href="/login" className="bg-navy text-white font-bold px-6 py-3 rounded-lg">Ir para o login</a>
        </div>
      </main>
    );
  }

  const canSeeFinance = role === "ADMIN" || role === "TESOURARIA";
  const canSeeAgenda = role === "ADMIN" || role === "SECRETARIA";

  return (
    <main className="min-h-screen bg-cream">
      <header className="bg-navy text-white px-6 py-4 flex items-center justify-between">
        <div className="font-bold text-xl">Berit <span className="text-gold text-xs font-normal">Gestão simples para igrejas</span></div>
        <div className="text-sm">{user.email}</div>
      </header>
      <div className="max-w-6xl mx-auto px-6 py-8 grid md:grid-cols-[220px_1fr] gap-6">
        <aside className="bg-navy text-white rounded-2xl p-4 h-fit">
          <div className="text-gold text-xs mb-3">Simular perfil</div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full text-graphite text-sm rounded-lg px-3 py-2 mb-4"
          >
            <option value="ADMIN">Administrador</option>
            <option value="SECRETARIA">Secretaria</option>
            <option value="TESOURARIA">Tesouraria</option>
          </select>
          <nav className="space-y-1 text-sm">
            <div className="bg-gold text-navy font-bold rounded-lg px-3 py-2.5">📊 Dashboard</div>
            <div className="px-3 py-2.5 rounded-lg hover:bg-white/10 cursor-pointer">👥 Membros</div>
            {canSeeFinance && <div className="px-3 py-2.5 rounded-lg hover:bg-white/10 cursor-pointer">💰 Finanças</div>}
            {canSeeAgenda && <div className="px-3 py-2.5 rounded-lg hover:bg-white/10 cursor-pointer">📅 Agenda</div>}
            {role !== "TESOURARIA" && <div className="px-3 py-2.5 rounded-lg hover:bg-white/10 cursor-pointer">⚙️ Configurações</div>}
            <button onClick={handleSignOut} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/10">🚪 Sair</button>
          </nav>
        </aside>
        <section>
          <div className="bg-white border border-borda rounded-2xl p-6 mb-6">
            <h1 className="text-navy text-2xl font-bold mb-1">Dashboard</h1>
            <p className="text-gray2 text-sm">Fase 1 concluída: estrutura, banco de dados e login funcionando.</p>
          </div>
          <div className="bg-white border border-borda rounded-2xl p-6">
            <h2 className="text-navy font-bold mb-3">Próximas fases</h2>
            <ul className="text-sm space-y-2 text-graphite">
              <li>✅ Fase 1 — Fundação (estrutura, banco, login, multi-tenant)</li>
              <li>⏳ Fase 2 — Módulo público (busca, ficha da igreja, indicação)</li>
              <li>⏳ Fase 3 — Módulo administrativo (membros, finanças, agenda)</li>
              <li>⏳ Fase 4 — WhatsApp e notificações</li>
              <li>⏳ Fase 5 — Publicação e PWA instalável</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
