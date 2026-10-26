import { validarEventoMaterial, adminMaterial } from '../../../../lib/material/validar-evento'

const BUCKET = 'materiais-eventos'

export async function POST(request) {
  try {
    const corpo = await request.json().catch(() => ({}))
    const caminho = String(corpo?.caminho || '').trim()
    const remetente = String(corpo?.remetente || '').trim()
    const contato = String(corpo?.contato || '').trim()
    const descricao = String(corpo?.descricao || '').trim()
    const nomeArquivo = String(corpo?.arquivo_nome || '').trim()
    const tamanho = Number(corpo?.arquivo_tamanho || 0)

    if (!caminho || !remetente || !nomeArquivo) {
      return Response.json({ ok: false, mensagem: 'Dados incompletos para registrar o envio.' }, { status: 400 })
    }

    const validacao = await validarEventoMaterial(corpo?.evento_id)
    if (!validacao.ok) {
      return Response.json({ ok: false, mensagem: validacao.mensagem }, { status: validacao.status })
    }

    const { evento } = validacao
    const prefixo = `${evento.igreja_id}/${evento.id}/`
    if (!caminho.startsWith(prefixo)) {
      return Response.json({ ok: false, mensagem: 'Caminho do arquivo inválido para este evento.' }, { status: 400 })
    }

    const pasta = `${evento.igreja_id}/${evento.id}`
    const nomeNoStorage = caminho.slice(prefixo.length)
    const { data: lista, error: erroLista } = await adminMaterial().storage.from(BUCKET).list(pasta, { limit: 1000 })
    if (erroLista) {
      return Response.json({ ok: false, mensagem: 'Não foi possível confirmar o arquivo: ' + erroLista.message }, { status: 500 })
    }
    if (!(lista || []).some((item) => item.name === nomeNoStorage)) {
      return Response.json({ ok: false, mensagem: 'O arquivo não foi encontrado no armazenamento. Envie novamente.' }, { status: 400 })
    }

    const { error: erroInsert } = await adminMaterial().from('eventos_materiais_enviados').insert({
      evento_id: evento.id,
      igreja_id: evento.igreja_id,
      remetente,
      contato: contato || null,
      descricao: descricao || null,
      arquivo_path: caminho,
      arquivo_nome: nomeArquivo,
      arquivo_tamanho: tamanho || null,
    })

    if (erroInsert) {
      return Response.json({ ok: false, mensagem: 'Não foi possível registrar o envio: ' + erroInsert.message }, { status: 500 })
    }

    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return Response.json({ ok: false, mensagem: 'Erro inesperado: ' + (e?.message || String(e)) }, { status: 500 })
  }
}
