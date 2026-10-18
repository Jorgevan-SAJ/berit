'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getPerfil } from '../../lib/perfil'

function formatarHora(h) {
  if (!h) return ''
  return String(h).slice(0, 5)
}

export default function MultimidiaPage() {
  const [perfilAtual, setPerfilAtual] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [eventosHoje, setEventosHoje] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [eventoVinculado, setEventoVinculado] = useState('')
  const [mensagemExtra, setMensagemExtra] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    getPerfil().then((p) => {
      setPerfilAtual(p)
      setVerificando(false)
      if (p && ['admin_master', 'multimidia'].includes(p.perfil)) {
        carregarEventosHoje()
      }
    })
  }, [])

  async function carregarEventosHoje() {
    setCarregando(true)
    const agora = new Date()
    const hojeISO = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`
    const diaSemana = agora.getDay()
    const { data, error } = await supabase
      .from('eventos')
      .select('id, titulo, tipo_evento, data_inicio, hora_inicio, dia_semana, local')
      .order('hora_inicio')
    if (error) {
      setErro('Não foi possível carregar a programação de hoje.')
    } else {
      const lista = (data || []).filter((e) => {
        if (e.tipo_evento === 'permanente') return Number(e.dia_semana) === diaSemana
        return (e.data_inicio || '') === hojeISO
      })
      setEventosHoje(lista)
    }
    setCarregando(false)
  }

  function abrirModal() {
    setEventoVinculado('')
    setMensagemExtra('')
    setErro('')
    setModalAberto(true)
  }

  async function enviarAoVivo() {
    setEnviando(true)
    setErro('')
    try {
      const { data: sessao } = await supabase.auth.getSession()
      const token = sessao?.session?.access_token
      if (!token) {
        setResultado({ ok: false, mensagem: 'Sessão expirada. Faça login novamente.' })
        setModalAberto(false)
        return
      }
      const resposta = await fetch('/api/estamos-ao-vivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ p_evento_id: eventoVinculado || null, p_mensagem: mensagemExtra }),
      })
      const dados = await resposta.json()
      setResultado(dados)
      setModalAberto(false)
    } catch (e) {
      setResultado({ ok: false, mensagem: 'Não foi possível conectar ao servidor de envio.' })
      setModalAberto(false)
    } finally {
      setEnviando(false)
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

  if (!perfilAtual || !['admin_master', 'multimidia'].includes(perfilAtual.perfil)) {
    return (
      <main style={estilo.main}>
        <header style={estilo.header}>
          <a href="/area" style={estilo.linkLogo}>Berit</a>
          <a href="/area" style={estilo.botaoVoltar}>Voltar</a>
        </header>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1F3A5F', marginBottom: 8 }}>Acesso restrito</div>
          <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px' }}>
            Esta área é exclusiva dos perfis <strong>Administrador</strong> e <strong>Multimídia</strong>.
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
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Multimídia</h1>
        <p style={{ fontSize: 14, color: '#8A8A8A', margin: '0 0 1.5rem' }}>
          Posto de trabalho da equipe de mídia. Avise os fiéis no celular quando a transmissão começar.
        </p>

        <div style={{ ...estilo.card, textAlign: 'center', marginBottom: '1.5rem' }}>
          <button
            onClick={abrirModal}
            style={{ background: '#B71C1C', color: '#FFFFFF', border: 'none', borderRadius: 12, padding: '18px 36px', fontSize: 18, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(183,28,28,0.25)' }}
          >
            🔴 Estamos ao vivo
          </button>
          <p style={{ fontSize: 13, color: '#8A8A8A', margin: '12px 0 0', lineHeight: 1.5 }}>
            Envia notificação no celular de todos os fiéis que acompanham a igreja, com link direto para a página pública da congregação.
          </p>
        </div>

        {erro && (
          <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>
        )}

        <div style={estilo.card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F', marginBottom: 8 }}>📅 Programação de hoje</div>
          {carregando ? (
            <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '1rem' }}>Carregando...</div>
          ) : eventosHoje.length === 0 ? (
            <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '1rem' }}>
              Nenhum evento programado para hoje. O botão "Estamos ao vivo" continua funcionando com a mensagem padrão.
            </div>
          ) : (
            <div>
              {eventosHoje.map((e, i) => (
                <div
                  key={e.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem',
                    padding: '10px 0', borderTop: i === 0 ? 'none' : '1px solid #F0EAE0',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#2E2E2E' }}>{e.titulo}</div>
                    <div style={{ fontSize: 12, color: '#8A8A8A', marginTop: 2 }}>
                      {formatarHora(e.hora_inicio) ? `${formatarHora(e.hora_inicio)} · ` : ''}{e.local || 'Local não informado'}
                    </div>
                  </div>
                  <span style={{ background: '#E8F0FA', color: '#1F3A5F', padding: '2px 8px', borderRadius: 999, fontSize: 11, whiteSpace: 'nowrap' }}>
                    {e.tipo_evento === 'permanente' ? 'semanal' : 'hoje'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalAberto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', maxWidth: 480, width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#B71C1C', marginBottom: 6 }}>🔴 Estamos ao vivo</div>
            <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px' }}>
              Enviar notificação para todos os fiéis que acompanham a igreja?
            </p>
            {eventosHoje.length > 0 && (
              <>
                <label style={estilo.rotulo}>Vincular a um evento de hoje (opcional)</label>
                <select value={eventoVinculado} onChange={(e) => setEventoVinculado(e.target.value)} style={estilo.campo}>
                  <option value="">Sem vínculo — mensagem padrão</option>
                  {eventosHoje.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.titulo}{formatarHora(e.hora_inicio) ? ` (${formatarHora(e.hora_inicio)})` : ''}
                    </option>
                  ))}
                </select>
              </>
            )}
            <label style={estilo.rotulo}>Mensagem extra (opcional)</label>
            <textarea
              value={mensagemExtra}
              onChange={(e) => setMensagemExtra(e.target.value)}
              rows={2}
              placeholder="ex.: Link da transmissão disponível na página da igreja..."
              style={{ ...estilo.campo, marginBottom: 16, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={enviarAoVivo}
                disabled={enviando}
                style={{ flex: 1, padding: '12px', background: '#B71C1C', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                {enviando ? 'Enviando...' : 'Enviar notificação'}
              </button>
              <button
                onClick={() => setModalAberto(false)}
                disabled={enviando}
                style={{ flex: 1, padding: '12px', background: '#F5F0E6', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {resultado && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', maxWidth: 420, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{resultado.ok ? '✅' : '⚠️'}</div>
            <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px' }}>{resultado.mensagem}</p>
            <button
              onClick={() => setResultado(null)}
              style={{ width: '100%', padding: '12px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
