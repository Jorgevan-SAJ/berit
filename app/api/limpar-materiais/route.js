import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY

const admin = createClient(url, chaveServico)

const BUCKET = 'materiais-eventos'
const LIMITE_CONSULTA = 1000
const TAMANHO_BLOCO = 200

const SEM_CACHE = { headers: { 'Cache-Control': 'no-store' } }

function hojeSaoPaulo() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

function ontemSaoPaulo() {
  const [a, m, d] = hojeSaoPaulo().split('-').map(Number)
  const base = new Date(Date.UTC(a, m - 1, d))
  base.setUTCDate(base.getUTCDate() - 1)
  return base.toISOString().slice(0, 10)
}

function emBlocos(lista, tamanho) {
  const blocos = []
  for (let i = 0; i < lista.length; i += tamanho) blocos.push(lista.slice(i, i + tamanho))
  return blocos
}

export async function GET(request) {
  const segredo = process.env.CRON_SECRET
  if (segredo) {
    const autorizacao = request?.headers?.get('authorization') || ''
    if (autorizacao !== `Bearer ${segredo}`) {
      return Response.json({ ok: false, mensagem: 'Não autorizado.' }, { status: 401, ...SEM_CACHE })
    }
  }

  const simular = new URL(request.url).searchParams.get('simular') === '1'

  try {
    const { data: envios, error } = await admin
      .from('eventos_materiais_enviados')
      .select('*')
      .limit(LIMITE_CONSULTA)

    if (error) {
      return Response.json({ ok: false, mensagem: 'Erro ao consultar envios: ' + error.message }, { status: 500, ...SEM_CACHE })
    }
    if (!envios || envios.length === 0) {
      return Response.json({ ok: true, removidos: 0, mensagem: 'Nenhum material para verificar.' }, SEM_CACHE)
    }

    const idsEventos = [...new Set(envios.map((v) => v.evento_id).filter(Boolean))]

    const mapaEventos = {}
    for (const bloco of emBlocos(idsEventos, TAMANHO_BLOCO)) {
      const { data: eventos, error: erroEventos } = await admin
        .from('eventos')
        .select('id, tipo_evento, data_inicio')
        .in('id', bloco)

      if (erroEventos) {
        // Sem a lista de eventos não é seguro decidir o que apagar — sai sem remover nada
        return Response.json({ ok: false, mensagem: 'Erro ao consultar eventos: ' + erroEventos.message }, { status: 500, ...SEM_CACHE })
      }
      ;(eventos || []).forEach((e) => { mapaEventos[e.id] = e })
    }

    // Se algum id consultado não voltou, a leitura pode estar incompleta (limite de linhas).
    // Nesse caso nenhum registro é tratado como órfão, para não apagar material válido.
    const consultaCompleta = Object.keys(mapaEventos).length === idsEventos.length

    const limiteISO = ontemSaoPaulo()

    const expirados = []
    const orfaos = []
    const detalhe = { sem_evento: 0, permanente: 0, sem_data: 0, futuro_ou_hoje: 0, expirado: 0 }

    for (const v of envios) {
      const e = mapaEventos[v.evento_id]

      if (!e) {
        detalhe.sem_evento += 1
        if (consultaCompleta) orfaos.push(v)
        continue
      }
      if (e.tipo_evento === 'permanente') { detalhe.permanente += 1; continue }
      if (!e.data_inicio) { detalhe.sem_data += 1; continue }

      const dataEvento = String(e.data_inicio).slice(0, 10)
      if (dataEvento <= limiteISO) { detalhe.expirado += 1; expirados.push(v) }
      else detalhe.futuro_ou_hoje += 1
    }

    const total = expirados.length + orfaos.length

    if (simular) {
      return Response.json({
        ok: true,
        simulado: true,
        data_limite: limiteISO,
        total_verificado: envios.length,
        lista_possivelmente_truncada: envios.length >= LIMITE_CONSULTA,
        consulta_eventos_completa: consultaCompleta,
        removeria: total,
        removeria_expirados: expirados.length,
        removeria_orfaos: orfaos.length,
        detalhe,
        amostra_orfaos: orfaos.slice(0, 20).map((v) => ({
          arquivo: v.arquivo_nome,
          evento_id: v.evento_id,
          caminho: v.arquivo_path,
        })),
      }, SEM_CACHE)
    }

    if (total === 0) {
      return Response.json({
        ok: true,
        removidos: 0,
        data_limite: limiteISO,
        detalhe,
        mensagem: 'Nenhum material expirado ou órfão para remover.',
      }, SEM_CACHE)
    }

    const paraRemover = [...expirados, ...orfaos]
    const caminhos = paraRemover.map((v) => v.arquivo_path).filter(Boolean)

    let erroStorage = null
    for (const bloco of emBlocos(caminhos, 100)) {
      const { error } = await admin.storage.from(BUCKET).remove(bloco)
      if (error) { erroStorage = error; break }
    }

    let erroRegistros = null
    const ids = paraRemover.map((v) => v.id)
    for (const bloco of emBlocos(ids, 200)) {
      const { error } = await admin.from('eventos_materiais_enviados').delete().in('id', bloco)
      if (error) { erroRegistros = error; break }
    }

    return Response.json({
      ok: true,
      removidos: total,
      removidos_expirados: expirados.length,
      removidos_orfaos: orfaos.length,
      arquivos_sem_caminho: paraRemover.length - caminhos.length,
      detalhe,
      aviso: erroStorage ? 'Alguns arquivos podem não ter sido removidos do armazenamento: ' + erroStorage.message : null,
      avisoRegistros: erroRegistros ? erroRegistros.message : null,
      mensagem: `Limpeza concluída: ${total} material(is) removido(s).`,
    }, SEM_CACHE)
  } catch (e) {
    return Response.json({ ok: false, mensagem: 'Erro inesperado: ' + (e?.message || String(e)) }, { status: 500, ...SEM_CACHE })
  }
}
