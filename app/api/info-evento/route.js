import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY

const admin = createClient(url, chaveServico)

const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventoId = searchParams.get('evento')
    if (!eventoId) {
      return Response.json({ ok: false, mensagem: 'Evento não informado.' }, { status: 400 })
    }
    const { data: evento } = await admin
      .from('eventos')
      .select('id, igreja_id, titulo, tipo_evento, data_inicio, hora_inicio, dia_semana')
      .eq('id', eventoId)
      .maybeSingle()
    if (!evento) {
      return Response.json({ ok: false, mensagem: 'Evento não encontrado. Confira o link recebido.' }, { status: 404 })
    }
    const { data: igreja } = await admin.from('igrejas').select('nome').eq('id', evento.igreja_id).maybeSingle()
    let quando = ''
    if (evento.tipo_evento === 'permanente') {
      quando = `Todo ${DIAS[Number(evento.dia_semana)] || 'dia da semana'}${evento.hora_inicio ? `, às ${String(evento.hora_inicio).slice(0, 5)}` : ''}`
    } else {
      const p = String(evento.data_inicio || '').slice(0, 10).split('-')
      quando = p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : ''
      if (evento.hora_inicio) quando += ` às ${String(evento.hora_inicio).slice(0, 5)}`
    }
    return Response.json({
      ok: true,
      evento: {
        id: evento.id,
        titulo: evento.titulo,
        quando,
        igreja_id: evento.igreja_id,
        igreja_nome: igreja?.nome || '',
      },
    })
  } catch (e) {
    return Response.json({ ok: false, mensagem: 'Erro inesperado ao consultar o evento.' }, { status: 500 })
  }
}
