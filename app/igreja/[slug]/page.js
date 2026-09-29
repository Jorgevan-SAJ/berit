'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const DIAS_ORDEM = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const CORES_REDE = {
  Instagram: { cor: '#7B4FA6', bg: '#F3EAFB' },
  Facebook: { cor: '#1F3A5F', bg: '#E8F0FA' },
  YouTube: { cor: '#B71C1C', bg: '#FDECEC' },
  TikTok: { cor: '#2E2E2E', bg: '#F0EAE0' },
  'X (Twitter)': { cor: '#5A5A5A', bg: '#F0EAE0' },
  Outra: { cor: '#4C8C6E', bg: '#EAF4EE' },
}

const estilo = {
  main: { minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" },
  header: { background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem' },
  logo: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' },
  hero: { background: '#1F3A5F', color: '#FFFFFF', padding: '2.5rem 1.5rem', textAlign: 'center' },
  card: { background: '#FFFFFF', borderRadius: 12, border: '1px solid #E4DED2', padding: '1.5rem', marginBottom: '1rem' },
  tituloSecao: { fontSize: 16, fontWeight: 700, color: '#1F3A5F', margin: '0 0 12px' },
}

function formatarCNPJ(cnpj) {
  const d = String(cnpj || '').replace(/\D/g, '')
  if (d.length !== 14) return cnpj || ''
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

function formatarDataBR(iso) {
  if (!iso) return ''
  const partes = String(iso).slice(0, 10).split('-')
  if (partes.length !== 3) return ''
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function formatarHora(iso) {
  if (!iso) return ''
  const h = String(iso).slice(11, 16)
  return h.length === 5 ? h.replace(':', 'h') : ''
}

function ordenarCultos(lista) {
  return [...(lista || [])].sort((a, b) => DIAS_ORDEM.indexOf(a.dia) - DIAS_ORDEM.indexOf(b.dia))
}

function saudacaoHorario() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

// Item 8 — normaliza o número para o formato internacional do wa.me (55 + DDD + número)
function normalizarWhats(valor) {
  const texto = String(valor || '')
  const m = texto.match(/(?:wa\.me\/|phone=)(\d+)/)
  const d = (m ? m[1] : texto).replace(/\D/g, '')
  if (d.length === 10 || d.length === 11) return `55${d}`
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d
  return ''
}

function SeloVerificado() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.18)', color: '#FFFFFF', padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
        <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Dados verificados
    </span>
  )
}

function IconeWhatsApp({ tamanho = 18 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

function ReclamarIgreja() {
  const [logado, setLogado] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setLogado(!!data.user))
  }, [])

  if (logado === null) return null
  if (logado) return null

  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
  const linkAdquirir = isAndroid
    ? 'https://play.google.com/store/apps/details?id=com.berit.app'
    : '/cadastro'

  return (
    <div style={{ background: '#E8F0FA', border: '1px solid #C9D9EC', borderRadius: 10, padding: '12px 14px', marginBottom: '1rem' }}>
      <p style={{ margin: 0, fontSize: 13, color: '#1F3A5F', lineHeight: 1.6 }}>
        Você é Pastor ou Líder desta Igreja?{' '}
        <a href={linkAdquirir} style={{ color: '#1F3A5F', fontWeight: 700 }}>
          Adquira o Berit agora clicando aqui
        </a>{' '}
        para gerenciar os dados, ou{' '}
        <a href="mailto:beritinovacoes@gmail.com?subject=Quero%20adquirir%20o%20Berit%20para%20minha%20igreja" style={{ color: '#1F3A5F', fontWeight: 700 }}>
          fale com a Equipe Berit
        </a>.
      </p>
    </div>
  )
}

// ===== Item 8 — Conversa guiada de acolhimento (Oração / Orientação espiritual) =====
function ChatAcolhimento({ igreja, tipoInicial, aoFechar }) {
  const [etapa, setEtapa] = useState('nome')
  const [historico, setHistorico] = useState([])
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState(tipoInicial || '')
  const [texto, setTexto] = useState('')
  const [cidade, setCidade] = useState('')
  const [autoriza, setAutoriza] = useState(null)
  const [retorno, setRetorno] = useState(null)
  const [contato, setContato] = useState('')
  const [enviandoBerit, setEnviandoBerit] = useState(false)
  const [erroBerit, setErroBerit] = useState('')

  useEffect(() => {
    setHistorico([
      { de: 'igreja', texto: `${saudacaoHorario()}! Seja bem-vindo(a) ao canal de acolhimento da ${igreja.nome}. Como é o seu nome?` },
    ])
  }, [])

  function avancar(novaEtapa, falaUsuario, falaIgreja) {
    setHistorico((h) => [
      ...h,
      ...(falaUsuario ? [{ de: 'usuario', texto: falaUsuario }] : []),
      ...(falaIgreja ? [{ de: 'igreja', texto: falaIgreja }] : []),
    ])
    setEtapa(novaEtapa)
  }

  function confirmarNome() {
    if (!nome.trim()) return
    avancar('tipo', nome.trim(), `Olá ${nome.trim()}, que bom que você está aqui! Em que podemos ajudar?`)
  }

  function escolherTipo(t) {
    setTipo(t)
    const pergunta = t === 'oracao'
      ? 'O nosso grupo de oração está pronto para orar por você. Me fale um pouco sobre o que deseja que a nossa igreja apresente a Deus em seu favor (motivos de oração).'
      : 'Ficamos felizes em poder ajudar. Me conte qual é a sua dúvida espiritual ou teológica.'
    avancar('texto', t === 'oracao' ? 'Oração' : 'Orientação espiritual ou dúvidas teológicas', pergunta)
  }

  function confirmarTexto() {
    if (!texto.trim()) return
    avancar(
      'dados',
      texto.trim(),
      'Tudo bem, já estou preparando o seu pedido, mas antes preciso que você me responda três coisas:\n1. De qual cidade você está falando?\n2. Você autoriza que eu compartilhe seu pedido no nosso grupo?\n3. Você deseja que alguém da nossa igreja retorne o seu contato para conversar com você?'
    )
  }

  function montarMensagem() {
    const titulo = tipo === 'oracao' ? '*Pedido de oração*' : '*Orientação espiritual / dúvida teológica*'
    return [
      titulo,
      `Nome: ${nome.trim()}`,
      `Cidade: ${cidade.trim()}`,
      tipo === 'oracao' ? `Motivo de oração: ${texto.trim()}` : `Dúvida/orientação: ${texto.trim()}`,
      `Autoriza compartilhar no grupo da igreja: ${autoriza === 'sim' ? 'Sim' : 'Não'}`,
      `Deseja que alguém da igreja retorne o contato: ${retorno === 'sim' ? 'Sim' : 'Não'}`,
      `— Enviado pela página da ${igreja.nome} no Berit`,
    ].join('\n')
  }

  const numeroDestino = normalizarWhats(tipo === 'oracao' ? igreja.whatsapp_oracoes : igreja.whatsapp_orientacoes)
  const podeEnviar = etapa === 'resumo' && numeroDestino && autoriza !== null && retorno !== null

  function enviar() {
    if (!podeEnviar) return
    const url = `https://wa.me/${numeroDestino}?text=${encodeURIComponent(montarMensagem())}`
    window.open(url, '_blank', 'noopener,noreferrer')
    aoFechar()
  }

  function recomecar() {
    setNome(''); setTipo(''); setTexto(''); setCidade(''); setAutoriza(null); setRetorno(null)
    setHistorico([{ de: 'igreja', texto: `${saudacaoHorario()}! Seja bem-vindo(a) ao canal de acolhimento da ${igreja.nome}. Como é o seu nome?` }])
    setEtapa('nome')
  }

  const bolhaIgreja = { alignSelf: 'flex-start', background: '#F5F0E6', color: '#2E2E2E', padding: '10px 14px', borderRadius: '12px 12px 12px 4px', fontSize: 13, lineHeight: 1.6, maxWidth: '85%', whiteSpace: 'pre-line' }
  const bolhaUsuario = { alignSelf: 'flex-end', background: '#1F3A5F', color: '#FFFFFF', padding: '10px 14px', borderRadius: '12px 12px 4px 12px', fontSize: 13, lineHeight: 1.6, maxWidth: '85%', whiteSpace: 'pre-line' }
  const campo = { width: '100%', padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' }
  const botaoPrimario = { padding: '10px 16px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
  const botaoOpcao = (ativo) => ({ padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: ativo ? '2px solid #1F3A5F' : '1px solid #E4DED2', background: ativo ? '#E8F0FA' : '#FFFFFF', color: '#1F3A5F' })

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, padding: '1rem' }}>
      <div style={{ background: '#FFFFFF', borderRadius: 12, maxWidth: 460, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ background: '#1F3A5F', color: '#FFFFFF', padding: '12px 16px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700 }}>
            <IconeWhatsApp tamanho={18} /> Acolhimento — {igreja.nome}
          </div>
          <button onClick={aoFechar} style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 8, background: '#FAF6EF' }}>
          {historico.map((m, i) => (
            <div key={i} style={m.de === 'igreja' ? bolhaIgreja : bolhaUsuario}>{m.texto}</div>
          ))}
        </div>
        <div style={{ padding: '1rem', borderTop: '1px solid #E4DED2' }}>
          {etapa === 'nome' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmarNome()} placeholder="Seu nome" style={campo} autoFocus />
              <button onClick={confirmarNome} disabled={!nome.trim()} style={{ ...botaoPrimario, opacity: nome.trim() ? 1 : 0.5 }}>Enviar</button>
            </div>
          )}
          {etapa === 'tipo' && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => escolherTipo('oracao')} style={{ ...botaoPrimario, background: '#4C8C6E' }}>1. Oração</button>
              <button onClick={() => escolherTipo('orientacao')} style={botaoPrimario}>2. Orientação espiritual ou dúvidas teológicas</button>
            </div>
          )}
          {etapa === 'texto' && (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} placeholder="Escreva aqui..." style={{ ...campo, resize: 'vertical' }} autoFocus />
              <button onClick={confirmarTexto} disabled={!texto.trim()} style={{ ...botaoPrimario, opacity: texto.trim() ? 1 : 0.5 }}>Enviar</button>
            </div>
          )}
          {etapa === 'dados' && (
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              <div>
                <div style={{ fontSize: 12, color: '#5A5A5A', marginBottom: 4 }}>1. De qual cidade você está falando?</div>
                <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" style={campo} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#5A5A5A', marginBottom: 4 }}>2. Você autoriza compartilhar seu pedido no nosso grupo?</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setAutoriza('sim')} style={botaoOpcao(autoriza === 'sim')}>Sim, autorizo</button>
                  <button onClick={() => setAutoriza('nao')} style={botaoOpcao(autoriza === 'nao')}>Não</button>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#5A5A5A', marginBottom: 4 }}>3. Você deseja que alguém da igreja retorne o seu contato?</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setRetorno('sim')} style={botaoOpcao(retorno === 'sim')}>Sim</button>
                  <button onClick={() => setRetorno('nao')} style={botaoOpcao(retorno === 'nao')}>Não</button>
                </div>
              </div>
              <button
                onClick={() => avancar('resumo', `Cidade: ${cidade.trim()} · Compartilhar: ${autoriza === 'sim' ? 'Sim' : 'Não'} · Retorno: ${retorno === 'sim' ? 'Sim' : 'Não'}`, 'Perfeito! Confira o resumo do seu pedido abaixo e envie pelo WhatsApp da igreja.')}
                disabled={!cidade.trim() || autoriza === null || retorno === null}
                style={{ ...botaoPrimario, opacity: cidade.trim() && autoriza !== null && retorno !== null ? 1 : 0.5 }}
              >
                Continuar
              </button>
            </div>
          )}
          {etapa === 'resumo' && (
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              <div style={{ background: '#F5F0E6', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#2E2E2E', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                {montarMensagem()}
              
              </div>
              {numeroDestino ? (
                <button onClick={enviar} style={{ padding: '12px', background: '#25D366', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <IconeWhatsApp tamanho={18} /> Enviar pelo WhatsApp da igreja
                </button>
              ) : (
                <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 12 }}>
                  O WhatsApp desta igreja não está configurado corretamente. Entre em contato pelos dados da seção "Local e contato".
                </div>
              )}
              <div style={{ fontSize: 11, color: '#8A8A8A', lineHeight: 1.5 }}>
                O Berit não participa da conversa nem armazena seu pedido: o envio acontece direto no WhatsApp da igreja.
              </div>
              <button onClick={recomecar} style={{ background: 'transparent', border: 'none', color: '#8A8A8A', fontSize: 12, cursor: 'pointer' }}>
                ↺ Voltar ao início da conversa
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaginaPublicaIgreja() {
  const { slug } = useParams()
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [igreja, setIgreja] = useState(null)
  const [eventos, setEventos] = useState([])
  // Item 8 — conversa guiada de acolhimento
  const [chatAberto, setChatAberto] = useState(false)
  const [chatTipo, setChatTipo] = useState('')

  useEffect(() => {
    async function carregar() {
      if (!slug) return
      const { data, error } = await supabase.rpc('obter_igreja_publica', { p_slug: String(slug) })
      if (error || !data || !data.ok) {
        setErro(data?.mensagem || 'Igreja não encontrada.')
        setCarregando(false)
        return
      }
      setIgreja(data.dados)

      const ev = await supabase.rpc('obter_eventos_publicos', { p_slug: String(slug) })
      if (ev.data && ev.data.ok) {
        setEventos(ev.data.eventos || [])
      }
      setCarregando(false)
    }
    carregar()
  }, [slug])

  if (carregando) {
    return (
      <main style={estilo.main}>
        <header style={estilo.header}>
          <a href="/igrejas" style={estilo.logo}>Berit</a>
        </header>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center', color: '#8A8A8A', fontSize: 14 }}>
          Carregando...
        </div>
      </main>
    )
  }

  if (erro || !igreja) {
    return (
      <main style={estilo.main}>
        <header style={estilo.header}>
          <a href="/igrejas" style={estilo.logo}>Berit</a>
        </header>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '2rem', border: '1px solid #E4DED2' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#B71C1C', marginBottom: 8 }}>Igreja não encontrada</div>
            <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px' }}>{erro || 'Esta igreja não está publicada no diretório.'}</p>
            <a href="/igrejas" style={{ color: '#1F3A5F', fontSize: 14 }}>← Voltar ao diretório</a>
          </div>
        </div>
      </main>
    )
  }

  const cultos = ordenarCultos(igreja.horarios_cultos)
  const redes = Array.isArray(igreja.redes_sociais_lista) ? igreja.redes_sociais_lista : []
  const cnpjFormatado = formatarCNPJ(igreja.cnpj)
  const temWhatsOracoes = !!igreja.whatsapp_oracoes
  const temWhatsOrientacoes = !!igreja.whatsapp_orientacoes
  const enderecoCompleto = `${igreja.endereco_publico || ''}${igreja.bairro ? `, ${igreja.bairro}` : ''}${igreja.cidade ? `, ${igreja.cidade}` : ''}${igreja.uf ? ` - ${igreja.uf}` : ''}`
  const enderecoComunidade = (igreja.aguarda_confirmacao || (igreja.origem === 'indicacao' && !igreja.publico_verificado)) && igreja.endereco_publico
  const temDadosInstitucionais =
    redes.length > 0 ||
    !!igreja.contato ||
    !!igreja.whatsapp_oracoes ||
    !!igreja.whatsapp_orientacoes ||
    cultos.length > 0

  return (
    <main style={estilo.main}>
      <header style={estilo.header}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/igrejas" style={estilo.logo}>Berit</a>
          <a href="/igrejas" style={{ color: '#FFFFFF', fontSize: 13, textDecoration: 'none' }}>Voltar ao Diretório</a>
        </div>
      </header>

      <div style={estilo.hero}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 28 }}>{igreja.nome}</h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
              {igreja.cidade || ''}{igreja.cidade && igreja.uf ? `, ${igreja.uf}` : igreja.uf || ''}
            </span>
            {igreja.publico_verificado && <SeloVerificado />}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem' }}>
        {igreja.aguarda_confirmacao && (
          <div style={{ background: '#FDF3E3', border: '1px solid #F0D9A8', borderRadius: 10, padding: '12px 14px', marginBottom: '1rem' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#7A5A1E', lineHeight: 1.6 }}>
              Esta igreja foi cadastrada pela comunidade e ainda aguarda a confirmação dos responsáveis. As informações podem não estar completas.
            </p>
            <a
              href={`mailto:beritinovacoes@gmail.com?subject=${encodeURIComponent('Denúncia de igreja inexistente no diretório')}&body=${encodeURIComponent(`Igreja: ${igreja.nome}\nPágina: ${typeof window !== 'undefined' ? window.location.href : ''}\n\nGostaria de informar que esta igreja não existe ou foi cadastrada indevidamente.`)}`}
              style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: '#7A5A1E', textDecoration: 'underline', fontWeight: 600 }}
            >
              Esta igreja não existe? Informe ao grupo Berit para retirá-la da lista pública.
            </a>
          </div>
        )}

        {igreja.origem === 'indicacao' && !igreja.aguarda_confirmacao && igreja.publico_verificado && !temDadosInstitucionais && (
          <div style={{ background: '#EAF4EE', border: '1px solid #C9E3D4', borderRadius: 10, padding: '12px 14px', marginBottom: '1rem' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#4C8C6E', lineHeight: 1.6 }}>
              Cadastro validado pela comunidade Berit. Os dados institucionais (redes sociais, contato, horários de cultos) serão completados quando a igreja aderir ao Berit.
            </p>
          </div>
        )}

        <ReclamarIgreja slug={igreja.slug} />

        {igreja.lead_publico && (
          <div style={{ ...estilo.card, background: '#FDF3E3', borderColor: '#F0D9A8' }}>
            <p style={{ margin: 0, fontSize: 15, color: '#7A5A1E', lineHeight: 1.6 }}>{igreja.lead_publico}</p>
          </div>
        )}

        {igreja.sobre && (
          <div style={estilo.card}>
            <h2 style={estilo.tituloSecao}>Sobre nós</h2>
            <p style={{ margin: 0, fontSize: 14, color: '#5A5A5A', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{igreja.sobre}</p>
          </div>
        )}

        {cultos.length > 0 && (
          <div style={estilo.card}>
            <h2 style={estilo.tituloSecao}>Horários de cultos</h2>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {cultos.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0EAE0', padding: '8px 0' }}>
                  <span style={{ fontSize: 14, color: '#2E2E2E', fontWeight: 600 }}>{c.dia}</span>
                  <span style={{ fontSize: 14, color: '#5A5A5A' }}>
                    {c.horario}{c.nome ? ` · ${c.nome}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {eventos.length > 0 && (
          <div style={estilo.card}>
            <h2 style={estilo.tituloSecao}>Próximos eventos</h2>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {eventos.map((ev) => (
                <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0EAE0', padding: '8px 0' }}>
                  <div>
                    <div style={{ fontSize: 14, color: '#2E2E2E', fontWeight: 600 }}>{ev.titulo || ev.nome || 'Evento'}</div>
                    {ev.descricao && <div style={{ fontSize: 12, color: '#8A8A8A' }}>{ev.descricao}</div>}
                  </div>
                  <div style={{ fontSize: 13, color: '#5A5A5A', textAlign: 'right' }}>
                    <div>{formatarDataBR(ev.data_inicio || ev.data)}</div>
                    {formatarHora(ev.data_inicio || ev.horario) && (
                      <div>{formatarHora(ev.data_inicio || ev.horario)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(igreja.endereco_publico || igreja.contato || igreja.email || cnpjFormatado) && (
          <div style={estilo.card}>
            <h2 style={estilo.tituloSecao}>Local e contato</h2>
            <div style={{ display: 'grid', gap: '0.4rem', fontSize: 14, color: '#5A5A5A' }}>
              {igreja.endereco_publico && (
                <div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoCompleto)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#1F3A5F', textDecoration: 'underline' }}
                  >
                    📍 {igreja.endereco_publico}{igreja.bairro ? `, ${igreja.bairro}` : ''}
                    {igreja.cidade && `, ${igreja.cidade}${igreja.uf ? ` - ${igreja.uf}` : ''}`}
                  </a>
                  <div style={{ fontSize: 12, color: '#8A8A8A', marginTop: 4 }}>Clique para abrir no Google Maps e traçar a rota.</div>
                </div>
              )}
              {igreja.contato && <div>📞 {igreja.contato}</div>}
              {igreja.email && <div>✉️ {igreja.email}</div>}
              {cnpjFormatado && <div>CNPJ: {cnpjFormatado}</div>}
            </div>
            {enderecoComunidade && (
              <div style={{ background: '#FDF3E3', border: '1px solid #F0D9A8', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#7A5A1E', marginTop: 12, lineHeight: 1.5 }}>
                ⚠️ Este endereço foi cadastrado pela comunidade e não passou por verificação do Berit. Antes de se deslocar, confirme a localização por outros meios e evite ir a locais desconhecidos.
              </div>
            )}
          </div>
        )}

        {(temWhatsOracoes || temWhatsOrientacoes) && (
          <div style={estilo.card}>
            <h2 style={estilo.tituloSecao}>Canais de acolhimento</h2>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#8A8A8A', lineHeight: 1.5 }}>
              Fale com a igreja pelo WhatsApp. A conversa é guiada pelo Berit e o envio acontece direto no WhatsApp da igreja.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {temWhatsOracoes && (
                <button
                  onClick={() => { setChatTipo('oracao'); setChatAberto(true) }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25D366', color: '#FFFFFF', padding: '12px 18px', borderRadius: 8, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  <IconeWhatsApp tamanho={18} /> Pedidos de oração
                </button>
              )}
              {temWhatsOrientacoes && (
                <button
                  onClick={() => { setChatTipo('orientacao'); setChatAberto(true) }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1F3A5F', color: '#FFFFFF', padding: '12px 18px', borderRadius: 8, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  <IconeWhatsApp tamanho={18} /> Orientação espiritual
                </button>
              )}
            </div>
          </div>
        )}

        {redes.length > 0 && (
          <div style={estilo.card}>
            <h2 style={estilo.tituloSecao}>Redes sociais</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {redes.map((r, i) => {
                const cores = CORES_REDE[r.nome] || CORES_REDE.Outra
                return (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-block', background: cores.bg, color: cores.cor, padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
                  >
                    {r.nome}
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <footer style={{ borderTop: '1px solid #E4DED2', padding: '1.5rem', textAlign: 'center', fontSize: 12, color: '#8A8A8A' }}>
        Berit, Gestão simples para igrejas
      </footer>

      {chatAberto && (
        <ChatAcolhimento igreja={igreja} tipoInicial={chatTipo} aoFechar={() => setChatAberto(false)} />
      )}
    </main>
  )
}
