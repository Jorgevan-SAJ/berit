import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY
const vapidPublica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivada = process.env.VAPID_PRIVATE_KEY

const admin = createClient(url, chaveServico)

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
    if (!perfil || perfil.ativo === false || !['admin_master', 'multimidia'].includes(perfil.perfil)) {
      return Response.json({ ok: false, mensagem: 'Sem permissão para enviar notificações.' }, { status: 403 })
    }
    if (!perfil.igreja_id) {
      return Response.json({ ok: false, mensagem: 'Seu perfil não está vinculado a uma igreja.' }, { status: 400 })
    }

    const corpo = await request.json().catch(() => ({}))
    const eventoId = corpo?.p_evento_id || null
    const mensagemExtra = String(corpo?.p_mensagem || '').trim()

    // Evento vinculado (opcional): valida se pertence à igreja do usuário
    let evento = null
    if (eventoId) {
      const { data: ev } = await admin.from('eventos').select('id, igreja_id, titulo, hora_inicio').eq('id', eventoId).maybeSingle()
      if (!ev || ev.igreja_id !== perfil.igreja_id) {
        return Response.json({ ok: false, mensagem: 'Evento vinculado inválido para a sua igreja.' }, { status: 400 })
      }
      evento = ev
    }

    const { data: igreja } = await admin.from('igrejas').select('nome, slug').eq('id', perfil.igreja_id).maybeSingle()

    const { data: inscricoes } = await admin.from('push_inscricoes').select('id, device_id, inscricao').eq('igreja_id', perfil.igreja_id)
    const lista = inscricoes || []

    if (lista.length === 0) {
      return Response.json({ ok: true, enviados: 0, falhas: 0, mensagem: 'Nenhum aparelho inscrito nesta igreja ainda. Os fiéis que tocarem em "Acompanhar esta igreja" passarão a receber as notificações.' })
    }

    const titulo = igreja?.nome ? `🔴 Estamos ao vivo — ${igreja.nome}` : '🔴 Estamos ao vivo!'
    let corpoTexto = evento
      ? `${evento.titulo}${evento.hora_inicio ? ` (${String(evento.hora_inicio).slice(0, 5)})` : ''} está no ar. Acompanhe a transmissão!`
      : 'A transmissão começou. Acompanhe agora mesmo!'
    if (mensagemExtra) {
      corpoTexto += `\n${mensagemExtra}`
    }

    webpush.setVapidDetails('mailto:beritinovacoes@gmail.com', vapidPublica, vapidPrivada)

    let enviados = 0
    let falhas = 0

    for (const item of lista) {
      try {
        await webpush.sendNotification(item.inscricao, JSON.stringify({
          title: titulo,
          body: corpoTexto,
          url: igreja?.slug ? `/igreja/${igreja.slug}` : '/igrejas',
        }))
        enviados++
        try {
          await admin.from('notificacoes_enviadas').insert({
            evento_id: evento ? evento.id : null,
            igreja_id: perfil.igreja_id,
            tipo: 'push',
            destinatario: item.device_id || String(item.id),
            status: 'sucesso',
            enviado_em: new Date().toISOString(),
          })
        } catch (erroLog) {
          console.error('Log de notificação não gravado (envio seguiu normalmente):', erroLog?.message || erroLog)
        }
      } catch (e) {
        falhas++
        try {
          await admin.from('notificacoes_enviadas').insert({
            evento_id: evento ? evento.id : null,
            igreja_id: perfil.igreja_id,
            tipo: 'push',
            destinatario: item.device_id || String(item.id),
            status: 'erro',
            erro: String(e?.message || e).slice(0, 500),
            enviado_em: new Date().toISOString(),
          })
        } catch (erroLog) {
          console.error('Log de notificação não gravado (envio seguiu normalmente):', erroLog?.message || erroLog)
        }
      }
    }

    return Response.json({ ok: true, enviados, falhas, mensagem: `Notificação enviada para ${enviados} aparelho(s)${falhas ? ` · ${falhas} falha(s)` : ''}.` })
  } catch (e) {
    return Response.json({ ok: false, mensagem: 'Erro inesperado: ' + (e?.message || String(e)) }, { status: 500 })
  }
}
