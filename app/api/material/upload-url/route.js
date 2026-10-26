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
      .select('id, igreja_id, titulo')
      .eq('id', eventoId)
      .maybeSingle()

    if (erroEvento || !evento) {
      return Response.json({ ok: false, mensagem: 'Evento não encontrado. Confira o link recebido.' }, { status: 404 })
    }

    const caminho = `${evento.igreja_id}/${evento.id}/${Date.now()}-${limparNome(nomeArquivo)}`

    const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(caminho)
    if (error || !data?.token) {
      return Response.json({ ok: false, mensagem: 'Não foi possível autorizar o envio: ' + (error?.message || 'erro desconhecido') }, { status: 500 })
    }

    return Response.json({ ok: true, caminho: data.path || caminho, token: data.token })
  } catch (e) {
    return Response.json({ ok: false, mensagem: 'Erro inesperado: ' + (e?.message || String(e)) }, { status: 500 })
  }
}
