'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getPerfil } from '../../lib/perfil'
const TIPOS = [
  { v: 'culto', r: 'Culto', cor: '#1F3A5F', bg: '#E8F0FA' },
  { v: 'ensaio', r: 'Ensaio', cor: '#4C8C6E', bg: '#EAF4EE' },
  { v: 'reuniao', r: 'Reunião', cor: '#B26A00', bg: '#FDF3E3' },
  { v: 'evento', r: 'Evento', cor: '#B71C1C', bg: '#FDECEC' },
  { v: 'campanha', r: 'Campanha', cor: '#7B4FA6', bg: '#F3EAFB' },
  { v: 'outro', r: 'Outro', cor: '#5A5A5A', bg: '#F0EAE0' },
]
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DIAS_SEMANA_LABEL = ['Domingos', 'Segundas', 'Terças', 'Quartas', 'Quintas', 'Sextas', 'Sábados']
function rotuloTipo(v) {
  const t = TIPOS.find((x) => x.v === v)
  return t ? t.r : v
}
function corTipo(v) {
  const t = TIPOS.find((x) => x.v === v)
  return t || { cor: '#5A5A5A', bg: '#F0EAE0' }
}
function formatarData(iso) {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}
function formatarHora(h) {
  if (!h) return ''
  return h.slice(0, 5)
}
function mesAtual() {
  const h = new Date()
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}`
}
function nomeMes(ano, mes) {
  const nomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  return `${nomes[mes - 1]} de ${ano}`
}
export default function AgendaPage() {
  const [perfilAtual, setPerfilAtual] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [eventos, setEventos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mes, setMes] = useState(mesAtual())
  const [filtroTipo, setFiltroTipo] = useState('')
  const [selecionado, setSelecionado] = useState(null)
  const [excluindo, setExcluindo] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const podeVer = perfilAtual && ['admin_master', 'secretaria', 'tesouraria', 'conselho_fiscal'].includes(perfilAtual.perfil)
  const podeGerenciar = perfilAtual && ['admin_master', 'secretaria'].includes(perfilAtual.perfil)
  const ehSomenteLeitura = perfilAtual && ['tesouraria', 'conselho_fiscal'].includes(perfilAtual.perfil)
  useEffect(() => {
    getPerfil().then((p) => {
      setPerfilAtual(p)
      setVerificando(false)
      if (p && ['admin_master', 'secretaria', 'tesouraria', 'conselho_fiscal'].includes(p.perfil)) carregar()
    })
  }, [])
  async function carregar() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .order('data_inicio', { ascending: true })
      .order('hora_inicio', { ascending: true })
    if (error) {
      setErro('Não foi possível carregar a agenda.')
    } else {
      setEventos(data || [])
    }
    setCarregando(false)
  }
  const [ano, mesNum] = mes.split('-').map(Number)
  const primeiro = new Date(ano, mesNum - 1, 1)
  const diasNoMes = new Date(ano, mesNum, 0).getDate()
  const offset = primeiro.getDay()
  const hojeISO = new Date().toISOString().slice(0, 10)
  const eventosAtivos = eventos.filter((e) => {
    if (e.tipo_evento === 'permanente') {
      return e.dia_semana !== null && e.dia_semana !== undefined
    }
    return (e.data_inicio || '') >= hojeISO
  })
  const especificosDoMes = eventosAtivos.filter((e) => e.tipo_evento !== 'permanente' && (e.data_inicio || '').startsWith(mes))
  const permanentes = eventosAtivos.filter((e) => e.tipo_evento === 'permanente')
  const filtrados = [...permanentes, ...especificosDoMes].filter((e) => !filtroTipo || e.tipo === filtroTipo)
  const eventosPorDia = {}
  filtrados.forEach((e) => {
    if (e.tipo_evento === 'permanente') {
      for (let d = 1; d <= diasNoMes; d++) {
        if (new Date(ano, mesNum - 1, d).getDay() === e.dia_semana) {
          if (!eventosPorDia[d]) eventosPorDia[d] = []
          eventosPorDia[d].push(e)
        }
      }
    } else {
      const dia = Number(e.data_inicio.slice(8, 10))
      if (!eventosPorDia[dia]) eventosPorDia[dia] = []
      eventosPorDia[dia].push(e)
    }
  })
  const celulas = []
  for (let i = 0; i < offset; i++) celulas.push(null)
  for (let d = 1; d <= diasNoMes; d++) celulas.push(d)
  function mudarMes(delta) {
    const d = new Date(ano, mesNum - 1 + delta, 1)
    setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  async function confirmarExclusao() {
    if (!excluindo) return
    setSalvando(true)
    const { error } = await supabase.from('eventos').delete().eq('id', excluindo.id)
    setSalvando(false)
    if (error) {
      setErro('Não foi possível excluir o evento.')
    } else {
      setExcluindo(null)
      setSelecionado(null)
      carregar()
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
  if (!perfilAtual || !podeVer) {
    return (
      <main style={estilo.main}>
        <header style={estilo.header}>
          <a href="/area" style={estilo.linkLogo}>Berit</a>
          <a href="/area" style={estilo.botaoVoltar}>Voltar</a>
        </header>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1F3A5F', marginBottom: 8 }}>Acesso restrito</div>
          <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px' }}>
            Esta área é exclusiva dos perfis <strong>Administrador</strong>, <strong>Secretaria</strong>, <strong>Tesouraria</strong> e <strong>Conselho Fiscal</strong>.
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
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Agenda de Atividades</h1>
            <p style={{ fontSize: 14, color: '#8A8A8A', margin: 0 }}>
              Programações, cultos, ensaios e eventos da igreja.
              {ehSomenteLeitura && ' Consulta em modo somente leitura.'}
            </p>
          </div>
          {podeGerenciar && (
            <a href="/agenda/novo" style={{ background: '#D9A441', color: '#1F3A5F', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              + Novo evento
            </a>
          )}
        </div>
        {erro && (
          <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>
        )}
        <div style={{ ...estilo.card, marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button onClick={() => mudarMes(-1)} style={{ padding: '8px 14px', background: '#F5F0E6', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>‹</button>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1F3A5F', minWidth: 180, textAlign: 'center' }}>{nomeMes(ano, mesNum)}</div>
              <button onClick={() => mudarMes(1)} style={{ padding: '8px 14px', background: '#F5F0E6', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>›</button>
            </div>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ ...estilo.campo, width: 200 }}>
              <option value="">Todos os tipos</option>
              {TIPOS.map((t) => (
                <option key={t.v} value={t.v}>{t.r}</option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: 12, color: '#8A8A8A', marginBottom: 12, lineHeight: 1.5 }}>
            💡 Eventos <strong>permanentes</strong> aparecem toda semana no mês e nunca expiram. Eventos <strong>específicos</strong> somem automaticamente após a data.
          </div>
          {carregando ? (
            <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '2rem' }}>Carregando...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {DIAS_SEMANA.map((d) => (
                <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#8A8A8A', padding: '4px 0' }}>{d}</div>
              ))}
              {celulas.map((d, i) =>
                d === null ? (
                  <div key={`v-${i}`} style={{ minHeight: 90, borderRadius: 8, background: '#F7F3EA' }} />
                ) : (
                  <div
                    key={d}
                    style={{
                      minHeight: 90, borderRadius: 8, padding: 6, border: '1px solid #F0EAE0',
                      background: mes === hojeISO.slice(0, 7) && d === Number(hojeISO.slice(8, 10)) ? '#FFFDF7' : '#FFFFFF',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1F3A5F', marginBottom: 4 }}>{d}</div>
                    {(eventosPorDia[d] || []).slice(0, 2).map((e) => {
                      const c = corTipo(e.tipo)
                      return (
                        <button
                          key={e.id}
                          onClick={() => setSelecionado(e)}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left', background: c.bg, color: c.cor,
                            border: 'none', borderRadius: 6, padding: '3px 6px', fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}
                        >
                          {formatarHora(e.hora_inicio)} {e.titulo}
                        </button>
                      )
                    })}
                    {(eventosPorDia[d] || []).length > 2 && (
                      <div style={{ fontSize: 10, color: '#8A8A8A' }}>+{(eventosPorDia[d] || []).length - 2} mais</div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
        <div style={estilo.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 12 }}>
            Eventos do mês ({filtrados.length})
          </div>
          {filtrados.length === 0 ? (
            <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '1.5rem' }}>
              Nenhum evento neste mês.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 780 }}>
                <thead>
                  <tr style={{ background: '#F5F0E6', color: '#1F3A5F', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Data</th>
                    <th style={{ padding: '10px 12px' }}>Hora</th>
                    <th style={{ padding: '10px 12px' }}>Evento</th>
                    <th style={{ padding: '10px 12px' }}>Tipo</th>
                    <th style={{ padding: '10px 12px' }}>Recorrência</th>
                    <th style={{ padding: '10px 12px' }}>Local</th>
                    <th style={{ padding: '10px 12px' }}>Responsável</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((e) => {
                    const c = corTipo(e.tipo)
                    return (
                      <tr key={e.id} style={{ borderTop: '1px solid #F0EAE0', cursor: 'pointer' }} onClick={() => setSelecionado(e)}>
                        <td style={{ padding: '10px 12px', color: '#5A5A5A' }}>
                          {e.tipo_evento === 'permanente' ? DIAS_SEMANA_LABEL[e.dia_semana] : formatarData(e.data_inicio)}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#5A5A5A' }}>{formatarHora(e.hora_inicio)}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#2E2E2E' }}>{e.titulo}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ background: c.bg, color: c.cor, padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                            {rotuloTipo(e.tipo)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ background: e.tipo_evento === 'permanente' ? '#E8F0FA' : '#F5F0E6', color: e.tipo_evento === 'permanente' ? '#1F3A5F' : '#5A5A5A', padding: '3px 8px', borderRadius: 999, fontSize: 11 }}>
                            {e.tipo_evento === 'permanente' ? 'Permanente' : 'Data única'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#5A5A5A' }}>{e.local || '—'}</td>
                        <td style={{ padding: '10px 12px', color: '#5A5A5A' }}>{e.responsavel || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {selecionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', maxWidth: 520, width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1F3A5F' }}>{selecionado.titulo}</div>
              <button onClick={() => setSelecionado(null)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#8A8A8A', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: '0.6rem', fontSize: 14 }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ background: corTipo(selecionado.tipo).bg, color: corTipo(selecionado.tipo).cor, padding: '3px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                  {rotuloTipo(selecionado.tipo)}
                </span>
                <span style={{ background: selecionado.tipo_evento === 'permanente' ? '#E8F0FA' : '#F5F0E6', color: selecionado.tipo_evento === 'permanente' ? '#1F3A5F' : '#5A5A5A', padding: '3px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                  {selecionado.tipo_evento === 'permanente' ? 'Evento permanente' : 'Evento específico'}
                </span>
              </div>
              <div>
                <strong style={{ color: '#1F3A5F' }}>Data:</strong>{' '}
                {selecionado.tipo_evento === 'permanente'
                  ? `Todos os ${DIAS_SEMANA_LABEL[selecionado.dia_semana]}`
                  : formatarData(selecionado.data_inicio)}
              </div>
              <div><strong style={{ color: '#1F3A5F' }}>Hora:</strong> {formatarHora(selecionado.hora_inicio)}{selecionado.hora_fim ? ` às ${formatarHora(selecionado.hora_fim)}` : ''}</div>
              {selecionado.tipo_evento !== 'permanente' && selecionado.data_fim && (
                <div><strong style={{ color: '#1F3A5F' }}>Data final:</strong> {formatarData(selecionado.data_fim)}</div>
              )}
              <div><strong style={{ color: '#1F3A5F' }}>Local:</strong> {selecionado.local || '—'}</div>
              <div><strong style={{ color: '#1F3A5F' }}>Responsável:</strong> {selecionado.responsavel || '—'}</div>
              <div>
                <strong style={{ color: '#1F3A5F' }}>Descrição:</strong>{' '}
                {selecionado.descricao ? (
                  <span style={{ whiteSpace: 'pre-line', color: '#2E2E2E' }}>{selecionado.descricao}</span>
                ) : '—'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: 20 }}>
              <button
                onClick={() => setSelecionado(null)}
                style={{ flex: 1, padding: '12px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Fechar
              </button>
              {podeGerenciar && (
                <>
                  <a
                    href={`/agenda/editar?id=${selecionado.id}`}
                    style={{ flex: 1, padding: '12px', background: '#F5F0E6', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}
                  >
                    Editar
                  </a>
                  <button
                    onClick={() => setExcluindo(selecionado)}
                    style={{ flex: 1, padding: '12px', background: '#B71C1C', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Excluir
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {excluindo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', maxWidth: 420, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#B71C1C', marginBottom: 6 }}>Excluir evento</div>
            <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px' }}>
              Você deseja excluir o evento <strong>{excluindo.titulo}</strong>? Esta ação não pode ser desfeita.
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
