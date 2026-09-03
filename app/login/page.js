"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("E-mail ou senha incorretos. Verifique e tente novamente.");
      return;
    }
    window.location.href = "/admin";
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <div className="bg-white border border-borda rounded-2xl p-8 w-full max-w-md shadow-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-xl bg-navy flex items-center justify-center text-gold font-bold text-2xl mb-2">B</div>
          <h1 className="text-navy text-2xl font-bold">Área da Igreja</h1>
          <p className="text-gray2 text-sm">Acesso para administradores, secretaria e tesouraria.</p>
        </div>
        <form onSubmit={handleLogin}>
          <label className="block text-sm font-semibold text-navy mb-1">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-borda rounded-lg px-3 py-2.5 mb-4 focus:border-gold outline-none"
            placeholder="voce@igreja.com.br"
          />
          <label className="block text-sm font-semibold text-navy mb-1">Senha</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-borda rounded-lg px-3 py-2.5 mb-4 focus:border-gold outline-none"
            placeholder="••••••••"
          />
          {error && <p className="text-red text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-white font-bold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="text-gray2 text-xs text-center mt-4">
          Fase 1: o login usa o Supabase Auth. Crie o primeiro usuário no painel do Supabase.
        </p>
      </div>
    </main>
  );
}
