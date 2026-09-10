'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AtualizarSenhaPage() {
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')

    if (senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (senha !== confirmacao) {
      setErro('As senhas não coincidem.')
      return
    }

    setCarregando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setCarregando(false)

    if (error) {
      setErro('Não foi possível definir a senha. Tente novamente.')
      return
    }

    router.push('/login')
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto', display: 'grid', gap: 12 }}>
      <h1>Definir nova senha</h1>
      <input
        type="password"
        placeholder="Nova senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Confirmar senha"
        value={confirmacao}
        onChange={(e) => setConfirmacao(e.target.value)}
        required
      />
      {erro && <p style={{ color: '#c0392b' }}>{erro}</p>}
      <button type="submit" disabled={carregando}>
        {carregando ? 'Salvando...' : 'Definir senha'}
      </button>
    </form>
  )
}
