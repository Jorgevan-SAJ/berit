'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AtualizarSenhaPage() {
  const router = useRouter()
  const [estado, setEstado] = useState('verificando')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    let ativo = true

    function liberar() {
      if (!ativo) return
      if (window.location.search || window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname)
      }
      setEstado('pronto')
    }

    async function preparar() {
      const parametros = new URLSearchParams(window.location.search)
      const code = parametros.get('code')

      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
      }

      for (let tentativa = 0; tentativa < 12; tentativa++) {
        if (!ativo) return
        const { data } = await supabase.auth.getSession()
        if (data && data.session) {
          liberar()
          return
        }
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      if (ativo) setEstado('invalido')
    }

    preparar()

    return () => {
      ativo = false
    }
  }, [])

  async function salvar(e) {
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
      setErro('Não foi possível salvar a senha. Tente novamente.')
      return
    }

    await supabase.auth.signOut()
    router.replace('/login')
  }

  const estilo = {
    main: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif", padding: '1rem' },
    card: { background: '#FFFFFF', borderRadius: 16, padding: '2rem', maxWidth: 400, width: '100%', border: '1px solid #E4DED2', boxShadow: '0 4px 24px rgba(31,58,95,0.08)' },
    logo: { textAlign: 'center', fontSize: 32, fontWeight: 700, color: '#1F3A5F', letterSpacing: '-0.02em', marginBottom: 4 },
    subtitulo: { textAlign: 'center', fontSize: 13, color: '#8A8A8A', margin: '0 0 1.5rem' },
    rotulo: { fontSize: 13, color: '#2E2E2E', display: 'block', marginBottom: 6 },
    campo: { width: '100%', padding: '11px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
    botao: { width: '100%', padding: '12px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
    aviso: { background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 },
  }

  if (estado === 'verificando') {
    return (
      <main style={estilo.main}>
        <div style={estilo.card}>
          <div style={estilo.logo}>Berit</div>
          <p style={estilo.subtitulo}>Validando o link de recuperação...</p>
        </div>
      </main>
    )
  }

  if (estado === 'invalido') {
    return (
      <main style={estilo.main}>
        <div style={estilo.card}>
          <div style={estilo.logo}>Berit</div>
          <p style={estilo.subtitulo}>Link inválido ou expirado</p>
          <div style={estilo.aviso}>
            Não foi possível validar este link. Solicite uma nova recuperação de senha.
          </div>
          <button style={estilo.botao} onClick={() => router.replace('/login')}>
            Voltar para o acesso
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={estilo.main}>
      <div style={estilo.card}>
        <div style={estilo.logo}>Berit</div>
        <p style={estilo.subtitulo}>Defina sua nova senha</p>
        {erro && <div style={estilo.aviso}>{erro}</div>}
        <form onSubmit={salvar}>
          <label style={estilo.rotulo}>Nova senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Mínimo de 8 caracteres"
            style={{ ...estilo.campo, marginBottom: 16 }}
            autoComplete="new-password"
          />
          <label style={estilo.rotulo}>Confirmar nova senha</label>
          <input
            type="password"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            placeholder="Repita a senha"
            style={{ ...estilo.campo, marginBottom: 16 }}
            autoComplete="new-password"
          />
          <button type="submit" disabled={carregando} style={{ ...estilo.botao, opacity: carregando ? 0.6 : 1 }}>
            {carregando ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </main>
  )
}
