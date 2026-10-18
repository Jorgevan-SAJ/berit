import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY

const admin = createClient(url, chaveServico)

// Limpeza automática: remove materiais enviados cujo evento já passou
// (exclusão no dia seguinte à data do evento). Eventos permanentes não expiram.
export async function GET() {
  try {
    const { data: envios, error } = await admin
      .from('eventos_materiais_enviados')
      .select('id, arquivo_path, evento_id')
      .limit(1000)

    if (error) {
      return Response.json({ ok: false, mensagem: 'Erro ao consultar envios: ' + error.message }, { status: 500 })
    }
    if (!envios || envios.length === 0) {
      return Response.json({ ok: true, removidos: 0, mensagem: 'Nenhum material para verificar.' })
    }

    const idsEventos = [...new Set(envios.map((v) => v.evento_id))]
    const { data: eventos } = await admin
      .from('eventos')
      .select('id, tipo_evento, data_inicio')
      .in('id', idsEventos)

    const mapaEventos = {}
    ;(eventos || []).forEach((e) => { mapaEventos[e.id] = e })

    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)
    const limiteISO = `${ontem.getFullYear()}-${String(ontem.getMonth() + 1).padStart(2, '0')}-${String(ontem.getDate()).padStart(2, '0')}`

    const expirados = envios.filter((v) => {
      const e = mapaEventos[v.evento_id]
      if (!e) return false
      if (e.tipo_evento === 'permanente' || !e.data_inicio) return false
      return e.data_inicio <= limiteISO
    })

    if (expirados.length === 0) {
      return Response.json({ ok: true, removidos: 0, mensagem: 'Nenhum material expirado para remover.' })
    }

    // Remove os arquivos fisicamente do armazenamento
    const caminhos = expirados.map((v) => v.arquivo_path)
    const { error: erroStorage } = await admin.storage.from('materiais-eventos').remove(caminhos)

    // Remove os registros da tabela
    const ids = expirados.map((v) => v.id)
    const { error: erroRegistros } = await admin
      .from('eventos_materiais_enviados')
      .delete()
      .in('id', ids)

    return Response.json({
      ok: true,
      removidos: expirados.length,
      aviso: erroStorage ? 'Alguns arquivos podem não ter sido removidos do armazenamento: ' + erroStorage.message : null,
      avisoRegistros: erroRegistros ? erroRegistros.message : null,
      mensagem: `Limpeza concluída: ${expirados.length} material(is) removido(s).`,
    })
  } catch (e) {
    return Response.json({ ok: false, mensagem: 'Erro inesperado: ' + (e?.message || String(e)) }, { status: 500 })
  }
}
