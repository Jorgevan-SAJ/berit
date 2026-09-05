'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

function formatarCelular(valor) {
  const d = (valor || '').replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export default function MembrosInativos() {
  const [membros, setMembros] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [reativando, setReativando] = useState(null)

  async function carregar() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('membros')
      .select('*')
      .eq('situacao', 'inativo')
      .order('nome')
    if (error) {
      setErro('Não foi possível carregar os membros inativos.')
    } else {
      setMembros(data || [])
    }
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])

  async function reativar(m) {
    if (!window.confirm(`Reativar o membro "${m.nome}"? Ele voltará para a lista de membros ativos.`)) return
    setReativando(m.id)
    const { error } = await supabase
      .from('membros')
      .update({
        situacao: 'ativo',
        motivo_inativacao: null,
        data_inativacao: null,
      })
      .eq('id', m.id)
    setReativando(null)
    if (error) {
      setErro('Não foi possível reativar o membro. Tente novamente.')
    } else {
      carregar()
    }
  }

  function formatarData(d) {
    if (!d) return '—'
    const partes = d.split('-')
    if (partes.length !== 3) return d
    return `${partes[2]}/${partes[1]}/${partes[0]}`
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
      <header style={{ background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/area" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' }}>
          Berit
        </a>
        <a href="/membros" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>
          Voltar
        </a>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Membros Inativos</h1>
            <p style={{ fontSize: 14, color: '#8A8A8A', margin: 0 }}>Cadastros preservados com o motivo da saída. Reative quando necessário.</p>
          </div>
          <a href="/membros" style={{ background: '#F5F0E6', color: '#1F3A5F', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            ← Voltar aos ativos
          </a>
        </div>

        {erro && (
          <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            {erro}
          </div>
        )}

        {carregando ? (
          <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '2rem' }}>Carregando...</div>
        ) : membros.length === 0 ? (
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '2rem', textAlign: 'center', border: '1px solid #E4DED2', fontSize: 14, color: '#8A8A8A' }}>
            Nenhum membro inativo no momento.
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E4DED2', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#F5F0E6', color: '#1F3A5F', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Nome</th>
                  <th style={{ padding: '12px 16px' }}>Celular</th>
                  <th style={{ padding: '12px 16px' }}>Motivo</th>
                  <th style={{ padding: '12px 16px' }}>Data</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {membros.map((m) => (
                  <tr key={m.id} style={{ borderTop: '1px solid #F0EAE0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2E2E2E' }}>{m.nome}</td>
                    <td style={{ padding: '12px 16px', color: '#5A5A5A' }}>{formatarCelular(m.celular) || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: '#F5F0E6', color: '#8A8A8A', padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
                        {m.motivo_inativacao || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#5A5A5A' }}>{formatarData(m.data_inativacao)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => reativar(m)}
                        disabled={reativando === m.id}
                        style={{ background: '#1F3A5F', border: 'none', color: '#FFFFFF', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        {reativando === m.id ? 'Reativando...' : 'Reativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
