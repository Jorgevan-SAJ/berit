import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const corpo = await request.json()
    const userId = corpo?.userId
    const token = (request.headers.get('authorization') || '').replace('Bearer ', '').trim()

    if (!userId) {
      return Response.json({ ok: false, mensagem: 'Informe o identificador do usuário.' }, { status: 400 })
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

    const { data: perfilDeQuemPede } = await admin
      .from('perfis')
      .select('perfil, igreja_id')
      .eq('user_id', quemPede.user.id)
      .maybeSingle()

    if (perfilDeQuemPede?.perfil !== 'admin_master') {
      return Response.json({ ok: false, mensagem: 'Apenas o Administrador pode excluir usuários.' }, { status: 403 })
    }

    if (userId === quemPede.user.id) {
      return Response.json({ ok: false, mensagem: 'Você não pode excluir o próprio usuário.' }, { status: 400 })
    }

    const { data: perfilAlvo } = await admin
      .from('perfis')
      .select('user_id, igreja_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (perfilAlvo && perfilAlvo.igreja_id !== perfilDeQuemPede.igreja_id) {
      return Response.json({ ok: false, mensagem: 'Este usuário não pertence à sua igreja.' }, { status: 403 })
    }

    const { error: erroPerfil } = await admin.from('perfis').delete().eq('user_id', userId)
    if (erroPerfil) {
      return Response.json({ ok: false, mensagem: 'Não foi possível remover o perfil: ' + erroPerfil.message }, { status: 500 })
    }

    const { error: erroAuth } = await admin.auth.admin.deleteUser(userId)
    if (erroAuth) {
      return Response.json({ ok: false, mensagem: 'O perfil foi removido, mas o registro de login não pôde ser excluído: ' + erroAuth.message + '. Remova manualmente em Authentication → Users ou via SQL.' }, { status: 500 })
    }

    return Response.json({ ok: true, mensagem: 'Usuário excluído definitivamente.' }, { status: 200 })
  } catch (e) {
    return Response.json({ ok: false, mensagem: 'Erro inesperado ao excluir o usuário.' }, { status: 500 })
  }
}
