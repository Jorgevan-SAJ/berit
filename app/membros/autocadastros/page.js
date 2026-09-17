'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const PERFIS_MODERADORES = ['admin_master', 'secretaria']
const SITUACOES_OPCOES = [
  { v: 'membro', r: 'Membro' },
  { v: 'congregado', r: 'Congregado' },
  { v: 'visitante', r: 'Visitante' },
]
const ROTULO_SITUACAO = { membro: 'Membro', congregado: 'Congregado', visitante: 'Visitante' }

function normalizar(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
function formatarData(iso) {
  if (!iso) return '—'
  const [a, m, d] = String(iso).split('-')
  return `${d}/${m}/${a}`
}
function calcularIdade(nasc) {
  if (!nasc) return null
  const hoje = new Date()
  const nascDate = new Date(String(nasc) + 'T00:00:00')
  let idade = hoje.getFullYear() - nascDate.getFullYear()
  const m = hoje.getMonth() - nascDate.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nascDate.getDate())) idade--
  return idade
}

const estilo = {
  main: { minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" },
  header: { background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  linkLogo: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' },
  botaoVoltar: { background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none' },
  card: { background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #E4DED2' },
  campo: { padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', width: '100%' },
  botaoAzul: { padding: '12px 20px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  botaoVerde: { padding: '10px 16px', background: '#4C8C6E', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  botaoVermelho: { padding: '10px 16px', background: '#FFFFFF', color: '#B71C1C', border: '1px solid #B71C1C', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 },
}

export default function AutocadastrosPage() {
  const router = useRouter()
  const [verificando, setVerificando] = useState(true)
  const [perfil, setPerfil] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [msg, setMsg] = useState('')
  const [linkGerado, setLinkGerado] = useState('')
  const [gerando, setGerando] = useState(false)
  const [pendentes, setPendentes] = useState([])
  const [historico, setHistorico] = useState([])
  const [membros, setMembros] = useState([])
  const [situacoes, setSituacoes] = useState({})
  const [processando, setProcessando] = useState(null)
  const [rejeitando, setRejeitando] = useState(null)

  useEffect(() => { iniciar() }, [])

  async function iniciar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setVerificando(false)
      router.push('/login')
      return
    }
    const { data: p } = await supabase
      .from('perfis')
      .select('igreja_id, perfil')
      .eq('user_id', user.id)
      .maybeSingle()
    setPerfil(p)
    setVerificando(false)
    if (!p || !PERFIS_MODERADORES.includes(p.perfil)) return
    carregarTudo(p.igreja_id)
  }

  async function carregarTudo(igrejaId) {
    setCarregando(true)
    const [sol, mem] = await Promise.all([
      supabase.from('solicitacoes_membros').select('*').order('criado_em', { ascending: false }),
      supabase.from('membros').select('id, nome, data_nascimento, email, situacao').order('nome'),
    ])
    if (sol.error || mem.error) {
      setErro('Não foi possível carregar as solicitações.')
    } else {
      const todas = sol.data || []
      setPendentes(todas.filter((s) => s.status === 'pendente').reverse())
      setHistorico(todas.filter((s) => s.status === 'aprovado' || s.status === 'rejeitado').slice(0, 50))
      setMembros(mem.data || [])
      const init = {}
      todas.filter((s) => s.status === 'pendente').forEach((s) => { init[s.id] = 'congregado' })
      setSituacoes(init)
    }
    setCarregando(false)
  }

  async function gerarLink() {
    setGerando(true)
    setMsg('')
    setErro('')
    const { data: { user } } = await supabase.auth.getUser()
    const token = crypto.randomUUID()
    const expiraEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { error } = await supabase.from('solicitacoes_membros').insert({
      igreja_id: perfil.igreja_id,
      token,
      status: 'ativo',
      expira_em: expiraEm,
      criado_por: user?.id || null,
    })
    setGerando(false)
    if (error) {
      setErro('Erro ao gerar o link: ' + error.message)
      return
    }
    setLinkGerado(`${window.location.origin}/autocadastro/${token}`)
  }

  function copiarLink() {
    if (!linkGerado) return
    navigator.clipboard?.writeText(linkGerado)
      .then(() => setMsg('Link copiado! Envie ao interessado.'))
      .catch(() => setMsg('Copie o link manualmente.'))
  }

  function verificarDuplicado(sol) {
    const emailDup = !!(sol.email && membros.some((m) => m.email && String(m.email).toLowerCase() === String(sol.email).toLowerCase()))
    const nomeDataDup = !!(sol.nome && sol.data_nascimento && membros.some((m) => normalizar(m.nome) === normalizar(sol.nome) && m.data_nascimento === sol.data_nascimento))
    return { emailDup, nomeDataDup }
  }

  async function aprovar(sol) {
    const { emailDup } = verificarDuplicado(sol)
    if (emailDup) {
      setErro(`Já existe um membro com o e-mail ${sol.email}. Aprovação bloqueada para evitar duplicidade.`)
      return
    }
    setProcessando(sol.id)
    setErro('')
    setMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    const situacao = situacoes[sol.id] || 'congregado'
    const { data: novoMembro, error: errInsert } = await supabase.from('membros').insert({
      igreja_id: perfil.igreja_id,
      nome: sol.nome,
      sexo: sol.sexo,
      data_nascimento: sol.data_nascimento,
      email: sol.email || null,
      celular: sol.celular || null,
      situacao,
    }).select('id').maybeSingle()

    if (errInsert || !novoMembro) {
      setProcessando(null)
      setErro('Não foi possível criar o membro. Verifique se os campos obrigatórios foram preenchidos no autocadastro.')
      return
    }

    const { error: errUpd } = await supabase.from('solicitacoes_membros').update({
      status: 'aprovado',
      aprovado_por: user?.id || null,
      aprovado_em: new Date().toISOString(),
      membro_criado_id: novoMembro.id,
      situacao_aprovacao: situacao,
    }).eq('id', sol.id)

    setProcessando(null)
    if (errUpd) {
      setErro('Membro criado, mas não foi possível atualizar a solicitação.')
    } else {
      setMsg(`${sol.nome} foi aprovado(a) e incluído(a) como ${ROTULO_SITUACAO[situacao]}.`)
    }
    carregarTudo(perfil.igreja_id)
  }

  async function confirmarRejeicao() {
    if (!rejeitando) return
    setProcessando(rejeitando.id)
    setErro('')
    setMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('solicitacoes_membros').update({
      status: 'rejeitado',
      rejeitado_por: user?.id || null,
      rejeitado_em: new Date().toISOString(),
      motivo_rejeicao: rejeitando.motivo?.trim() || null,
    }).eq('id', rejeitando.id)
    setProcessando(null)
    setRejeitando(null)
    if (error) {
      setErro('Não foi possível rejeitar a solicitação.')
      return
    }
    setMsg('Solicitação rejeitada.')
    carregarTudo(perfil.igreja_id)
  }

  if (verificando) {
    return (
      <main style={estilo.main}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center', fontSize: 14, color: '#8A8A8A' }}>Verificando permissões...</div>
      </main>
    )
  }

  if (!perfil || !PERFIS_MODERADORES.includes(perfil.perfil)) {
    return (
      <main style={estilo.main}>
        <header style={estilo.header}>
          <a href="/area" style={estilo.linkLogo}>Berit</a>
          <a href="/membros" style={estilo.botaoVoltar}>Voltar</a>
        </header>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1F3A5F', marginBottom: 8 }}>Acesso restrito</div>
          <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px' }}>
            Esta área é exclusiva dos perfis <strong>Administrador</strong> e <strong>Secretaria</strong>.
          </p>
          <a href="/membros" style={{ color: '#1F3A5F', fontSize: 14 }}>Voltar para Membros</a>
        </div>
      </main>
    )
  }

  const corStatus = {
    pendente: { bg: '#FDF3E3', fg: '#B26A00' },
    aprovado: { bg: '#EAF4EE', fg: '#4C8C6E' },
    rejeitado: { bg: '#FDECEC', fg: '#B71C1C' },
  }

  return (
    <main style={estilo.main}>
      <header style={estilo.header}>
        <a href="/area" style={estilo.linkLogo}>Berit</a>
        <a href="/membros" style={estilo.botaoVoltar}>Voltar</a>
      </header>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Autocadastro de Membros</h1>
        <p style={{ fontSize: 14, color: '#8A8A8A', margin: '0 0 1.5rem' }}>
          Gere links para os interessados preencherem a própria ficha e aprove ou rejeite as solicitações recebidas.
        </p>

        {msg && <div style={{ background: '#EAF4EE', color: '#4C8C6E', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{msg}</div>}
        {erro && <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>}

        <div style={{ ...estilo.card, marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 12 }}>Gerar link de autocadastro</div>
          <p style={{ fontSize: 13, color: '#5A5A5A', margin: '0 0 12px', lineHeight: 1.6 }}>
            O link é de <strong>uso único</strong>, vale por <strong>7 dias</strong> e pode ser enviado por WhatsApp, e-mail ou impresso.
          </p>
          <button onClick={gerarLink} disabled={gerando} style={{ ...estilo.botaoAzul, opacity: gerando ? 0.6 : 1 }}>
            {gerando ? 'Gerando...' : linkGerado ? 'Gerar outro link' : 'Gerar link'}
          </button>
          {linkGerado && (
            <div style={{ marginTop: 16, background: '#F5F0E6', borderRadius: 8, padding: '12px' }}>
              <div style={{ fontSize: 12, color: '#8A8A8A', marginBottom: 6 }}>Link gerado (copie e envie):</div>
              <input readOnly value={linkGerado} style={{ ...estilo.campo, background: '#FFFFFF', marginBottom: 10 }} />
              <button onClick={copiarLink} style={estilo.botaoAzul}>📋 Copiar link</button>
            </div>
          )}
        </div>

        <div style={estilo.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 12 }}>Pendências ({pendentes.length})</div>
          {carregando ? (
            <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '1.5rem' }}>Carregando...</div>
          ) : pendentes.length === 0 ? (
            <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '1.5rem' }}>
              Nenhuma solicitação aguardando confirmação.
            </div>
          ) : (
            pendentes.map((s) => {
              const dup = verificarDuplicado(s)
              const idade = calcularIdade(s.data_nascimento)
              return (
                <div key={s.id} style={{ border: '1px solid #F0EAE0', borderRadius: 10, padding: '14px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#2E2E2E' }}>{s.nome}</span>
                      <span style={{ ...estilo.badge, background: corStatus.pendente.bg, color: corStatus.pendente.fg, marginLeft: 8 }}>
                        {formatarData(s.enviado_em)} · Pendente
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#5A5A5A', lineHeight: 1.8 }}>
                    <div>Sexo: {s.sexo || '—'} · Nascimento: {formatarData(s.data_nascimento)}{idade !== null ? ` (${idade} anos)` : ''}</div>
                    <div>E-mail: {s.email || '—'} · Celular: {s.celular || '—'}</div>
                  </div>
                  {dup.emailDup && (
                    <div style={{ background: '#FDECEC', color: '#B71C1C', borderRadius: 8, padding: '8px 10px', fontSize: 12, marginTop: 8 }}>
                      ⚠️ Já existe um membro com o e-mail {s.email}. A aprovação será bloqueada.
                    </div>
                  )}
                  {dup.nomeDataDup && (
                    <div style={{ background: '#FDF3E3', color: '#B26A00', borderRadius: 8, padding: '8px 10px', fontSize: 12, marginTop: 8 }}>
                      ⚠️ Possível duplicado: mesmo nome e data de nascimento de um membro já cadastrado. Confira antes de aprovar.
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
                    <select
                      value={situacoes[s.id] || 'congregado'}
                      onChange={(e) => setSituacoes({ ...situacoes, [s.id]: e.target.value })}
                      style={{ padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                    >
                      {SITUACOES_OPCOES.map((o) => (
                        <option key={o.v} value={o.v}>Incluir como {o.r}</option>
                      ))}
                    </select>
                    <button onClick={() => aprovar(s)} disabled={processando === s.id} style={estilo.botaoVerde}>
                      {processando === s.id ? 'Aprovando...' : 'Aprovar'}
                    </button>
                    <button onClick={() => setRejeitando({ id: s.id, motivo: '' })} disabled={processando === s.id} style={estilo.botaoVermelho}>
                      Rejeitar
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {historico.length > 0 && (
          <div style={{ ...estilo.card, marginTop: '1.5rem' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 12 }}>Histórico recente</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 560 }}>
                <thead>
                  <tr style={{ background: '#F5F0E6', color: '#1F3A5F', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Nome</th>
                    <th style={{ padding: '10px 12px' }}>Situação</th>
                    <th style={{ padding: '10px 12px' }}>Data</th>
                    <th style={{ padding: '10px 12px' }}>Detalhe</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((h) => (
                    <tr key={h.id} style={{ borderTop: '1px solid #F0EAE0' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#2E2E2E' }}>{h.nome}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ ...estilo.badge, background: corStatus[h.status].bg, color: corStatus[h.status].fg }}>
                          {h.status === 'aprovado' ? 'Aprovado' : 'Rejeitado'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#5A5A5A' }}>
                        {h.status === 'aprovado' ? formatarData(h.aprovado_em) : formatarData(h.rejeitado_em)}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#5A5A5A' }}>
                        {h.status === 'aprovado' ? `Incluído como ${ROTULO_SITUACAO[h.situacao_aprovacao] || '—'}` : (h.motivo_rejeicao || '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {rejeitando && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', maxWidth: 420, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#B71C1C', marginBottom: 6 }}>Rejeitar solicitação</div>
            <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 12px' }}>
              Informe o motivo (opcional). A solicitação ficará registrada como rejeitada no histórico.
            </p>
            <textarea
              value={rejeitando.motivo}
              onChange={(e) => setRejeitando({ ...rejeitando, motivo: e.target.value })}
              rows={3}
              placeholder="Motivo da rejeição"
              style={{ ...estilo.campo, marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={confirmarRejeicao} disabled={processando === rejeitando.id} style={{ flex: 1, padding: '12px', background: '#B71C1C', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                {processando === rejeitando.id ? 'Rejeitando...' : 'Confirmar rejeição'}
              </button>
              <button onClick={() => setRejeitando(null)} style={{ flex: 1, padding: '12px', background: '#F5F0E6', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
