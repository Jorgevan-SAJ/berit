'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const [modo, setModo] = useState('login')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar(e) {
    e.preventDefault()
    setErro('')
    setAviso('')
    setCarregando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setCarregando(false)
    if (error) {
      setErro('E-mail ou senha incorretos. Verifique e tente novamente.')
    } else {
      window.location.href = '/area'
    }
  }

  async function enviarLink(e) {
    e.preventDefault()
    setErro('')
    setAviso('')
    setCarregando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://berit-s36t.vercel.app/redefinir-senha',
    })
    setCarregando(false)
    if (error) {
      setErro('Não foi possível enviar o link. Verifique se o e-mail está correto.')
    } else {
      setAviso('Enviamos um link de recuperação para o seu e-mail. Confira a caixa de entrada e também o spam.')
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

        {modo === 'login' ? (
          <form onSubmit={entrar}>
            <h1 style={{ fontSize: 20, color: '#1F3A5F', margin: '0 0 4px' }}>Área da Igreja</h1>
            <p style={{ fontSize: 13, color: '#8A8A8A', margin: '0 0 20px' }}>
              Acesso para administradores, secretaria e tesouraria.
            </p>

            <label style={{ fontSize: 13, color: '#2E2E2E', display: 'block', marginBottom: 6 }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, marginBottom: 16, boxSizing: 'border-box' }}
            />

            <label style={{ fontSize: 13, color: '#2E2E2E', display: 'block', marginBottom: 6 }}>
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha"
              required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, marginBottom: 16, boxSizing: 'border-box' }}
            />

            {erro && (
              <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              style={{ width: '100%', padding: '12px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => { setModo('recuperar'); setErro(''); setAviso('') }}
                style={{ background: 'none', border: 'none', color: '#1F3A5F', textDecoration: 'underline', fontSize: 13, cursor: 'pointer' }}
              >
                Esqueci minha senha
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={enviarLink}>
            <h1 style={{ fontSize: 20, color: '#1F3A5F', margin: '0 0 4px' }}>Recuperar senha</h1>
            <p style={{ fontSize: 13, color: '#8A8A8A', margin: '0 0 20px' }}>
              Digite seu e-mail e enviaremos um link para criar uma nova senha.
            </p>

            <label style={{ fontSize: 13, color: '#2E2E2E', display: 'block', marginBottom: 6 }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
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
              {carregando ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => { setModo('login'); setErro(''); setAviso('') }}
                style={{ background: 'none', border: 'none', color: '#1F3A5F', textDecoration: 'underline', fontSize: 13, cursor: 'pointer' }}
              >
                Voltar para o login
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
