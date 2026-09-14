'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

const NOMES_PLANOS = {
  trial: 'Trial (60 dias)',
  basico: 'Plano Básico',
  plano2: 'Plano 2',
  plano3: 'Plano 3',
}

export default function ConfiguracoesIgreja() {
  const [form, setForm] = useState({ nome: '', cnpj: '', contato: '', whatsapp_grupos: '', redes_sociais: '' })
  const [plano, setPlano] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setCarregando(false); return }
    const { data: perfil } = await supabase.from('perfis').select('igreja_id, perfil').eq('user_id', user.id).single()
    if (!perfil) { setCarregando(false); return }
    if (perfil.perfil !== 'admin_master') {
      setErro('Apenas o Administrador pode editar os dados da igreja.')
      setCarregando(false)
      return
    }
    const { data: igreja } = await supabase.from('igrejas').select('*').eq('id', perfil.igreja_id).single()
    if (igreja) {
      setForm({
        nome: igreja.nome || '',
        cnpj: igreja.cnpj || '',
        contato: igreja.contato || '',
        whatsapp_grupos: igreja.whatsapp_grupos || '',
        redes_sociais: igreja.redes_sociais || '',
      })
      setPlano(igreja)
    }
    setCarregando(false)
  }

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true); setMsg(''); setErro('')
    const { data: { user } } = await supabase.auth.getUser()
    const { data: perfil } = await supabase.from('perfis').select('igreja_id').eq('user_id', user.id).single()
    const { error } = await supabase.from('igrejas').update(form).eq('id', perfil.igreja_id)
    setSalvando(false)
    if (error) setErro(error.message)
    else setMsg('Dados da igreja atualizados com sucesso.')
  }

  if (carregando) return <div className="p-8">Carregando...</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Configurações da Igreja</h1>

      {plano && (
        <div className="bg-gray-50 border rounded-lg p-4 mb-6 text-sm">
          <p><strong>Plano atual:</strong> {plano.vitalicio ? 'Vitalício (acesso total)' : NOMES_PLANOS[plano.plano] || plano.plano}</p>
          {!plano.vitalicio && plano.trial_termina_em && (
            <p><strong>Trial termina em:</strong> {new Date(plano.trial_termina_em).toLocaleDateString('pt-BR')}</p>
          )}
        </div>
      )}

      {msg && <p className="text-green-600 mb-4">{msg}</p>}
      {erro && <p className="text-red-600 mb-4">{erro}</p>}

      <form onSubmit={salvar} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome da igreja</label>
          <input type="text" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
          <input type="text" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Opcional" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contato</label>
          <input type="text" value={form.contato} onChange={(e) => setForm({ ...form, contato: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Telefone ou e-mail de contato" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp de grupos</label>
          <input type="text" value={form.whatsapp_grupos} onChange={(e) => setForm({ ...form, whatsapp_grupos: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Link ou número" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Redes sociais</label>
          <input type="text" value={form.redes_sociais} onChange={(e) => setForm({ ...form, redes_sociais: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Instagram, Facebook, YouTube..." />
        </div>
        <button type="submit" disabled={salvando} className="w-full font-semibold rounded-lg py-2.5 disabled:opacity-50">
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    </div>
  )
}
