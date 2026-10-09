import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY
const vapidPublica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivada = process.env.VAPID_PRIVATE_KEY

const admin = createClient(url, chaveServico)

const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

function formatarDataBR(iso) {
  if (!iso) return ''
  const p = String(iso).slice(0, 10).split('-')
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : ''
}

export async function POST(request) {
  try {
    if (!vapidPublica || !vapidPrivada) {
      return Response.json({ ok: false, mensagem: 'Chaves VAPID não configuradas no servidor. Confira a variável VAPID_PRIVATE_KEY na Vercel.' }, { status: 500 })
    }

    const token = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim()
    if (!token) {
      return Response.json({ ok: false, mensagem: 'Você precisa estar logado.' }, { status: 401 })
    }

    const { data: dadosUsuario, error: erroUsuario } = await admin.auth.getUser(token)
    const usuario = dadosUsuario?.user
    if (erroUsuario || !usuario) {
      return Response.json({ ok: false, mensagem: 'Sessão expirada. Faça login novamente.' }, { status: 401 })
    }

    const { data: perfil } = await admin.from('perfis').select('perfil, igreja_id, ativo').eq('user_id', usuario.id).maybeSingle()
    if (!perfil || perfil.ativo === false || !['admin_master', 'secretaria'].includes(perfil.perfil)) {
      return Response.json({ ok: false, mensagem: 'Sem permissão para enviar notificações.' }, { status: 403 })
    }

    const corpo = await request.json()
    const eventoId = corpo?.p_evento_id
    const mensagemExtra = String(corpo?.p_mensagem || '').trim()
    if (!eventoId) {
      return Response.json({ ok: false, mensagem: 'Evento não informado.' }, { status: 400 })
    }

    const { data: evento } = await admin.from('eventos').select('id, igreja_id, titulo, tipo_evento, data_inicio, hora_inicio, dia_semana, local').eq('id', eventoId).maybeSingle()
    if (!evento) {
      return Response.json({ ok: false, mensagem: 'Evento não encontrado.' }, { status: 404 })
    }
    if (evento.igreja_id !== perfil.igreja_id) {
      return Response.json({ ok: false, mensagem: 'Este evento não pertence à sua igreja.' }, { status: 403 })
    }

    const { data: igreja } = await admin.from('igrejas').select('nome, slug').eq('id', evento.igreja_id).maybeSingle()

    const { data: inscricoes } = await admin.from('push_inscricoes').select('id, device_id, inscricao').eq('igreja_id', evento.igreja_id)
    const lista = inscricoes || []

    if (lista.length === 0) {
      return Response.json({ ok: true, enviados: 0, falhas: 0, mensagem: 'Nenhum aparelho inscrito nesta igreja ainda. Os fiéis que tocarem em "Acompanhar esta igreja" passarão a receber as notificações.' })
    }

    let quando = ''
    if (evento.tipo_evento === 'permanente') {
      quando = `Todo ${DIAS[Number(evento.dia_semana)] || 'dia da semana'}${evento.hora_inicio ? `, às ${evento.hora_inicio}` : ''}`
    } else {
      quando = `${formatarDataBR(evento.data_inicio)}${evento.hora_inicio ? ` às ${evento.hora_inicio}` : ''}`
    }

    const textoCorpo = `${evento.titulo} — ${quando}${evento.local ? ` · ${evento.local}` : ''}${mensagemExtra ? `\n${mensagemExtra}` : ''}`

    webpush.setVapidDetails('mailto:beritinovacoes@gmail.com', vapidPublica, vapidPrivada)

    let enviados = 0
    let falhas = 0

    for (const item of lista) {
      try {
        await webpush.sendNotification(item.inscricao, JSON.stringify({
          titulo: igreja?.nome || 'Berit',
          corpo: textoCorpo,
          url: igreja?.slug ? `/igreja/${igreja.slug}` : '/igrejas',
        }))
        enviados++
        await admin.from('notificacoes_enviadas').insert({
          evento_id: evento.id,
          igreja_id: evento.igreja_id,
          tipo: 'push',
          destinatario: item.device_id || String(item.id),
          status: 'sucesso',
          enviado_em: new Date().toISOString(),
        })
      } catch (e) {
        falhas++
        await admin.from('notificacoes_enviadas').insert({
          evento_id: evento.id,
          igreja_id: evento.igreja_id,
          tipo: 'push',
          destinatario: item.device_id || String(item.id),
          status: 'erro',
          erro: String(e?.message || e).slice(0, 500),
          enviado_em: new Date().toISOString(),
        })
      }
    }

    return Response.json({ ok: true, enviados, falhas, mensagem: `Notificação enviada para ${enviados} aparelho(s)${falhas ? ` · ${falhas} falha(s)` : ''}.` })
  } catch (e) {
    return Response.json({ ok: false, mensagem: 'Erro inesperado: ' + (e?.message || String(e)) }, { status: 500 })
  }
}
