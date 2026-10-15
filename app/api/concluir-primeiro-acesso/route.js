import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const token = (request.headers.get('authorization') || '').replace('Bearer ', '').trim()
    if (!token) {
      return Response.json({ ok: false, mensagem: 'Sessão inválida.' }, { status: 401 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: quemPede } = await admin.auth.getUser(token)
    if (!quemPede?.user) {
      return Response.json({ ok: false, mensagem: 'Sessão inválida. Entre novamente.' }, { status: 401 })
    }

    const appMeta = { ...(quemPede.user.app_metadata || {}), primeiro_acesso: false }
    const { error } = await admin.auth.admin.updateUserById(quemPede.user.id, {
      app_metadata: appMeta,
    })
    if (error) {
      return Response.json({ ok: false, mensagem: error.message }, { status: 500 })
    }

    return Response.json({ ok: true }, { status: 200 })
  } catch (e) {
    return Response.json({ ok: false, mensagem: 'Erro inesperado.' }, { status: 500 })
  }
}
