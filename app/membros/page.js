'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function MembrosPage() {
  const [membros, setMembros] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function carregar() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('membros')
      .select('*')
      .order('nome')
    if (error) {
      setErro('Não foi possível carregar os membros.')
    } else {
      setMembros(data || [])
    }
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])

  async function excluir(id, nome) {
    if (!window.confirm(`Excluir o membro "${nome}"?`)) return
    const { error } = await supabase.from('membros').delete().eq('id', id)
    if (error) {
      setErro('Não foi possível excluir o membro.')
    } else {
      carregar()
    }
  }

  const filtrados = membros.filter((m) =>
    (m.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <main style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
      <header style={{ background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/area" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' }}>
          Berit
        </a>
        <a href="/area" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>
          Voltar
        </a>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Membros</h1>
            <p style={{ fontSize: 14, color: '#8A8A8A', margin: 0 }}>Cadastro e gestão do rol de membros da igreja.</p>
          </div>
          <a href="/membros/novo" style={{ background: '#D9A441', color: '#1F3A5F', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            + Novo membro
          </a>
        </div>

        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, marginBottom: '1.5rem', boxSizing: 'border-box' }}
        />

        {erro && (
          <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            {erro}
          </div>
        )}

        {carregando ? (
          <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '2rem' }}>Carregando membros...</div>
        ) : filtrados.length === 0 ? (
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '2rem', textAlign: 'center', border: '1px solid #E4DED2', fontSize: 14, color: '#8A8A8A' }}>
            Nenhum membro encontrado. Clique em "+ Novo membro" para cadastrar o primeiro.
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E4DED2', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#F5F0E6', color: '#1F3A5F', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Nome</th>
                  <th style={{ padding: '12px 16px' }}>E-mail</th>
                  <th style={{ padding: '12px 16px' }}>Celular</th>
                  <th style={{ padding: '12px 16px' }}>Situação</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((m) => (
                  <tr key={m.id} style={{ borderTop: '1px solid #F0EAE0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2E2E2E' }}>{m.nome}</td>
                    <td style={{ padding: '12px 16px', color: '#5A5A5A' }}>{m.email || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#5A5A5A' }}>{m.celular || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: m.situacao === 'ativo' ? '#EAF4EE' : '#F5F0E6', color: m.situacao === 'ativo' ? '#4C8C6E' : '#8A8A8A', padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
                        {m.situacao}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <a href={`/membros/editar?id=${m.id}`} style={{ color: '#1F3A5F', marginRight: 12, fontSize: 13 }}>Editar</a>
                      <button onClick={() => excluir(m.id, m.nome)} style={{ background: 'none', border: 'none', color: '#B71C1C', fontSize: 13, cursor: 'pointer' }}>
                        Excluir
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
