import { validarEventoMaterial, formatarQuando } from '../../../lib/material/validar-evento'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const validacao = await validarEventoMaterial(searchParams.get('evento'))

    if (!validacao.ok) {
      return Response.json({ ok: false, mensagem: validacao.mensagem }, { status: validacao.status })
    }

    const { evento, igreja } = validacao

    return Response.json(
      {
        ok: true,
        evento: {
          id: evento.id,
          titulo: evento.titulo,
          quando: formatarQuando(evento),
          igreja_nome: igreja.nome || '',
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (e) {
    return Response.json({ ok: false, mensagem: 'Erro inesperado ao consultar o evento.' }, { status: 500 })
  }
}
