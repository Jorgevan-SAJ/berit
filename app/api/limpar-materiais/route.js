import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY

const admin = createClient(url, chaveServico)

const BUCKET = 'materiais-eventos'

function hojeSaoPaulo() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

function ontemSaoPaulo() {
  const [a, m, d] = hojeSaoPaulo().split('-').map(Number)
  const base = new Date(Date.UTC(a, m - 1, d))
  base.setUTCDate(base.getUTCDate() - 1)
  return base.toISOString().slice(0, 10)
}

export async function GET(request) {
  // Proteção opcional: se CRON_SECRET existir na Vercel, exige o cabeçalho do cron
  const segredo = process.env.CRON_SECRET
  if (segredo) {
    const autorizacao = request?.headers?.get('authorization') || ''
    if (autorizacao !== `Bearer ${segredo}`) {
      return Response.json({ ok: false, mensagem: 'Não autorizado.' }, { status: 401 })
    }
  }

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

    // Material de evento ocorrido até ontem é removido; o do dia do culto fica preservado
    const limiteISO = ontemSaoPaulo()

    const expirados = envios.filter((v) => {
      const e = mapaEventos[v.evento_id]
      if (!e) return false
      if (e.tipo_evento === 'permanente' || !e.data_inicio) return false
      return String(e.data_inicio).slice(0, 10) <= limiteISO
    })

    if (expirados.length === 0) {
      return Response.json({ ok: true, removidos: 0, mensagem: 'Nenhum material expirado para remover.' })
    }

    const caminhos = expirados.map((v) => v.arquivo_path)
    const { error: erroStorage } = await admin.storage.from(BUCKET).remove(caminhos)

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
