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
