import { supabase } from './supabase'

export async function getPerfil() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('perfis')
    .select('perfil, ativo')
    .eq('user_id', user.id)
    .limit(1)

  if (!data || data.length === 0) return null
  return data[0]
}

export const PERFIS = {
  admin_master: 'Admin Master',
  secretaria: 'Secretaria',
  tesouraria: 'Tesouraria',
}

export function perfilLabel(perfil) {
  return PERFIS[perfil] || perfil || '—'
}
