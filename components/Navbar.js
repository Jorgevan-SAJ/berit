'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

const ROTAS_PUBLICAS = ['/login', '/igrejas/nova', '/termos', '/privacidade']

export default function Navbar() {
  const [perfil, setPerfil] = useState(null)
  const [logado, setLogado] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setCarregando(false)
        return
      }
      setLogado(true)
      const { data } = await supabase
        .from('perfis')
        .select('perfil')
        .eq('user_id', user.id)
        .maybeSingle()
      setPerfil(data?.perfil || null)
      setCarregando(false)
    }
    carregar()
  }, [])

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (ROTAS_PUBLICAS.includes(pathname)) return null
  if (carregando || !logado) return null

  return (
    <nav className="bg-[#1F3A5F] text-white px-6 py-3 flex items-center gap-6 flex-wrap">
      <Link href="/" className="font-bold text-lg">Berit</Link>
      <Link href="/membros" className="hover:opacity-80">Membros</Link>
      <Link href="/financas" className="hover:opacity-80">Finanças</Link>
      <Link href="/agenda" className="hover:opacity-80">Agenda</Link>
      {perfil === 'admin_master' && (
        <Link href="/acessos" className="hover:opacity-80">Perfis de Acesso</Link>
      )}
      {perfil === 'admin_master' && (
        <Link href="/igrejas/editar" className="hover:opacity-80">Configurações da Igreja</Link>
      )}
      <Link href="/conta/alterar-senha" className="hover:opacity-80">Alterar senha</Link>
      <button onClick={sair} className="ml-auto hover:opacity-80">Sair</button>
    </nav>
  )
}
