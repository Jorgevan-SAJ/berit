'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function LinkModeracao() {
  const [ehMaster, setEhMaster] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function verificar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setCarregando(false)
        return
      }
      const { data: perfil } = await supabase
        .from('perfis')
        .select('perfil, indicador_verificado')
        .eq('user_id', user.id)
        .maybeSingle()
      setEhMaster(!!perfil && (perfil.perfil === 'admin_master' || !!perfil.indicador_verificado))
      setCarregando(false)
    }
    verificar()
  }, [])

  if (carregando) return null

  if (ehMaster) {
    return (
      <a
        href="/igrejas/moderacao"
        style={{ background: '#D9A441', color: '#1F3A5F', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
      >
        Moderação
      </a>
    )
  }

  return (
    <span
      title="Disponível apenas para o administrador master"
      style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'not-allowed', opacity: 0.7 }}
    >
      Moderação
    </span>
  )
}
