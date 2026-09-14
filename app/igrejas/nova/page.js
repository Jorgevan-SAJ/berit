'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function NovaIgreja() {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', termos: false })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (!form.termos) {
      setErro('Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.')
      return
    }

    setCarregando(true)

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.senha,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: { nome_igreja: form.nome },
      },
    })

    if (error || !data.user) {
      setErro(error?.message || 'Não foi possível criar a conta. Verifique os dados e tente novamente.')
      setCarregando(false)
      return
    }

    const { error: rpcError } = await supabase.rpc('criar_igreja', {
      p_nome: form.nome,
      p_email: form.email,
      p_user_id: data.user.id,
      p_termos_aceitos: form.termos,
    })

    if (rpcError) {
      setErro('Conta criada, mas o ambiente da igreja não pôde ser provisionado. Entre em contato pelo Fale conosco.')
      setCarregando(false)
      return
    }

    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Quase lá!</h1>
          <p className="text-gray-600 mb-4">
            Enviamos um link de confirmação para <strong>{form.email}</strong>.
            Clique no link para ativar sua conta e acessar o Berit.
          </p>
          <p className="text-sm text-gray-500">
            Não recebeu? Verifique a caixa de spam ou tente novamente em alguns minutos.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-1">Cadastre sua igreja</h1>
        <p className="text-gray-500 text-sm mb-6">60 dias grátis, sem cartão de crédito.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da igreja</label>
            <input
              type="text"
              required
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
              placeholder="Ex.: Igreja Batista Central"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail do administrador</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
              placeholder="voce@igreja.com.br"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
              placeholder="Mínimo de 8 caracteres"
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.termos}
              onChange={(e) => setForm({ ...form, termos: e.target.checked })}
              className="mt-1"
            />
            <span>
              Li e aceito os <a href="/termos" className="underline">Termos de Uso</a> e a{' '}
              <a href="/privacidade" className="underline">Política de Privacidade</a> (LGPD).
            </span>
          </label>

          {erro && <p className="text-red-600 text-sm">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full font-semibold rounded-lg py-2.5 disabled:opacity-50"
          >
            {carregando ? 'Criando conta...' : 'Criar conta e igreja'}
          </button>
        </form>
      </div>
    </div>
  )
}
