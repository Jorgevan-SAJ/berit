'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getPerfil, getStatusPlano } from '../../lib/perfil'
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
  const [notificando, setNotificando] = useState(null)
  const [enviandoNotificacao, setEnviandoNotificacao] = useState(false)
  const [resultadoNotificacao, setResultadoNotificacao] = useState(null)
  const [mensagemExtra, setMensagemExtra] = useState('')
  // Item 11 — status do plano para o bloqueio funcional
  const [planoBloqueado, setPlanoBloqueado] = useState(false)
  const [trialTerminaEm, setTrialTerminaEm] = useState(null)
  const podeVer = perfilAtual && ['admin_master', 'secretaria', 'tesouraria', 'conselho_fiscal'].includes(perfilAtual.perfil)
  // Item 11 — escrita bloqueada com trial expirado
  const podeGerenciar = perfilAtual && ['admin_master', 'secretaria'].includes(perfilAtual.perfil) && !planoBloqueado
  const ehSomenteLeitura = perfilAtual && ['tesouraria', 'conselho_fiscal'].includes(perfilAtual.perfil)
  useEffect(() => {
    getPerfil().then(async (p) => {
      setPerfilAtual(p)
      setVerificando(false)
      if (p && ['admin_master', 'secretaria', 'tesouraria', 'conselho_fiscal'].includes(p.perfil)) {
        // Item 11 — verificação centralizada do status do plano
        const st = await getStatusPlano()
        setPlanoBloqueado(!!st.bloqueado)
        setTrialTerminaEm(st.trialTerminaEm || null)
        carregar()
      }
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
    async function enviarNotificacao(evento) {
    setEnviandoNotificacao(true)
    setResultadoNotificacao(null)
    try {
      const { data: sessao } = await supabase.auth.getSession()
      const token = sessao?.session?.access_token
      if (!token) {
        setResultadoNotificacao({ ok: false, mensagem: 'Sessão expirada. Faça login novamente.' })
        return
      }
      const resposta = await fetch('/api/notificar-evento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ p_evento_id: evento.id, p_mensagem: mensagemExtra }),
      })
      const dados = await resposta.json()
      setResultadoNotificacao(dados)
    } catch (e) {
      setResultadoNotificacao({ ok: false, mensagem: 'Não foi possível conectar ao servidor de envio.' })
    } finally {
      setEnviandoNotificacao(false)
    }
  }
  const dataFimTrial = trialTerminaEm ? new Date(trialTerminaEm).toLocaleDateString('pt-BR') : ''
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
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {planoBloqueado && (
          <div style={{ background: '#FDECEC', border: '1px solid #F0C9C9', borderRadius: 10, padding: '12px 14px', marginBottom: '1.5rem', fontSize: 13, color: '#B71C1C', lineHeight: 1.5 }}>
            ⛔ <strong>O período de teste encerrou em {dataFimTrial}.</strong>{' '}
            As funções de cadastro e edição de eventos estão bloqueadas. A consulta à agenda permanece liberada.{' '}
            Regularize seu plano para retomar o uso completo do Berit — fale com a Equipe Berit em{' '}
            <a href="mailto:beritinovacoes@gmail.com?subject=Regulariza%C3%A7%C3%A3o%20de%20plano%20Berit" style={{ color: '#B71C1C', fontWeight: 700 }}>beritinovacoes@gmail.com</a>.
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Agenda</h1>
            <p style={{ fontSize: 14, color: '#8A8A8A', margin: 0 }}>
              Programações e eventos da igreja.
              {ehSomenteLeitura && ' Consulta em modo somente leitura.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {podeGerenciar && (
              <a href="/agenda/novo" style={{ background: '#D9A441', color: '#1F3A5F', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                + Novo evento
              </a>
            )}
          </div>
        </div>
        {erro && (
          <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
          <button onClick={() => mudarMes(-1)} style={{ padding: '10px 14px', background: '#F5F0E6', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>←</button>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1F3A5F', minWidth: 180, textAlign: 'center' }}>{nomeMes(ano, mesNum)}</div>
          <button onClick={() => mudarMes(1)} style={{ padding: '10px 14px', background: '#F5F0E6', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>→</button>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ ...estilo.campo, width: 180 }}>
            <option value="">Todos os tipos</option>
            {TIPOS.map((t) => (
              <option key={t.v} value={t.v}>{t.r}</option>
            ))}
          </select>
        </div>
        {carregando ? (
          <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '2rem' }}>Carregando agenda...</div>
        ) : (
          <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E4DED2', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#F5F0E6', color: '#1F3A5F', fontWeight: 700, fontSize: 12, textAlign: 'center' }}>
              {DIAS_SEMANA.map((d) => (
                <div key={d} style={{ padding: '10px 4px' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: 420 }}>
              {celulas.map((dia, i) => {
                if (dia === null) return <div key={`vazio-${i}`} style={{ borderTop: '1px solid #F0EAE0', borderRight: '1px solid #F0EAE0', minHeight: 90, background: '#FAFAF7' }} />
                const eventosDia = eventosPorDia[dia] || []
                const ehHoje = `${ano}-${String(mesNum).padStart(2, '0')}-${String(dia).padStart(2, '0')}` === hojeISO
                return (
                  <div
                    key={dia}
                    onClick={() => eventosDia.length > 0 && setSelecionado({ dia, eventos: eventosDia })}
                    style={{
                      borderTop: '1px solid #F0EAE0', borderRight: '1px solid #F0EAE0', minHeight: 90, padding: 6,
                      cursor: eventosDia.length > 0 ? 'pointer' : 'default', background: ehHoje ? '#FDF9EF' : '#FFFFFF',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: ehHoje ? 800 : 600, color: ehHoje ? '#B26A00' : '#5A5A5A', marginBottom: 4 }}>
                      {dia}
                    </div>
                    {eventosDia.slice(0, 3).map((e, idx) => {
                      const c = corTipo(e.tipo)
                      return (
                        <div key={idx} style={{ background: c.bg, color: c.cor, borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 600, marginBottom: 3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          {formatarHora(e.hora_inicio) ? `${formatarHora(e.hora_inicio)} ` : ''}{e.titulo}
                        </div>
                      )
                    })}
                    {eventosDia.length > 3 && (
                      <div style={{ fontSize: 10, color: '#8A8A8A', fontWeight: 600 }}>+{eventosDia.length - 3} mais</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
      {selecionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', maxWidth: 520, width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1F3A5F' }}>
                Eventos — {String(selecionado.dia).padStart(2, '0')}/{String(mesNum).padStart(2, '0')}/{ano}
              </div>
              <button onClick={() => setSelecionado(null)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#8A8A8A', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {selecionado.eventos.map((e) => {
                const c = corTipo(e.tipo)
                return (
                  <div key={e.id} style={{ border: '1px solid #F0EAE0', borderRadius: 10, padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ background: c.bg, color: c.cor, padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{rotuloTipo(e.tipo)}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#2E2E2E' }}>{e.titulo}</span>
                      </div>
                      {e.tipo_evento === 'permanente' && (
                        <span style={{ background: '#E8F0FA', color: '#1F3A5F', padding: '2px 7px', borderRadius: 999, fontSize: 10 }}>semanal</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#8A8A8A', marginTop: 6 }}>
                      {e.tipo_evento === 'permanente'
                        ? `${DIAS_SEMANA_LABEL[e.dia_semana]}${formatarHora(e.hora_inicio) ? ` às ${formatarHora(e.hora_inicio)}` : ''}`
                        : `${formatarData(e.data_inicio)}${formatarHora(e.hora_inicio) ? ` às ${formatarHora(e.hora_inicio)}` : ''}`}
                      {e.local ? ` · ${e.local}` : ''}
                    </div>
                    {e.descricao && <div style={{ fontSize: 13, color: '#5A5A5A', marginTop: 8, whiteSpace: 'pre-line', lineHeight: 1.5 }}>{e.descricao}</div>}
                    {podeGerenciar && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 12, flexWrap: 'wrap' }}>
                       <button onClick={() => { setMensagemExtra(''); setNotificando(e) }} style={{ padding: '8px 14px', background: '#E8F0FA', color: '#1F3A5F', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
                        🔔 Notificar
                       </button>
                        <a href={`/agenda/editar?id=${e.id}`} style={{ padding: '8px 14px', background: '#F5F0E6', color: '#1F3A5F', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                         Editar
                          </a>
                          <button onClick={() => setExcluindo(e)} style={{ padding: '8px 14px', background: '#FDECEC', color: '#B71C1C', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
                           Excluir
                          </button>
                        </div>
                      )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
      {notificando && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', maxWidth: 460, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1F3A5F', marginBottom: 6 }}>🔔 Notificar fiéis</div>
            <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 12px' }}>
              Enviar notificação no celular de quem acompanha a igreja sobre o evento <strong>{notificando.titulo}</strong>?
            </p>
            <label style={{ fontSize: 13, color: '#2E2E2E', display: 'block', marginBottom: 6 }}>Mensagem extra (opcional)</label>
            <textarea value={mensagemExtra} onChange={(e) => setMensagemExtra(e.target.value)} rows={2} placeholder="ex.: Traga um lanche para a confraternização..." style={{ width: '100%', padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => enviarNotificacao(notificando)} disabled={enviandoNotificacao} style={{ flex: 1, padding: '12px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                {enviandoNotificacao ? 'Enviando...' : 'Enviar notificação'}
              </button>
              <button onClick={() => setNotificando(null)} disabled={enviandoNotificacao} style={{ flex: 1, padding: '12px', background: '#F5F0E6', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {resultadoNotificacao && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', maxWidth: 420, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{resultadoNotificacao.ok ? '✅' : '⚠️'}</div>
            <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px' }}>{resultadoNotificacao.mensagem}</p>
            <button onClick={() => { setResultadoNotificacao(null); setNotificando(null) }} style={{ width: '100%', padding: '12px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Fechar
            </button>
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
