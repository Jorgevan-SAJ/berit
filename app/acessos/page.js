'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getPerfil } from '../../lib/perfil'

const PERFIS_DISPONIVEIS = [
  { valor: 'admin_master', rotulo: 'Admin Master' },
  { valor: 'secretaria', rotulo: 'Secretaria' },
  { valor: 'tesouraria', rotulo: 'Tesouraria' },
]

export default function AcessosPage() {
  const [perfilAtual, setPerfilAtual] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [novo, setNovo] = useState({ email: '', senha: '', perfil: 'secretaria' })
  const [criando, setCriando] = useState(false)
  const [meuId, setMeuId] = useState(null)
  const [excluindo, setExcluindo] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setMeuId(data.user?.id || null)
    })
    getPerfil().then((p) => {
      setPerfilAtual(p)
      setVerificando(false)
      if (p && p.perfil === 'admin_master') {
        carregarUsuarios()
      }
    })
  }, [])

  async function carregarUsuarios() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('v_usuarios')
      .select('id, email, created_at, perfil, ativo')
      .order('email')
    if (error) {
      setErro('Não foi possível carregar os usuários.')
    } else {
      setUsuarios(data || [])
    }
    setCarregando(false)
  }

  async function criarUsuario(e) {
    e.preventDefault()
    setErro('')
    setAviso('')
    if (!novo.email.trim() || novo.senha.length < 6) {
      setErro('Informe um e-mail válido e uma senha com pelo menos 6 caracteres.')
      return
    }
    setCriando(true)
    const { data, error } = await supabase.auth.signUp({
      email: novo.email.trim().toLowerCase(),
      password: novo.senha,
    })
    if (error || !data.user) {
      setErro('Não foi possível criar o usuário. Verifique se o e-mail já está em uso.')
      setCriando(false)
      return
    }
    const { error: erroPerfil } = await supabase.from('perfis').insert([
      { user_id: data.user.id, perfil: novo.perfil },
    ])
    setCriando(false)
    if (erroPerfil) {
      setErro('Usuário criado, mas não foi possível atribuir o perfil. Tente novamente.')
    } else {
      setAviso(`Usuário ${novo.email} criado com sucesso! Ele receberá um e-mail de confirmação.`)
      setNovo({ email: '', senha: '', perfil: 'secretaria' })
      carregarUsuarios()
    }
  }

  async function mudarPerfil(usuario, perfil) {
    setErro('')
    const { error } = await supabase
      .from('perfis')
      .upsert({ user_id: usuario.id, perfil }, { onConflict: 'user_id' })
    if (error) {
      setErro('Não foi possível alterar o perfil.')
    } else {
      carregarUsuarios()
    }
  }

  async function alternarAtivo(usuario) {
    setErro('')
    const novoAtivo = usuario.ativo ? false : true
    const { error } = await supabase
      .from('perfis')
      .upsert({ user_id: usuario.id, ativo: novoAtivo }, { onConflict: 'user_id' })
    if (error) {
      setErro('Não foi possível alterar o status do usuário.')
    } else {
      carregarUsuarios()
    }
  }

  async function redefinirSenha(email) {
    setErro('')
    setAviso('')
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) {
      setErro('Não foi possível enviar o e-mail de redefinição.')
    } else {
      setAviso(`E-mail de redefinição enviado para ${email}.`)
    }
  }

  async function confirmarExclusao() {
    if (!excluindo) return
    setSalvando(true)
    setErro('')
    setAviso('')
    const { error } = await supabase.rpc('excluir_usuario', { user_id: excluindo.id })
    setSalvando(false)
    if (error) {
      setErro(error.message || 'Não foi possível excluir o usuário.')
    } else {
      setAviso(`Usuário ${excluindo.email} excluído definitivamente.`)
      setExcluindo(null)
      carregarUsuarios()
    }
  }

  const estilo = {
    main: { minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" },
    header: { background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    linkLogo: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' },
    botaoVoltar: { background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none' },
    card: { background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #E4DED2' },
    campo: { width: '100%', padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit' },
    rotulo: { fontSize: 13, color: '#2E2E2E', display: 'block', marginBottom: 6 },
    botaoPrimario: { padding: '12px 20px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  }

  if (verificando) {
    return (
      <main style={estilo.main}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center', fontSize: 14, color: '#8A8A8A' }}>
          Verificando permissões...
        </div>
      </main>
    )
  }

  if (!perfilAtual || perfilAtual.perfil !== 'admin_master') {
    return (
      <main style={estilo.main}>
        <header style={estilo.header}>
          <a href="/area" style={estilo.linkLogo}>Berit</a>
          <a href="/area" style={estilo.botaoVoltar}>Voltar</a>
        </header>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1F3A5F', marginBottom: 8 }}>Acesso restrito</div>
          <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px' }}>
            Esta área é exclusiva do perfil <strong>Admin Master</strong>.
          </p>
          <a href="/area" style={{ color: '#1F3A5F', fontSize: 14 }}>Voltar para o início</a>
        </div>
      </main>
    )
  }

  return (
    <main style={estilo.main}>
      <header style={estilo.header}>
        <a href="/area" style={estilo.linkLogo}>Berit</a>
        <a href="/area" style={estilo.botaoVoltar}>Voltar</a>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Perfis de Acesso</h1>
        <p style={{ fontSize: 14, color: '#8A8A8A', margin: '0 0 1.5rem' }}>
          Crie usuários e controle as permissões de cada operador da plataforma.
        </p>

        {erro && (
          <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>
        )}
        {aviso && (
          <div style={{ background: '#EAF4EE', color: '#4C8C6E', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{aviso}</div>
        )}

        <div style={{ ...estilo.card, marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 8 }}>Novo usuário</div>
          <form onSubmit={criarUsuario} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0 1rem' }}>
            <div>
              <label style={estilo.rotulo}>E-mail</label>
              <input type="email" value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} placeholder="email@exemplo.com" required style={estilo.campo} />
            </div>
            <div>
              <label style={estilo.rotulo}>Senha inicial</label>
              <input type="text" value={novo.senha} onChange={(e) => setNovo({ ...novo, senha: e.target.value })} placeholder="mínimo 6 caracteres" required style={estilo.campo} />
            </div>
            <div>
              <label style={estilo.rotulo}>Perfil</label>
              <select value={novo.perfil} onChange={(e) => setNovo({ ...novo, perfil: e.target.value })} style={estilo.campo}>
                {PERFIS_DISPONIVEIS.map((p) => (
                  <option key={p.valor} value={p.valor}>{p.rotulo}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" disabled={criando} style={estilo.botaoPrimario}>
                {criando ? 'Criando...' : 'Criar usuário'}
              </button>
            </div>
          </form>
        </div>

        <div style={estilo.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 8 }}>Usuários cadastrados</div>
          {carregando ? (
            <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '1.5rem' }}>Carregando...</div>
          ) : usuarios.length === 0 ? (
            <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '1.5rem' }}>Nenhum usuário encontrado.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#F5F0E6', color: '#1F3A5F', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px' }}>E-mail</th>
                    <th style={{ padding: '12px 16px' }}>Perfil</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} style={{ borderTop: '1px solid #F0EAE0' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2E2E2E' }}>
                        {u.email}
                        {u.id === meuId && (
                          <span style={{ background: '#E8F0FA', color: '#1F3A5F', padding: '2px 8px', borderRadius: 999, fontSize: 11, marginLeft: 8 }}>
                            Você
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <select
                          value={u.perfil || ''}
                          onChange={(e) => mudarPerfil(u, e.target.value)}
                          style={{ padding: '8px 10px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                        >
                          <option value="" disabled>— Sem perfil —</option>
                          {PERFIS_DISPONIVEIS.map((p) => (
                            <option key={p.valor} value={p.valor}>{p.rotulo}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: u.ativo === false ? '#FDECEC' : '#EAF4EE', color: u.ativo === false ? '#B71C1C' : '#4C8C6E', padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
                          {u.ativo === false ? 'Inativo' : 'Ativo'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button onClick={() => alternarAtivo(u)} style={{ background: 'none', border: 'none', color: u.ativo === false ? '#4C8C6E' : '#B7791F', fontSize: 13, cursor: 'pointer', marginRight: 12 }}>
                          {u.ativo === false ? 'Reativar' : 'Inativar'}
                        </button>
                        <button onClick={() => redefinirSenha(u.email)} style={{ background: 'none', border: 'none', color: '#1F3A5F', fontSize: 13, cursor: 'pointer', marginRight: 12 }}>
                          Redefinir senha
                        </button>
                        {u.id !== meuId && (
                          <button onClick={() => setExcluindo(u)} style={{ background: 'none', border: 'none', color: '#B71C1C', fontSize: 13, cursor: 'pointer' }}>
                            Excluir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {excluindo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', maxWidth: 420, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#B71C1C', marginBottom: 6 }}>Excluir usuário definitivamente</div>
            <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px' }}>
              Você deseja excluir o acesso de <strong>{excluindo.email}</strong>? Esta ação <strong>não pode ser desfeita</strong> e o usuário perderá o acesso à plataforma permanentemente.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={confirmarExclusao}
                disabled={salvando}
                style={{ flex: 1, padding: '12px', background: '#B71C1C', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                {salvando ? 'Excluindo...' : 'Sim, excluir definitivamente'}
              </button>
              <button
                onClick={() => setExcluindo(null)}
                style={{ flex: 1, padding: '12px', background: '#F5F0E6', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
