'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function PrimeiroAcessoPage() {
  const [verificando, setVerificando] = useState(true)
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [concluido, setConcluido] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user
      if (!user) {
        window.location.href = '/login'
        return
      }
      if (!user.app_metadata?.primeiro_acesso) {
        window.location.href = '/area'
        return
      }
      setVerificando(false)
    })
  }, [])

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    if (senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (senha !== confirmar) {
      setErro('As duas senhas não conferem.')
      return
    }
    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) {
      setSalvando(false)
      setErro('Não foi possível salvar a senha. Tente novamente.')
      return
    }
    // Limpa a marcação de primeiro acesso (só o servidor pode)
    try {
      const { data: sessao } = await supabase.auth.getSession()
      await fetch('/api/concluir-primeiro-acesso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessao?.session?.access_token || ''}`,
        },
      })
    } catch (erroRede) {
      // Se falhar, o usuário apenas verá esta tela novamente no próximo login
    }
    setSalvando(false)
    setConcluido(true)
  }

  const estilo = {
    main: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif", padding: '1rem' },
    card: { background: '#FFFFFF', borderRadius: 16, padding: '2rem', maxWidth: 400, width: '100%', border: '1px solid #E4DED2', boxShadow: '0 4px 24px rgba(31,58,95,0.08)' },
    logo: { textAlign: 'center', fontSize: 32, fontWeight: 700, color: '#1F3A5F', letterSpacing: '-0.02em', marginBottom: 4 },
    subtitulo: { textAlign: 'center', fontSize: 15, fontWeight: 600, color: '#1F3A5F', margin: '0 0 1rem' },
    rotulo: { fontSize: 13, color: '#2E2E2E', display: 'block', marginBottom: 6 },
    campo: { width: '100%', padding: '11px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
    botao: { width: '100%', padding: '12px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  }

  if (verificando) {
    return (
      <main style={estilo.main}>
        <div style={estilo.card}>
          <div style={estilo.logo}>Berit</div>
          <p style={estilo.subtitulo}>Verificando...</p>
        </div>
      </main>
    )
  }

  return (
    <main style={estilo.main}>
      <div style={estilo.card}>
        <div style={estilo.logo}>Berit</div>
        {concluido ? (
          <>
            <p style={estilo.subtitulo}>Senha criada com sucesso! 🎉</p>
            <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px', textAlign: 'center' }}>
              Sua senha pessoal está pronta e a senha provisória deixou de valer.
            </p>
            <button onClick={() => { window.location.href = '/area' }} style={estilo.botao}>
              Entrar no Berit
            </button>
          </>
        ) : (
          <>
            <p style={estilo.subtitulo}>Crie sua nova senha</p>
            <p style={{ fontSize: 13, color: '#5A5A5A', margin: '0 0 16px', textAlign: 'center' }}>
              Este é o seu primeiro acesso. Por segurança, crie uma senha pessoal para continuar.
            </p>
            {erro && (
              <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>
            )}
            <form onSubmit={salvar}>
              <label style={estilo.rotulo}>Nova senha</label>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                style={{ ...estilo.campo, marginBottom: 16 }}
                autoComplete="new-password"
              />
              <label style={estilo.rotulo}>Confirmar nova senha</label>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repita a senha"
                style={{ ...estilo.campo, marginBottom: 12 }}
                autoComplete="new-password"
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#5A5A5A', marginBottom: 16 }}>
                <input type="checkbox" checked={mostrarSenha} onChange={(e) => setMostrarSenha(e.target.checked)} />
                Mostrar senhas
              </label>
              <button type="submit" disabled={salvando} style={{ ...estilo.botao, opacity: salvando ? 0.6 : 1 }}>
                {salvando ? 'Salvando...' : 'Criar minha senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
