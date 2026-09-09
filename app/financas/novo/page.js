'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { getPerfil } from '../../../lib/perfil'

const FORMAS_PAGAMENTO = ['Dinheiro', 'PIX', 'Transferência', 'Cartão', 'Cheque', 'Outro']

export default function NovoFinancas() {
  const [perfilAtual, setPerfilAtual] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [categorias, setCategorias] = useState([])
  const [membros, setMembros] = useState([])
  const [form, setForm] = useState({
    tipo: 'entrada',
    categoria_id: '',
    descricao: '',
    valor: '',
    data_lancamento: new Date().toISOString().slice(0, 10),
    forma_pagamento: '',
    membro_id: '',
    observacoes: '',
  })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    getPerfil().then((p) => {
      setPerfilAtual(p)
      setVerificando(false)
      if (p && p.perfil === 'tesouraria') {
        carregarOpcoes()
      }
    })
  }, [])

  async function carregarOpcoes() {
    const [cat, mem] = await Promise.all([
      supabase.from('categorias').select('*').order('nome'),
      supabase.from('membros').select('id, nome').in('situacao', ['ativo', 'congregado']).order('nome'),
    ])
    setCategorias(cat.data || [])
    setMembros(mem.data || [])
    const iniciais = (cat.data || []).filter((c) => c.tipo === 'entrada')
    if (iniciais.length > 0) {
      setForm((f) => ({ ...f, categoria_id: iniciais[0].id }))
    }
  }

  function mudarTipo(tipo) {
    const iniciais = categorias.filter((c) => c.tipo === tipo)
    setForm({
      ...form,
      tipo,
      categoria_id: iniciais.length > 0 ? iniciais[0].id : '',
      membro_id: '',
    })
  }

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    const valorNum = parseFloat(String(form.valor).replace(',', '.'))
    if (!valorNum || valorNum <= 0) {
      setErro('Informe um valor válido.')
      return
    }
    if (!form.categoria_id) {
      setErro('Selecione a categoria.')
      return
    }
    setCarregando(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('lancamentos').insert([
      {
        tipo: form.tipo,
        categoria_id: form.categoria_id,
        descricao: form.descricao.trim() || null,
        valor: valorNum,
        data_lancamento: form.data_lancamento,
        forma_pagamento: form.forma_pagamento || null,
        membro_id: form.tipo === 'entrada' ? form.membro_id || null : null,
        observacoes: form.observacoes.trim() || null,
        created_by: user?.id || null,
      },
    ])
    setCarregando(false)
    if (error) {
      setErro('Não foi possível salvar o lançamento. Tente novamente.')
    } else {
      window.location.href = '/financas'
    }
  }

  const campo = {
    width: '100%', padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8,
    fontSize: 14, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const rotulo = { fontSize: 13, color: '#2E2E2E', display: 'block', marginBottom: 6 }

  if (verificando) {
    return (
      <main style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center', fontSize: 14, color: '#8A8A8A' }}>
          Verificando permissões...
        </div>
      </main>
    )
  }

  if (!perfilAtual || perfilAtual.perfil !== 'tesouraria') {
    return (
      <main style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
        <header style={{ background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/area" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' }}>Berit</a>
          <a href="/financas" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>Voltar</a>
        </header>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1F3A5F', marginBottom: 8 }}>Acesso restrito</div>
          <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px' }}>
            Esta ação é exclusiva do perfil <strong>Tesouraria</strong>.
          </p>
          <a href="/financas" style={{ color: '#1F3A5F', fontSize: 14 }}>Voltar para Finanças</a>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
      <header style={{ background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/area" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' }}>Berit</a>
        <a href="/financas" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>Voltar</a>
      </header>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Novo lançamento</h1>
        <p style={{ fontSize: 14, color: '#8A8A8A', margin: '0 0 1.5rem' }}>Registre uma entrada ou saída financeira.</p>

        {erro && (
          <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>
        )}

        <form onSubmit={salvar} style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #E4DED2' }}>
          <label style={rotulo}>Tipo</label>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => mudarTipo('entrada')}
              style={{
                flex: 1, padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                background: form.tipo === 'entrada' ? '#4C8C6E' : '#F5F0E6',
                color: form.tipo === 'entrada' ? '#FFFFFF' : '#5A5A5A',
                border: 'none',
              }}
            >
              Entrada
            </button>
            <button
              type="button"
              onClick={() => mudarTipo('saida')}
              style={{
                flex: 1, padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                background: form.tipo === 'saida' ? '#B71C1C' : '#F5F0E6',
                color: form.tipo === 'saida' ? '#FFFFFF' : '#5A5A5A',
                border: 'none',
              }}
            >
              Saída
            </button>
          </div>

          <label style={rotulo}>Categoria</label>
          <select value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })} style={campo}>
            {categorias.filter((c) => c.tipo === form.tipo).map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          {form.tipo === 'saida' && (
            <>
              <label style={rotulo}>Descrição</label>
              <input type="text" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="ex.: Conta de luz" style={campo} />
            </>
          )}

          <label style={rotulo}>Valor (R$) *</label>
          <input type="text" inputMode="decimal" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" required style={campo} />

          <label style={rotulo}>Data</label>
          <input type="date" value={form.data_lancamento} onChange={(e) => setForm({ ...form, data_lancamento: e.target.value })} style={campo} />

          <label style={rotulo}>Forma de pagamento</label>
          <select value={form.forma_pagamento} onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })} style={campo}>
            <option value="">— Selecione —</option>
            {FORMAS_PAGAMENTO.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          {form.tipo === 'entrada' && (
            <>
              <label style={rotulo}>Membro (para dízimos e ofertas)</label>
              <select value={form.membro_id} onChange={(e) => setForm({ ...form, membro_id: e.target.value })} style={campo}>
                <option value="">— Não vinculado —</option>
                {membros.map((m) => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </select>
            </>
          )}

          <label style={rotulo}>Observações</label>
          <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} placeholder="Anotações opcionais" style={campo} />

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: 4 }}>
            <button type="submit" disabled={carregando} style={{ flex: 1, padding: '12px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              {carregando ? 'Salvando...' : 'Salvar lançamento'}
            </button>
            <a href="/financas" style={{ flex: 1, padding: '12px', background: '#F5F0E6', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>
              Cancelar
            </a>
          </div>
        </form>
      </div>
    </main>
  )
}
