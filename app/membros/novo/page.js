'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

function formatarCelular(valor) {
  const d = (valor || '').replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export default function NovoMembro() {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    celular: '',
    sexo: '',
    data_nascimento: '',
    data_batismo: '',
    data_recebimento: '',
    situacao: 'ativo',
    observacoes: '',
  })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  function atualizar(campo, valor) {
    setForm({ ...form, [campo]: valor })
  }

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    if (!form.nome.trim()) {
      setErro('O nome é obrigatório.')
      return
    }
    if (!form.sexo) {
      setErro('O sexo é obrigatório.')
      return
    }
    if (!form.data_nascimento) {
      setErro('A data de nascimento é obrigatória.')
      return
    }
    setCarregando(true)
    const { error } = await supabase.from('membros').insert([
      {
        nome: form.nome.trim(),
        email: form.email.trim() || null,
        celular: form.celular.replace(/\D/g, '') || null,
        sexo: form.sexo,
        data_nascimento: form.data_nascimento,
        data_batismo: form.data_batismo || null,
        data_recebimento: form.data_recebimento || null,
        situacao: form.situacao,
        observacoes: form.observacoes.trim() || null,
      },
    ])
    setCarregando(false)
    if (error) {
      setErro('Não foi possível cadastrar o membro. Tente novamente.')
    } else {
      window.location.href = '/membros'
    }
  }

  const campo = {
    width: '100%', padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8,
    fontSize: 14, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const rotulo = { fontSize: 13, color: '#2E2E2E', display: 'block', marginBottom: 6 }

  return (
    <main style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
      <header style={{ background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/area" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' }}>Berit</a>
        <a href="/membros" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>Voltar</a>
      </header>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Novo membro</h1>
        <p style={{ fontSize: 14, color: '#8A8A8A', margin: '0 0 1.5rem' }}>Preencha os dados para cadastrar um novo membro.</p>

        {erro && (
          <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>
        )}

        <form onSubmit={salvar} style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #E4DED2' }}>
          <label style={rotulo}>Nome *</label>
          <input type="text" value={form.nome} onChange={(e) => atualizar('nome', e.target.value)} placeholder="Nome completo" required style={campo} />

          <label style={rotulo}>E-mail</label>
          <input type="email" value={form.email} onChange={(e) => atualizar('email', e.target.value)} placeholder="email@exemplo.com" style={campo} />

          <label style={rotulo}>Celular</label>
          <input type="text" value={form.celular} onChange={(e) => atualizar('celular', formatarCelular(e.target.value))} placeholder="(00) 00000-0000" style={campo} />

          <label style={rotulo}>Sexo *</label>
          <select value={form.sexo} onChange={(e) => atualizar('sexo', e.target.value)} required style={campo}>
            <option value="">— Selecione —</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
          </select>

          <label style={rotulo}>Data de nascimento *</label>
          <input type="date" value={form.data_nascimento} onChange={(e) => atualizar('data_nascimento', e.target.value)} required style={campo} />

          <label style={rotulo}>Data de batismo</label>
          <input type="date" value={form.data_batismo} onChange={(e) => atualizar('data_batismo', e.target.value)} style={campo} />

          <label style={rotulo}>Data de recebimento</label>
          <input type="date" value={form.data_recebimento} onChange={(e) => atualizar('data_recebimento', e.target.value)} style={campo} />

          <label style={rotulo}>Situação</label>
          <select value={form.situacao} onChange={(e) => atualizar('situacao', e.target.value)} style={campo}>
            <option value="ativo">Ativo</option>
            <option value="congregado">Congregado</option>
            <option value="visitante">Visitante</option>
          </select>

          <label style={rotulo}>Observações</label>
          <textarea value={form.observacoes} onChange={(e) => atualizar('observacoes', e.target.value)} rows={3} placeholder="Anotações opcionais" style={campo} />

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: 4 }}>
            <button type="submit" disabled={carregando} style={{ flex: 1, padding: '12px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              {carregando ? 'Salvando...' : 'Cadastrar membro'}
            </button>
            <a href="/membros" style={{ flex: 1, padding: '12px', background: '#F5F0E6', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>
              Cancelar
            </a>
          </div>
        </form>
      </div>
    </main>
  )
}
