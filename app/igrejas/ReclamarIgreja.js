'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function ReclamarIgreja({ slug }) {
  const [carregando, setCarregando] = useState(true)
  const [estado, setEstado] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function verificar() {
      const { data, error } = await supabase.rpc('verificar_reclamacao', { p_slug: slug })
      if (!error && data && data.ok) {
        setEstado(data)
      }
      setCarregando(false)
    }
    verificar()
  }, [slug])

  async function reclamar() {
    setEnviando(true)
    setMsg('')
    setErro('')
    const { data, error } = await supabase.rpc('reclamar_igreja', { p_igreja_id: estado.igreja_id })
    setEnviando(false)
    if (error || !data || !data.ok) {
      setErro(data?.mensagem || 'Não foi possível enviar a solicitação.')
      return
    }
    setMsg(data.mensagem)
    if (data.automatico) {
      setEstado({ ...estado, eh_admin_desta: true })
    } else {
      setEstado({ ...estado, ja_reclamou: true })
    }
  }

  if (carregando) return null
  if (!estado || !estado.ok) return null

  if (msg) {
    return (
      <div style={{ background: '#EAF4EE', border: '1px solid #C9E3D4', borderRadius: 10, padding: '12px 14px', marginBottom: '1rem' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#4C8C6E', lineHeight: 1.6 }}>{msg}</p>
      </div>
    )
  }

  if (!estado.logado) {
    return (
      <div style={{ background: '#E8F0FA', border: '1px solid #C9D9EC', borderRadius: 10, padding: '12px 14px', marginBottom: '1rem' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#1F3A5F', lineHeight: 1.6 }}>
          Você é Pastor ou Líder desta Igreja?{' '}
          <a href="/cadastro" style={{ color: '#1F3A5F', fontWeight: 700 }}>
            Adquira o Berit para gerenciar os dados
          </a>
        </p>
      </div>
    )
  }

  if (estado.eh_admin_desta || estado.ja_tem_igreja) return null

  if (estado.igreja_tem_admin) {
    return (
      <div style={{ background: '#FDF3E3', border: '1px solid #F0D9A8', borderRadius: 10, padding: '12px 14px', marginBottom: '1rem' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#7A5A1E', lineHeight: 1.6 }}>
          Esta igreja já é administrada por outra pessoa. Para assumir a gestão, contate a{' '}
          <a href="mailto:beritinovacoes@gmail.com?subject=Assumir%20gestão%20de%20igreja" style={{ color: '#7A5A1E', fontWeight: 700 }}>
            Equipe Berit
          </a>.
        </p>
      </div>
    )
  }

  if (estado.ja_reclamou) {
    return (
      <div style={{ background: '#EAF4EE', border: '1px solid #C9E3D4', borderRadius: 10, padding: '12px 14px', marginBottom: '1rem' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#4C8C6E', lineHeight: 1.6 }}>
          Solicitação enviada. Aguardando aprovação do administrador do Berit.
        </p>
      </div>
    )
  }

  return (
    <div style={{ background: '#E8F0FA', border: '1px solid #C9D9EC', borderRadius: 10, padding: '12px 14px', marginBottom: '1rem' }}>
      <p style={{ margin: 0, fontSize: 13, color: '#1F3A5F', lineHeight: 1.6 }}>
        Esta é a sua igreja? Reclame o cadastro para gerenciar as informações e completar os dados.
      </p>
      {erro && <p style={{ margin: '8px 0 0', fontSize: 13, color: '#B71C1C' }}>{erro}</p>}
      <button
        type="button"
        onClick={reclamar}
        disabled={enviando}
        style={{ marginTop: 10, background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: enviando ? 0.6 : 1 }}
      >
        {enviando ? 'Enviando...' : 'Esta é a minha igreja'}
      </button>
    </div>
  )
}
