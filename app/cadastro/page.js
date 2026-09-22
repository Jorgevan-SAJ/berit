'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const estilo = {
  main: { minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' },
  card: { background: '#FFFFFF', borderRadius: 16, border: '1px solid #E4DED2', padding: '2rem', maxWidth: 480, width: '100%', boxShadow: '0 4px 20px rgba(31,58,95,0.08)' },
  logo: { fontSize: 24, fontWeight: 700, color: '#1F3A5F', textAlign: 'center', margin: '0 0 4px', letterSpacing: '-0.02em' },
  subtitulo: { textAlign: 'center', color: '#8A8A8A', fontSize: 13, margin: '0 0 24px' },
  campo: { width: '100%', padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 12 },
  rotulo: { display: 'block', fontSize: 13, fontWeight: 600, color: '#1F3A5F', marginBottom: 4 },
  botao: { width: '100%', padding: '12px', background: '#D9A441', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  aviso: { background: '#FDF3E3', border: '1px solid #F0D9A8', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#7A5A1E', marginBottom: 16, lineHeight: 1.5 },
  erro: { background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 },
  ok: { background: '#EAF4EE', color: '#4C8C6E', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 },
}

export default function CadastroInicial() {
  const router = useRouter()
  const [form, setForm] = useState({ nomeUsuario: '', nomeIgreja: '', email: '', senha: '', confirmarSenha: '', termos: false })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [msg, setMsg] = useState('')

  async function cadastrar(e) {
    e.preventDefault()
    setErro('')
    setMsg('')
    if (!form.nomeUsuario.trim() || !form.nomeIgreja.trim() || !form.email.trim()) {
      setErro('Preencha nome do administrador, nome da igreja e e-mail.')
      return
    }
    if (form.senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (form.senha !== form.confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }
    if (!form.termos) {
      setErro('Você precisa aceitar os Termos de Uso e a Política de Privacidade.')
      return
    }
    setEnviando(true)

    const origem = typeof window !== 'undefined' ? window.location.origin : ''
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.senha,
      options: {
        data: { nome: form.nomeUsuario.trim() },
        emailRedirectTo: `${origem}/igrejas/editar`,
      },
    })
    if (error || !data.user) {
      setEnviando(false)
      setErro(error?.message || 'Não foi possível criar o usuário. Tente novamente.')
      return
    }

    const { data: criada, error: erroIgreja } = await supabase.rpc('criar_igreja', {
      p_user_id: data.user.id,
      p_nome: form.nomeIgreja.trim(),
      p_email: form.email.trim(),
      p_termos_aceitos: true,
    })
    setEnviando(false)
    if (erroIgreja || !criada) {
      setErro('Usuário criado, mas não foi possível criar a igreja: ' + (erroIgreja?.message || 'erro desconhecido') + '. Entre em contato com a Equipe Berit.')
      return
    }

    if (data.session) {
      router.push('/igrejas/editar')
    } else {
      setMsg('Conta criada! Enviamos um link de confirmação para o seu e-mail. Após confirmar, acesse sua conta e complete os dados da igreja.')
    }
  }

  return (
    <main style={estilo.main}>
      <div style={estilo.card}>
        <h1 style={estilo.logo}>Berit</h1>
        <p style={estilo.subtitulo}>Adquira o Berit e gerencie os dados da sua igreja</p>
        {msg && <div style={estilo.ok}>{msg}</div>}
        {erro && <div style={estilo.erro}>{erro}</div>}
        <form onSubmit={cadastrar}>
          <label style={estilo.rotulo}>Nome do administrador / pastor</label>
          <input
            type="text"
            value={form.nomeUsuario}
            onChange={(e) => setForm({ ...form, nomeUsuario: e.target.value })}
            style={estilo.campo}
            placeholder="Seu nome"
            required
          />
          <label style={estilo.rotulo}>Nome da igreja</label>
          <input
            type="text"
            value={form.nomeIgreja}
            onChange={(e) => setForm({ ...form, nomeIgreja: e.target.value })}
            style={estilo.campo}
            placeholder="Nome completo da igreja"
            required
          />
          <label style={estilo.rotulo}>E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={estilo.campo}
            placeholder="voce@email.com"
            required
          />
          <label style={estilo.rotulo}>Senha</label>
          <input
            type="password"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            style={estilo.campo}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            required
          />
          <label style={estilo.rotulo}>Confirmar senha</label>
          <input
            type="password"
            value={form.confirmarSenha}
            onChange={(e) => setForm({ ...form, confirmarSenha: e.target.value })}
            style={estilo.campo}
            placeholder="Repita a senha"
            autoComplete="new-password"
            required
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#5A5A5A', marginBottom: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.termos}
              onChange={(e) => setForm({ ...form, termos: e.target.checked })}
              style={{ width: 16, height: 16 }}
            />
            Aceito os Termos de Uso e a Política de Privacidade
          </label>
          <div style={estilo.aviso}>
            Ao criar a conta, sua igreja entra em período de teste gratuito de 30 dias. No primeiro acesso, você completa os dados (endereço e bairro são obrigatórios) e, se a igreja já estiver cadastrada no diretório, poderá assumir a gestão dela.
          </div>
          <button type="submit" disabled={enviando} style={{ ...estilo.botao, opacity: enviando ? 0.6 : 1 }}>
            {enviando ? 'Criando conta...' : 'Criar conta e igreja'}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: 13, color: '#8A8A8A', marginTop: 16 }}>
          Já tem conta? <a href="/login" style={{ color: '#1F3A5F', fontWeight: 700 }}>Entrar</a>
        </p>
      </div>
    </main>
  )
}
