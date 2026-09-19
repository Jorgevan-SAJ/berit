'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const estilo = {
  main: { minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" },
  header: { background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem' },
  logo: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' },
  card: { background: '#FFFFFF', borderRadius: 12, border: '1px solid #E4DED2', padding: '1.25rem', marginBottom: '1rem' },
  campo: { width: '100%', padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
  botao: { padding: '10px 18px', background: '#D9A441', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  botaoExcluir: { padding: '10px 18px', background: '#FDECEC', color: '#B71C1C', border: '1px solid #F0C4C4', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
}

export default function ModeracaoIgrejas() {
  const router = useRouter()
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [msg, setMsg] = useState('')
  const [igrejas, setIgrejas] = useState([])
  const [salvandoId, setSalvandoId] = useState(null)
  const [excluindoId, setExcluindoId] = useState(null)

  async function carregar() {
    setCarregando(true)
    setErro('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setCarregando(false)
      router.push('/login?voltar=/igrejas/moderacao')
      return
    }
    const { data, error } = await supabase.rpc('listar_igrejas_para_moderacao')
    if (error || !data || !data.ok) {
      setErro(data?.mensagem || 'Não foi possível carregar a moderação.')
      setIgrejas([])
    } else {
      setIgrejas(data.igrejas || [])
    }
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])

  function alterar(id, campo, valor) {
    setIgrejas(igrejas.map((ig) => ig.id === id ? { ...ig, [campo]: valor } : ig))
  }

  async function salvar(ig) {
    setSalvandoId(ig.id)
    setMsg('')
    setErro('')
    const { data, error } = await supabase.rpc('atualizar_igreja_indicada', {
      p_igreja_id: ig.id,
      p_nome: ig.nome || '',
      p_cidade: ig.cidade || '',
      p_uf: ig.uf || '',
      p_endereco: ig.endereco_publico || '',
      p_bairro: ig.bairro || '',
      p_contato: ig.contato || '',
    })
    setSalvandoId(null)
    if (error || !data || !data.ok) {
      setErro(data?.mensagem || 'Não foi possível salvar.')
      return
    }
    setMsg(`Dados de "${ig.nome}" atualizados.`)
    if (data.slug) {
      setIgrejas(igrejas.map((x) => x.id === ig.id ? { ...x, slug: data.slug } : x))
    }
  }

  async function excluir(ig) {
    const confirmou = window.confirm(
      `Excluir "${ig.nome}" (${ig.cidade || ''}${ig.uf ? `/${ig.uf}` : ''}) do diretório?\n\nEsta ação remove a igreja da lista pública e não pode ser desfeita.`
    )
    if (!confirmou) return
    setExcluindoId(ig.id)
    setMsg('')
    setErro('')
    const { data, error } = await supabase.rpc('excluir_igreja_indicada', {
      p_igreja_id: ig.id,
    })
    setExcluindoId(null)
    if (error || !data || !data.ok) {
      setErro(data?.mensagem || 'Não foi possível excluir.')
      return
    }
    setMsg(`"${ig.nome}" foi excluída do diretório.`)
    setIgrejas(igrejas.filter((x) => x.id !== ig.id))
  }

  return (
    <main style={estilo.main}>
      <header style={estilo.header}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/igrejas" style={estilo.logo}>Berit</a>
          <a href="/area" style={{ color: '#FFFFFF', fontSize: 13, textDecoration: 'none' }}>Voltar ao painel</a>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem' }}>
        <h1 style={{ fontSize: 22, color: '#1F3A5F', margin: '0 0 4px' }}>Moderação de igrejas indicadas</h1>
        <p style={{ fontSize: 13, color: '#8A8A8A', margin: '0 0 20px' }}>
          Corrija nome, cidade, UF, endereço, bairro e contato, ou exclua igrejas duplicadas ou inexistentes. As alterações aparecem na hora no diretório e na página pública.
        </p>

        {msg && <div style={{ background: '#EAF4EE', color: '#4C8C6E', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{msg}</div>}
        {erro && <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>}

        {carregando ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#8A8A8A', fontSize: 14 }}>Carregando...</div>
        ) : igrejas.length === 0 ? (
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '2.5rem', textAlign: 'center', border: '1px solid #E4DED2' }}>
            <p style={{ fontSize: 15, color: '#5A5A5A', margin: 0 }}>Nenhuma igreja indicada para moderar.</p>
          </div>
        ) : (
          igrejas.map((ig) => (
            <div key={ig.id} style={estilo.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 16, color: '#1F3A5F' }}>{ig.nome}</h2>
                  <div style={{ fontSize: 12, color: '#8A8A8A' }}>
                    {ig.cidade || ''}{ig.cidade && ig.uf ? `, ${ig.uf}` : ig.uf || ''}
                    {ig.aguarda_confirmacao ? ' · aguardando confirmação' : ig.publico_verificado ? ' · verificada' : ''}
                  </div>
                </div>
                <a href={`/igreja/${ig.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#1F3A5F' }}>Ver página</a>
              </div>
              <div style={{ display: 'grid', gap: '0.75rem', marginBottom: 12 }}>
                <input
                  type="text"
                  value={ig.nome || ''}
                  onChange={(e) => alterar(ig.id, 'nome', e.target.value)}
                  placeholder="Nome da igreja *"
                  style={estilo.campo}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                  <input
                    type="text"
                    value={ig.cidade || ''}
                    onChange={(e) => alterar(ig.id, 'cidade', e.target.value)}
                    placeholder="Cidade *"
                    style={estilo.campo}
                  />
                  <select
                    value={ig.uf || ''}
                    onChange={(e) => alterar(ig.id, 'uf', e.target.value)}
                    style={estilo.campo}
                  >
                    <option value="">UF *</option>
                    {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <input
                  type="text"
                  value={ig.endereco_publico || ''}
                  onChange={(e) => alterar(ig.id, 'endereco_publico', e.target.value)}
                  placeholder="Endereço (rua, número)"
                  style={estilo.campo}
                />
                <input
                  type="text"
                  value={ig.bairro || ''}
                  onChange={(e) => alterar(ig.id, 'bairro', e.target.value)}
                  placeholder="Bairro"
                  style={estilo.campo}
                />
                <input
                  type="text"
                  value={ig.contato || ''}
                  onChange={(e) => alterar(ig.id, 'contato', e.target.value)}
                  placeholder="Contato (telefone ou e-mail)"
                  style={estilo.campo}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => salvar(ig)} disabled={salvandoId === ig.id} style={{ ...estilo.botao, opacity: salvandoId === ig.id ? 0.6 : 1 }}>
                  {salvandoId === ig.id ? 'Salvando...' : 'Salvar alterações'}
                </button>
                <button type="button" onClick={() => excluir(ig)} disabled={excluindoId === ig.id} style={{ ...estilo.botaoExcluir, opacity: excluindoId === ig.id ? 0.6 : 1 }}>
                  {excluindoId === ig.id ? 'Excluindo...' : 'Excluir igreja'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}
