'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { getPerfil } from '../../../lib/perfil'

function formatarMoeda(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function formatarData(iso) {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

function formatarDataHora(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

const CAMPOS = [
  { k: 'tipo', r: 'Tipo' },
  { k: 'descricao', r: 'Descrição' },
  { k: 'valor', r: 'Valor' },
  { k: 'categoria_id', r: 'Categoria' },
  { k: 'data_lancamento', r: 'Data' },
  { k: 'forma_pagamento', r: 'Forma de pagamento' },
  { k: 'membro_id', r: 'Membro' },
  { k: 'observacoes', r: 'Observações' },
]

export default function AuditoriaPage() {
  const [perfilAtual, setPerfilAtual] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [solicitacoes, setSolicitacoes] = useState([])
  const [historico, setHistorico] = useState([])
  const [categorias, setCategorias] = useState([])
  const [membros, setMembros] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [processandoId, setProcessandoId] = useState(null)

  useEffect(() => {
    getPerfil().then((p) => {
      setPerfilAtual(p)
      setVerificando(false)
      if (p && (p.perfil === 'admin_master' || p.perfil === 'tesouraria')) carregarDados()
    })
  }, [])

  async function carregarDados() {
    setCarregando(true)
    const [pend, hist, cat, mem, usr] = await Promise.all([
      supabase.from('solicitacoes_alteracao').select('*').eq('status', 'pendente').order('solicitado_em', { ascending: true }),
      supabase.from('solicitacoes_alteracao').select('*').in('status', ['aprovada', 'rejeitada']).order('analisado_em', { ascending: false }).limit(10),
      supabase.from('categorias').select('*').order('nome'),
      supabase.from('membros').select('id, nome').order('nome'),
      supabase.from('v_usuarios').select('id, email').order('email'),
    ])
    setSolicitacoes(pend.data || [])
    setHistorico(hist.data || [])
    setCategorias(cat.data || [])
    setMembros(mem.data || [])
    setUsuarios(usr.data || [])
    if (pend.error || hist.error || cat.error || mem.error || usr.error) setErro('Não foi possível carregar as solicitações.')
    setCarregando(false)
  }

  const emailUsuario = (id) => {
    const u = usuarios.find((x) => x.id === id)
    return u ? u.email : '—'
  }

  const nomeCategoria = (id) => {
    const c = categorias.find((x) => x.id === id)
    return c ? c.nome : '—'
  }

  const nomeMembro = (id) => {
    if (!id) return ''
    const m = membros.find((x) => x.id === id)
    return m ? m.nome : '—'
  }

  function formatarValor(campo, valor) {
    if (valor === null || valor === undefined || valor === '') return '—'
    if (campo === 'valor') return formatarMoeda(valor)
    if (campo === 'data_lancamento') return formatarData(valor)
    if (campo === 'categoria_id') return nomeCategoria(valor)
    if (campo === 'membro_id') return nomeMembro(valor)
    if (campo === 'tipo') return valor === 'entrada' ? 'Entrada' : 'Saída'
    if (campo === 'forma_pagamento') return valor
    return String(valor)
  }

  function camposAlterados(sol) {
    const orig = sol.dados_originais || {}
    const novo = sol.dados_novos || {}
    return CAMPOS.filter((c) => String(orig[c.k] || '') !== String(novo[c.k] || ''))
  }

  async function analisar(sol, aprovar) {
    setErro('')
    setAviso('')
    setProcessandoId(sol.id)
    const { error } = await supabase.rpc('analisar_alteracao', { p_solicitacao: sol.id, p_aprovar: aprovar })
    setProcessandoId(null)
    if (error) {
      setErro(error.message || 'Não foi possível concluir a análise.')
    } else {
      setAviso(aprovar ? 'Alteração aprovada. O lançamento recebeu a nota permanente de alteração.' : 'Alteração rejeitada. Os valores originais foram restaurados.')
      carregarDados()
    }
  }

  const estilo = {
    main: { minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" },
    header: { background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    linkLogo: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' },
    botaoVoltar: { background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none' },
    card: { background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #E4DED2' },
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

  if (!perfilAtual || (perfilAtual.perfil !== 'admin_master' && perfilAtual.perfil !== 'tesouraria')) {
    return (
      <main style={estilo.main}>
        <header style={estilo.header}>
          <a href="/area" style={estilo.linkLogo}>Berit</a>
          <a href="/financas" style={estilo.botaoVoltar}>Voltar</a>
        </header>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: '#5A5A5A' }}>Acesso restrito aos perfis Administrador e Tesouraria.</p>
          <a href="/financas" style={{ color: '#1F3A5F', fontSize: 14 }}>Voltar para Finanças</a>
        </div>
      </main>
    )
  }

  return (
    <main style={estilo.main}>
      <header style={estilo.header}>
        <a href="/area" style={estilo.linkLogo}>Berit</a>
        <a href="/financas" style={estilo.botaoVoltar}>Voltar</a>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Central de Auditoria</h1>
        <p style={{ fontSize: 14, color: '#8A8A8A', margin: '0 0 1.5rem' }}>
          Conferência das alterações feitas em lançamentos consolidados.
        </p>

        <div style={{ background: '#E8F0FA', color: '#1F3A5F', padding: '12px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
          Quando um lançamento consolidado é alterado, a mudança é aplicada na hora e fica <strong>aguardando a conferência de outro usuário com perfil financeiro</strong> (Administrador confere o que o Tesoureiro alterou, e vice-versa). <strong>Ninguém pode conferir a própria alteração.</strong> Aprovando, o lançamento ganha a nota permanente "Esse lançamento foi alterado em dd/mm/aaaa". Rejeitando, os valores originais são restaurados.
        </div>

        {erro && (
          <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>
        )}
        {aviso && (
          <div style={{ background: '#EAF4EE', color: '#4C8C6E', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{aviso}</div>
        )}

        <div style={{ ...estilo.card, marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 12 }}>
            Aguardando conferência ({solicitacoes.length})
          </div>
          {carregando ? (
            <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '1.5rem' }}>Carregando...</div>
          ) : solicitacoes.length === 0 ? (
            <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '1.5rem' }}>Nenhuma alteração aguardando conferência. 🎉</div>
          ) : (
            solicitacoes.map((sol) => {
              const alterados = camposAlterados(sol)
              const novo = sol.dados_novos || {}
              return (
                <div key={sol.id} style={{ border: '1px solid #E4DED2', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: 10 }}>
                    <span style={{ background: '#FDF3E3', color: '#B26A00', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                      Aguardando conferência
                    </span>
                    <span style={{ fontSize: 12, color: '#8A8A8A' }}>
                      Solicitada por <strong style={{ color: '#2E2E2E' }}>{emailUsuario(sol.solicitado_por)}</strong> em {formatarDataHora(sol.solicitado_em)}
                    </span>
                  </div>

                  {alterados.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#5A5A5A' }}>Alteração nos dados do lançamento.</div>
                  ) : (
                    <div style={{ display: 'grid', gap: '0.35rem', marginBottom: 10 }}>
                      {alterados.map((c) => (
                        <div key={c.k} style={{ fontSize: 13, color: '#5A5A5A' }}>
                          <strong style={{ color: '#1F3A5F' }}>{c.r}:</strong>{' '}
                          <span style={{ textDecoration: 'line-through', color: '#B71C1C' }}>
                            {formatarValor(c.k, (sol.dados_originais || {})[c.k])}
                          </span>{' '}
                          →{' '}
                          <span style={{ color: '#4C8C6E', fontWeight: 600 }}>
                            {formatarValor(c.k, novo[c.k])}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: '#8A8A8A', marginBottom: 12 }}>
                    Valor após alteração: <strong style={{ color: '#2E2E2E' }}>{formatarMoeda(novo.valor)}</strong> · Descrição: {novo.descricao || '—'}
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => analisar(sol, true)}
                      disabled={processandoId === sol.id}
                      style={{ padding: '10px 16px', background: '#4C8C6E', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      {processandoId === sol.id ? 'Processando...' : 'Aprovar alteração'}
                    </button>
                    <button
                      onClick={() => analisar(sol, false)}
                      disabled={processandoId === sol.id}
                      style={{ padding: '10px 16px', background: '#B71C1C', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Rejeitar e restaurar originais
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div style={estilo.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 12 }}>Últimas análises</div>
          {historico.length === 0 ? (
            <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '1rem' }}>Nenhuma análise realizada ainda.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 760 }}>
                <thead>
                  <tr style={{ background: '#F5F0E6', color: '#1F3A5F', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px' }}>Descrição</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Valor</th>
                    <th style={{ padding: '10px 12px' }}>Solicitada por</th>
                    <th style={{ padding: '10px 12px' }}>Analisada por</th>
                    <th style={{ padding: '10px 12px' }}>Analisada em</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((h) => (
                    <tr key={h.id} style={{ borderTop: '1px solid #F0EAE0' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ background: h.status === 'aprovada' ? '#EAF4EE' : '#FDECEC', color: h.status === 'aprovada' ? '#4C8C6E' : '#B71C1C', padding: '3px 8px', borderRadius: 999, fontSize: 11 }}>
                          {h.status === 'aprovada' ? 'Aprovada' : 'Rejeitada'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#5A5A5A' }}>{(h.dados_novos || {}).descricao || 'Lançamento'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#2E2E2E' }}>{formatarMoeda((h.dados_novos || {}).valor)}</td>
                      <td style={{ padding: '10px 12px', color: '#5A5A5A' }}>{emailUsuario(h.solicitado_por)}</td>
                      <td style={{ padding: '10px 12px', color: '#5A5A5A' }}>{emailUsuario(h.analisado_por)}</td>
                      <td style={{ padding: '10px 12px', color: '#5A5A5A' }}>{formatarDataHora(h.analisado_em)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
