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

const NOMES_MES_CURTO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function chaveMes(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function ultimosMeses(n) {
  const hoje = new Date()
  const lista = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    lista.push({ chave: chaveMes(d), rotulo: NOMES_MES_CURTO[d.getMonth()] })
  }
  return lista
}

function agregarPorMes(lancamentos, meses) {
  const mapa = {}
  meses.forEach((m) => { mapa[m.chave] = { entradas: 0, saidas: 0 } })
  lancamentos.forEach((l) => {
    const chave = (l.data_lancamento || '').slice(0, 7)
    if (!mapa[chave]) return
    const v = Number(l.valor) || 0
    if (l.tipo === 'entrada') mapa[chave].entradas += v
    else if (l.tipo === 'saida') mapa[chave].saidas += v
  })
  return meses.map((m) => ({
    ...m,
    entradas: mapa[m.chave].entradas,
    saidas: mapa[m.chave].saidas,
    saldo: mapa[m.chave].entradas - mapa[m.chave].saidas,
  }))
}

function formatarValorCurto(v) {
  const abs = Math.abs(v)
  if (abs >= 1000000) return `${(v / 1000000).toFixed(1).replace('.', ',')}M`
  if (abs >= 1000) return `${Math.round(v / 1000)}k`
  return `${Math.round(v)}`
}

function GraficoLinhas({ dados }) {
  const W = 560
  const H = 230
  const padEsq = 48
  const padDir = 14
  const padTop = 18
  const padBaixo = 30
  const plotW = W - padEsq - padDir
  const plotH = H - padTop - padBaixo
  const temDados = dados.some((d) => d.entradas > 0 || d.saidas > 0)
  if (!temDados) {
    return (
      <div style={{ fontSize: 13, color: '#8A8A8A', textAlign: 'center', padding: '2rem 0' }}>
        Sem dados suficientes para exibir o gráfico.
      </div>
    )
  }
  const maxVal = Math.max(1, ...dados.map((d) => Math.max(d.entradas, d.saidas, Math.abs(d.saldo))))
  const passoX = dados.length > 1 ? plotW / (dados.length - 1) : 0
  const x = (i) => padEsq + (dados.length > 1 ? i * passoX : plotW / 2)
  const y = (v) => padTop + plotH - (v / maxVal) * plotH
  const pathDe = (campo) =>
    dados.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d[campo]).toFixed(1)}`).join(' ')
  const segmentosSaldo = []
  let atual = null
  dados.forEach((d, i) => {
    const v = d.saldo
    const cor = v >= 0 ? '#1F3A5F' : '#7B4FA6'
    if (!atual || atual.cor !== cor) {
      atual = { cor, pts: [] }
      segmentosSaldo.push(atual)
    }
    atual.pts.push([x(i), y(v)])
  })
  const linhas = [0.25, 0.5, 0.75, 1]
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {linhas.map((f) => {
          const yy = padTop + plotH - f * plotH
          const vv = maxVal * f
          return (
            <g key={f}>
              <line x1={padEsq} y1={yy} x2={W - padDir} y2={yy} stroke="#F0EAE0" strokeWidth={1} />
              <text x={padEsq - 6} y={yy + 4} textAnchor="end" fontSize={10} fill="#8A8A8A">{formatarValorCurto(vv)}</text>
            </g>
          )
        })}
        <line x1={padEsq} y1={padTop + plotH} x2={W - padDir} y2={padTop + plotH} stroke="#E4DED2" strokeWidth={1} />
        <path d={pathDe('entradas')} fill="none" stroke="#4C8C6E" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <path d={pathDe('saidas')} fill="none" stroke="#B71C1C" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {segmentosSaldo.map((s, i) => (
          <path
            key={i}
            d={s.pts.map((p, j) => `${j === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}
            fill="none"
            stroke={s.cor}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {dados.map((d, i) => (
          <g key={d.chave}>
            <circle cx={x(i)} cy={y(d.entradas)} r={3} fill="#4C8C6E" />
            <circle cx={x(i)} cy={y(d.saidas)} r={3} fill="#B71C1C" />
            <circle cx={x(i)} cy={y(d.saldo)} r={3} fill={d.saldo >= 0 ? '#1F3A5F' : '#7B4FA6'} />
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize={10} fill="#8A8A8A">{d.rotulo}</text>
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: 12, color: '#5A5A5A', marginTop: 8 }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 999, background: '#4C8C6E', marginRight: 5 }} />Entradas</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 999, background: '#B71C1C', marginRight: 5 }} />Saídas</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 999, background: '#1F3A5F', marginRight: 5 }} />Saldo</span>
      </div>
    </div>
  )
}

function GraficoBarras({ dados }) {
  const W = 560
  const H = 230
  const padEsq = 48
  const padDir = 14
  const padTop = 18
  const padBaixo = 30
  const plotW = W - padEsq - padDir
  const plotH = H - padTop - padBaixo
  const temDados = dados.some((d) => d.entradas > 0 || d.saidas > 0)
  if (!temDados) {
    return (
      <div style={{ fontSize: 13, color: '#8A8A8A', textAlign: 'center', padding: '2rem 0' }}>
        Sem dados suficientes para exibir o gráfico.
      </div>
    )
  }
  const maxVal = Math.max(1, ...dados.map((d) => Math.max(d.entradas, d.saidas)))
  const grupoW = plotW / dados.length
  const barraW = Math.min(20, grupoW * 0.3)
  const y = (v) => padTop + plotH - (v / maxVal) * plotH
  const linhas = [0.25, 0.5, 0.75, 1]
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {linhas.map((f) => {
          const yy = padTop + plotH - f * plotH
          const vv = maxVal * f
          return (
            <g key={f}>
              <line x1={padEsq} y1={yy} x2={W - padDir} y2={yy} stroke="#F0EAE0" strokeWidth={1} />
              <text x={padEsq - 6} y={yy + 4} textAnchor="end" fontSize={10} fill="#8A8A8A">{formatarValorCurto(vv)}</text>
            </g>
          )
        })}
        <line x1={padEsq} y1={padTop + plotH} x2={W - padDir} y2={padTop + plotH} stroke="#E4DED2" strokeWidth={1} />
        {dados.map((d, i) => {
          const cx = padEsq + i * grupoW + grupoW / 2
          const hE = Math.max(0, padTop + plotH - y(d.entradas))
          const hS = Math.max(0, padTop + plotH - y(d.saidas))
          return (
            <g key={d.chave}>
              <rect x={cx - barraW - 2} y={y(d.entradas)} width={barraW} height={hE} rx={3} fill="#4C8C6E" />
              <rect x={cx + 2} y={y(d.saidas)} width={barraW} height={hS} rx={3} fill="#B71C1C" />
              <text x={cx} y={H - 8} textAnchor="middle" fontSize={10} fill="#8A8A8A">{d.rotulo}</text>
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: 12, color: '#5A5A5A', marginTop: 8 }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#4C8C6E', marginRight: 5 }} />Entradas</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#B71C1C', marginRight: 5 }} />Saídas</span>
      </div>
    </div>
  )
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
      if (p && ['admin_master', 'tesouraria', 'conselho_fiscal'].includes(p.perfil)) {
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

  const dadosGrafico = agregarPorMes(lancamentos, ultimosMeses(6))

  // Permissões por perfil
  const podeLancar = perfilAtual && perfilAtual.perfil === 'tesouraria'
  const podeConferir = perfilAtual && ['admin_master', 'tesouraria'].includes(perfilAtual.perfil)
  const ehConselhoFiscal = perfilAtual && perfilAtual.perfil === 'conselho_fiscal'

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

  if (!perfilAtual || !['admin_master', 'tesouraria', 'conselho_fiscal'].includes(perfilAtual.perfil)) {
    return (
      <main style={estilo.main}>
        <header style={estilo.header}>
          <a href="/area" style={estilo.linkLogo}>Berit</a>
          <a href="/area" style={estilo.botaoVoltar}>Voltar</a>
        </header>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1F3A5F', marginBottom: 8 }}>Acesso restrito</div>
          <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px' }}>
            Esta área é exclusiva dos perfis <strong>Administrador</strong>, <strong>Tesouraria</strong> e <strong>Conselho Fiscal</strong>.
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
            <p style={{ fontSize: 14, color: '#8A8A8A', margin: 0 }}>
              {ehConselhoFiscal
                ? 'Consulta em modo somente leitura — Conselho Fiscal.'
                : 'Entradas, saídas e controle financeiro da igreja.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <a href="/financas/relatorios" style={{ background: '#FFFFFF', color: '#1F3A5F', border: '1px solid #1F3A5F', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Relatórios
            </a>
            {podeLancar && (
              <a href="/financas/consolidar" style={{ background: '#1F3A5F', color: '#FFFFFF', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                Consolidar
              </a>
            )}
            <a href="/financas/auditoria" style={{ background: '#FFFFFF', color: '#1F3A5F', border: '1px solid #1F3A5F', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Auditoria
            </a>
            {podeLancar && (
              <a href="/financas/contribuicoes" style={{ background: '#FFFFFF', color: '#4C8C6E', border: '1px solid #4C8C6E', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                Contribuições
              </a>
            )}
            {podeLancar && (
              <a href="/financas/novo" style={{ background: '#D9A441', color: '#1F3A5F', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                + Novo lançamento
              </a>
            )}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={estilo.card}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 4 }}>Evolução — últimos 6 meses</div>
            <div style={{ fontSize: 12, color: '#8A8A8A', marginBottom: 12 }}>
              Entradas, saídas e saldo ao longo do tempo (saldo negativo em roxo).
            </div>
            <GraficoLinhas dados={dadosGrafico} />
          </div>
          <div style={estilo.card}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 4 }}>Comparativo mensal</div>
            <div style={{ fontSize: 12, color: '#8A8A8A', marginBottom: 12 }}>
              Entradas vs. saídas por mês.
            </div>
            <GraficoBarras dados={dadosGrafico} />
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
                      {podeLancar && (
                        <>
                          <a href={`/financas/editar?id=${l.id}`} style={{ color: '#1F3A5F', marginRight: 12, fontSize: 13 }}>Editar</a>
                          {l.consolidado ? (
                            <span style={{ color: '#C9C2B6', fontSize: 13 }} title="Lançamento consolidado não pode ser excluído">Excluir</span>
                          ) : (
                            <button onClick={() => setExcluindo(l)} style={{ background: 'none', border: 'none', color: '#B71C1C', fontSize: 13, cursor: 'pointer' }}>
                              Excluir
                            </button>
                          )}
                        </>
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
              {podeLancar && (
                <a
                  href={`/financas/editar?id=${consultando.id}`}
                  style={{ flex: 1, padding: '12px', background: '#F5F0E6', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}
                >
                  Editar lançamento
                </a>
              )}
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
