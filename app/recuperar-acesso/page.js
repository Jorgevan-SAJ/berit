'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getPerfil } from '../../lib/perfil'

export default function RecuperarAcessoPage() {
  const [chave, setChave] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [processando, setProcessando] = useState(false)
  const [verificando, setVerificando] = useState(true)
  const [jaAdmin, setJaAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        window.location.href = '/login'
        return
      }
      const p = await getPerfil()
      setJaAdmin(p && p.perfil === 'admin_master')
      setVerificando(false)
    })
  }, [])

  async function recuperar(e) {
    e.preventDefault()
    setErro('')
    setAviso('')
    if (!chave.trim()) {
      setErro('Informe a chave de recuperação.')
      return
    }
    setProcessando(true)
    const { error } = await supabase.rpc('promover_emergencia', { chave: chave.trim() })
    setProcessando(false)
    if (error) {
      setErro(error.message || 'Não foi possível usar a chave de recuperação.')
    } else {
      setAviso('Recuperação concluída! Você agora é Administrador da plataforma.')
      setTimeout(() => { window.location.href = '/area' }, 1500)
    }
  }

  const estilo = {
    main: { minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" },
    card: { background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #E4DED2', maxWidth: 480, margin: '0 auto' },
    campo: { width: '100%', padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit' },
    rotulo: { fontSize: 13, color: '#2E2E2E', display: 'block', marginBottom: 6 },
    botao: { width: '100%', padding: '12px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  }

  if (verificando) {
    return (
      <main style={estilo.main}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center', fontSize: 14, color: '#8A8A8A' }}>
          Verificando...
        </div>
      </main>
    )
  }

  if (jaAdmin) {
    return (
      <main style={estilo.main}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1F3A5F', marginBottom: 8 }}>Você já é Administrador</div>
          <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px' }}>Sua conta já possui permissão de administrador. Não é necessário recuperar acesso.</p>
          <a href="/area" style={{ color: '#1F3A5F', fontSize: 14 }}>Voltar para o início</a>
        </div>
      </main>
    )
  }

  return (
    <main style={estilo.main}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px', textAlign: 'center' }}>Recuperar acesso de administrador</h1>
        <p style={{ fontSize: 14, color: '#8A8A8A', margin: '0 0 1.5rem', textAlign: 'center' }}>
          Use esta opção apenas quando não houver nenhum administrador ativo na plataforma. Informe a chave de recuperação guardada pela liderança da igreja.
        </p>

        {erro && (
          <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>
        )}
        {aviso && (
          <div style={{ background: '#EAF4EE', color: '#4C8C6E', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{aviso}</div>
        )}

        <form onSubmit={recuperar} style={estilo.card}>
          <label style={estilo.rotulo}>Chave de recuperação</label>
          <input
            type="password"
            value={chave}
            onChange={(e) => setChave(e.target.value)}
            placeholder="Digite a chave secreta"
            style={estilo.campo}
          />
          <button type="submit" disabled={processando} style={estilo.botao}>
            {processando ? 'Processando...' : 'Promover minha conta a Administrador'}
          </button>
        </form>

        <p style={{ fontSize: 12, color: '#8A8A8A', textAlign: 'center', marginTop: 16 }}>
          A recuperação só funciona quando não existe nenhum administrador ativo. Em último caso, o responsável pelo Supabase pode promover um usuário diretamente no banco.
        </p>
      </div>
    </main>
  )
}
