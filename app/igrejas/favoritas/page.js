'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const estilo = {
  main: { minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" },
  header: { background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem' },
  logo: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' },
  card: { background: '#FFFFFF', borderRadius: 12, border: '1px solid #E4DED2', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
}

export default function MinhasIgrejasFavoritas() {
  const [carregando, setCarregando] = useState(true)
  const [igrejas, setIgrejas] = useState([])
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    const deviceId = localStorage.getItem('berit_device_id')
    if (!deviceId) {
      setCarregando(false)
      return
    }
    const { data, error } = await supabase.rpc('listar_favoritas_usuario', { p_device_id: deviceId })
    if (error || !data || !data.ok) {
      setErro('Não foi possível carregar suas igrejas favoritas. Tente novamente em instantes.')
      setIgrejas([])
    } else {
      setIgrejas(data.igrejas || [])
      setErro('')
    }
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregar()
    window.addEventListener('focus', carregar)
    return () => window.removeEventListener('focus', carregar)
  }, [carregar])

  async function remover(igrejaId) {
    const deviceId = localStorage.getItem('berit_device_id')
    if (!deviceId) return
    setIgrejas((atuais) => atuais.filter((ig) => ig.id !== igrejaId))
    await supabase.rpc('desfavoritar_igreja', { p_igreja_id: igrejaId, p_device_id: deviceId })
  }

  return (
    <main style={estilo.main}>
      <header style={estilo.header}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <a href="/igrejas" style={estilo.logo}>Berit</a>
          <div style={{ marginTop: 6 }}>
            <a href="/igrejas" style={{ color: '#FFFFFF', fontSize: 13, textDecoration: 'none' }}>← Voltar ao Diretório</a>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 24, color: '#1F3A5F' }}>❤️ Minhas igrejas favoritas</h1>
        <p style={{ margin: '0 0 1.25rem', fontSize: 13, color: '#8A8A8A' }}>
          As igrejas que você acompanha neste dispositivo, da mais recente para a mais antiga. Você receberá as notificações de atividades delas.
        </p>

        {erro && <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>}

        {carregando ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#8A8A8A', fontSize: 14 }}>Carregando suas igrejas...</div>
        ) : igrejas.length === 0 ? (
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '2.5rem', textAlign: 'center', border: '1px solid #E4DED2' }}>
            <p style={{ fontSize: 15, color: '#5A5A5A', margin: '0 0 4px' }}>Você ainda não acompanha nenhuma igreja.</p>
            <p style={{ fontSize: 13, color: '#8A8A8A', margin: '0 0 16px' }}>Encontre a sua no diretório e toque em "Acompanhar esta igreja".</p>
            <a href="/igrejas" style={{ display: 'inline-block', background: '#D9A441', color: '#1F3A5F', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              Explorar o Diretório
            </a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {igrejas.map((ig) => (
              <div key={ig.id} style={estilo.card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: 17, color: '#1F3A5F' }}>❤️ {ig.nome}</h2>
                  {ig.publico_verificado && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', background: '#EAF4EE', color: '#4C8C6E', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      Verificada
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#8A8A8A' }}>
                  {ig.cidade || ''}{ig.cidade && ig.uf ? `, ${ig.uf}` : ig.uf || ''}
                </div>
                {ig.endereco_publico && (
                  <div style={{ fontSize: 12, color: '#8A8A8A' }}>
                    📍 {ig.endereco_publico}{ig.bairro ? `, ${ig.bairro}` : ''}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  <a href={`/igreja/${ig.slug}`} style={{ flex: 1, background: '#1F3A5F', color: '#FFFFFF', textAlign: 'center', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    Ver página
                  </a>
                  <button
                    onClick={() => remover(ig.id)}
                    title="Deixar de acompanhar"
                    style={{ background: '#FBEFEA', color: '#8A4B2D', border: 'none', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer style={{ borderTop: '1px solid #E4DED2', padding: '1.5rem', textAlign: 'center', fontSize: 12, color: '#8A8A8A' }}>
        Berit, Gestão Eclesiástica
      </footer>
    </main>
  )
}
