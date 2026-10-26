import { createClient } from '@supabase/supabase-js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const STATUS_IGREJA_INATIVA = [
  'inativo', 'inativa', 'bloqueado', 'bloqueada',
  'suspenso', 'suspensa', 'excluido', 'excluida',
]

const DIAS = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado',
]

// Cliente único com chave de serviço, reaproveitado pelas três rotas
let clienteAdmin = null

export function adminMaterial() {
  if (!clienteAdmin) {
    clienteAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }
  return clienteAdmin
}

// Data de hoje no fuso de Brasília, no formato AAAA-MM-DD
export function hojeSaoPaulo() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

function prazoEncerrado(evento) {
  if (evento.tipo_evento === 'permanente') return false
  const dataEvento = String(evento.data_inicio || '').slice(0, 10)
  if (!dataEvento) return false
  // O material de evento já ocorrido é removido no dia seguinte,
  // então o envio só é aceito até o dia do evento.
  return dataEvento < hojeSaoPaulo()
}

function igrejaBloqueada(igreja) {
  const status = String(igreja.status || igreja.situacao || '').toLowerCase()
  return (
    igreja.ativa === false ||
    igreja.ativo === false ||
    igreja.bloqueada === true ||
    igreja.bloqueado === true ||
    STATUS_IGREJA_INATIVA.includes(status)
  )
}

/**
 * Valida se um evento pode receber material.
 * Retorna { ok: true, evento, igreja } ou { ok: false, status, mensagem }.
 */
export async function validarEventoMaterial(eventoIdBruto) {
  const eventoId = String(eventoIdBruto || '').trim()

  if (!eventoId) {
    return { ok: false, status: 400, mensagem: 'Evento não informado.' }
  }
  if (!UUID.test(eventoId)) {
    return { ok: false, status: 400, mensagem: 'Link inválido. Peça à equipe da igreja um link de envio atualizado.' }
  }

  const { data: evento, error: erroEvento } = await adminMaterial()
    .from('eventos')
    .select('id, igreja_id, titulo, tipo_evento, data_inicio, hora_inicio, dia_semana')
    .eq('id', eventoId)
    .maybeSingle()

  if (erroEvento) {
    return { ok: false, status: 500, mensagem: 'Não foi possível consultar o evento. Tente novamente.' }
  }
  if (!evento) {
    return { ok: false, status: 404, mensagem: 'Evento não encontrado. Confira o link recebido.' }
  }

  // select * para não depender do nome exato da coluna de status/plano da igreja
  const { data: igreja } = await adminMaterial()
    .from('igrejas')
    .select('*')
    .eq('id', evento.igreja_id)
    .maybeSingle()

  if (!igreja) {
    return { ok: false, status: 404, mensagem: 'Este link não está mais disponível.' }
  }
  if (igrejaBloqueada(igreja)) {
    return { ok: false, status: 404, mensagem: 'Este link não está mais disponível.' }
  }
  if (prazoEncerrado(evento)) {
    return { ok: false, status: 410, mensagem: 'O prazo de envio de material para este evento já encerrou.' }
  }

  return { ok: true, evento, igreja }
}

// Texto amigável da data/hora do evento, para exibir ao fiel
export function formatarQuando(evento) {
  const hora = evento.hora_inicio ? String(evento.hora_inicio).slice(0, 5) : ''

  if (evento.tipo_evento === 'permanente') {
    const indice = evento.dia_semana === null || evento.dia_semana === undefined ? null : Number(evento.dia_semana)
    const dia = indice !== null && DIAS[indice] ? DIAS[indice] : ''
    let texto = dia ? `Todo ${dia}` : 'Evento permanente'
    if (hora) texto += `, às ${hora}`
    return texto
  }

  const p = String(evento.data_inicio || '').slice(0, 10).split('-')
  let texto = p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : ''
  if (hora) texto += ` às ${hora}`
  return texto
}
