'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function AlterarSenha() {
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')

  async function alterar(e) {
    e.preventDefault()
    setMsg(''); setErro('')
    if (senha.length < 8) { setErro('A senha deve ter no mínimo 8 caracteres.'); return }
    if (senha !== confirmacao) { setErro('As senhas não conferem.'); return }
    setCarregando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setCarregando(false)
    if (error) setErro(error.message)
    else { setMsg('Senha alterada com sucesso.'); setSenha(''); setConfirmacao('') }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Alterar senha</h1>
      {msg && <p className="text-green-600 mb-4">{msg}</p>}
      {erro && <p className="text-red-600 mb-4">{erro}</p>}
      <form onSubmit={alterar} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
          <input type="password" required minLength={8} value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
          <input type="password" required minLength={8} value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <button type="submit" disabled={carregando} className="w-full font-semibold rounded-lg py-2.5 disabled:opacity-50">
          {carregando ? 'Alterando...' : 'Alterar senha'}
        </button>
      </form>
    </div>
  )
}
