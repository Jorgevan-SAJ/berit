'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { getPerfil } from '../../../lib/perfil'
import { formatarMoeda, formatarDataBR, gerarExcelRelatorio, gerarPDFRelatorio } from '../../../lib/relatorios'
function hojeISO(),
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
{
  return new Date().toISOString().slice(0, 10)
}

function mesAtual() {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
}

function primeiroDiaDoMes() {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
}

export default function RelatoriosPage() {
  const [perfilAtual, setPerfilAtual] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [lancamentos, setLancamentos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [membros, setMembros] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [modo, setModo] = useState('dia')
  const [tipoRel, setTipoRel] = useState('completo')
  const [dia, setDia] = useState(hojeISO())
  const [mes, setMes] = useState(mesAtual())
  const [dataInicio, setDataInicio] = useState(primeiroDiaDoMes())
  const [dataFim, setDataFim] = useState(hojeISO())

  const [assinatura1, setAssinatura1] = useState('')
  const [assinatura2, setAssinatura2] = useState('')
  const [assinatura3, setAssinatura3] = useState('')

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
      supabase.from('lancamentos').select('*').order('data_lancamento', { ascending: true }),
      supabase.from('categorias').select('*').order('nome'),
      supabase.from('membros').select('id, nome').order('nome'),
    ])
    if (lanc.error || cat.error || mem.error) {
      setErro('Não foi possível carregar os dados.')
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

  function filtrar() {
    let lista = lancamentos.filter((l) => {
      const data = l.data_lancamento || ''
      if (modo === 'dia') return data === dia
      if (modo === 'mes') return data.startsWith(mes)
      return data >= dataInicio && data <= dataFim
    })
    if (tipoRel === 'entrada') lista = lista.filter((l) => l.tipo === 'entrada')
    if (tipoRel === 'saida') lista = lista.filter((l) => l.tipo === 'saida')

    let saldo = 0
    return lista.map((l, i) => {
      saldo += l.tipo === 'entrada' ? Number(l.valor) : -Number(l.valor)
      return {
        ...l,
        seq: i + 1,
        saldoAcumulado: saldo,
        descricaoExibida: l.descricao || (l.tipo === 'entrada' && l.membro_id ? nomeMembro(l.membro_id) : '—'),
        categoriaNome: nomeCategoria(l.categoria_id),
      }
    })
  }

  function calcularTotais(lista) {
    const entradas = lista.filter((l) => l.tipo === 'entrada').reduce((s, l) => s + Number(l.valor), 0)
    const saidas = lista.filter((l) => l.tipo === 'saida').reduce((s, l) => s + Number(l.valor), 0)
    return { entradas, saidas, saldo: entradas - saidas }
  }

  function tituloRelatorio() {
    const tipo = tipoRel === 'entrada' ? ' — Apenas Entradas' : tipoRel === 'saida' ? ' — Apenas Saídas' : ''
    if (modo === 'dia') return `Relatório do Dia (${formatarDataBR(dia)})${tipo}`
    if (modo === 'mes') {
      const [a, m] = mes.split('-')
      return `Relatório Mensal — ${MESES[Number(m) - 1]} de ${a}${tipo}`
    }
    return `Relatório por Período (${formatarDataBR(dataInicio)} a ${formatarDataBR(dataFim)})${tipo}`
  }

  function gerarPDF() {
    const lista = filtrar()
    const totais = calcularTotais(lista)
    const assinaturas = modo === 'dia' ? [assinatura1, assinatura2, assinatura3].filter((a) => a.trim()) : []
    gerarPDFRelatorio({
      titulo: tituloRelatorio(),
      subtitulo: 'Berit — Finanças e Tesouraria',
      lancamentos: lista,
      totais,
      assinaturas,
      nomeArquivo: `berit_relatorio_${modo}_${tipoRel}.pdf`,
    })
  }

  function gerarExcel() {
    const lista = filtrar()
    gerarExcelRelatorio(lista, `berit_relatorio_${modo}_${tipoRel}.xlsx`)
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

  const lista = filtrar()
  const totais = calcularTotais(lista)

  return (
    <main style={estilo.main}>
      <header style={estilo.header}>
        <a href="/area" style={estilo.linkLogo}>Berit</a>
        <a href="/financas" style={estilo.botaoVoltar}>Voltar</a>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Relatórios Financeiros</h1>
        <p style={{ fontSize: 14, color: '#8A8A8A', margin: '0 0 1.5rem' }}>
          Gere relatórios do dia, mensais ou por período, em PDF ou Excel, para baixar e/ou imprimir.
        </p>

        {erro && (
          <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>
        )}

        <div style={{ ...estilo.card, marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 12 }}>Configuração do relatório</div>

          <label style={estilo.rotulo}>Período</label>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { v: 'dia', r: 'Por dia' },
              { v: 'mes', r: 'Por mês' },
              { v: 'periodo', r: 'Por período' },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setModo(o.v)}
                style={{
                  padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: modo === o.v ? '#1F3A5F' : '#F5F0E6',
                  color: modo === o.v ? '#FFFFFF' : '#5A5A5A',
                }}
              >
                {o.r}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0 1rem', marginBottom: 16 }}>
            {modo === 'dia' && (
              <div>
                <label style={estilo.rotulo}>Data do relatório</label>
                <input type="date" value={dia} onChange={(e) => setDia(e.target.value)} style={estilo.campo} />
              </div>
            )}
            {modo === 'mes' && (
              <div>
                <label style={estilo.rotulo}>Mês de referência</label>
                <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} style={estilo.campo} />
              </div>
            )}
            {modo === 'periodo' && (
              <>
                <div>
                  <label style={estilo.rotulo}>Data inicial</label>
                  <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} style={estilo.campo} />
                </div>
                <div>
                  <label style={estilo.rotulo}>Data final</label>
                  <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} style={estilo.campo} />
                </div>
              </>
            )}
          </div>

          <label style={estilo.rotulo}>Conteúdo</label>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { v: 'completo', r: 'Completo (extrato)' },
              { v: 'entrada', r: 'Apenas entradas' },
              { v: 'saida', r: 'Apenas saídas' },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setTipoRel(o.v)}
                style={{
                  padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: tipoRel === o.v ? '#4C8C6E' : '#F5F0E6',
                  color: tipoRel === o.v ? '#FFFFFF' : '#5A5A5A',
                }}
              >
                {o.r}
              </button>
            ))}
          </div>

          {modo === 'dia' && (
            <>
              <label style={estilo.rotulo}>Assinaturas dos representantes (contagem dos dízimos)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0 1rem', marginBottom: 16 }}>
                <div>
                  <input type="text" value={assinatura1} onChange={(e) => setAssinatura1(e.target.value)} placeholder="Relator / Tesoureiro" style={estilo.campo} />
                </div>
                <div>
                  <input type="text" value={assinatura2} onChange={(e) => setAssinatura2(e.target.value)} placeholder="Membro da comissão" style={estilo.campo} />
                </div>
                <div>
                  <input type="text" value={assinatura3} onChange={(e) => setAssinatura3(e.target.value)} placeholder="Membro da comissão" style={estilo.campo} />
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={gerarPDF} style={{ padding: '12px 20px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              📄 Baixar PDF
            </button>
            <button onClick={gerarExcel} style={{ padding: '12px 20px', background: '#4C8C6E', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              📊 Baixar Excel
            </button>
          </div>
        </div>

        <div style={estilo.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F' }}>{tituloRelatorio()}</div>
            <div style={{ fontSize: 13, color: '#5A5A5A' }}>
              {lista.length} lançamento(s) · Entradas {formatarMoeda(totais.entradas)} · Saídas {formatarMoeda(totais.saidas)} · Saldo {formatarMoeda(totais.saldo)}
            </div>
          </div>
          {carregando ? (
            <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '1.5rem' }}>Carregando...</div>
          ) : lista.length === 0 ? (
            <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '1.5rem' }}>Nenhum lançamento encontrado para esta configuração.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 760 }}>
                <thead>
                  <tr style={{ background: '#F5F0E6', color: '#1F3A5F', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Nº</th>
                    <th style={{ padding: '10px 12px' }}>Data</th>
                    <th style={{ padding: '10px 12px' }}>Descrição</th>
                    <th style={{ padding: '10px 12px' }}>Categoria</th>
                    <th style={{ padding: '10px 12px' }}>Tipo</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Valor</th>
                    {tipoRel === 'completo' && <th style={{ padding: '10px 12px', textAlign: 'right' }}>Saldo</th>}
                  </tr>
                </thead>
                <tbody>
                  {lista.map((l) => (
                    <tr key={l.id} style={{ borderTop: '1px solid #F0EAE0' }}>
                      <td style={{ padding: '10px 12px', color: '#5A5A5A' }}>{l.seq}</td>
                      <td style={{ padding: '10px 12px', color: '#5A5A5A' }}>{formatarDataBR(l.data_lancamento)}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#2E2E2E' }}>{l.descricaoExibida}</td>
                      <td style={{ padding: '10px 12px', color: '#5A5A5A' }}>{l.categoriaNome}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ background: l.tipo === 'entrada' ? '#EAF4EE' : '#FDECEC', color: l.tipo === 'entrada' ? '#4C8C6E' : '#B71C1C', padding: '3px 8px', borderRadius: 999, fontSize: 11 }}>
                          {l.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: l.tipo === 'entrada' ? '#4C8C6E' : '#B71C1C' }}>
                        {formatarMoeda(l.valor)}
                      </td>
                      {tipoRel === 'completo' && (
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#5A5A5A' }}>{formatarMoeda(l.saldoAcumulado)}</td>
                      )}
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
