'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getPerfil } from '../../lib/perfil'

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)
}

function formatarData(iso) {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

export default function FinancasPage() {
  const [perfilAtual, setPerfilAtual] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [lancamentos, setLancamentos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [membros, setMembros] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mes, setMes] = useState(() => {
    const hoje = new Date()
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  })
  const [tipo, setTipo] = useState('')
  const [categoria, setCategoria] = useState('')
  const [excluindo, setExcluindo] = useState(null)
  const [consultando, setConsultando] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    getPerfil().then((p) => {
      setPerfilAtual(p)
      setVerificando(false)
      if (p && (p.perfil === 'admin_master' || p.perfil === 'tesouraria')) {
        carregarDados()
      }
    })
  }, [])

  async function carregarDados() {
    setCarregando(true)
    const [lanc, cat, mem] = await Promise.all([
      supabase.from('lancamentos').select('*').order('data_lancamento', { ascending: false }),
      supabase.from('categorias').select('*').order('nome'),
      supabase.from('membros').select('id, nome').order('nome'),
    ])
    if (lanc.error || cat.error || mem.error) {
      setErro('Não foi possível carregar os dados financeiros.')
    } else {
      setLancamentos(lanc.data || [])
      setCategorias(cat.data || [])
      setMembros(mem.data || [])
    }
    setCarregando(false)
  }

  const nomeCategoria = (id) => {
    const c = categorias.find((x) => x.id === id)
    return c ? c.nome : '—'
  }

  const nomeMembro = (id) => {
    const m = membros.find((x) => x.id === id)
    return m ? m.nome : ''
  }

  const filtrados = lancamentos.filter((l) => {
    const mesOk = !mes || (l.data_lancamento || '').startsWith(mes)
    const tipoOk = !tipo || l.tipo === tipo
    const catOk = !categoria || l.categoria_id === categoria
    return mesOk && tipoOk && catOk
  })

  const totalEntradas = filtrados.filter((l) => l.tipo === 'entrada').reduce((s, l) => s + Number(l.valor), 0)
  const totalSaidas = filtrados.filter((l) => l.tipo === 'saida').reduce((s, l) => s + Number(l.valor), 0)
  const saldo = totalEntradas - totalSaidas

  async function confirmarExclusao() {
    if (!excluindo) return
    setSalvando(true)
    const { error } = await supabase.from('lancamentos').delete().eq('id', excluindo.id)
    setSalvando(false)
    if (error) {
      setErro('Não foi possível excluir o lançamento. Lançamentos consolidados não podem ser excluídos.')
    } else {
      setExcluindo(null)
      carregarDados()
    }
  }

  const estilo = {
    main: { minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" },
    header: { background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    linkLogo: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' },
    botaoVoltar: { background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none' },
    card: { background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #E4DED2' },
    campo: { padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', width: '100%' },
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
          <a href="/area" style={estilo.botaoVoltar}>Voltar</a>
        </header>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1F3A5F', marginBottom: 8 }}>Acesso restrito</div>
          <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px' }}>
            Esta área é exclusiva dos perfis <strong>Administrador</strong> e <strong>Tesouraria</strong>.
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

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Finanças e Tesouraria</h1>
            <p style={{ fontSize: 14, color: '#8A8A8A', margin: 0 }}>Entradas, saídas e controle financeiro da igreja.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <a href="/financas/relatorios" style={{ background: '#FFFFFF', color: '#1F3A5F', border: '1px solid #1F3A5F', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Relatórios
            </a>
            <a href="/financas/consolidar" style={{ background: '#1F3A5F', color: '#FFFFFF', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Consolidar
            </a>
            <a href="/financas/auditoria" style={{ background: '#FFFFFF', color: '#1F3A5F', border: '1px solid #1F3A5F', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Auditoria
            </a>
            <a href="/financas/novo" style={{ background: '#D9A441', color: '#1F3A5F', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              + Novo lançamento
            </a>
          </div>
        </div>

        {erro && (
          <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ ...estilo.card, borderLeft: '4px solid #1F3A5F' }}>
            <div style={{ fontSize: 13, color: '#8A8A8A', marginBottom: 4 }}>Saldo do período</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: saldo >= 0 ? '#4C8C6E' : '#B71C1C' }}>{formatarMoeda(saldo)}</div>
          </div>
          <div style={{ ...estilo.card, borderLeft: '4px solid #4C8C6E' }}>
            <div style={{ fontSize: 13, color: '#8A8A8A', marginBottom: 4 }}>Entradas</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#4C8C6E' }}>{formatarMoeda(totalEntradas)}</div>
          </div>
          <div style={{ ...estilo.card, borderLeft: '4px solid #B71C1C' }}>
            <div style={{ fontSize: 13, color: '#8A8A8A', marginBottom: 4 }}>Saídas</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#B71C1C' }}>{formatarMoeda(totalSaidas)}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div>
            <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} style={estilo.campo} />
          </div>
          <select value={tipo} onChange={(e) => { setTipo(e.target.value); setCategoria('') }} style={estilo.campo}>
            <option value="">Todos os tipos</option>
            <option value="entrada">Entradas</option>
            <option value="saida">Saídas</option>
          </select>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={estilo.campo}>
            <option value="">Todas as categorias</option>
            {categorias.filter((c) => !tipo || c.tipo === tipo).map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          <button onClick={() => setMes('')} style={{ padding: '10px 12px', background: '#F5F0E6', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
            Todos os meses
          </button>
        </div>

        {carregando ? (
          <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '2rem' }}>Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '2rem', textAlign: 'center', border: '1px solid #E4DED2', fontSize: 14, color: '#8A8A8A' }}>
            Nenhum lançamento encontrado com os filtros selecionados.
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E4DED2', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 820 }}>
              <thead>
                <tr style={{ background: '#F5F0E6', color: '#1F3A5F', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Data</th>
                  <th style={{ padding: '12px 16px' }}>Descrição</th>
                  <th style={{ padding: '12px 16px' }}>Categoria</th>
                  <th style={{ padding: '12px 16px' }}>Tipo</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Valor</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((l) => (
                  <tr key={l.id} style={{ borderTop: '1px solid #F0EAE0', background: l.consolidado ? '#FFFDF7' : 'transparent' }}>
                    <td style={{ padding: '12px 16px', color: '#5A5A5A', verticalAlign: 'top' }}>
                      {formatarData(l.data_lancamento)}
                      {l.consolidado && (
                        <span style={{ display: 'block', background: '#FDF3E3', color: '#B26A00', padding: '2px 8px', borderRadius: 999, fontSize: 11, marginTop: 4, width: 'fit-content' }}>
                          🔒 Consolidado
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2E2E2E', verticalAlign: 'top' }}>
                      {l.descricao || (l.tipo === 'entrada' && l.membro_id ? nomeMembro(l.membro_id) : '—')}
                      {l.nota_permanente && (
                        <span style={{ display: 'block', marginTop: 4, fontSize: 11, fontWeight: 400, color: '#B26A00', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                          {l.nota_permanente}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#5A5A5A', verticalAlign: 'top' }}>{nomeCategoria(l.categoria_id)}</td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                      <span style={{ background: l.tipo === 'entrada' ? '#EAF4EE' : '#FDECEC', color: l.tipo === 'entrada' ? '#4C8C6E' : '#B71C1C', padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
                        {l.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: l.tipo === 'entrada' ? '#4C8C6E' : '#B71C1C', verticalAlign: 'top' }}>
                      {formatarMoeda(l.valor)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                      <button onClick={() => setConsultando(l)} style={{ background: 'none', border: 'none', color: '#1F3A5F', fontSize: 13, cursor: 'pointer', marginRight: 12 }}>
                        Consultar
                      </button>
                      <a href={`/financas/editar?id=${l.id}`} style={{ color: '#1F3A5F', marginRight: 12, fontSize: 13 }}>Editar</a>
                      {l.consolidado ? (
                        <span style={{ color: '#C9C2B6', fontSize: 13 }} title="Lançamento consolidado não pode ser excluído">Excluir</span>
                      ) : (
                        <button onClick={() => setExcluindo(l)} style={{ background: 'none', border: 'none', color: '#B71C1C', fontSize: 13, cursor: 'pointer' }}>
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

      {consultando && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', maxWidth: 520, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1F3A5F' }}>Consulta do lançamento</div>
              <button onClick={() => setConsultando(null)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#8A8A8A', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gap: '0.6rem', fontSize: 14 }}>
              <div><strong style={{ color: '#1F3A5F' }}>Data:</strong> {formatarData(consultando.data_lancamento)}</div>
              <div><strong style={{ color: '#1F3A5F' }}>Descrição:</strong> {consultando.descricao || '—'}</div>
              <div><strong style={{ color: '#1F3A5F' }}>Categoria:</strong> {nomeCategoria(consultando.categoria_id)}</div>
              <div>
                <strong style={{ color: '#1F3A5F' }}>Tipo:</strong>{' '}
                <span style={{ background: consultando.tipo === 'entrada' ? '#EAF4EE' : '#FDECEC', color: consultando.tipo === 'entrada' ? '#4C8C6E' : '#B71C1C', padding: '3px 8px', borderRadius: 999, fontSize: 12 }}>
                  {consultando.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                </span>
              </div>
              <div><strong style={{ color: '#1F3A5F' }}>Valor:</strong> <strong>{formatarMoeda(consultando.valor)}</strong></div>
              <div><strong style={{ color: '#1F3A5F' }}>Forma de pagamento:</strong> {consultando.forma_pagamento || '—'}</div>
              <div>
                <strong style={{ color: '#1F3A5F' }}>Membro:</strong>{' '}
                {consultando.membro_id ? nomeMembro(consultando.membro_id) : '—'}
              </div>
              <div>
                <strong style={{ color: '#1F3A5F' }}>Observações:</strong>{' '}
                {consultando.observacoes ? (
                  <span style={{ whiteSpace: 'pre-line', color: '#2E2E2E' }}>{consultando.observacoes}</span>
                ) : '—'}
              </div>
              {consultando.consolidado && (
                <div><strong style={{ color: '#B26A00' }}>Status:</strong> <span style={{ color: '#B26A00' }}>🔒 Consolidado</span></div>
              )}
              {consultando.nota_permanente && (
                <div style={{ background: '#FDF3E3', color: '#B26A00', padding: '10px 12px', borderRadius: 8, fontSize: 12, whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                  <strong>Nota permanente:</strong> {consultando.nota_permanente}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: 20 }}>
              <button
                onClick={() => setConsultando(null)}
                style={{ flex: 1, padding: '12px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Fechar
              </button>
              <a
                href={`/financas/editar?id=${consultando.id}`}
                style={{ flex: 1, padding: '12px', background: '#F5F0E6', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}
              >
                Editar lançamento
              </a>
            </div>
          </div>
        </div>
      )}

      {excluindo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', maxWidth: 420, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#B71C1C', marginBottom: 6 }}>Excluir lançamento</div>
            <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px' }}>
              Você deseja excluir o lançamento <strong>{excluindo.descricao || (excluindo.tipo === 'entrada' && excluindo.membro_id ? nomeMembro(excluindo.membro_id) : 'sem descrição')}</strong> de <strong>{formatarMoeda(excluindo.valor)}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={confirmarExclusao}
                disabled={salvando}
                style={{ flex: 1, padding: '12px', background: '#B71C1C', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                {salvando ? 'Excluindo...' : 'Sim, excluir'}
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
