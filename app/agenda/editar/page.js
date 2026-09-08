'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { getPerfil } from '../../../lib/perfil'

const TIPOS = [
  { v: 'culto', r: 'Culto' },
  { v: 'ensaio', r: 'Ensaio' },
  { v: 'reuniao', r: 'Reunião' },
  { v: 'evento', r: 'Evento' },
  { v: 'campanha', r: 'Campanha' },
  { v: 'outro', r: 'Outro' },
]

export default function EditarEvento() {
  const [perfilAtual, setPerfilAtual] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [form, setForm] = useState(null)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    getPerfil().then((p) => {
      setPerfilAtual(p)
      setVerificando(false)
      if (p && (p.perfil === 'admin_master' || p.perfil === 'secretaria')) {
        carregar()
      }
    })
  }, [])

  async function carregar() {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (!id) {
      setNaoEncontrado(true)
      return
    }
    const { data, error } = await supabase.from('eventos').select('*').eq('id', id).single()
    if (error || !data) {
      setNaoEncontrado(true)
    } else {
      setForm({
        titulo: data.titulo,
        tipo: data.tipo,
        data_inicio: data.data_inicio || '',
        hora_inicio: data.hora_inicio || '19:00',
        data_fim: data.data_fim || '',
        hora_fim: data.hora_fim || '',
        local: data.local || '',
        responsavel: data.responsavel || '',
        descricao: data.descricao || '',
      })
    }
  }

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    if (!form.titulo.trim()) {
      setErro('Informe o título do evento.')
      return
    }
    if (!form.data_inicio) {
      setErro('Informe a data do evento.')
      return
    }
    setCarregando(true)
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    const { error } = await supabase.from('eventos').update({
      titulo: form.titulo.trim(),
      tipo: form.tipo,
      data_inicio: form.data_inicio,
      hora_inicio: form.hora_inicio || '19:00',
      data_fim: form.data_fim || null,
      hora_fim: form.hora_fim || null,
      local: form.local.trim() || '',
      responsavel: form.responsavel.trim() || '',
      descricao: form.descricao.trim() || '',
    }).eq('id', id)
    setCarregando(false)
    if (error) {
      setErro(error.message || 'Não foi possível salvar o evento.')
    } else {
      window.location.href = '/agenda'
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

  if (!perfilAtual || (perfilAtual.perfil !== 'admin_master' && perfilAtual.perfil !== 'secretaria')) {
    return (
      <main style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
        <header style={{ background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/area" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' }}>Berit</a>
          <a href="/agenda" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>Voltar</a>
        </header>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: '#5A5A5A' }}>Acesso restrito aos perfis Administrador e Secretaria.</p>
          <a href="/agenda" style={{ color: '#1F3A5F', fontSize: 14 }}>Voltar para a Agenda</a>
        </div>
      </main>
    )
  }

  if (naoEncontrado) {
    return (
      <main style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: '#5A5A5A' }}>Evento não encontrado.</p>
          <a href="/agenda" style={{ color: '#1F3A5F', fontSize: 14 }}>Voltar para a Agenda</a>
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
        <a href="/agenda" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>Voltar</a>
      </header>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Editar evento</h1>
        <p style={{ fontSize: 14, color: '#8A8A8A', margin: '0 0 1.5rem' }}>Atualize os dados da programação.</p>

        {erro && (
          <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>
        )}

        <form onSubmit={salvar} style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #E4DED2' }}>
          <label style={rotulo}>Título *</label>
          <input type="text" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required style={campo} />

          <label style={rotulo}>Tipo</label>
          <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} style={campo}>
            {TIPOS.map((t) => (
              <option key={t.v} value={t.v}>{t.r}</option>
            ))}
          </select>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div>
              <label style={rotulo}>Data *</label>
              <input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} required style={campo} />
            </div>
            <div>
              <label style={rotulo}>Hora</label>
              <input type="time" value={form.hora_inicio} onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })} style={campo} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div>
              <label style={rotulo}>Data final (opcional)</label>
              <input type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} style={campo} />
            </div>
            <div>
              <label style={rotulo}>Hora final (opcional)</label>
              <input type="time" value={form.hora_fim} onChange={(e) => setForm({ ...form, hora_fim: e.target.value })} style={campo} />
            </div>
          </div>

          <label style={rotulo}>Local</label>
          <input type="text" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} style={campo} />

          <label style={rotulo}>Responsável</label>
          <input type="text" value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} style={campo} />

          <label style={rotulo}>Descrição</label>
          <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} style={campo} />

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: 4 }}>
            <button type="submit" disabled={carregando} style={{ flex: 1, padding: '12px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              {carregando ? 'Salvando...' : 'Salvar alterações'}
            </button>
            <a href="/agenda" style={{ flex: 1, padding: '12px', background: '#F5F0E6', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>
              Cancelar
            </a>
          </div>
        </form>
      </div>
    </main>
  )
}
