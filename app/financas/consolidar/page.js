'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { getPerfil } from '../../../lib/perfil'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const PERIODOS = [
  { v: 'diario', r: 'Diário' },
  { v: 'semanal', r: 'Semanal' },
  { v: 'quinzenal', r: 'Quinzenal' },
  { v: 'mensal', r: 'Mensal' },
]

function formatarMoeda(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function formatarData(iso) {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

function mesAtual() {
  const h = new Date()
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}`
}

function semanaAtual() {
  const h = new Date()
  const dia = (h.getDay() + 6) % 7 // segunda-feira = 0
  const seg = new Date(h)
  seg.setDate(h.getDate() - dia)
  const dom = new Date(seg)
  dom.setDate(seg.getDate() + 6)
  return { inicio: seg.toISOString().slice(0, 10), fim: dom.toISOString().slice(0, 10) }
}

function quinzenaAtual() {
  const fim = new Date()
  const ini = new Date(fim)
  ini.setDate(fim.getDate() - 14)
  return { inicio: ini.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) }
}

export default function ConsolidarPage() {
  const [perfilAtual, setPerfilAtual] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [lancamentos, setLancamentos] = useState([])
  const [consolidacoes, setConsolidacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [processando, setProcessando] = useState(false)

  const [periodo, setPeriodo] = useState('diario')
  const [dataDiaria, setDataDiaria] = useState(hojeISO())
  const [semana, setSemana] = useState(semanaAtual())
  const [quinzena, setQuinzena] = useState(quinzenaAtual())
  const [mesRef, setMesRef] = useState(mesAtual())

  useEffect(() => {
    getPerfil().then((p) => {
      setPerfilAtual(p)
      setVerificando(false)
      if (p && (p.perfil === 'admin_master' || p.perfil === 'tesouraria')) carregarDados()
    })
  }, [])

  async function carregarDados() {
    setCarregando(true)
    const [lanc, cons] = await Promise.all([
      supabase.from('lancamentos').select('*').order('data_lancamento', { ascending: true }),
      supabase.from('consolidacoes').select('*').order('confirmado_em', { ascending: false }),
    ])
    if (lanc.error || cons.error) {
      setErro('Não foi possível carregar os dados.')
    } else {
      setLancamentos(lanc.data || [])
      setConsolidacoes(cons.data || [])
    }
    setCarregando(false)
  }

  function intervalo() {
    if (periodo === 'diario') return { inicio: dataDiaria, fim: dataDiaria }
    if (periodo === 'semanal') return { inicio: semana.inicio, fim: semana.fim }
    if (periodo === 'quinzenal') return { inicio: quinzena.inicio, fim: quinzena.fim }
    const [ano, m] = mesRef.split('-')
    const ultimo = new Date(Number(ano), Number(m), 0).getDate()
    return { inicio: `${mesRef}-01`, fim: `${mesRef}-${String(ultimo).padStart(2, '0')}` }
  }

  const intervaloAtual = intervalo()
  const lista = lancamentos.filter((l) => l.data_lancamento >= intervaloAtual.inicio && l.data_lancamento <= intervaloAtual.fim)
  const entradas = lista.filter((l) => l.tipo === 'entrada').reduce((s, l) => s + Number(l.valor), 0)
  const saidas = lista.filter((l) => l.tipo === 'saida').reduce((s, l) => s + Number(l.valor), 0)
  const saldo = entradas - saidas
  const jaConsolidados = lista.filter((l) => l.consolidado).length
  const jaExistente = consolidacoes.find((c) => c.data_inicio === intervaloAtual.inicio && c.data_fim === intervaloAtual.fim && c.periodo === periodo)

  async function confirmar() {
    setErro('')
    setAviso('')
    const int = intervalo()
    if (lista.length === 0) {
      setErro('Não há lançamentos neste período para consolidar. Verifique as datas.')
      return
    }
    setProcessando(true)
    const { data, error } = await supabase.rpc('consolidar_periodo', {
      p_periodo: periodo,
      p_data_inicio: int.inicio,
      p_data_fim: int.fim,
    })
    setProcessando(false)
    if (error) {
      setErro(error.message || 'Não foi possível consolidar o período.')
    } else {
      setAviso(`Período consolidado! ${data.qtd} lançamentos travados. Entradas ${formatarMoeda(data.entradas)} · Saídas ${formatarMoeda(data.saidas)}.`)
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
        <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Consolidação de Período</h1>
        <p style={{ fontSize: 14, color: '#8A8A8A', margin: '0 0 1.5rem' }}>
          Confirme a contagem da comissão de finanças e trave os lançamentos do período.
        </p>

        <div style={{ background: '#FDF3E3', color: '#B26A00', padding: '12px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
          <strong>Como funciona:</strong> ao confirmar a consolidação, os lançamentos do período ficam <strong>travados</strong> (não podem mais ser editados ou excluídos diretamente). Caso seja necessária uma correção, o lançamento é alterado e fica <strong>aguardando a conferência do outro perfil financeiro</strong> (Administrador confere o que o Tesoureiro alterou, e vice-versa), com registro permanente da alteração.
        </div>

        {erro && (
          <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>
        )}
        {aviso && (
          <div style={{ background: '#EAF4EE', color: '#4C8C6E', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{aviso}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ ...estilo.card, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#8A8A8A', marginBottom: 4 }}>Entradas</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#4C8C6E' }}>{formatarMoeda(entradas)}</div>
          </div>
          <div style={{ ...estilo.card, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#8A8A8A', marginBottom: 4 }}>Saídas</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#B71C1C' }}>{formatarMoeda(saidas)}</div>
          </div>
          <div style={{ ...estilo.card, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#8A8A8A', marginBottom: 4 }}>Saldo do período</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: saldo >= 0 ? '#4C8C6E' : '#B71C1C' }}>{formatarMoeda(saldo)}</div>
          </div>
          <div style={{ ...estilo.card, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#8A8A8A', marginBottom: 4 }}>Lançamentos</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1F3A5F' }}>
              {lista.length}
              {jaConsolidados > 0 && (
                <span style={{ fontSize: 12, fontWeight: 400, color: '#8A8A8A', display: 'block' }}>
                  {jaConsolidados} já consolidado(s)
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ ...estilo.card, marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 12 }}>Selecione o período</div>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: 16, flexWrap: 'wrap' }}>
            {PERIODOS.map((p) => (
              <button
                key={p.v}
                type="button"
                onClick={() => setPeriodo(p.v)}
                style={{
                  padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: periodo === p.v ? '#1F3A5F' : '#F5F0E6',
                  color: periodo === p.v ? '#FFFFFF' : '#5A5A5A',
                }}
              >
                {p.r}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0 1rem', marginBottom: 16 }}>
            {periodo === 'diario' && (
              <div>
                <label style={estilo.rotulo}>Data do culto / dia</label>
                <input type="date" value={dataDiaria} onChange={(e) => setDataDiaria(e.target.value)} style={estilo.campo} />
              </div>
            )}
            {periodo === 'semanal' && (
              <>
                <div>
                  <label style={estilo.rotulo}>Início da semana</label>
                  <input type="date" value={semana.inicio} onChange={(e) => setSemana({ ...semana, inicio: e.target.value })} style={estilo.campo} />
                </div>
                <div>
                  <label style={estilo.rotulo}>Fim da semana</label>
                  <input type="date" value={semana.fim} onChange={(e) => setSemana({ ...semana, fim: e.target.value })} style={estilo.campo} />
                </div>
              </>
            )}
            {periodo === 'quinzenal' && (
              <>
                <div>
                  <label style={estilo.rotulo}>Início da quinzena</label>
                  <input type="date" value={quinzena.inicio} onChange={(e) => setQuinzena({ ...quinzena, inicio: e.target.value })} style={estilo.campo} />
                </div>
                <div>
                  <label style={estilo.rotulo}>Fim da quinzena</label>
                  <input type="date" value={quinzena.fim} onChange={(e) => setQuinzena({ ...quinzena, fim: e.target.value })} style={estilo.campo} />
                </div>
              </>
            )}
            {periodo === 'mensal' && (
              <div>
                <label style={estilo.rotulo}>Mês de referência</label>
                <input type="month" value={mesRef} onChange={(e) => setMesRef(e.target.value)} style={estilo.campo} />
              </div>
            )}
          </div>

          <div style={{ fontSize: 13, color: '#5A5A5A', marginBottom: 16 }}>
            Período selecionado: <strong>{formatarData(intervaloAtual.inicio)}</strong> a <strong>{formatarData(intervaloAtual.fim)}</strong>
          </div>

          {jaExistente && (
            <div style={{ background: '#E8F0FA', color: '#1F3A5F', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
              Este período já foi consolidado em {formatarData(jaExistente.confirmado_em ? jaExistente.confirmado_em.slice(0, 10) : '')}. Confirmar novamente atualizará o registro e re-trancará os lançamentos.
            </div>
          )}

          <button
            onClick={confirmar}
            disabled={processando || lista.length === 0}
            style={{
              padding: '12px 20px', background: lista.length === 0 ? '#D9D9D9' : '#1F3A5F', color: lista.length === 0 ? '#8A8A8A' : '#FFFFFF',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: lista.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {processando ? 'Consolidando...' : 'Confirmar consolidação e travar lançamentos'}
          </button>
        </div>

        <div style={estilo.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 12 }}>Consolidações anteriores</div>
          {carregando ? (
            <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '1.5rem' }}>Carregando...</div>
          ) : consolidacoes.length === 0 ? (
            <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '1.5rem' }}>Nenhuma consolidação registrada ainda.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 720 }}>
                <thead>
                  <tr style={{ background: '#F5F0E6', color: '#1F3A5F', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Período</th>
                    <th style={{ padding: '10px 12px' }}>Intervalo</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Entradas</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Saídas</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Qtd</th>
                    <th style={{ padding: '10px 12px' }}>Confirmado em</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidacoes.map((c) => (
                    <tr key={c.id} style={{ borderTop: '1px solid #F0EAE0' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#2E2E2E' }}>
                        {PERIODOS.find((p) => p.v === c.periodo)?.r || c.periodo}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#5A5A5A' }}>
                        {formatarData(c.data_inicio)} a {formatarData(c.data_fim)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#4C8C6E' }}>{formatarMoeda(c.total_entradas)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#B71C1C' }}>{formatarMoeda(c.total_saidas)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#5A5A5A' }}>{c.qtd_lancamentos}</td>
                      <td style={{ padding: '10px 12px', color: '#5A5A5A' }}>{formatarData(c.confirmado_em ? c.confirmado_em.slice(0, 10) : '')}</td>
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
