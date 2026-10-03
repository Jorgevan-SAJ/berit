import { Resend } from 'resend'

export async function POST(req) {
  try {
    const { nomeIgreja, emailTitular, dataExclusao } = await req.json()

    if (!nomeIgreja) {
      return Response.json({ ok: false, mensagem: 'Nome da igreja é obrigatório.' }, { status: 400 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const { error } = await resend.emails.send({
      from: 'Berit <onboarding@resend.dev>',
      to: ['beritinovacoes@gmail.com'],
      subject: `Igreja excluída — ${nomeIgreja}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color: #1F3A5F;">Exclusão de conta — Berit</h2>
          <p style="font-size: 14px; color: #333;">A igreja <strong>${nomeIgreja}</strong> foi excluída por seus administradores pelo botão "Excluir Cadastro da Igreja".</p>
          <p style="font-size: 14px; color: #333;">Os dados foram removidos, mas o <strong>e-mail de acesso ainda existe</strong> no sistema.</p>
          <p style="font-size: 14px; color: #333;"><strong>E-mail do titular:</strong> ${emailTitular || '—'}</p>
          <p style="font-size: 14px; color: #333;"><strong>Data da exclusão:</strong> ${dataExclusao || '—'}</p>
          <p style="font-size: 14px; color: #B71C1C;"><strong>Ação necessária:</strong> proceda com a exclusão do e-mail de acesso na página de Moderação (seção "Exclusão total de conta — LGPD").</p>
          <p style="font-size: 12px; color: #888;">E-mail automático enviado pela plataforma Berit.</p>
        </div>
      `,
    })

    if (error) {
      return Response.json({ ok: false, mensagem: error.message }, { status: 500 })
    }

    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ ok: false, mensagem: e.message }, { status: 500 })
  }
}
