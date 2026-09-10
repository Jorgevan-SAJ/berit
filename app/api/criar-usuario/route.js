import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const corpo = await request.json()
    const email = (corpo?.email || '').trim().toLowerCase()
    const perfil = corpo?.perfil || 'secretaria'
    const token = (request.headers.get('authorization') || '').replace('Bearer ', '').trim()

    if (!email.includes('@')) {
      return Response.json({ ok: false, mensagem: 'Informe um e-mail válido.' }, { status: 400 })
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
      .select('perfil')
      .eq('user_id', quemPede.user.id)
      .maybeSingle()

    if (perfilDeQuemPede?.perfil !== 'admin_master') {
      return Response.json({ ok: false, mensagem: 'Apenas o Administrador pode criar usuários.' }, { status: 403 })
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    })

    if (error || !data?.user) {
      return Response.json({ ok: false, mensagem: error?.message || 'Não foi possível criar o usuário.' }, { status: 400 })
    }

    const { error: erroPerfil } = await admin
      .from('perfis')
      .insert([{ user_id: data.user.id, perfil }])

    if (erroPerfil) {
      return Response.json({ ok: false, mensagem: 'Usuário criado, mas o perfil não foi atribuído: ' + erroPerfil.message }, { status: 500 })
    }

    return Response.json({ ok: true }, { status: 200 })
  } catch (e) {
    return Response.json({ ok: false, mensagem: 'Erro inesperado ao criar o usuário.' }, { status: 500 })
  }
}
