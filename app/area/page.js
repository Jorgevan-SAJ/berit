'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AreaPage() {
  const [carregando, setCarregando] = useState(true)
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = '/login'
      } else {
        setUsuario(data.session.user)
        setCarregando(false)
      }
    })
  }, [])

  if (carregando) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
        <div style={{ fontSize: 14, color: '#8A8A8A' }}>Carregando...</div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
      <header style={{ background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Berit
        </div>
        <button
          onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
        >
          Sair
        </button>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Área da Igreja</h1>
        <p style={{ fontSize: 14, color: '#8A8A8A', margin: '0 0 2rem' }}>
          Bem-vindo{usuario?.email ? `, ${usuario.email}` : ''} — gestão simples para igrejas.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #E4DED2', boxShadow: '0 2px 12px rgba(31,58,95,0.06)' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1F3A5F', marginBottom: 6 }}>Membros</div>
            <div style={{ fontSize: 13, color: '#8A8A8A' }}>Cadastro e gestão do rol de membros. Disponível na Fase 2.</div>
          </div>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #E4DED2', boxShadow: '0 2px 12px rgba(31,58,95,0.06)' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1F3A5F', marginBottom: 6 }}>Finanças</div>
            <div style={{ fontSize: 13, color: '#8A8A8A' }}>Entradas, saídas e relatório de dizimistas. Disponível na Fase 2.</div>
          </div>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #E4DED2', boxShadow: '0 2px 12px rgba(31,58,95,0.06)' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1F3A5F', marginBottom: 6 }}>Agenda</div>
            <div style={{ fontSize: 13, color: '#8A8A8A' }}>Programações e eventos da igreja. Disponível na Fase 2.</div>
          </div>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #E4DED2', boxShadow: '0 2px 12px rgba(31,58,95,0.06)' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1F3A5F', marginBottom: 6 }}>Diretório Público</div>
            <div style={{ fontSize: 13, color: '#8A8A8A' }}>Busca de igrejas perto de você. Disponível na Fase 3.</div>
          </div>
        </div>
      </div>
    </main>
  )
}
