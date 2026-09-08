'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { getPerfil } from '../../../lib/perfil'
import { formatarMoeda, gerarExcelContribuicoes, gerarPDFContribuicoes } from '../../../lib/relatorios'

const SITUACOES = [
  { v: 'ativo', r: 'Ativo' },
  { v: 'congregado', r: 'Congregado' },
  { v: 'visitante', r: 'Visitante' },
  { v: 'inativo', r: 'Inativo' },
]

function rotuloSituacao(v) {
  const s = SITUACOES.find((x) => x.v === v)
  return s ? s.r : v || '—'
}

function calcularIdade(nascimento) {
  if (!nascimento) return null
  const hoje = new Date()
  const nasc = new Date(nascimento + 'T00:00:00')
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

export default function ContribuicoesPage() {
  const [perfilAtual, setPerfilAtual] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [membros, setMembros] = useState([])
  const [lancamentos, setLancamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [ano, setAno] = useState(() => String(new Date().getFullYear()))
  const [filtroSituacao, setFiltroSituacao] = useState('')
  const [filtroClassificacao, setFiltroClassificacao] = useState('')

  useEffect(() => {
    getPerfil().then((p) => {
      setPerfilAtual(p)
      setVerificando(false)
      if (p && p.perfil === 'tesouraria') carregarDados()
    })
  }, [])

  async function carregarDados() {
    setCarregando(true)
    const [mem, lanc] = await Promise.all([
      supabase.from('membros').select('id, nome, data_nascimento, situacao').order('nome'),
      supabase.from('lancamentos').select('id, membro_id, data_lancamento, valor').eq('tipo', 'entrada').not('membro_id', 'is', null).order('data_lancamento', { ascending: true }),
    ])
    if (mem.error || lanc.error) {
      setErro('Não foi possível carregar os dados.')
    } else {
      setMembros(mem.data || [])
      setLancamentos(lanc.data || [])
    }
    setCarregando(false)
  }

  const dados = membros.map((m) => {
    const doAno = lancamentos.filter((l) => {
      const mesAno = (l.data_lancamento || '').slice(0, 7)
      return l.membro_id === m.id && mesAno.startsWith(ano)
    })
    const mesesSet = new Set(doAno.map((l) => (l.data_lancamento || '').slice(0, 7)))
    const meses = mesesSet.size
    const total = doAno.reduce((s, l) => s + Number(l.valor), 0)
    let classificacao = 'nao_ofertante'
    let classificacaoLabel = 'Não Ofertante'
    if (meses >= 1 && meses <= 5) {
      classificacao = 'esporadico'
      classificacaoLabel = 'Ofertante Esporádico'
    } else if (meses >= 6 && meses <= 8) {
      classificacao = 'frequente'
      classificacaoLabel = 'Ofertante Frequente'
    } else if (meses >= 9) {
      classificacao = 'dizimista'
      classificacaoLabel = 'Dizimista'
    }
    return {
      ...m,
      idade: calcularIdade(m.data_nascimento),
      meses,
      total,
      classificacao,
      classificacaoLabel,
      situacaoLabel: rotuloSituacao(m.situacao),
    }
  })

  const filtrados = dados.filter((d) => {
    const sitOk = !filtroSituacao || d.situacao === filtroSituacao
    const clOk = !filtroClassificacao || d.classificacao === filtroClassificacao
    return sitOk && clOk
  })

  function corClassificacao(c) {
    if (c === 'dizimista') return { bg: '#EAF4EE', fg: '#4C8C6E' }
    if (c === 'frequente') return { bg: '#E8F0FA', fg: '#1F3A5F' }
    if (c === 'esporadico') return { bg: '#FDF3E3', fg: '#B26A00' }
    return { bg: '#F0EAE0', fg: '#8A8A8A' }
  }

  const estilo = {
    main: { minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" },
    header: { background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    linkLogo: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' },
    botaoVoltar: { background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none' },
    card: { background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #E4DED2' },
    campo: { padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', width: '100%' },
    rotulo: { fontSize: 13, color: '#2E2E2E', display: 'block', marginBottom: 6 },
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

  if (!perfilAtual || perfilAtual.perfil !== 'tesouraria') {
    return (
      <main style={estilo.main}>
        <header style={estilo.header}>
          <a href="/area" style={estilo.linkLogo}>Berit</a>
          <a href="/financas" style={estilo.botaoVoltar}>Voltar</a>
        </header>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1F3A5F', marginBottom: 8 }}>Acesso restrito</div>
          <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px' }}>
            Esta área é exclusiva do perfil <strong>Tesouraria</strong>.
          </p>
          <a href="/financas" style={{ color: '#1F3A5F', fontSize: 14 }}>Voltar para Finanças</a>
        </div>
      </main>
    )
  }

  const totaisResumo = {
    dizimistas: filtrados.filter((d) => d.classificacao === 'dizimista').length,
    frequentes: filtrados.filter((d) => d.classificacao === 'frequente').length,
    esporadicos: filtrados.filter((d) => d.classificacao === 'esporadico').length,
    naoOfertantes: filtrados.filter((d) => d.classificacao === 'nao_ofertante').length,
  }

  return (
    <main style={estilo.main}>
      <header style={estilo.header}>
        <a href="/area" style={estilo.linkLogo}>Berit</a>
        <a href="/financas" style={estilo.botaoVoltar}>Voltar</a>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Contribuições dos Membros</h1>
        <p style={{ fontSize: 14, color: '#8A8A8A', margin: '0 0 1.5rem' }}>
          Comportamento dos membros em relação às contribuições — classificação automática por meses de entrega no ano.
        </p>

        <div style={{ background: '#E8F0FA', color: '#1F3A5F', padding: '12px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
          <strong>Critério:</strong> contagem de <strong>meses distintos</strong> no ano em que o membro teve pelo menos um lançamento de entrada vinculado. Todos os membros entram na análise. <strong>0 meses</strong> = Não Ofertante · <strong>1 a 5 meses</strong> (até 49%) = Ofertante Esporádico · <strong>6 a 8 meses</strong> (50% a 75%) = Ofertante Frequente · <strong>9 a 12 meses</strong> (acima de 75%) = Dizimista. O sistema considera apenas os números de entregas, independentemente dos motivos.
        </div>

        {erro && (
          <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ ...estilo.card, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#8A8A8A', marginBottom: 4 }}>Dizimistas</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#4C8C6E' }}>{totaisResumo.dizimistas}</div>
          </div>
          <div style={{ ...estilo.card, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#8A8A8A', marginBottom: 4 }}>Ofertantes frequentes</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1F3A5F' }}>{totaisResumo.frequentes}</div>
          </div>
          <div style={{ ...estilo.card, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#8A8A8A', marginBottom: 4 }}>Ofertantes esporádicos</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#B26A00' }}>{totaisResumo.esporadicos}</div>
          </div>
          <div style={{ ...estilo.card, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#8A8A8A', marginBottom: 4 }}>Não ofertantes</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#8A8A8A' }}>{totaisResumo.naoOfertantes}</div>
          </div>
        </div>

        <div style={{ ...estilo.card, marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 12 }}>Filtros e exportação</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0 1rem', marginBottom: 16 }}>
            <div>
              <label style={estilo.rotulo}>Ano de referência</label>
              <input type="number" value={ano} min="2000" max="2100" onChange={(e) => setAno(e.target.value)} style={estilo.campo} />
            </div>
            <div>
              <label style={estilo.rotulo}>Situação</label>
              <select value={filtroSituacao} onChange={(e) => setFiltroSituacao(e.target.value)} style={estilo.campo}>
                <option value="">Todas</option>
                {SITUACOES.map((s) => (
                  <option key={s.v} value={s.v}>{s.r}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={estilo.rotulo}>Classificação</label>
              <select value={filtroClassificacao} onChange={(e) => setFiltroClassificacao(e.target.value)} style={estilo.campo}>
                <option value="">Todas</option>
                <option value="dizimista">Dizimista</option>
                <option value="frequente">Ofertante frequente</option>
                <option value="esporadico">Ofertante esporádico</option>
                <option value="nao_ofertante">Não Ofertante</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => gerarPDFContribuicoes({ ano, membros: filtrados, nomeArquivo: `berit_contribuicoes_${ano}.pdf` })}
              style={{ padding: '12px 20px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              📄 Baixar PDF
            </button>
            <button
              onClick={() => gerarExcelContribuicoes(filtrados, `berit_contribuicoes_${ano}.xlsx`)}
              style={{ padding: '12px 20px', background: '#4C8C6E', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              📊 Baixar Excel
            </button>
          </div>
        </div>

        <div style={estilo.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F' }}>Membros analisados ({filtrados.length})</div>
            <div style={{ fontSize: 13, color: '#5A5A5A' }}>Ano de referência: {ano}</div>
          </div>
          {carregando ? (
            <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '1.5rem' }}>Carregando...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 720 }}>
                <thead>
                  <tr style={{ background: '#F5F0E6', color: '#1F3A5F', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Nome</th>
                    <th style={{ padding: '10px 12px' }}>Idade</th>
                    <th style={{ padding: '10px 12px' }}>Situação</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Meses com contribuição</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total ({ano})</th>
                    <th style={{ padding: '10px 12px' }}>Classificação</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((m) => {
                    const cor = corClassificacao(m.classificacao)
                    return (
                      <tr key={m.id} style={{ borderTop: '1px solid #F0EAE0' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#2E2E2E' }}>{m.nome}</td>
                        <td style={{ padding: '10px 12px', color: '#5A5A5A' }}>{m.idade !== null ? `${m.idade} anos` : '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#5A5A5A' }}>{m.situacaoLabel}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#5A5A5A' }}>{m.meses} / 12</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#2E2E2E' }}>{formatarMoeda(m.total)}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ background: cor.bg, color: cor.fg, padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {m.classificacaoLabel}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
