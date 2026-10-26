import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY

const admin = createClient(url, chaveServico)

const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function hojeSaoPaulo() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventoId = String(searchParams.get('evento') || '').trim()

    if (!eventoId) {
      return Response.json({ ok: false, mensagem: 'Evento não informado.' }, { status: 400 })
    }
    if (!UUID.test(eventoId)) {
      return Response.json({ ok: false, mensagem: 'Link inválido. Peça à equipe da igreja um link de envio atualizado.' }, { status: 400 })
    }

    const { data: evento, error: erroEvento } = await admin
      .from('eventos')
      .select('id, igreja_id, titulo, tipo_evento, data_inicio, hora_inicio, dia_semana')
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

    let quando = ''
    if (permanente) {
      const indice = evento.dia_semana === null || evento.dia_semana === undefined ? null : Number(evento.dia_semana)
      const dia = indice !== null && DIAS[indice] ? DIAS[indice] : ''
      quando = dia ? `Todo ${dia}` : 'Evento permanente'
      if (evento.hora_inicio) quando += `, às ${String(evento.hora_inicio).slice(0, 5)}`
    } else {
      const p = String(evento.data_inicio || '').slice(0, 10).split('-')
      quando = p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : ''
      if (evento.hora_inicio) quando += ` às ${String(evento.hora_inicio).slice(0, 5)}`
    }

    return Response.json(
      {
        ok: true,
        evento: {
          id: evento.id,
          titulo: evento.titulo,
          quando,
          igreja_nome: igreja.nome || '',
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (e) {
    return Response.json({ ok: false, mensagem: 'Erro inesperado ao consultar o evento.' }, { status: 500 })
  }
}
