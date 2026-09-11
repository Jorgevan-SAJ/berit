import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const corpo = await request.json()
    const email = (corpo?.email || '').trim().toLowerCase()
    const perfil = corpo?.perfil || 'secretaria'
    const nome = (corpo?.nome || '').trim()
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

    const { data: perfilDeQuemPede, error: erroPerfilQuemPede } = await admin
      .from('perfis')
      .select('perfil, igreja_id')
      .eq('user_id', quemPede.user.id)
      .maybeSingle()

    if (erroPerfilQuemPede) {
      return Response.json({ ok: false, mensagem: 'Não foi possível ler o seu perfil: ' + erroPerfilQuemPede.message }, { status: 500 })
    }
    if (perfilDeQuemPede?.perfil !== 'admin_master') {
      return Response.json({ ok: false, mensagem: 'Apenas o Administrador pode criar usuários.' }, { status: 403 })
    }

    const igrejaId = perfilDeQuemPede?.igreja_id
    if (!igrejaId) {
      return Response.json({ ok: false, mensagem: 'Seu perfil não está vinculado a uma igreja. Verifique o registro na tabela de perfis.' }, { status: 400 })
    }

    let usuarioAchado = null
    let pagina = 1
    while (pagina <= 10 && !usuarioAchado) {
      const { data: lista, error: erroLista } = await admin.auth.admin.listUsers({ page: pagina, perPage: 1000 })
      if (erroLista) {
        return Response.json({ ok: false, mensagem: 'Não foi possível consultar os usuários: ' + erroLista.message }, { status: 500 })
      }
      const usuarios = lista?.users ?? []
      usuarioAchado = usuarios.find((u) => u.email && u.email.toLowerCase() === email) || null
      if (usuarios.length < 1000) break
      pagina++
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL

    if (usuarioAchado) {
      const { data: perfilExistente } = await admin
        .from('perfis')
        .select('user_id, igreja_id')
        .eq('user_id', usuarioAchado.id)
        .maybeSingle()

      if (perfilExistente && perfilExistente.igreja_id && perfilExistente.igreja_id !== igrejaId) {
        return Response.json({ ok: false, mensagem: 'Este e-mail já pertence a outra igreja.' }, { status: 400 })
      }

      if (perfilExistente) {
        const { error: erroUpdate } = await admin
          .from('perfis')
          .update({ perfil, igreja_id: igrejaId, nome })
          .eq('user_id', usuarioAchado.id)
        if (erroUpdate) {
          return Response.json({ ok: false, mensagem: 'Usuário localizado, mas o perfil não foi atualizado: ' + erroUpdate.message }, { status: 500 })
        }
        return Response.json({ ok: true, mensagem: 'Este e-mail já existia e o perfil foi atualizado. Se ele ainda não tiver senha, use "Esqueci minha senha" na tela de login.' }, { status: 200 })
      }

      const criadoEm = usuarioAchado.created_at ? new Date(usuarioAchado.created_at).getTime() : 0
      const haMenosDe60Min = Date.now() - criadoEm < 60 * 60 * 1000
      if (!haMenosDe60Min) {
        return Response.json({ ok: false, mensagem: 'Este e-mail já existe na plataforma sem perfil vinculado. Contate o suporte para regularizar.' }, { status: 400 })
      }
      const { error: erroInsert } = await admin
        .from('perfis')
        .insert([{ user_id: usuarioAchado.id, igreja_id: igrejaId, perfil, ativo: true, nome }])
      if (erroInsert) {
        return Response.json({ ok: false, mensagem: 'Usuário localizado, mas o perfil não foi gravado: ' + erroInsert.message }, { status: 500 })
      }
      return Response.json({ ok: true, mensagem: 'Usuário já existia na base e foi vinculado. Use "Esqueci minha senha" na tela de login para ele definir a senha.' }, { status: 200 })
    }

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: appUrl ? `${appUrl}/auth/update-password` : undefined,
    })

    if (error || !data?.user) {
      return Response.json({ ok: false, mensagem: error?.message || 'Não foi possível criar o usuário.' }, { status: 400 })
    }

    const { error: erroInsert } = await admin
      .from('perfis')
      .insert([{ user_id: data.user.id, igreja_id: igrejaId, perfil, ativo: true, nome }])
    if (erroInsert) {
      return Response.json({ ok: false, mensagem: 'Usuário criado, mas o perfil não foi gravado: ' + erroInsert.message }, { status: 500 })
    }

    return Response.json({ ok: true, mensagem: `Usuário ${email} criado! Enviamos um e-mail de convite para ele definir a própria senha. Oriente-o a verificar também a caixa de spam ou lixo eletrônico, pois alguns provedores podem direcionar o e-mail para lá.` }, { status: 200 })
  } catch (e) {
    return Response.json({ ok: false, mensagem: 'Erro inesperado ao criar o usuário.' }, { status: 500 })
  }
}
