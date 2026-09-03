'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function RedefinirSenha() {
  const [sessao, setSessao] = useState(null)
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_evento, sessaoAtual) => {
      setSessao(sessaoAtual)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    setAviso('')
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (senha !== confirmar) {
      setErro('As senhas não coincidem. Verifique e tente novamente.')
      return
    }
    setCarregando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setCarregando(false)
    if (error) {
      setErro('Não foi possível atualizar a senha. Tente novamente.')
    } else {
      setAviso('Senha atualizada com sucesso! Redirecionando para o login...')
      setTimeout(() => { window.location.href = '/login' }, 2500)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif", padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#FFFFFF', borderRadius: 12, padding: '2rem', boxShadow: '0 4px 24px rgba(31,58,95,0.08)', border: '1px solid #E4DED2' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#1F3A5F', letterSpacing: '-0.02em' }}>
            Berit
          </div>
          <div style={{ fontSize: 13, color: '#8A8A8A', marginTop: 4 }}>
            Gestão simples para igrejas
          </div>
        </div>

        {!sessao ? (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 20, color: '#1F3A5F', margin: '0 0 8px' }}>Criar nova senha</h1>
            <p style={{ fontSize: 13, color: '#8A8A8A', margin: '0 0 16px' }}>
              Aguarde um instante, estamos validando o link recebido...
            </p>
            <div style={{ fontSize: 13, color: '#8A8A8A' }}>Carregando</div>
          </div>
        ) : (
          <form onSubmit={salvar}>
            <h1 style={{ fontSize: 20, color: '#1F3A5F', margin: '0 0 4px' }}>Criar nova senha</h1>
            <p style={{ fontSize: 13, color: '#8A8A8A', margin: '0 0 20px' }}>
              Defina uma nova senha para acessar a Área da Igreja.
            </p>

            <label style={{ fontSize: 13, color: '#2E2E2E', display: 'block', marginBottom: 6 }}>
              Nova senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
              required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, marginBottom: 16, boxSizing: 'border-box' }}
            />

            <label style={{ fontSize: 13, color: '#2E2E2E', display: 'block', marginBottom: 6 }}>
              Confirmar nova senha
            </label>
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Repita a nova senha"
              required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, marginBottom: 16, boxSizing: 'border-box' }}
            />

            {erro && (
              <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                {erro}
              </div>
            )}

            {aviso && (
              <div style={{ background: '#EAF4EE', color: '#4C8C6E', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                {aviso}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              style={{ width: '100%', padding: '12px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
            >
              {carregando ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
