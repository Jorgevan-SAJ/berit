'use client'

import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'

function formatarCelular(valor) {
  const d = (valor || '').replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function formatarData(valor) {
  if (!valor) return ''
  const partes = valor.split('-')
  if (partes.length !== 3) return valor
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

const MOTIVOS = [
  'Falecido',
  'Abandono',
  'Em disciplina',
  'Transferido para outra igreja',
  'Mudança de cidade',
  'Outros',
]

export default function MembrosPage() {
  const [membros, setMembros] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [inativando, setInativando] = useState(null)
  const [motivo, setMotivo] = useState(MOTIVOS[0])
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('membros')
      .select('*')
      .eq('situacao', 'ativo')
      .order('nome')
    if (error) {
      setErro('Não foi possível carregar os membros.')
    } else {
      setMembros(data || [])
    }
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])

  async function confirmarInativacao() {
    if (!inativando) return
    setSalvando(true)
    const { error } = await supabase
      .from('membros')
      .update({
        situacao: 'inativo',
        motivo_inativacao: motivo,
        data_inativacao: new Date().toISOString().slice(0, 10),
      })
      .eq('id', inativando.id)
    setSalvando(false)
    setInativando(null)
    setMotivo(MOTIVOS[0])
    if (error) {
      setErro('Não foi possível inativar o membro. Tente novamente.')
    } else {
      carregar()
    }
  }

  function exportar() {
    const dados = filtrados.map((m) => ({
      Nome: m.nome,
      'E-mail': m.email || '',
      Celular: formatarCelular(m.celular),
      'Data de Nascimento': formatarData(m.data_nascimento),
      'Data de Batismo': formatarData(m.data_batismo),
      'Data de Recebimento': formatarData(m.data_recebimento),
      Situacao: m.situacao,
      Observações: m.observacoes || '',
    }))
    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Membros')
    XLSX.writeFile(wb, 'membros_berit.xlsx')
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
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <a href="/membros/inativos" style={{ background: '#F5F0E6', color: '#1F3A5F', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Inativos
            </a>
            <a href="/membros/importar" style={{ background: '#FFFFFF', color: '#1F3A5F', border: '1px solid #1F3A5F', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Importar dados
            </a>
            <button onClick={exportar} style={{ background: '#FFFFFF', color: '#1F3A5F', border: '1px solid #1F3A5F', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Exportar
            </button>
            <a href="/membros/novo" style={{ background: '#D9A441', color: '#1F3A5F', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              + Novo membro
            </a>
          </div>
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
            Nenhum membro ativo encontrado. Clique em "+ Novo membro" para cadastrar o primeiro.
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
                    <td style={{ padding: '12px 16px', color: '#5A5A5A' }}>{formatarCelular(m.celular) || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: '#EAF4EE', color: '#4C8C6E', padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
                        {m.situacao}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <a href={`/membros/editar?id=${m.id}`} style={{ color: '#1F3A5F', marginRight: 12, fontSize: 13 }}>Editar</a>
                      <button onClick={() => setInativando(m)} style={{ background: 'none', border: 'none', color: '#B71C1C', fontSize: 13, cursor: 'pointer' }}>
                        Inativar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {inativando && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', maxWidth: 420, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1F3A5F', marginBottom: 6 }}>Inativar membro</div>
            <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px' }}>
              Informe o motivo da saída de <strong>{inativando.nome}</strong>. O cadastro será preservado e movido para a pasta Inativos.
            </p>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit' }}
            >
              {MOTIVOS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={confirmarInativacao}
                disabled={salvando}
                style={{ flex: 1, padding: '12px', background: '#B71C1C', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                {salvando ? 'Salvando...' : 'Confirmar inativação'}
              </button>
              <button
                onClick={() => { setInativando(null); setMotivo(MOTIVOS[0]) }}
                style={{ flex: 1, padding: '12px', background: '#F5F0E6', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
