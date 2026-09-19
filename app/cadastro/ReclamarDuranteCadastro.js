'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function ReclamarDuranteCadastro({ nome, cidade, onVinculada }) {
  const [buscando, setBuscando] = useState(false)
  const [candidatas, setCandidatas] = useState([])
  const [buscado, setBuscado] = useState(false)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')
  const [processandoId, setProcessandoId] = useState(null)

  async function buscar() {
    if (!nome.trim() || !cidade.trim()) {
      setErro('Informe o nome e a cidade da igreja para buscar coincidencias.')
      return
    }
    setBuscando(true)
    setErro('')
    setMsg('')
    const { data, error } = await supabase.rpc('buscar_igrejas_similares', {
      p_nome: nome.trim(),
      p_cidade: cidade.trim(),
    })
    setBuscando(false)
    if (error || !data || !data.ok) {
      setErro('Não foi possível buscar igrejas similares. Tente novamente.')
      return
    }
    setCandidatas(data.igrejas || [])
    setBuscado(true)
  }

  async function reclamar(ig) {
    setProcessandoId(ig.id)
    setErro('')
    setMsg('')
    const { data, error } = await supabase.rpc('reclamar_igreja', { p_igreja_id: ig.id })
    setProcessandoId(null)
    if (error || !data || !data.ok) {
      setErro(data?.mensagem || 'Não foi possível reclamar a igreja.')
      return
    }
    setMsg(data.mensagem)
    if (data.automatico && onVinculada) {
      onVinculada(ig)
    }
  }

  return (
    <div style={{ background: '#E8F0FA', border: '1px solid #C9D9EC', borderRadius: 10, padding: '12px 14px', marginBottom: '1rem' }}>
      <p style={{ margin: 0, fontSize: 13, color: '#1F3A5F', lineHeight: 1.6 }}>
        Uma dessas igrejas já cadastradas é a sua? Se você a encontra na lista, selecione-a para assumir a gestão em lugar de criar um cadastro duplicado.
      </p>
      <button
        type="button"
        onClick={buscar}
        disabled={buscando}
        style={{ marginTop: 10, background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: buscando ? 0.6 : 1 }}
      >
        {buscando ? 'Buscando...' : 'Buscar igrejas similares'}
      </button>
      {erro && <p style={{ margin: '8px 0 0', fontSize: 13, color: '#B71C1C' }}>{erro}</p>}
      {msg && <p style={{ margin: '8px 0 0', fontSize: 13, color: '#4C8C6E' }}>{msg}</p>}
      {buscado && candidatas.length === 0 && !msg && (
        <p style={{ margin: '8px 0 0', fontSize: 13, color: '#5A5A5A' }}>
          Não encontramos coincidencias. Você pode continuar e criar o cadastro da igreja.
        </p>
      )}
      {candidatas.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {candidatas.map((ig) => (
            <div key={ig.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', border: '1px solid #E4DED2', borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1F3A5F' }}>{ig.nome}</div>
                <div style={{ fontSize: 12, color: '#8A8A8A' }}>
                  {ig.cidade || ''}{ig.cidade && ig.uf ? `, ${ig.uf}` : ig.uf || ''}
                  {ig.endereco_publico ? ` · ${ig.endereco_publico}` : ''}
                  {ig.bairro ? `, ${ig.bairro}` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() => reclamar(ig)}
                disabled={processandoId === ig.id}
                style={{ background: '#D9A441', color: '#1F3A5F', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', opacity: processandoId === ig.id ? 0.6 : 1 }}
              >
                {processandoId === ig.id ? 'Processando...' : 'Esta é a minha igreja'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
