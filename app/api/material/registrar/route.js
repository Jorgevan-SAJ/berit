import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(url, chaveServico)

const BUCKET = 'materiais-eventos'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function hojeSaoPaulo() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

export async function POST(request) {
  try {
    const corpo = await request.json().catch(() => ({}))
    const eventoId = String(corpo?.evento_id || '').trim()
    const caminho = String(corpo?.caminho || '').trim()
    const remetente = String(corpo?.remetente || '').trim()
    const contato = String(corpo?.contato || '').trim()
    const descricao = String(corpo?.descricao || '').trim()
    const nomeArquivo = String(corpo?.arquivo_nome || '').trim()
    const tamanho = Number(corpo?.arquivo_tamanho || 0)

    if (!eventoId || !caminho || !remetente || !nomeArquivo) {
      return Response.json({ ok: false, mensagem: 'Dados incompletos para registrar o envio.' }, { status: 400 })
    }
    if (!UUID.test(eventoId)) {
      return Response.json({ ok: false, mensagem: 'Link inválido. Peça à equipe da igreja um link de envio atualizado.' }, { status: 400 })
    }

    const { data: evento, error: erroEvento } = await admin
      .from('eventos')
      .select('id, igreja_id, tipo_evento, data_inicio')
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

    const prefixo = `${evento.igreja_id}/${evento.id}/`
    if (!caminho.startsWith(prefixo)) {
      return Response.json({ ok: false, mensagem: 'Caminho do arquivo inválido para este evento.' }, { status: 400 })
    }

    const pasta = `${evento.igreja_id}/${evento.id}`
    const nomeNoStorage = caminho.slice(prefixo.length)
    const { data: lista, error: erroLista } = await admin.storage.from(BUCKET).list(pasta, { limit: 1000 })
    if (erroLista) {
      return Response.json({ ok: false, mensagem: 'Não foi possível confirmar o arquivo: ' + erroLista.message }, { status: 500 })
    }
    if (!(lista || []).some((item) => item.name === nomeNoStorage)) {
      return Response.json({ ok: false, mensagem: 'O arquivo não foi encontrado no armazenamento. Envie novamente.' }, { status: 400 })
    }

    const { error: erroInsert } = await admin.from('eventos_materiais_enviados').insert({
      evento_id: evento.id,
      igreja_id: evento.igreja_id,
      remetente,
      contato: contato || null,
      descricao: descricao || null,
      arquivo_path: caminho,
      arquivo_nome: nomeArquivo,
      arquivo_tamanho: tamanho || null,
    })

    if (erroInsert) {
      return Response.json({ ok: false, mensagem: 'Não foi possível registrar o envio: ' + erroInsert.message }, { status: 500 })
    }

    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return Response.json({ ok: false, mensagem: 'Erro inesperado: ' + (e?.message || String(e)) }, { status: 500 })
  }
}
