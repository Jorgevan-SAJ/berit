'use client'
import { useEffect, useRef, useState } from 'react'
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
  const inputFotoRef = useRef(null)
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
    chave_pix: '',
    publico_visivel: false,
    publico_verificado: false,
    publico_confirmado_em: null,
    slug: '',
  })
  const [fotoUrl, setFotoUrl] = useState('')
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const [msgFoto, setMsgFoto] = useState('')
  const [erroFoto, setErroFoto] = useState('')
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
  // Exclusão do cadastro da igreja (LGPD — art. 18, VI)
  const [modalExcluir1, setModalExcluir1] = useState(false)
  const [modalExcluir2, setModalExcluir2] = useState(false)
  const [senhaExclusao, setSenhaExclusao] = useState('')
  const [excluindo, setExcluindo] = useState(false)
  const [erroExclusao, setErroExclusao] = useState('')
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
          chave_pix: igreja.chave_pix || '',
          publico_visivel: !!igreja.publico_visivel,
          publico_verificado: !!igreja.publico_verificado,
          publico_confirmado_em: igreja.publico_confirmado_em || null,
          slug: igreja.slug || '',
        })
        setFotoUrl(igreja.foto_url || '')
        setHorariosCultos(Array.isArray(igreja.horarios_cultos) ? igreja.horarios_cultos : [])
        setRedes(Array.isArray(igreja.redes_sociais_lista) ? igreja.redes_sociais_lista : [])
        setPlano(igreja)
        setIgrejaOrigemIndicacao(igreja.origem === 'indicacao')
        setIgrejaAguardaConfirmacao(!!igreja.aguarda_confirmacao)
      }
    }
    setCarregando(false)
  }
  // Upload da foto da igreja para o bucket fotos-igrejas (Supabase Storage)
  async function selecionarFoto(e) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo || !perfil?.igreja_id) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type)) {
      setErroFoto('Formato não aceito. Use JPG, PNG ou WEBP.')
      return
    }
    if (arquivo.size > 5 * 1024 * 1024) {
      setErroFoto('Arquivo muito grande. O limite é 5 MB.')
      return
    }
    setEnviandoFoto(true)
    setErroFoto('')
    setMsgFoto('')
    const ext = arquivo.name.split('.').pop().toLowerCase()
    const caminho = `igreja-${perfil.igreja_id}/foto-${Date.now()}.${ext}`
    const { error: erroUpload } = await supabase.storage
      .from('fotos-igrejas')
      .upload(caminho, arquivo, { upsert: true })
    if (erroUpload) {
      setEnviandoFoto(false)
      setErroFoto('Erro no envio da foto: ' + erroUpload.message)
      return
    }
    const { data: dadosUrl } = supabase.storage.from('fotos-igrejas').getPublicUrl(caminho)
    const url = dadosUrl?.publicUrl || ''
    const { error: erroSalvar } = await supabase
      .from('igrejas')
      .update({ foto_url: url })
      .eq('id', perfil.igreja_id)
    setEnviandoFoto(false)
    if (erroSalvar) {
      setErroFoto('A foto foi enviada, mas não foi possível vinculá-la à igreja: ' + erroSalvar.message)
      return
    }
    setFotoUrl(url)
    setMsgFoto('Foto atualizada. Ela aparece na página pública da igreja.')
  }
  async function removerFoto() {
    if (!fotoUrl || !perfil?.igreja_id) return
    setEnviandoFoto(true)
    setErroFoto('')
    setMsgFoto('')
    const m = fotoUrl.match(/fotos-igrejas\/(.+)$/)
    if (m) {
      await supabase.storage.from('fotos-igrejas').remove([m[1]])
    }
    const { error } = await supabase
      .from('igrejas')
      .update({ foto_url: null })
      .eq('id', perfil.igreja_id)
    setEnviandoFoto(false)
    if (error) {
      setErroFoto('Não foi possível remover a foto: ' + error.message)
      return
    }
    setFotoUrl('')
    setMsgFoto('Foto removida.')
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
  // Verifica no Google Maps com a mesma fórmula da página pública:
  // nome da igreja + endereço + cidade + UF (busca de maior precisão)
  function verificarNoMaps() {
    const query = [form.nome, form.endereco_publico, form.cidade, form.uf].filter(Boolean).join(', ')
    if (!query) return
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer')
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
      chave_pix: form.chave_pix,
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
  // Exclusão do cadastro da igreja — LGPD (art. 18, VI)
  async function confirmarExclusao(e) {
    e.preventDefault()
    setErroExclusao('')
    if (!senhaExclusao) {
      setErroExclusao('Informe sua senha de acesso para confirmar.')
      return
    }
    setExcluindo(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setExcluindo(false)
      setErroExclusao('Sessão expirada. Faça login novamente.')
      return
    }
    // Valida a senha de acesso antes de qualquer exclusão
    const { error: erroSenha } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: senhaExclusao,
    })
    if (erroSenha) {
      setExcluindo(false)
      setErroExclusao('Senha incorreta. A exclusão não foi realizada.')
      return
    }
    // Executa a exclusão no banco (transação única)
    const { data, error } = await supabase.rpc('excluir_cadastro_igreja', {
      p_igreja_id: perfil.igreja_id,
    })
    setExcluindo(false)
    if (error || !data?.ok) {
      setErroExclusao('Não foi possível excluir o cadastro: ' + (error?.message || data?.erro || 'erro desconhecido'))
      return
    }
    // Encerra a sessão e volta ao início
    await supabase.auth.signOut()
    window.location.href = '/'
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
                  placeholder="Número no formato 55 + DDD + número (ex.: 5575988038122) ou link de grupo"
                />
              </div>
              <div>
                <label className={rotuloClasse}>Perguntas e orientações</label>
                <input
                  type="text"
                  value={form.whatsapp_orientacoes}
                  onChange={(e) => setForm({ ...form, whatsapp_orientacoes: e.target.value })}
                  className={inputClasse}
                  placeholder="Número no formato 55 + DDD + número (ex.: 5575988038122) ou link de grupo"
                />
              </div>
              <p className="text-xs text-gray-500">
                Recomendado: cadastre o número de um responsável pelo canal (formato 55 + DDD + número, 13 dígitos para celular). O pedido do visitante chega pronto por mensagem. Links de grupo (chat.whatsapp.com) também são aceitos, mas exigem que o visitante cole a mensagem manualmente.
              </p>
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
              <div>
                <label className={rotuloClasse}>Foto da igreja (opcional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {fotoUrl ? (
                    <img
                      src={fotoUrl}
                      alt="Foto da igreja"
                      style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E4DED2' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 72, height: 72, borderRadius: '50%', background: '#F5F0E6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, color: '#B26A00', fontWeight: 700,
                      }}
                    >
                      {(form.nome || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => inputFotoRef.current?.click()}
                      disabled={enviandoFoto}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40"
                    >
                      {enviandoFoto ? 'Enviando...' : fotoUrl ? 'Trocar foto' : 'Enviar foto'}
                    </button>
                    {fotoUrl && (
                      <button
                        type="button"
                        onClick={removerFoto}
                        disabled={enviandoFoto}
                        className="text-red-600 text-sm"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={inputFotoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={selecionarFoto}
                />
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG ou WEBP até 5 MB. A foto aparece em formato circular no topo da página pública. O envio é imediato — não é preciso clicar em "Salvar alterações".
                </p>
                {msgFoto && <p className="text-green-600 text-xs mt-1">{msgFoto}</p>}
                {erroFoto && <p className="text-red-600 text-xs mt-1">{erroFoto}</p>}
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={form.endereco_publico}
                    onChange={(e) => setForm({ ...form, endereco_publico: e.target.value })}
                    className={inputClasse}
                    placeholder="Rua, número, bairro"
                  />
                  <button
                    type="button"
                    onClick={verificarNoMaps}
                    disabled={!form.endereco_publico.trim()}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap disabled:opacity-40"
                  >
                    Verificar no Maps
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Abre o Google Maps com a busca "Nome da igreja + endereço + cidade + UF" — a mesma fórmula usada na página pública. Confirme o resultado antes de publicar.
                </p>
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
                <label className={rotuloClasse}>Chave Pix (opcional)</label>
                <input
                  type="text"
                  value={form.chave_pix}
                  onChange={(e) => setForm({ ...form, chave_pix: e.target.value })}
                  className={inputClasse}
                  placeholder="CPF/CNPJ, celular, e-mail ou chave aleatória"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se preenchida, a página pública exibirá o botão "Dizimar/Ofertar", que copia a chave para o visitante colar no aplicativo do banco.
                </p>
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
      {ehAdmin && (
        <div className="border-t pt-4 mt-6">
          <button
            type="button"
            onClick={() => { setModalExcluir1(true); setErroExclusao('') }}
            className="w-full border border-red-300 text-red-700 rounded-lg py-2.5 text-sm font-semibold hover:bg-red-50"
          >
            Excluir Cadastro da Igreja
          </button>
        </div>
      )}
      {modalExcluir1 && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Excluir cadastro da igreja</h2>
            <p className="text-sm text-gray-600 mb-6">
              ⚠️ Atenção: se você confirmar, todos os dados serão excluídos permanentemente. Deseja continuar?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setModalExcluir1(false); setSenhaExclusao(''); setErroExclusao('') }}
                className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => { setModalExcluir1(false); setModalExcluir2(true) }}
                className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-semibold"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
      {modalExcluir2 && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-lg font-bold text-red-700 mb-3">Confirmação final</h2>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Os dados da igreja serão excluídos permanentemente e deixará de aparecer no Diretório Público.
              Caso volte a utilizar o BERIT será necessário informar todos os dados novamente e nenhuma informação
              atual poderá ser resgatada. Confirme sua decisão com a senha de acesso.
            </p>
            {erroExclusao && <p className="text-red-600 text-sm mb-3">{erroExclusao}</p>}
            <form onSubmit={confirmarExclusao} className="space-y-4">
              <div>
                <label className={rotuloClasse}>Senha de acesso</label>
                <input
                  type="password"
                  value={senhaExclusao}
                  onChange={(e) => setSenhaExclusao(e.target.value)}
                  className={inputClasse}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setModalExcluir2(false); setSenhaExclusao(''); setErroExclusao('') }}
                  className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={excluindo}
                  className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  {excluindo ? 'Excluindo...' : 'Excluir permanentemente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
