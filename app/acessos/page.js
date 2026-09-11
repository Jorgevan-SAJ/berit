'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getPerfil } from '../../lib/perfil'

const PERFIS_DISPONIVEIS = [
  { valor: 'admin_master', rotulo: 'Administrador' },
  { valor: 'secretaria', rotulo: 'Secretaria' },
  { valor: 'tesouraria', rotulo: 'Tesouraria' },
  { valor: 'conselho_fiscal', rotulo: 'Conselho Fiscal' },
]

export default function AcessosPage() {
  const [perfilAtual, setPerfilAtual] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [novo, setNovo] = useState({ nome: '', email: '', perfil: 'secretaria' })
  const [criando, setCriando] = useState(false)
  const [meuId, setMeuId] = useState(null)
  const [excluindo, setExcluindo] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [chaveDefinida, setChaveDefinida] = useState(false)
  const [verificandoChave, setVerificandoChave] = useState(true)
  const [mostrarFormChave, setMostrarFormChave] = useState(false)
  const [fraseChave, setFraseChave] = useState('')
  const [fraseConfirmacao, setFraseConfirmacao] = useState('')
  const [salvandoChave, setSalvandoChave] = useState(false)
  const [fraseExibida, setFraseExibida] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setMeuId(data.user?.id || null)
    })
    getPerfil().then((p) => {
      setPerfilAtual(p)
      setVerificando(false)
      if (p && p.perfil === 'admin_master') {
        carregarUsuarios()
        verificarChave()
      }
    })
  }, [])

  async function carregarUsuarios() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('v_usuarios')
      .select('id, email, created_at, perfil, ativo, nome')
      .order('email')
    if (error) {
      setErro('Não foi possível carregar os usuários.')
    } else {
      setUsuarios(data || [])
    }
    setCarregando(false)
  }

  async function verificarChave() {
    setVerificandoChave(true)
    const { data, error } = await supabase.rpc('chave_recuperacao_definida')
    if (!error) {
      setChaveDefinida(!!data)
    }
    setVerificandoChave(false)
  }

  async function criarUsuario(e) {
    e.preventDefault()
    setErro('')
    setAviso('')
    const nome = novo.nome.trim()
    const email = novo.email.trim().toLowerCase()
    if (!nome) {
      setErro('Informe o nome do usuário.')
      return
    }
    if (!email) {
      setErro('Informe um e-mail válido.')
      return
    }
    setCriando(true)
    const { data: sessao } = await supabase.auth.getSession()
    const token = sessao?.session?.access_token || ''
    let resposta
    try {
      resposta = await fetch('/api/criar-usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nome, email, perfil: novo.perfil }),
      })
    } catch (erroRede) {
      setCriando(false)
      setErro('Não foi possível contatar o servidor. Tente novamente.')
      return
    }
    const dados = await resposta.json()
    setCriando(false)
    if (!dados.ok) {
      setErro(dados.mensagem || 'Não foi possível criar o usuário.')
      return
    }
    setAviso(dados.mensagem || `Usuário ${email} criado com sucesso!`)
    setNovo({ nome: '', email: '', perfil: 'secretaria' })
    carregarUsuarios()
  }

  async function mudarPerfil(usuario, perfil) {
    setErro('')
    setAviso('')
    if (usuario.id === meuId) {
      setErro('Um Administrador não pode alterar o próprio perfil.')
      return
    }
    const { error } = await supabase
      .from('perfis')
      .upsert({ user_id: usuario.id, perfil }, { onConflict: 'user_id' })
    if (error) {
      setErro(error.message || 'Não foi possível alterar o perfil.')
    } else {
      carregarUsuarios()
    }
  }

  async function alternarAtivo(usuario) {
    setErro('')
    setAviso('')
    if (usuario.id === meuId) {
      setErro('Você não pode inativar o próprio usuário.')
      return
    }
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

  async function confirmarExclusao() {
    if (!excluindo) return
    setSalvando(true)
    setErro('')
    setAviso('')
    const { data: sessao } = await supabase.auth.getSession()
    const token = sessao?.session?.access_token || ''
    let resposta
    try {
      resposta = await fetch('/api/excluir-usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: excluindo.id }),
      })
    } catch (erroRede) {
      setSalvando(false)
      setErro('Não foi possível contatar o servidor. Tente novamente.')
      return
    }
    const dados = await resposta.json()
    setSalvando(false)
    if (!dados.ok) {
      setErro(dados.mensagem || 'Não foi possível excluir o usuário.')
      return
    }
    setAviso(`Usuário ${excluindo.email} excluído definitivamente.`)
    setExcluindo(null)
    carregarUsuarios()
  }

  async function salvarChave(e) {
    e.preventDefault()
    setErro('')
    setAviso('')
    if (fraseChave.length < 8) {
      setErro('A chave deve ter pelo menos 8 caracteres.')
      return
    }
    if (fraseChave !== fraseConfirmacao) {
      setErro('As duas digitações da chave não conferem.')
      return
    }
    setSalvandoChave(true)
    const { error } = await supabase.rpc('definir_chave_recuperacao', { frase: fraseChave })
    setSalvandoChave(false)
    if (error) {
      setErro(error.message || 'Não foi possível salvar a chave.')
    } else {
      setFraseExibida(fraseChave)
      setFraseChave('')
      setFraseConfirmacao('')
      setMostrarFormChave(false)
      setChaveDefinida(true)
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
            Esta área é exclusiva do perfil <strong>Administrador</strong>.
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
          <div style={{ background: '#E8F0FA', color: '#1F3A5F', padding: '12px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
            <strong>Como funciona o primeiro acesso:</strong> o administrador cadastra o usuário e o sistema envia um e-mail de convite com um link para o usuário definir a própria senha. Após clicar no link enviado pelo Berit Inovações, ele será redirecionado para a área de acesso, deve informar o e-mail cadastrado e clicar em <strong>"Esqueci minha senha"</strong>; um novo e-mail será enviado para o cadastramento da senha. O administrador não define nem vê a senha de nenhum usuário.
          </div>
          <div style={{ background: '#FDF3E3', color: '#B26A00', padding: '12px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
            <strong>Dica de segurança:</strong> cadastre sempre pelo menos um segundo usuário com o perfil Administrador. Assim, se o administrador principal ficar impossibilitado de acessar (saída, falecimento ou outro motivo), a igreja mantém o controle da plataforma.
          </div>
          <div style={{ background: '#EAF4EE', color: '#4C8C6E', padding: '12px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
            <strong>Conselho Fiscal:</strong> perfil com acesso <strong>somente leitura</strong> ao módulo de Finanças (consulta de lançamentos, relatórios e histórico da auditoria), sem qualquer poder de lançamento, edição, consolidação ou conferência. Ideal para a fiscalização estatutária das contas da igreja.
          </div>
          <form onSubmit={criarUsuario} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0 1rem' }}>
            <div>
              <label style={estilo.rotulo}>Nome</label>
              <input type="text" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Nome completo" required style={estilo.campo} />
            </div>
            <div>
              <label style={estilo.rotulo}>E-mail</label>
              <input type="email" value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} placeholder="email@exemplo.com" required style={estilo.campo} />
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
        <div style={{ ...estilo.card, marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 8 }}>Chave de recuperação de administrador</div>
          <p style={{ fontSize: 13, color: '#5A5A5A', margin: '0 0 12px', lineHeight: 1.5 }}>
            Esta chave é o caminho de emergência para recuperar o acesso de administrador caso nenhum administrador ativo consiga entrar na plataforma (saída, falecimento ou outro motivo). Ela deve ser criada pela própria igreja e guardada em local seguro, fora do sistema, pois é exibida apenas uma única vez.
          </p>
          {verificandoChave ? (
            <div style={{ fontSize: 13, color: '#8A8A8A' }}>Verificando...</div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 12 }}>
                <span style={{ background: chaveDefinida ? '#EAF4EE' : '#FDF3E3', color: chaveDefinida ? '#4C8C6E' : '#B26A00', padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
                  {chaveDefinida ? 'Chave definida' : 'Chave não definida'}
                </span>
                <button
                  onClick={() => setMostrarFormChave(!mostrarFormChave)}
                  style={{ background: 'none', border: 'none', color: '#1F3A5F', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {mostrarFormChave ? 'Cancelar' : chaveDefinida ? 'Alterar chave' : 'Definir chave'}
                </button>
              </div>
              {fraseExibida && (
                <div style={{ background: '#FDF3E3', color: '#B26A00', padding: '12px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12, lineHeight: 1.5, border: '1px solid #F0D9A8' }}>
                  <strong>Guarde esta frase em local seguro!</strong> Ela é exibida apenas agora, pois o sistema não consegue mostrá-la novamente. Entregue-a à liderança da igreja (conselho ou diaconia).
                  <span style={{ display: 'block', marginTop: 8, fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#8A5A00' }}>{fraseExibida}</span>
                  <button
                    onClick={() => setFraseExibida(null)}
                    style={{ marginTop: 10, background: '#1F3A5F', color: '#FFFFFF', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                  >
                    Já anotei, fechar
                  </button>
                </div>
              )}
              {mostrarFormChave && (
                <form onSubmit={salvarChave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0 1rem' }}>
                  <div>
                    <label style={estilo.rotulo}>Frase secreta (mínimo 8 caracteres)</label>
                    <input type="text" value={fraseChave} onChange={(e) => setFraseChave(e.target.value)} placeholder="ex.: Berit@Conselho2026" style={estilo.campo} />
                  </div>
                  <div>
                    <label style={estilo.rotulo}>Repita a frase secreta</label>
                    <input type="text" value={fraseConfirmacao} onChange={(e) => setFraseConfirmacao(e.target.value)} placeholder="Repita a mesma frase" style={estilo.campo} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="submit" disabled={salvandoChave} style={estilo.botaoPrimario}>
                      {salvandoChave ? 'Salvando...' : 'Salvar chave'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
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
                    <th style={{ padding: '12px 16px' }}>Nome</th>
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
                        {u.nome || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {u.email}
                        {u.id === meuId && (
                          <span style={{ background: '#E8F0FA', color: '#1F3A5F', padding: '2px 8px', borderRadius: 999, fontSize: 11, marginLeft: 8 }}>
                            Você
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {u.id === meuId ? (
                          <div>
                            <span style={{ fontWeight: 600, color: '#2E2E2E' }}>
                              {PERFIS_DISPONIVEIS.find((p) => p.valor === u.perfil)?.rotulo || 'Sem perfil'}
                            </span>
                            <div style={{ fontSize: 11, color: '#8A8A8A', marginTop: 2 }}>
                              Você não pode alterar seu próprio perfil
                            </div>
                          </div>
                        ) : (
                          <select
                            value={u.perfil || ''}
                            onChange={(e) => mudarPerfil(u, e.target.value)}
                            style={{ padding: '8px 10px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                          >
                            <option value="" disabled>Sem perfil</option>
                            {PERFIS_DISPONIVEIS.map((p) => (
                              <option key={p.valor} value={p.valor}>{p.rotulo}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: u.ativo === false ? '#FDECEC' : '#EAF4EE', color: u.ativo === false ? '#B71C1C' : '#4C8C6E', padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
                          {u.ativo === false ? 'Inativo' : 'Ativo'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {u.id !== meuId && (
                          <>
                            <button onClick={() => alternarAtivo(u)} style={{ background: 'none', border: 'none', color: u.ativo === false ? '#4C8C6E' : '#B7791F', fontSize: 13, cursor: 'pointer', marginRight: 12 }}>
                              {u.ativo === false ? 'Reativar' : 'Inativar'}
                            </button>
                            <button onClick={() => setExcluindo(u)} style={{ background: 'none', border: 'none', color: '#B71C1C', fontSize: 13, cursor: 'pointer' }}>
                              Excluir
                            </button>
                          </>
                        )}
                        {u.id === meuId && (
                          <span style={{ fontSize: 12, color: '#C9C2B6' }}>—</span>
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
            {erro && (
              <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>
            )}
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
