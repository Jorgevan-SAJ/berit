'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const SEXOS = ['Masculino', 'Feminino']

const estilo = {
  main: { minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" },
  header: { background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  linkLogo: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' },
  card: { background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #E4DED2' },
  campo: { width: '100%', padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit' },
  rotulo: { fontSize: 13, color: '#2E2E2E', display: 'block', marginBottom: 6 },
  botao: { width: '100%', padding: '12px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
}

export default function FormAutocadastro() {
  const { token } = useParams()
  const [estado, setEstado] = useState('carregando') // carregando | ativo | invalido
  const [mensagem, setMensagem] = useState('')
  const [igreja, setIgreja] = useState('')
  const [form, setForm] = useState({ nome: '', sexo: '', data_nascimento: '', email: '', celular: '' })
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    async function verificar() {
      if (!token) return
      const { data, error } = await supabase.rpc('consultar_autocadastro', { p_token: String(token) })
      if (error || !data || !data.valido) {
        setEstado('invalido')
        setMensagem(data?.mensagem || 'Link inválido.')
        return
      }
      setIgreja(data.igreja || '')
      setEstado('ativo')
    }
    verificar()
  }, [token])

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    if (!form.nome.trim()) return setErro('Informe seu nome completo.')
    if (!form.sexo) return setErro('Selecione o sexo.')
    if (!form.data_nascimento) return setErro('Informe a data de nascimento.')
    setEnviando(true)
    const { data, error } = await supabase.rpc('submeter_autocadastro', {
      p_token: String(token),
      p_dados: {
        nome: form.nome.trim(),
        sexo: form.sexo,
        data_nascimento: form.data_nascimento,
        email: form.email.trim().toLowerCase(),
        celular: form.celular.trim(),
      },
    })
    setEnviando(false)
    if (error || !data || !data.ok) {
      setErro(data?.mensagem || 'Não foi possível enviar o cadastro. Tente novamente.')
      return
    }
    setEnviado(true)
  }

  return (
    <main style={estilo.main}>
      <header style={estilo.header}>
        <span style={estilo.linkLogo}>Berit</span>
      </header>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {estado === 'carregando' && (
          <div style={{ ...estilo.card, textAlign: 'center', fontSize: 14, color: '#8A8A8A' }}>Carregando...</div>
        )}

        {estado === 'invalido' && (
          <div style={{ ...estilo.card, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#B71C1C', marginBottom: 8 }}>Link indisponível</div>
            <p style={{ fontSize: 14, color: '#5A5A5A', margin: 0, lineHeight: 1.6 }}>{mensagem}</p>
          </div>
        )}

        {estado === 'ativo' && !enviado && (
          <div style={estilo.card}>
            <h1 style={{ fontSize: 20, color: '#1F3A5F', margin: '0 0 4px' }}>Autocadastro de membro</h1>
            {igreja && (
              <p style={{ fontSize: 13, color: '#8A8A8A', margin: '0 0 1.25rem' }}>
                Igreja <strong>{igreja}</strong> — preencha seus dados para ingressar no rol de membros.
              </p>
            )}
            {erro && <p style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</p>}
            <form onSubmit={enviar}>
              <label style={estilo.rotulo}>Nome completo *</label>
              <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Seu nome completo" style={estilo.campo} required />

              <label style={estilo.rotulo}>Sexo *</label>
              <select value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })} style={estilo.campo} required>
                <option value="">— Selecione —</option>
                {SEXOS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              <label style={estilo.rotulo}>Data de nascimento *</label>
              <input type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} style={estilo.campo} required />

              <label style={estilo.rotulo}>E-mail</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Opcional" style={estilo.campo} />

              <label style={estilo.rotulo}>Celular</label>
              <input type="tel" value={form.celular} onChange={(e) => setForm({ ...form, celular: e.target.value })} placeholder="Opcional" style={estilo.campo} />

              <button type="submit" disabled={enviando} style={{ ...estilo.botao, opacity: enviando ? 0.6 : 1 }}>
                {enviando ? 'Enviando...' : 'Enviar cadastro'}
              </button>
              <p style={{ fontSize: 12, color: '#8A8A8A', textAlign: 'center', margin: '12px 0 0' }}>
                Após o envio, a secretaria da igreja confirmará sua inclusão.
              </p>
            </form>
          </div>
        )}

        {estado === 'ativo' && enviado && (
          <div style={{ ...estilo.card, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#4C8C6E', marginBottom: 8 }}>Cadastro enviado com sucesso!</div>
            <p style={{ fontSize: 14, color: '#5A5A5A', margin: 0, lineHeight: 1.6 }}>
              A secretaria da igreja <strong>{igreja}</strong> irá confirmar sua inclusão. Você pode fechar esta página.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
