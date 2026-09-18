'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const estilo = {
  main: { minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" },
  header: { background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem' },
  logo: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' },
  hero: { background: '#1F3A5F', color: '#FFFFFF', padding: '3rem 1.5rem 2.5rem', textAlign: 'center' },
  card: { background: '#FFFFFF', borderRadius: 12, border: '1px solid #E4DED2', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  campo: { padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
}

function SeloVerificado() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EAF4EE', color: '#4C8C6E', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
        <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Verificada
    </span>
  )
}

export default function DiretorioIgrejas() {
  const [carregando, setCarregando] = useState(true)
  const [igrejas, setIgrejas] = useState([])
  const [termo, setTermo] = useState('')
  const [uf, setUf] = useState('')
  const [erro, setErro] = useState('')

  async function buscar(t, u) {
    setCarregando(true)
    setErro('')
    const { data, error } = await supabase.rpc('buscar_diretorio_igrejas', {
      p_termo: t || null,
      p_uf: u || null,
    })
    if (error || !data || !data.ok) {
      setErro('Não foi possível carregar o diretório de igrejas. Tente novamente em instantes.')
      setIgrejas([])
    } else {
      setIgrejas(data.igrejas || [])
    }
    setCarregando(false)
  }

  useEffect(() => { buscar('', '') }, [])

  function aplicar(e) {
    e.preventDefault()
    buscar(termo.trim(), uf)
  }

  return (
    <main style={estilo.main}>
      <header style={estilo.header}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/igrejas" style={estilo.logo}>Berit</a>
          <a href="/login" style={{ color: '#FFFFFF', fontSize: 13, textDecoration: 'none' }}>Entrar</a>
        </div>
      </header>

      <div style={estilo.hero}>
        <h1 style={{ margin: '0 0 8px', fontSize: 28 }}>Encontre uma igreja</h1>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
          Diretório de congregações cadastradas na plataforma Berit.
        </p>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem' }}>
        <form onSubmit={aplicar} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <input
            type="text"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Buscar por nome ou cidade..."
            style={{ ...estilo.campo, flex: 1, minWidth: 220 }}
          />
          <select value={uf} onChange={(e) => setUf(e.target.value)} style={{ ...estilo.campo, width: 90 }}>
            <option value="">UF</option>
            {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <button type="submit" style={{ padding: '10px 20px', background: '#D9A441', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Buscar
          </button>
        </form>

        {erro && <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>}

        {carregando ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#8A8A8A', fontSize: 14 }}>Carregando igrejas...</div>
        ) : igrejas.length === 0 ? (
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '2.5rem', textAlign: 'center', border: '1px solid #E4DED2' }}>
            <p style={{ fontSize: 15, color: '#5A5A5A', margin: '0 0 4px' }}>Nenhuma igreja encontrada.</p>
            <p style={{ fontSize: 13, color: '#8A8A8A', margin: 0 }}>Ajuste o termo de busca ou o filtro de UF e tente novamente.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {igrejas.map((ig) => (
              <div key={ig.slug} style={estilo.card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: 17, color: '#1F3A5F' }}>{ig.nome}</h2>
                  {ig.publico_verificado && <SeloVerificado />}
                </div>
                <div style={{ fontSize: 13, color: '#8A8A8A' }}>
                  {ig.cidade || ''}{ig.cidade && ig.uf ? `, ${ig.uf}` : ig.uf || ''}
                </div>
                {ig.sobre && (
                  <p style={{ margin: 0, fontSize: 13, color: '#5A5A5A', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ig.sobre}
                  </p>
                )}
                <a href={`/igreja/${ig.slug}`} style={{ marginTop: 'auto', background: '#1F3A5F', color: '#FFFFFF', textAlign: 'center', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  Ver página
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer style={{ borderTop: '1px solid #E4DED2', padding: '1.5rem', textAlign: 'center', fontSize: 12, color: '#8A8A8A' }}>
        Berit, Gestão simples para igrejas
      </footer>
    </main>
  )
}
