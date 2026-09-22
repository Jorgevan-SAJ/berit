'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import ReclamarDuranteCadastro from '../../cadastro/ReclamarDuranteCadastro'

const NOMES_PLANOS = {
  trial: 'Trial (30 dias)',
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
const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

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
    bairro: '',
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
  const [igrejaOrigemIndicacao, setIgrejaOrigemIndicacao] = useState(false)
  const [igrejaAguardaConfirmacao, setIgrejaAguardaConfirmacao] = useState(false)
  const [confirmandoIndicacao, setConfirmandoIndicacao] = useState(false)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [alterandoSenha, setAlterandoSenha] = useState(false)
  const [msgSenha, setMsgSenha] = useState('')
  const [erroSenha, setErroSenha] = useState('')

  useEffect(() => {
    carregar()
  }, [])

  function pendenciaPublicacao() {
  const faltando = []
  if (!form.nome.trim()) faltando.push('Nome da igreja')
  if (!form.cidade.trim()) faltando.push('Cidade')
  if (!form.uf.trim()) faltando.push('UF')
  if (!form.endereco_publico.trim()) faltando.push('Endereço')
  if (!form.bairro.trim()) faltando.push('Bairro')
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
          bairro: igreja.bairro || '',
          lead_publico: igreja.lead_publico || '',
          publico_visivel: !!igreja.publico_visivel,
          publico_verificado: !!igreja.publico_verificado,
          publico_confirmado_em: igreja.publico_confirmado_em || null,
          slug: igreja.slug || '',
        })
        setHorariosCultos(Array.isArray(igreja.horarios_cultos) ? igreja.horarios_cultos : [])
        setRedes(Array.isArray(igreja.redes_sociais_lista) ? igreja.redes_sociais_lista : [])
        setPlano(igreja)
        setIgrejaOrigemIndicacao(igreja.origem === 'indicacao')
        setIgrejaAguardaConfirmacao(!!igreja.aguarda_confirmacao)
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

  async function confirmarIndicacao() {
    setConfirmandoIndicacao(true)
    setMsgPublico('')
    setErroPublico('')
    const { error } = await supabase
      .from('igrejas')
      .update({ aguarda_confirmacao: false })
      .eq('id', perfil.igreja_id)
    setConfirmandoIndicacao(false)
    if (error) {
      setErroPublico('Nao foi possivel confirmar o cadastro: ' + error.message)
      return
    }
    setIgrejaAguardaConfirmacao(false)
    setMsgPublico('Cadastro confirmado. Esta igreja agora aparece como confirmada no diretorio. Preencha os dados publicos e ative o selo quando quiser.')
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
      bairro: form.bairro,
      lead_publico: form.lead_publico,
      publico_visivel: form.publico_visivel,
      horarios_cultos: horariosCultos,
    }
    const { data: atualizada, error } = await supabase
      .from('igrejas')
      .update(dadosParaSalvar)
      .eq('id', perfilAtual.igreja_id)
      .select('id, nome, cnpj, contato, whatsapp_oracoes, whatsapp_orientacoes, redes_sociais_lista, publico_visivel, slug')
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
    if (atualizada.slug && !form.slug) {
      setForm((f) => ({ ...f, slug: atualizada.slug }))
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
            <label className={rotuloClasse}>Contato (opcional)</label>
            <input
              type="text"
              value={form.contato}
              onChange={(e) => setForm({ ...form, contato: e.target.value })}
              className={inputClasse}
              placeholder="Telefone ou e-mail, ex.: (11) 99999-9999"
            />
            <p className="text-xs text-gray-500 mt-1">
              Não é obrigatório, mas recomendado: é o que aparece na página pública para os visitantes entrarem em contato.
            </p>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Grupos de WhatsApp</p>
            <div className="space-y-3">
              <div>
                <label className={rotuloClasse}>Pedidos de oração</label>
                <input
                  type="text"
                  value={form.whatsapp_oracoes}
                  onChange={(e) => setForm({ ...form, whatsapp_oracoes: e.target.value })}
                  className={inputClasse}
                  placeholder="https://chat.whatsapp.com/..."
                />
              </div>
              <div>
                <label className={rotuloClasse}>Perguntas e orientações</label>
                <input
                  type="text"
                  value={form.whatsapp_orientacoes}
                  onChange={(e) => setForm({ ...form, whatsapp_orientacoes: e.target.value })}
                  className={inputClasse}
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
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 mb-3">
            Para publicar a igreja no diretório é obrigatório: <strong>Nome da igreja</strong>,{' '}
            <strong>Cidade</strong>, <strong>UF</strong>, <strong>Endereço</strong> e <strong>Bairro</strong>.
            Os demais campos são opcionais.
            </p>
          {msgPublico && <p className="text-green-600 mb-3 text-sm">{msgPublico}</p>}
            {erroPublico && <p className="text-red-600 mb-3 text-sm">{erroPublico}</p>}
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.publico_visivel}
                onChange={(e) => setForm({ ...form, publico_visivel: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">
                Incluir esta igreja no diretório público
              </span>
            </label>
            {igrejaOrigemIndicacao && igrejaAguardaConfirmacao && (
              <div style={{ background: '#FDF3E3', border: '1px solid #F0D9A8', borderRadius: 8, padding: '12px', marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: '#7A5A1E', margin: '0 0 8px', lineHeight: 1.5 }}>
                  Esta igreja foi cadastrada no diretorio pela comunidade e esta marcada como aguardando confirmacao.
                  Se voce e responsavel por ela, confirme o cadastro.
                </p>
                <button
                  type="button"
                  onClick={confirmarIndicacao}
                  disabled={confirmandoIndicacao}
                  style={{ background: '#D9A441', color: '#1F3A5F', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  {confirmandoIndicacao ? 'Confirmando...' : 'Confirmar esta igreja como responsavel'}
                </button>
              </div>
            )}
            {pend.length > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                Para publicar, preencha: {pend.join(', ')}.
              </p>
            )}
            <div className="space-y-3">
              <div>
                <label className={rotuloClasse}>Sobre a igreja</label>
                <textarea
                  value={form.sobre}
                  onChange={(e) => setForm({ ...form, sobre: e.target.value })}
                  className={inputClasse}
                  rows={3}
                  placeholder="Apresentação curta exibida no diretório e na página pública"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className={rotuloClasse}>Cidade *</label>
                  <input
                    type="text"
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    className={inputClasse}
                    placeholder="Cidade sede"
                  />
                </div>
                <div>
                  <label className={rotuloClasse}>UF *</label>
                  <select
                    value={form.uf}
                    onChange={(e) => setForm({ ...form, uf: e.target.value })}
                    className={inputClasse}
                  >
                    <option value="">—</option>
                    {UFS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
           <label className={rotuloClasse}>Endereço público *</label>
           <input
           type="text"
           required
           value={form.endereco_publico}
           onChange={(e) => setForm({ ...form, endereco_publico: e.target.value })}
           className={inputClasse}
           placeholder="Rua, número, bairro"
         />
        </div>
        <div>
           <label className={rotuloClasse}>Bairro *</label>
           <input
           type="text"
           required
           value={form.bairro}
           onChange={(e) => setForm({ ...form, bairro: e.target.value })}
           className={inputClasse}
           placeholder="Nome do bairro"
         />
         </div>
          {ehAdmin && (!perfil?.igreja_id || !form.endereco_publico.trim()) && (
           <ReclamarDuranteCadastro
            nome={form.nome}
            cidade={form.cidade}
            uf={form.uf}
            endereco={form.endereco_publico}
            modoAdocao={!!perfil?.igreja_id}
            onVinculada={(ig) => {
            setMsg('Igreja vinculada ao seu usuário. Agora você pode gerenciar os dados.')
            carregar()
          }}
         />
        )}
              <div>
                <label className={rotuloClasse}>Mensagem de acolhimento</label>
                <input
                  type="text"
                  value={form.lead_publico}
                  onChange={(e) => setForm({ ...form, lead_publico: e.target.value })}
                  className={inputClasse}
                  placeholder="Opcional, ex.: Sejam bem-vindos!"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Horários de cultos</p>
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <select
                    value={novoCulto.dia}
                    onChange={(e) => setNovoCulto({ ...novoCulto, dia: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 sm:w-36"
                  >
                    {DIAS_SEMANA.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={novoCulto.horario}
                    onChange={(e) => setNovoCulto({ ...novoCulto, horario: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  />
                  <input
                    type="text"
                    value={novoCulto.nome}
                    onChange={(e) => setNovoCulto({ ...novoCulto, nome: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Nome do culto (opcional)"
                  />
                  <button
                    type="button"
                    onClick={adicionarCulto}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium"
                  >
                    Adicionar
                  </button>
                </div>
                {horariosCultos.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum horário cadastrado.</p>
                ) : (
                  <ul className="space-y-2">
                    {horariosCultos.map((c, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      >
                        <span>
                          <strong>{c.dia}</strong> às {c.horario}
                          {c.nome ? ` · ${c.nome}` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => removerCulto(i)}
                          className="text-red-600 text-sm"
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {form.slug && (
              <div className="bg-gray-50 border rounded-lg p-3 mt-4 text-sm">
                <p className="text-xs text-gray-500 mb-1">Link público da igreja:</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/igreja/${form.slug}`}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={copiarLinkPublico}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-xs"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={confirmarPublico}
                disabled={confirmandoPublico || pend.length > 0 || !form.publico_visivel}
                className="border border-green-600 text-green-700 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40"
              >
                {confirmandoPublico
                  ? 'Confirmando...'
                  : form.publico_verificado
                    ? 'Dados públicos confirmados'
                    : 'Confirmar dados públicos'}
              </button>
              {form.publico_verificado && (
                <span className="text-xs text-green-700">✓ Selo de verificado ativo no portal.</span>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={salvando}
            className="w-full font-semibold rounded-lg py-2.5 disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      ) : (
        <div className="bg-gray-50 border rounded-lg p-4 mb-6 text-sm text-gray-600">
          Apenas o Administrador pode editar os dados da igreja. Nesta área, você pode alterar a sua senha de acesso.
        </div>
      )}
      <div className="border-t pt-4 mt-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">Alteração de Senha</p>
        {msgSenha && <p className="text-green-600 mb-4">{msgSenha}</p>}
        {erroSenha && <p className="text-red-600 mb-4">{erroSenha}</p>}
        <form onSubmit={alterarSenha} className="space-y-3">
          <div>
            <label className={rotuloClasse}>Nova senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className={inputClasse}
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label className={rotuloClasse}>Confirmar nova senha</label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className={inputClasse}
              autoComplete="new-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={alterandoSenha}
            className="w-full font-semibold rounded-lg py-2.5 disabled:opacity-50"
          >
            {alterandoSenha ? 'Alterando...' : 'Alterar senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
