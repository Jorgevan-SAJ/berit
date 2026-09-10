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

    // 1) Quem está pedindo
    const { data: quemPede } = await admin.auth.getUser(token)
    if (!quemPede?.user) {
      return Response.json({ ok: false, mensagem: 'Sessão inválida. Entre novamente.' }, { status: 401 })
    }

    // 2) Perfil e igreja de quem pede
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

    // 3) O usuário de autenticação já existe?
    let usuarioId = null
    let pagina = 1
    while (pagina <= 10 && !usuarioId) {
      const { data: lista, error: erroLista } = await admin.auth.admin.listUsers({ page: pagina, perPage: 1000 })
      if (erroLista) {
        return Response.json({ ok: false, mensagem: 'Não foi possível consultar os usuários: ' + erroLista.message }, { status: 500 })
      }
      const usuarios = lista?.users ?? []
      const achado = usuarios.find((u) => u.email && u.email.toLowerCase() === email)
      if (achado) usuarioId = achado.id
      if (usuarios.length < 1000) break
      pagina++
    }

    // 4) Não existe: cria já confirmado, sem disparar e-mail
    if (!usuarioId) {
      const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true })
      if (error || !data?.user) {
        return Response.json({ ok: false, mensagem: error?.message || 'Não foi possível criar o usuário.' }, { status: 400 })
      }
      usuarioId = data.user.id
    }

    // 5) Perfil: cria se não existir, completa se já existir
    const { data: perfilExistente } = await admin
      .from('perfis')
      .select('user_id, igreja_id')
      .eq('user_id', usuarioId)
      .maybeSingle()

    if (perfilExistente) {
      if (perfilExistente.igreja_id && perfilExistente.igreja_id !== igrejaId) {
        return Response.json({ ok: false, mensagem: 'Este e-mail já pertence a outra igreja.' }, { status: 400 })
      }
      const { error: erroUpdate } = await admin
        .from('perfis')
        .update({ perfil, igreja_id: igrejaId })
        .eq('user_id', usuarioId)
      if (erroUpdate) {
        return Response.json({ ok: false, mensagem: 'Usuário localizado, mas o perfil não foi atualizado: ' + erroUpdate.message }, { status: 500 })
      }
    } else {
      const { error: erroInsert } = await admin
        .from('perfis')
        .insert([{ user_id: usuarioId, igreja_id: igrejaId, perfil, ativo: true }])
      if (erroInsert) {
        return Response.json({ ok: false, mensagem: 'Usuário criado, mas o perfil não foi gravado: ' + erroInsert.message }, { status: 500 })
      }
    }

    return Response.json({ ok: true }, { status: 200 })
  } catch (e) {
    return Response.json({ ok: false, mensagem: 'Erro inesperado ao criar o usuário.' }, { status: 500 })
  }
}
