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

// Normaliza o número para o formato internacional do wa.me (55 + DDD + número).
// Também extrai o número de links wa.me caso o valor gravado seja um link.
function normalizarWhats(valor) {
  const texto = String(valor || '')
  const m = texto.match(/(?:wa\.me\/|phone=)(\d+)/)
  const d = (m ? m[1] : texto).replace(/\D/g, '')
  if (d.length === 10 || d.length === 11) return `55${d}`
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d
  return ''
}

// Detecta link de convite de grupo (chat.whatsapp.com) no campo configurado
function extrairLinkGrupo(valor) {
  const m = String(valor || '').match(/chat\.whatsapp\.com\/(?:invite\/)?([A-Za-z0-9_-]+)/)
  return m ? `https://chat.whatsapp.com/${m[1]}` : ''
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

// ===== Canal de acolhimento — conversa guiada com envio híbrido =====
// Prioridade: WhatsApp da igreja quando configurado (número ou grupo);
// sem WhatsApp configurado, o pedido é registrado no painel da igreja (Berit);
// igreja sem administração recebe orientação e convite aos líderes.
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
  const [copiado, setCopiado] = useState('')

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
      ...(retorno === 'sim' && contato.trim() ? [`Contato para retorno: ${contato.trim()}`] : []),
      `— Enviado pela página da ${igreja.nome} no Berit`,
    ].join('\n')
  }

  const campoWhats = tipo === 'oracao' ? igreja.whatsapp_oracoes : igreja.whatsapp_orientacoes
  const numeroDestino = normalizarWhats(campoWhats)
  const linkGrupo = extrairLinkGrupo(campoWhats)
  const podeEnviar = etapa === 'resumo' && autoriza !== null && retorno !== null
  const semAdministracao = igreja.aguarda_confirmacao || (igreja.origem === 'indicacao' && !igreja.publico_verificado)

  // Envio pelo WhatsApp da igreja (número)
  function enviar() {
    if (!numeroDestino || !podeEnviar) return
    const url = `https://wa.me/${numeroDestino}?text=${encodeURIComponent(montarMensagem())}`
    window.open(url, '_blank', 'noopener,noreferrer')
    aoFechar()
  }

  // Envio por grupo: copia a mensagem e orienta o usuário a colar no grupo
  async function enviarGrupo() {
    if (!linkGrupo || !podeEnviar) return
    try { await navigator.clipboard.writeText(montarMensagem()) } catch {}
    avancar('grupo', null, 'Copiei a sua mensagem para a área de transferência. Siga os passos abaixo para enviá-la ao grupo.')
  }

  // Envio pelo Berit: registra o pedido no painel da igreja
  async function enviarBerit() {
    if (!podeEnviar) return
    setEnviandoBerit(true)
    setErroBerit('')
    const { data, error } = 
