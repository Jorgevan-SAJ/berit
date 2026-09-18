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

const CORES_REDE = {
  Instagram: { cor: '#7B4FA6', bg: '#F3EAFB' },
  Facebook: { cor: '#1F3A5F', bg: '#E8F0FA' },
  YouTube: { cor: '#B71C1C', bg: '#FDECEC' },
  TikTok: { cor: '#2E2E2E', bg: '#F0EAE0' },
  'X (Twitter)': { cor: '#5A5A5A', bg: '#F0EAE0' },
  Outra: { cor: '#4C8C6E', bg: '#EAF4EE' },
}

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

function estiloRede(nome) {
  return CORES_REDE[nome] || CORES_REDE.Outra
}

export default function ConfiguracoesIgreja() {
  const router = useRouter()
  const [perfil, setPerfil] = useState(null)
  const [ehAdmin, setEhAdmin] = useState(false)
  const [carregando, setCarregando] = useState(true)

  const [form, setForm] = useState({
    nome: '',
    cnpj: '',
    contato: '',
    whatsapp_oracoes: '',
    whatsapp_orientacoes: '',
    sobre: '',
    cidade: '',
    uf: '',
    endereco_publico: '',
    lead_publico: '',
    publico_visivel: false,
    publico_verificado: false,
    publico_confirmado_em: null,
    slug: '',
  })
  const [horariosCultos, setHorariosCultos] = useState([])
  const [novoCulto, setNovoCulto] = useState({ dia: 'Domingo', horario: '', nome: '' })
  const [redes, setRedes] = useState([])
  const [redeNome, setRedeNome] = useState('Instagram')
  const [redeUrl, setRedeUrl] = useState('')
  const [plano, setPlano] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')
  const [msgPublico, setMsgPublico] = useState('')
  const [erroPublico, setErroPublico] = useState('')
  const [confirmandoPublico, setConfirmandoPublico] = useState(false)

  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [alterandoSenha, setAlterandoSenha] = useState(false)
  const [msgSenha, setMsgSenha] = useState('')
  const [erroSenha, setErroSenha] = useState('')

  useEffect(() => {
    carregar()
  }, [])

  // P9/Fase 3 — Bloco B: lista do que falta para publicar
  function pendenciaPublicacao() {
    const faltando = []
    if (!form.nome.trim()) faltando.push('Nome da igreja')
    if (!form.cidade.trim()) faltando.push('Cidade')
    if (!form.uf.trim()) faltando.push('UF')
    if (!form.contato.trim()) faltando.push('Contato')
    const temCanal =
      form.whatsapp_oracoes.trim() ||
      form.whatsapp_orientacoes.trim() ||
      redes.length > 0
    if (!temCanal) faltando.push('ao menos um canal (WhatsApp ou rede social)')
    return faltando
  }

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setCarregando(false)
      router.push('/login')
      return
    }
    const { data: p } = await supabase
      .from('perfis')
      .select('igreja_id, perfil')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!p) {
      setCarregando(false)
      return
    }
    setPerfil(p)
    const admin = p.perfil === 'admin_master'
    setEhAdmin(admin)
    if (admin) {
      const { data: igreja } = await supabase
        .from('igrejas')
        .select('*')
        .eq('id', p.igreja_id)
        .maybeSingle()
      if (igreja) {
        setForm({
          nome: igreja.nome || '',
          cnpj: igreja.cnpj || '',
          contato: igreja.contato || '',
          whatsapp_oracoes: igreja.whatsapp_oracoes || '',
          whatsapp_orientacoes: igreja.whatsapp_orientacoes || '',
          sobre: igreja.sobre || '',
          cidade: igreja.cidade || '',
          uf: igreja.uf || '',
          endereco_publico: igreja.endereco_publico || '',
          lead_publico: igreja.lead_publico || '',
          publico_visivel: !!igreja.publico_visivel,
          publico_verificado: !!igreja.publico_verificado,
          publico_confirmado_em: igreja.publico_confirmado_em || null,
          slug: igreja.slug || '',
        })
        setHorariosCultos(Array.isArray(igreja.horarios_cultos) ? igreja.horarios_cultos : [])
        setRedes(Array.isArray(igreja.redes_sociais_lista) ? igreja.redes_sociais_lista : [])
        setPlano(igreja)
      }
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

  function adicionarCulto() {
    if (!novoCulto.horario.trim()) {
      setErroPublico('Informe o horário do culto.')
      return
    }
    setErroPublico('')
    setHorariosCultos([
      ...horariosCultos,
      { dia: novoCulto.dia, horario: novoCulto.horario, nome: novoCulto.nome.trim() || '' },
    ])
    setNovoCulto({ dia: 'Domingo', horario: '', nome: '' })
  }

  function removerCulto(indice) {
    setHorariosCultos(horariosCultos.filter((_, i) => i !== indice))
  }

  function copiarLinkPublico() {
    if (!form.slug) return
    const url = `${window.location.origin}/igreja/${form.slug}`
    navigator.clipboard?.writeText(url)
      .then(() => setMsgPublico('Link copiado! Compartilhe com quem quiser.'))
      .catch(() => setMsgPublico('Copie o link manualmente.'))
  }

  async function confirmarPublico() {
    const pend = pendenciaPublicacao()
    if (pend.length > 0) {
      setErroPublico('Para confirmar os dados públicos, preencha: ' + pend.join(', ') + '.')
      return
    }
    setConfirmandoPublico(true)
    setMsgPublico('')
    setErroPublico('')
    const { error } = await supabase
      .from('igrejas')
      .update({
        publico_verificado: true,
        publico_confirmado_em: new Date().toISOString(),
      })
      .eq('id', perfil.igreja_id)
    setConfirmandoPublico(false)
    if (error) {
      setErroPublico('Não foi possível confirmar os dados públicos: ' + error.message)
      return
    }
    setForm({ ...form, publico_verificado: true })
    setMsgPublico('Dados públicos confirmados. O selo de verificado agora aparece no portal.')
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
    const { data: perfilAtual, error: erroPerfil } = await supabase
      .from('perfis')
      .select('igreja_id, perfil')
      .eq('user_id', user.id)
      .maybeSingle()
    if (erroPerfil || !perfilAtual) {
      setSalvando(false)
      setErro('Não foi possível identificar sua igreja.')
      return
    }
    if (perfilAtual.perfil !== 'admin_master') {
      setSalvando(false)
      setErro('Apenas o Administrador pode editar os dados da igreja.')
      return
    }

    // Bloco B: se o opt-in estiver ligado, exige dados mínimos
    if (form.publico_visivel) {
      const pend = pendenciaPublicacao()
      if (pend.length > 0) {
        setSalvando(false)
        setErro('Para publicar no diretório, preencha: ' + pend.join(', ') + '.')
        return
      }
    }

    const dadosParaSalvar = {
      nome: form.nome,
      cnpj: form.cnpj,
      contato: form.contato,
      whatsapp_oracoes: form.whatsapp_oracoes,
      whatsapp_orientacoes: form.whatsapp_orientacoes,
      redes_sociais_lista: redes,
      sobre: form.sobre,
      cidade: form.cidade,
      uf: form.uf,
      endereco_publico: form.endereco_publico,
      lead_publico: form.lead_publico,
      publico_visivel: form.publico_visivel,
      horarios_cultos: horariosCultos,
    }

    const { data: atualizada, error } = await supabase
      .from('igrejas')
      .update(dadosParaSalvar)
      .eq('id', perfilAtual.igreja_id)
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

    const whatsappOk =
      String(atualizada.whatsapp_oracoes || '') === String(form.whatsapp_oracoes || '') &&
      String(atualizada.whatsapp_orientacoes || '') === String(form.whatsapp_orientacoes || '')
    if (!whatsappOk) {
      setErro('Atenção: os grupos de WhatsApp não foram gravados no banco. Confirme que as colunas whatsapp_oracoes e whatsapp_orientacoes existem e tente salvar novamente.')
      return
    }

    setMsg('Dados da igreja atualizados com sucesso.')
    setTimeout(() => router.push('/area'), 1200)
  }

  async function alterarSenha(e) {
    e.preventDefault()
    setMsgSenha('')
    setErroSenha('')
    if (novaSenha.length < 6) {
      setErroSenha('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmarSenha) {
      setErroSenha('As senhas não coincidem.')
      return
    }
    setAlterandoSenha(true)
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    setAlterandoSenha(false)
    if (error) {
      setErroSenha('Erro ao alterar senha: ' + error.message)
      return
    }
    setMsgSenha('Senha alterada com sucesso.')
    setNovaSenha('')
    setConfirmarSenha('')
  }

  if (carregando) return <div className="p-8">Carregando...</div>
  const inputClasse = 'w-full border border-gray-300 rounded-lg px-3 py-2'
  const rotuloClasse = 'block text-sm font-medium text-gray-700 mb-1'
  const pend = pendenciaPublicacao()

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
      {msg && <p className="text-green-600 mb-4">{msg}</p>}
      {erro && <p className="text-red-600 mb-4">{erro}</p>}
      {ehAdmin ? (
        <form onSubmit={salvar} className="space-y-4">
          {plano && (
            <div className="bg-gray-50 border rounded-lg p-4 mb-4 text-sm">
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
          <div>
            <label className={rotuloClasse}>Nome da igreja</label>
            <input
              type="text"
              required
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className={inputClasse}
            />
          </div>
          <div>
            <label className={rotuloClasse}>CNPJ</label>
            <input
              type="text"
              value={form.cnpj}
              onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              className={inputClasse}
              placeholder="Opcional"
            />
          </div>
          <div>
            <label className={rotuloClasse}>Contato</label>
            <input
              type="text"
              value={form.contato}
              onChange={(e) => setForm({ ...form, contato: e.target.value })}
              className={inputClasse}
              placeholder="Telefone ou e-mail de contato"
            />
         
