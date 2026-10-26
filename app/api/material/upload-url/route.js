import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(url, chaveServico)

const BUCKET = 'materiais-eventos'
const LIMITE_BYTES = 50 * 1024 * 1024
const EXTENSOES_PERMITIDAS = [
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif',
  'mp4', 'mov', 'm4v', 'avi', 'mkv', 'webm',
  'mp3', 'm4a', 'wav', 'ogg', 'aac', 'flac',
  'pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'rtf',
]

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function hojeSaoPaulo() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

function extensaoDe(nome) {
  const partes = String(nome || '').split('.')
  return partes.length > 1 ? String(partes.pop()).toLowerCase() : ''
}

function limparNome(nome) {
  const limpo = String(nome || '')
    .replace(/[^\w.\- ]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(-120)
  return limpo || 'arquivo'
}

export async function POST(request) {
  try {
    const corpo = await request.json().catch(() => ({}))
    const eventoId = String(corpo?.evento_id || '').trim()
    const nomeArquivo = String(corpo?.arquivo_nome || '').trim()
    const tamanho = Number(corpo?.arquivo_tamanho || 0)

    if (!eventoId) {
      return Response.json({ ok: false, mensagem: 'Evento não informado.' }, { status: 400 })
    }
    if (!UUID.test(eventoId)) {
      return Response.json({ ok: false, mensagem: 'Link inválido. Peça à equipe da igreja um link de envio atualizado.' }, { status: 400 })
    }
    if (!nomeArquivo) {
      return Response.json({ ok: false, mensagem: 'Nome do arquivo não informado.' }, { status: 400 })
    }
    if (!tamanho || tamanho <= 0) {
      return Response.json({ ok: false, mensagem: 'Arquivo vazio ou tamanho inválido.' }, { status: 400 })
    }
    if (tamanho > LIMITE_BYTES) {
      return Response.json({ ok: false, mensagem: 'O arquivo passa de 50 MB. Envie vídeos maiores por link (YouTube/Drive) na descrição.' }, { status: 400 })
    }

    const ext = extensaoDe(nomeArquivo)
    if (!EXTENSOES_PERMITIDAS.includes(ext)) {
      return Response.json({ ok: false, mensagem: `O tipo de arquivo ".${ext || '?'}" não é aceito.` }, { status: 400 })
    }

    const { data: evento, error: erroEvento } = await admin
      .from('eventos')
      .select('id, igreja_id, titulo, tipo_evento, data_inicio')
      .eq('id', eventoId)
      .maybeSingle()

    if (erroEvento) {
      return Response.json({ ok: false, mensagem: 'Não foi possível consultar o evento. Tente novamente.' }, { status: 500 })
    }
    if (!evento) {
      return Response.json({ ok: false, mensagem: 'Evento não encontrado. Confira o link recebido.' }, { status: 404 })
    }

    // select * para não depender do nome exato da coluna de status/plano da igreja
    const { data: igreja } = await admin
      .from('igrejas')
      .select('*')
      .eq('id', evento.igreja_id)
      .maybeSingle()

    if (!igreja) {
      return Response.json({ ok: false, mensagem: 'Este link não está mais disponível.' }, { status: 404 })
    }

    const statusIgreja = String(igreja.status || igreja.situacao || '').toLowerCase()
    const igrejaInativa =
      igreja.ativa === false ||
      igreja.ativo === false ||
      igreja.bloqueada === true ||
      igreja.bloqueado === true ||
      ['inativo', 'inativa', 'bloqueado', 'bloqueada', 'suspenso', 'suspensa', 'excluido', 'excluida'].includes(statusIgreja)

    if (igrejaInativa) {
      return Response.json({ ok: false, mensagem: 'Este link não está mais disponível.' }, { status: 404 })
    }

    // O material de evento já ocorrido é removido no dia seguinte,
    // então o envio só é aceito até o dia do evento.
    const permanente = evento.tipo_evento === 'permanente'
    if (!permanente && evento.data_inicio) {
      const dataEvento = String(evento.data_inicio).slice(0, 10)
      if (dataEvento && dataEvento < hojeSaoPaulo()) {
        return Response.json({ ok: false, mensagem: 'O prazo de envio de material para este evento já encerrou.' }, { status: 410 })
      }
    }

    const caminho = `${evento.igreja_id}/${evento.id}/${Date.now()}-${limparNome(nomeArquivo)}`

    const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(caminho)
    if (error || !data?.token) {
      return Response.json({ ok: false, mensagem: 'Não foi possível autorizar o envio: ' + (error?.message || 'erro desconhecido') }, { status: 500 })
    }

    return Response.json(
      { ok: true, caminho: data.path || caminho, token: data.token },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (e) {
    return Response.json({ ok: false, mensagem: 'Erro inesperado: ' + (e?.message || String(e)) }, { status: 500 })
  }
}
