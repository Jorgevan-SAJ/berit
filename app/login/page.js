'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  async function entrar(e) {
    e.preventDefault()
    setErro('')
    setAviso('')
    if (!email.trim() || !senha) {
      setErro('Informe seu e-mail e sua senha.')
      return
    }
    setCarregando(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    })
    setCarregando(false)
    if (error) {
      setErro('E-mail ou senha inválidos. Verifique e tente novamente.')
    } else {
      window.location.href = '/area'
    }
  }

  async function recuperarSenha() {
    setErro('')
    setAviso('')
    const emailDigitado = email.trim().toLowerCase()
    if (!emailDigitado) {
      setErro('Informe seu e-mail para receber o link de recuperação.')
      return
    }
    setCarregando(true)

    // 1) Verifica se o e-mail existe na base antes de enviar
    let cadastrado = true
    try {
      const resposta = await fetch('/api/verificar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailDigitado }),
      })
      const dados = await resposta.json()
      cadastrado = dados.cadastrado
    } catch (erroRede) {
      cadastrado = true // se a verificação falhar, tenta enviar normalmente
    }

    if (!cadastrado) {
      setCarregando(false)
      setErro('Este e-mail não consta na nossa base de dados.')
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(emailDigitado, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    })
    setCarregando(false)

    if (error) {
      if (error.status === 429) {
        setErro('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
      } else {
        setErro('Não foi possível enviar o e-mail de recuperação.')
      }
    } else {
      setAviso('Enviamos um link de recuperação para o seu e-mail. Verifique sua caixa de entrada.')
    }
  }

  const estilo = {
    main: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif", padding: '1rem' },
    card: { background: '#FFFFFF', borderRadius: 16, padding: '2rem', maxWidth: 400, width: '100%', border: '1px solid #E4DED2', boxShadow: '0 4px 24px rgba(31,58,95,0.08)' },
    logo: { textAlign: 'center', fontSize: 32, fontWeight: 700, color: '#1F3A5F', letterSpacing: '-0.02em', marginBottom: 4 },
    subtitulo: { textAlign: 'center', fontSize: 13, color: '#8A8A8A', margin: '0 0 1.5rem' },
    rotulo: { fontSize: 13, color: '#2E2E2E', display: 'block', marginBottom: 6 },
    campo: { width: '100%', padding: '11px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
    botao: { width: '100%', padding: '12px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
    link: { color: '#1F3A5F', fontSize: 13, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  }

  return (
    <main style={estilo.main}>
      <div style={estilo.card}>
        <div style={estilo.logo}>Berit</div>
        <p style={estilo.subtitulo}>Acesse a área da igreja</p>
        {erro && (
          <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>
        )}
        {aviso && (
          <div style={{ background: '#EAF4EE', color: '#4C8C6E', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{aviso}</div>
        )}
        <form onSubmit={entrar}>
          <label style={estilo.rotulo}>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            style={{ ...estilo.campo, marginBottom: 16 }}
            autoComplete="email"
          />
          <label style={estilo.rotulo}>Senha</label>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha"
              style={{ ...estilo.campo, paddingRight: 44 }}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {mostrarSenha ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A8A8A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A8A8A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button type="button" onClick={recuperarSenha} style={estilo.link} disabled={carregando}>
              Esqueci minha senha
            </button>
          </div>
          <button type="submit" disabled={carregando} style={{ ...estilo.botao, opacity: carregando ? 0.6 : 1 }}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}
