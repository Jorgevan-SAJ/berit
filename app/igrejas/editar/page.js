'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const NOMES_PLANOS = {
  trial: 'Trial (60 dias)',
  basico: 'Plano Básico',
  plano2: 'Plano 2',
  plano3: 'Plano 3',
}

const OPCOES_REDE = [
  'Instagram',
  'Facebook',
  'YouTube',
  'TikTok',
  'X (Twitter)',
  'Outra',
]

// Cores fixas de cada rede (mesmo padrão de pills usado nos eventos)
const CORES_REDE = {
  Instagram: { cor: '#7B4FA6', bg: '#F3EAFB' },
  Facebook: { cor: '#1F3A5F', bg: '#E8F0FA' },
  YouTube: { cor: '#B71C1C', bg: '#FDECEC' },
  TikTok: { cor: '#2E2E2E', bg: '#F0EAE0' },
  'X (Twitter)': { cor: '#5A5A5A', bg: '#F0EAE0' },
  Outra: { cor: '#4C8C6E', bg: '#EAF4EE' },
}

function estiloRede(nome) {
  return CORES_REDE[nome] || CORES_REDE.Outra
}

export default function ConfiguracoesIgreja() {
  const router = useRouter()

  const [form, setForm] = useState({
    nome: '',
    cnpj: '',
    contato: '',
    whatsapp_oracoes: '',
    whatsapp_orientacoes: '',
  })
  const [redes, setRedes] = useState([])
  const [redeNome, setRedeNome] = useState('Instagram')
  const [redeUrl, setRedeUrl] = useState('')
  const [plano, setPlano] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setCarregando(false)
      router.push('/login')
      return
    }

    const { data: perfil } = await supabase
      .from('perfis')
      .select('igreja_id, perfil')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!perfil) {
      setCarregando(false)
      return
    }

    if (perfil.perfil !== 'admin_master') {
      setErro('Apenas o Administrador pode editar os dados da igreja.')
      setCarregando(false)
      return
    }

    const { data: igreja } = await supabase
      .from('igrejas')
      .select('*')
      .eq('id', perfil.igreja_id)
      .maybeSingle()

    if (igreja) {
      setForm({
        nome: igreja.nome || '',
        cnpj: igreja.cnpj || '',
        contato: igreja.contato || '',
        whatsapp_oracoes: igreja.whatsapp_oracoes || '',
        whatsapp_orientacoes: igreja.whatsapp_orientacoes || '',
      })
      setRedes(Array.isArray(igreja.redes_sociais_lista) ? igreja.redes_sociais_lista : [])
      setPlano(igreja)
    }

    setCarregando(false)
  }

  function adicionarRede() {
    const url = redeUrl.trim()
    if (!url) {
      setErro('Informe o link da rede social antes de adicionar.')
      return
    }
    setErro('')
    setRedes([...redes, { nome: redeNome, url }])
    setRedeUrl('')
  }

  function removerRede(indice) {
    setRedes(redes.filter((_, i) => i !== indice))
  }

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    setMsg('')
    setErro('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSalvando(false)
      setErro('Sessão expirada. Faça login novamente.')
      return
    }

    const { data: perfil, error: erroPerfil } = await supabase
      .from('perfis')
      .select('igreja_id, perfil')
      .eq('user_id', user.id)
      .maybeSingle()

    if (erroPerfil || !perfil) {
      setSalvando(false)
      setErro('Não foi possível identificar sua igreja.')
      return
    }

    if (perfil.perfil !== 'admin_master') {
      setSalvando(false)
      setErro('Apenas o Administrador pode editar os dados da igreja.')
      return
    }

    const dadosParaSalvar = {
      ...form,
      redes_sociais_lista: redes,
    }

    const { data: atualizada, error } = await supabase
      .from('igrejas')
      .update(dadosParaSalvar)
      .eq('id', perfil.igreja_id)
      .select('id, nome, cnpj, contato, whatsapp_oracoes, whatsapp_orientacoes, redes_sociais_lista')
      .maybeSingle()

    setSalvando(false)

    if (error) {
      setErro('Erro ao salvar: ' + error.message)
      return
    }

    if (!atualizada) {
      setErro('O banco recusou a alteração (permissão de gravação). Nenhum dado foi salvo.')
      return
    }

    setMsg('Dados da igreja atualizados com sucesso.')
    setTimeout(() => router.push('/area'), 1200)
  }

  if (carregando) return <div className="p-8">Carregando...</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button
        type="button"
        onClick={() => router.push('/area')}
        className="mb-4 text-sm underline"
      >
        ← Voltar
      </button>

      <h1 className="text-2xl font-bold mb-6">Configurações da Igreja</h1>

      {plano && (
        <div className="bg-gray-50 border rounded-lg p-4 mb-6 text-sm">
          <p>
            <strong>Plano atual:</strong>{' '}
            {plano.vitalicio
              ? 'Vitalício (acesso total)'
              : NOMES_PLANOS[plano.plano] || plano.plano}
          </p>
          {!plano.vitalicio && plano.trial_termina_em && (
            <p>
              <strong>Trial termina em:</strong>{' '}
              {new Date(plano.trial_termina_em).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      )}

      {msg && <p className="text-green-600 mb-4">{msg}</p>}
      {erro && <p className="text-red-600 mb-4">{erro}</p>}

      <form onSubmit={salvar} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome da igreja</label>
          <input
            type="text"
            required
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
          <input
            type="text"
            value={form.cnpj}
            onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Opcional"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contato</label>
          <input
            type="text"
            value={form.contato}
            onChange={(e) => setForm({ ...form, contato: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Telefone ou e-mail de contato"
          />
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Grupos de WhatsApp</p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pedidos de oração
              </label>
              <input
                type="text"
                value={form.whatsapp_oracoes}
                onChange={(e) => setForm({ ...form, whatsapp_oracoes: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="https://chat.whatsapp.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Perguntas e orientações
              </label>
              <input
                type="text"
                value={form.whatsapp_orientacoes}
                onChange={(e) => setForm({ ...form, whatsapp_orientacoes: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="https://chat.whatsapp.com/..."
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Redes sociais</p>

          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <select
              value={redeNome}
              onChange={(e) => setRedeNome(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 sm:w-40"
            >
              {OPCOES_REDE.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={redeUrl}
              onChange={(e) => setRedeUrl(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Cole aqui o link da rede social"
            />

            <button
              type="button"
              onClick={adicionarRede}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium"
            >
              Adicionar
            </button>
          </div>

          {redes.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma rede social cadastrada.</p>
          ) : (
            <ul className="space-y-2">
              {redes.map((rede, indice) => {
                const estilo = estiloRede(rede.nome)
                return (
                  <li
                    key={indice}
                    className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <span
                        style={{
                          display: 'inline-block',
                          background: estilo.bg,
                          color: estilo.cor,
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          marginBottom: 4,
                        }}
                      >
                        {rede.nome}
                      </span>
                      <div className="text-gray-500 truncate">{rede.url}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removerRede(indice)}
                      className="text-red-600 text-sm whitespace-nowrap"
                    >
                      Remover
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={salvando}
          className="w-full font-semibold rounded-lg py-2.5 disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>
    </div>
  )
}
