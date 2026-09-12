'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { getPerfil } from '../../../lib/perfil'

const FORMAS_PAGAMENTO = ['Dinheiro', 'PIX', 'Transferência', 'Cartão', 'Cheque', 'Outro']

export default function EditarFinancas() {
  const [perfilAtual, setPerfilAtual] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [categorias, setCategorias] = useState([])
  const [membros, setMembros] = useState([])
  const [form, setForm] = useState(null)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [consolidado, setConsolidado] = useState(false)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    getPerfil().then((p) => {
      setPerfilAtual(p)
      setVerificando(false)
      if (p && (p.perfil === 'admin_master' || p.perfil === 'tesouraria')) {
        carregarDados()
      }
    })
  }, [])

  async function carregarDados() {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (!id) {
      setNaoEncontrado(true)
      return
    }
    const [lanc, cat, mem] = await Promise.all([
      supabase.from('lancamentos').select('*').eq('id', id).single(),
      supabase.from('categorias').select('*').order('nome'),
      supabase.from('membros').select('id, nome').in('situacao', ['ativo', 'congregado']).order('nome'),
    ])
    setCategorias(cat.data || [])
    setMembros(mem.data || [])
    if (lanc.error || !lanc.data) {
      setNaoEncontrado(true)
    } else {
      setConsolidado(!!lanc.data.consolidado)
      setForm({
        tipo: lanc.data.tipo,
        categoria_id: lanc.data.categoria_id || '',
        descricao: lanc.data.descricao || '',
        valor: String(lanc.data.valor).replace('.', ','),
        data_lancamento: lanc.data.data_lancamento || '',
        forma_pagamento: lanc.data.forma_pagamento || '',
        membro_id: lanc.data.membro_id || '',
        observacoes: lanc.data.observacoes || '',
      })
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
    if (consolidado && !form.observacoes.trim()) {
      setErro('Para alterar um lançamento consolidado, é obrigatório informar o motivo nas Observações.')
      return
    }
    setCarregando(true)
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (consolidado) {
      const { error } = await supabase.rpc('solicitar_alteracao', {
        p_id: id,
        p_tipo: form.tipo,
        p_categoria_id: form.categoria_id,
        p_descricao: form.descricao.trim() || null,
        p_valor: valorNum,
        p_data_lancamento: form.data_lancamento,
        p_forma_pagamento: form.forma_pagamento || null,
        p_membro_id: form.tipo === 'entrada' ? form.membro_id || null : null,
        p_observacoes: form.observacoes.trim() || null,
      })
      setCarregando(false)
      if (error) {
        setErro(error.message || 'Não foi possível solicitar a alteração. Tente novamente.')
      } else {
        setSalvo(true)
      }
      return
    }
    const { error } = await supabase.from('lancamentos').update({
      tipo: form.tipo,
      categoria_id: form.categoria_id,
      descricao: form.descricao.trim() || null,
      valor: valorNum,
      data_lancamento: form.data_lancamento,
      forma_pagamento: form.forma_pagamento || null,
      membro_id: form.tipo === 'entrada' ? form.membro_id || null : null,
      observacoes: form.observacoes.trim() || null,
    }).eq('id', id)
    setCarregando(false)
    if (error) {
      setErro(error.message || 'Não foi possível salvar o lançamento. Tente novamente.')
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

  if (!perfilAtual || (perfilAtual.perfil !== 'admin_master' && perfilAtual.perfil !== 'tesouraria')) {
    return (
      <main style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: '#5A5A5A' }}>Acesso restrito aos perfis Administrador e Tesouraria.</p>
          <a href="/area" style={{ color: '#1F3A5F', fontSize: 14 }}>Voltar para o início</a>
        </div>
      </main>
    )
  }

  if (naoEncontrado) {
    return (
      <main style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: '#5A5A5A' }}>Lançamento não encontrado.</p>
          <a href="/financas" style={{ color: '#1F3A5F', fontSize: 14 }}>Voltar para Finanças</a>
        </div>
      </main>
    )
  }

  if (salvo) {
    return (
      <main style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
        <header style={{ background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/area" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' }}>Berit</a>
          <a href="/financas" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>Voltar</a>
        </header>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ background: '#EAF4EE', color: '#4C8C6E', padding: '18px', borderRadius: 12, fontSize: 14, lineHeight: 1.6 }}>
            <strong style={{ display: 'block', marginBottom: 6, fontSize: 16 }}>Alteração aplicada!</strong>
            Por se tratar de um lançamento <strong>consolidado</strong>, a mudança ficará <strong>aguardando a conferência do outro perfil financeiro</strong> na Central de Auditoria.
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            <a href="/financas/auditoria" style={{ padding: '12px 20px', background: '#1F3A5F', color: '#FFFFFF', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Ir para a Central de Auditoria
            </a>
            <a href="/financas" style={{ padding: '12px 20px', background: '#F5F0E6', color: '#1F3A5F', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Voltar para Finanças
            </a>
          </div>
        </div>
      </main>
    )
  }

  if (!form) {
    return (
      <main style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center', fontSize: 14, color: '#8A8A8A' }}>
          Carregando...
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
        <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Editar lançamento</h1>
        <p style={{ fontSize: 14, color: '#8A8A8A', margin: '0 0 1.5rem' }}>Atualize os dados e salve.</p>
        {consolidado && (
          <div style={{ background: '#FDF3E3', color: '#B26A00', padding: '12px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, lineHeight: 1.5, border: '1px solid #F0D9A8' }}>
            <strong>Este lançamento está consolidado.</strong> Ao salvar, a alteração será aplicada e ficará <strong>aguardando a conferência do outro perfil financeiro</strong> na Central de Auditoria. Se a conferência for rejeitada, os valores originais serão restaurados.
          </div>
        )}
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
          <input type="text" inputMode="decimal" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} required style={campo} />
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
          <label style={rotulo}>Observações{consolidado && ' *'}</label>
          <textarea
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            rows={3}
            placeholder={consolidado ? 'Explique o motivo da alteração deste lançamento consolidado (obrigatório)' : 'Anotações opcionais'}
            style={campo}
          />
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: 4 }}>
            <button type="submit" disabled={carregando} style={{ flex: 1, padding: '12px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              {carregando ? 'Salvando...' : consolidado ? 'Salvar e solicitar conferência' : 'Salvar alterações'}
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
