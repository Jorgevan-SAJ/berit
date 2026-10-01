import { supabase } from './supabase'

export async function getPerfil() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('perfis')
    .select('perfil, ativo, nome, igreja_id')
    .eq('user_id', user.id)
    .limit(1)
  if (!data || data.length === 0) return null
  return data[0]
}

// Item 11 — Verificação centralizada do status do plano da igreja.
// Todas as telas consultam esta função; nenhuma lógica de trial espalhada.
// Retorna: { status, bloqueado, diasRestantes?, trialTerminaEm? }
// status: 'vitalicio' | 'trial' | 'expirado' | 'ativo' | 'desconhecido'
export async function getStatusPlano() {
  const perfil = await getPerfil()
  if (!perfil?.igreja_id) return { status: 'desconhecido', bloqueado: false }
  const { data: ig } = await supabase
    .from('igrejas')
    .select('plano, trial_termina_em, vitalicio')
    .eq('id', perfil.igreja_id)
    .maybeSingle()
  if (!ig) return { status: 'desconhecido', bloqueado: false }
  if (ig.vitalicio) return { status: 'vitalicio', bloqueado: false }
  if (ig.plano !== 'trial' || !ig.trial_termina_em) return { status: 'ativo', bloqueado: false }
  const fim = new Date(ig.trial_termina_em)
  if (Number.isNaN(fim.getTime())) return { status: 'desconhecido', bloqueado: false }
  const agora = new Date()
  if (fim > agora) {
    const dias = Math.ceil((fim - agora) / 86400000)
    return { status: 'trial', bloqueado: false, diasRestantes: dias, trialTerminaEm: ig.trial_termina_em }
  }
  return { status: 'expirado', bloqueado: true, trialTerminaEm: ig.trial_termina_em }
}

export const PERFIS = {
  admin_master: 'Administrador',
  secretaria: 'Secretaria',
  tesouraria: 'Tesouraria',
  conselho_fiscal: 'Conselho Fiscal',
}

export function perfilLabel(perfil) {
  return PERFIS[perfil] || perfil || '—'
}
