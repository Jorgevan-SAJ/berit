import { createClient } from '@supabase/supabase-js'

// A chave da Brevo na Vercel (tenta os nomes mais comuns, na ordem)
function chaveBrevo() {
  return (
    process.env.BREVO_API_KEY ||
    process.env.SENDINBLUE_API_KEY ||
    process.env.BREVO_KEY ||
    ''
  )
}

// Remetente dos e-mails (deve ser o e-mail verificado na Brevo)
function remetenteBrevo() {
  return process.env.BREVO_FROM_EMAIL || process.env.BREVO_REMETENTE || 'beritinovacoes@gmail.com'
}

// Gera uma senha provisória forte: 10 caracteres com letras, números e símbolo
function gerarSenha() {
  const minusculas = 'abcdefghijkmnpqrstuvwxyz'
  const maiusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const numeros = '23456789'
  const simbolos = '!@#$%&*'
  const tudo = minusculas + maiusculas + numeros + simbolos
  const sorteia = (conj) => conj[Math.floor(Math.random() * conj.length)]
  const partes = [sorteia(minusculas), sorteia(maiusculas), sorteia(numeros), sorteia(simbolos)]
  for (let i = 0; i < 6; i++) partes.push(sorteia(tudo))
  for (let i = partes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[partes[i], partes[j]] = [partes[j], partes[i]]
  }
  return partes.join('')
}

// Envia o e-mail de boas-vindas com a senha provisória em destaque
async function enviarEmailBoasVindas(destinatario, nome, senhaProvisoria, urlApp) {
  if (!chaveBrevo()) return false
  const botaoAcesso = urlApp
    ? `<a href="${urlApp}/login" style="display: inline-block; background: #1F3A5F; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 15px; margin: 8px 0 20px;">Acessar o Berit agora</a>`
    : ''
  const resposta = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': chaveBrevo(),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Berit', email: remetenteBrevo() },
      to: [{ email: destinatario, name: nome }],
      subject: 'Bem-vindo(a) ao Berit! Seu acesso foi criado',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1F3A5F;">Bem-vindo(a) ao Berit, ${nome}!</h2>
          <p>Sua conta foi criada pela administração da sua igreja. Para o primeiro acesso, use:</p>
          <p style="font-size: 15px;"><strong>Seu e-mail:</strong> ${destinatario}</p>
          <div style="background: #F5F0E6; border: 2px dashed #D9A441; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-size: 14px; color: #1F3A5F; font-weight: bold; letter-spacing: 0.05em;">SENHA PROVISÓRIA: UTILIZE NO SEU PRIMEIRO ACESSO</p>
            <p style="margin: 0; font-size: 26px; font-weight: bold; color: #1F3A5F; font-family: monospace;">${senhaProvisoria}</p>
          </div>
          <p style="text-align: center;">${botaoAcesso}</p>
          <p>Como funciona: clique no botão acima, entre com o seu e-mail e a senha provisória destacada. O sistema vai pedir para você <strong>criar sua senha pessoal</strong>. Depois disso, esta senha provisória deixa de valer.</p>
          <p style="color: #8A8A8A; font-size: 13px;">Se você não esperava este e-mail, apenas ignore esta mensagem.</p>
          <p style="color: #1F3A5F; font-weight: bold;">Equipe Berit</p>
        </div>
      `,
    }),
  })
  if (!resposta.ok) {
    const detalhe = await resposta.text().catch(() => '')
    console.error('Brevo recusou o envio. Status:', resposta.status, 'Detalhe:', detalhe)
  }
  return resposta.ok
}

export async function POST(request) {
  try {
    const corpo = await request.json()
    const acao = corpo?.acao || 'criar'
    const email = (corpo?.email || '').trim().toLowerCase()
    const perfil = corpo?.perfil || 'secretaria'
    const nome = (corpo?.nome || '').trim()
    const token = (request.headers.get('authorization') || '').replace('Bearer ', '').trim()
    const urlApp = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || new URL(request.url).origin

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

    // ===== AÇÃO EXTRA: REENVIAR ACESSO (botão da lista de usuários) =====
    if (acao === 'reenviar') {
      const usuarioId = corpo?.usuario_id
      if (!usuarioId) {
        return Response.json({ ok: false, mensagem: 'Usuário não informado.' }, { status: 400 })
      }
      const { data: alvo } = await admin.auth.admin.getUserById(usuarioId)
      if (!alvo?.user) {
        return Response.json({ ok: false, mensagem: 'Usuário não encontrado.' }, { status: 404 })
      }
      const { data: perfilAlvo } = await admin
        .from('perfis')
        .select('igreja_id, nome')
        .eq('user_id', usuarioId)
        .maybeSingle()
      if (!perfilAlvo || perfilAlvo.igreja_id !== igrejaId) {
        return Response.json({ ok: false, mensagem: 'Este usuário não pertence à sua igreja.' }, { status: 403 })
      }
      const novaSenha = gerarSenha()
      const { error: erroSenha } = await admin.auth.admin.updateUserById(usuarioId, {
        password: novaSenha,
        email_confirm: true,
        app_metadata: { ...(alvo.user.app_metadata || {}), primeiro_acesso: true },
      })
      if (erroSenha) {
        return Response.json({ ok: false, mensagem: 'Não foi possível gerar o novo acesso: ' + erroSenha.message }, { status: 500 })
      }
      const enviou = await enviarEmailBoasVindas(alvo.user.email, perfilAlvo.nome || 'Colaborador', novaSenha, urlApp)
      if (!enviou) {
        return Response.json({ ok: true, mensagem: 'Nova senha gerada, mas o e-mail não saiu. Confira a chave da Brevo nas variáveis da Vercel e tente novamente.' }, { status: 200 })
      }
      return Response.json({ ok: true, mensagem: `Pronto! Enviamos um novo acesso provisório para ${alvo.user.email}. A senha anterior deixou de valer.` }, { status: 200 })
    }

    // ===== AÇÃO PRINCIPAL: CRIAR USUÁRIO =====
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
        return Response.json({ ok: true, mensagem: 'Este e-mail já tem acesso nesta igreja e os dados foram atualizados. Se ele perdeu a senha, use o botão "Reenviar acesso" na lista de usuários.' }, { status: 200 })
      }

      // Usuário órfão (existe na base, sem perfil): adota com senha provisória nova
      const senhaProvisoria = gerarSenha()
      const { error: erroSenha } = await admin.auth.admin.updateUserById(usuarioAchado.id, {
        password: senhaProvisoria,
        email_confirm: true,
        user_metadata: { ...(usuarioAchado.user_metadata || {}), nome },
        app_metadata: { ...(usuarioAchado.app_metadata || {}), primeiro_acesso: true },
      })
      if (erroSenha) {
        return Response.json({ ok: false, mensagem: 'Não foi possível preparar o acesso: ' + erroSenha.message }, { status: 500 })
      }
      const { error: erroInsert } = await admin
        .from('perfis')
        .insert([{ user_id: usuarioAchado.id, igreja_id: igrejaId, perfil, ativo: true, nome }])
      if (erroInsert) {
        return Response.json({ ok: false, mensagem: 'Usuário localizado, mas o perfil não foi gravado: ' + erroInsert.message }, { status: 500 })
      }
      const enviou = await enviarEmailBoasVindas(email, nome, senhaProvisoria, urlApp)
      if (!enviou) {
        return Response.json({ ok: true, mensagem: 'Usuário vinculado, mas o e-mail não saiu. Use "Reenviar acesso" na lista após conferir a chave da Brevo.' }, { status: 200 })
      }
      return Response.json({ ok: true, mensagem: `Usuário ${email} vinculado! Enviamos o e-mail de boas-vindas com a senha provisória.` }, { status: 200 })
    }

    // Usuário novo: conta criada já confirmada, com senha provisória gerada pelo sistema
    const senhaProvisoria = gerarSenha()
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: senhaProvisoria,
      email_confirm: true,
      user_metadata: { nome },
      app_metadata: { primeiro_acesso: true },
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

    const enviou = await enviarEmailBoasVindas(email, nome, senhaProvisoria, urlApp)
    if (!enviou) {
      return Response.json({ ok: true, mensagem: 'Usuário criado, mas o e-mail de boas-vindas não saiu. Confira a chave da Brevo nas variáveis da Vercel e use "Reenviar acesso" na lista de usuários.' }, { status: 200 })
    }

    return Response.json({ ok: true, mensagem: `Usuário ${email} criado! Enviamos o e-mail de boas-vindas com a senha provisória. Ele vai criar a própria senha no primeiro acesso. Oriente-o a verificar também a caixa de spam.` }, { status: 200 })
  } catch (e) {
    return Response.json({ ok: false, mensagem: 'Erro inesperado ao criar o usuário.' }, { status: 500 })
  }
}
