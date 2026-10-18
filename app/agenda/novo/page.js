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
const DIAS_SEMANA_OPCOES = [
  { v: '0', r: 'Domingo' },
  { v: '1', r: 'Segunda-feira' },
  { v: '2', r: 'Terça-feira' },
  { v: '3', r: 'Quarta-feira' },
  { v: '4', r: 'Quinta-feira' },
  { v: '5', r: 'Sexta-feira' },
  { v: '6', r: 'Sábado' },
]
const ANTECEDENCIAS = [
  { v: '1dia', r: '1 dia antes', ms: 24 * 60 * 60 * 1000, frase: (t) => `É amanhã: ${t}. Venha participar conosco!` },
  { v: '3h', r: '3 horas antes', ms: 3 * 60 * 60 * 1000, frase: (t) => `Começa em 3 horas: ${t}. Venha participar conosco!` },
  { v: '30min', r: '30 minutos antes', ms: 30 * 60 * 1000, frase: (t) => `Já vai começar: ${t}. Venha participar conosco!` },
  { v: 'horario', r: 'No horário do evento', ms: 0, frase: (t) => `É agora: ${t}. Venha participar conosco!` },
]
export default function NovoEvento() {
  const [perfilAtual, setPerfilAtual] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [antecedencias, setAntecedencias] = useState([])
  const [mensagemLembrete, setMensagemLembrete] = useState('')
  // Entrega 3 — Sala de Material: lista de materiais do evento
  const [materiais, setMateriais] = useState([])
  const [form, setForm] = useState({
    titulo: '',
    tipo: 'culto',
    tipo_evento: 'especifico',
    dia_semana: '0',
    data_inicio: new Date().toISOString().slice(0, 10),
    hora_inicio: '19:00',
    data_fim: '',
    hora_fim: '',
    local: '',
    responsavel: '',
    descricao: '',
  })
  useEffect(() => {
    getPerfil().then((p) => {
      setPerfilAtual(p)
      setVerificando(false)
    })
  }, [])
  function alternarAntecedencia(v) {
    setAntecedencias((atual) => (atual.includes(v) ? atual.filter((x) => x !== v) : [...atual, v]))
  }
  // Entrega 3 — funções da Sala de Material
  function adicionarMaterial() {
    setMateriais((atual) => [...atual, { item: '', quantidade: '', observacao: '' }])
  }
  function atualizarMaterial(i, campo, valor) {
    setMateriais((atual) => atual.map((m, idx) => (idx === i ? { ...m, [campo]: valor } : m)))
  }
  function removerMaterial(i) {
    setMateriais((atual) => atual.filter((_, idx) => idx !== i))
  }
  function calcularLembretes() {
    if (!form.notificacaoAutomatica || form.tipo_evento !== 'especifico' || !form.data_inicio || antecedencias.length === 0) return []
    const [h, m] = (form.hora_inicio || '19:00').split(':').map(Number)
    const titulo = form.titulo.trim() || 'nosso evento'
    return antecedencias
      .map((v) => ANTECEDENCIAS.find((a) => a.v === v))
      .filter(Boolean)
      .map((a) => {
        const inicio = new Date(`${form.data_inicio}T00:00:00`)
        inicio.setHours(h || 0, m || 0, 0, 0)
        const horario = new Date(inicio.getTime() - a.ms)
        return { ant: a.v, rotulo: a.r, horario, mensagem: mensagemLembrete.trim() || a.frase(titulo) }
      })
      .sort((x, y) => x.horario - y.horario)
  }
  async function salvar(e) {
    e.preventDefault()
    setErro('')
    if (!form.titulo.trim()) {
      setErro('Informe o título do evento.')
      return
    }
    if (form.tipo_evento === 'permanente' && form.dia_semana === '') {
      setErro('Selecione o dia da semana do evento permanente.')
      return
    }
    if (form.tipo_evento === 'especifico' && !form.data_inicio) {
      setErro('Informe a data do evento.')
      return
    }
    // Entrega 3 — valida a Sala de Material
    const materiaisValidos = materiais.filter((m) => m.item.trim() || m.quantidade.trim() || m.observacao.trim())
    if (materiaisValidos.some((m) => !m.item.trim())) {
      setErro('Há um material sem nome na Sala de Material. Preencha o item ou remova a linha.')
      return
    }
    let lembretes = []
    if (form.notificacaoAutomatica && form.tipo_evento === 'especifico') {
      if (antecedencias.length === 0) {
        setErro('Escolha pelo menos um momento para o aviso (ex.: 1 dia antes).')
        return
      }
      lembretes = calcularLembretes()
      const vencido = lembretes.find((l) => l.horario.getTime() <= Date.now())
      if (vencido) {
        setErro(`O aviso "${vencido.rotulo}" já teria saído. Ajuste a data/hora do evento ou os momentos escolhidos.`)
        return
      }
    }
    const permanente = form.tipo_evento === 'permanente'
    setCarregando(true)
    const { data: novoEvento, error } = await supabase
      .from('eventos')
      .insert([
        {
          titulo: form.titulo.trim(),
          tipo: form.tipo,
          tipo_evento: form.tipo_evento,
          dia_semana: permanente ? Number(form.dia_semana) : null,
          data_inicio: permanente ? null : form.data_inicio,
          hora_inicio: form.hora_inicio || '19:00',
          data_fim: permanente ? null : (form.data_fim || null),
          hora_fim: permanente ? null : (form.hora_fim || null),
          local: form.local.trim() || '',
          responsavel: form.responsavel.trim() || '',
          descricao: form.descricao.trim() || '',
          notificacao_automatica: lembretes.length > 0,
        },
      ])
      .select('id, igreja_id')
      .single()
    if (error) {
      setCarregando(false)
      setErro(error.message || 'Não foi possível salvar o evento.')
      return
    }
    if (lembretes.length > 0) {
      if (!novoEvento?.igreja_id) {
        await supabase.from('eventos').delete().eq('id', novoEvento.id)
        setCarregando(false)
        setErro('Não foi possível identificar a igreja para agendar os avisos. Tente novamente ou fale com a Equipe Berit.')
        return
      }
      const { error: erroLembretes } = await supabase.from('eventos_lembretes').insert(
        lembretes.map((l) => ({
          evento_id: novoEvento.id,
          igreja_id: novoEvento.igreja_id,
          horario_notificacao: l.horario.toISOString(),
          mensagem_notificacao: l.mensagem,
        }))
      )
      if (erroLembretes) {
        await supabase.from('eventos').delete().eq('id', novoEvento.id)
        setCarregando(false)
        setErro('Houve um problema ao agendar os avisos e o evento não foi salvo. Tente novamente.')
        return
      }
    }
    // Entrega 3 — grava os materiais do evento
    if (materiaisValidos.length > 0) {
      if (!novoEvento?.igreja_id) {
        setCarregando(false)
        setErro('O evento foi salvo, mas não foi possível identificar a igreja para gravar os materiais. Abra o evento em Editar para tentar novamente.')
        return
      }
      const { error: erroMateriais } = await supabase.from('eventos_materiais').insert(
        materiaisValidos.map((m) => ({
          evento_id: novoEvento.id,
          igreja_id: novoEvento.igreja_id,
          item: m.item.trim(),
          quantidade: m.quantidade.trim() || null,
          observacao: m.observacao.trim() || null,
        }))
      )
      if (erroMateriais) {
        setCarregando(false)
        setErro('O evento foi salvo, mas houve um problema ao gravar os materiais. Abra o evento em Editar para tentar novamente.')
        return
      }
    }
    setCarregando(false)
    window.location.href = '/agenda'
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
  const lembretesPrevistos = calcularLembretes()
  return (
    <main style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
      <header style={{ background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/area" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' }}>Berit</a>
        <a href="/agenda" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>Voltar</a>
      </header>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Novo evento</h1>
        <p style={{ fontSize: 14, color: '#8A8A8A', margin: '0 0 1.5rem' }}>Cadastre uma programação na agenda da igreja.</p>
        {erro && (
          <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{erro}</div>
        )}
        <form onSubmit={salvar} style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #E4DED2' }}>
          <label style={rotulo}>Título *</label>
          <input type="text" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="ex.: Culto de Celebração" required style={campo} />
          <label style={rotulo}>Tipo</label>
          <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} style={campo}>
            {TIPOS.map((t) => (
              <option key={t.v} value={t.v}>{t.r}</option>
            ))}
          </select>
          <label style={rotulo}>Tipo de evento</label>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setForm({ ...form, tipo_evento: 'especifico' })}
              style={{
                flex: 1, padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: form.tipo_evento === 'especifico' ? '#1F3A5F' : '#F5F0E6',
                color: form.tipo_evento === 'especifico' ? '#FFFFFF' : '#5A5A5A',
              }}
            >
              Data única
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, tipo_evento: 'permanente' })}
              style={{
                flex: 1, padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: form.tipo_evento === 'permanente' ? '#4C8C6E' : '#F5F0E6',
                color: form.tipo_evento === 'permanente' ? '#FFFFFF' : '#5A5A5A',
              }}
            >
              Permanente (recorrente)
            </button>
          </div>
          {form.tipo_evento === 'especifico' ? (
            <>
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
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              <div>
                <label style={rotulo}>Dia da semana *</label>
                <select value={form.dia_semana} onChange={(e) => setForm({ ...form, dia_semana: e.target.value })} style={campo}>
                  {DIAS_SEMANA_OPCOES.map((d) => (
                    <option key={d.v} value={d.v}>{d.r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={rotulo}>Hora</label>
                <input type="time" value={form.hora_inicio} onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })} style={campo} />
              </div>
            </div>
          )}
          <label style={rotulo}>Local</label>
          <input type="text" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} placeholder="ex.: Templo principal, salão social..." style={campo} />
          <label style={rotulo}>Responsável</label>
          <input type="text" value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} placeholder="ex.: Pr. João, Ministério de Louvor..." style={campo} />
          <label style={rotulo}>Descrição</label>
          <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} placeholder="Detalhes da programação..." style={campo} />
          <div style={{ background: '#F5F0E6', borderRadius: 10, padding: '14px', marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#1F3A5F', fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!form.notificacaoAutomatica}
                onChange={(e) => setForm({ ...form, notificacaoAutomatica: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              🔔 Avisar automaticamente quem acompanha a igreja
            </label>
            {form.tipo_evento === 'permanente' && (
              <p style={{ fontSize: 12, color: '#8A8A8A', margin: '8px 0 0' }}>O aviso automático está disponível apenas para eventos com data única.</p>
            )}
            {form.notificacaoAutomatica && form.tipo_evento === 'especifico' && (
              <div style={{ marginTop: 12 }}>
                <label style={{ ...rotulo, fontWeight: 600 }}>Avisar em (pode marcar mais de um):</label>
                {ANTECEDENCIAS.map((a) => (
                  <label key={a.v} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#2E2E2E', cursor: 'pointer', marginBottom: 6 }}>
                    <input
                      type="checkbox"
                      checked={antecedencias.includes(a.v)}
                      onChange={() => alternarAntecedencia(a.v)}
                      style={{ width: 17, height: 17 }}
                    />
                    {a.r}
                  </label>
                ))}
                <label style={rotulo}>Mensagem da notificação (opcional)</label>
                <textarea
                  value={mensagemLembrete}
                  onChange={(e) => setMensagemLembrete(e.target.value)}
                  rows={2}
                  placeholder="Deixe em branco para mensagens automáticas (ex.: 'É amanhã: Culto...') ou escreva uma mensagem para todos os avisos."
                  style={{ ...campo, marginBottom: 8 }}
                />
                {lembretesPrevistos.length > 0 && (
                  <div style={{ fontSize: 12, color: '#8A8A8A', lineHeight: 1.6 }}>
                    {lembretesPrevistos.map((l) => (
                      <div key={l.ant}>
                        • {l.rotulo} → sai em {l.horario.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ background: '#F5F0E6', borderRadius: 10, padding: '14px', marginBottom: 16 }}>
            <label style={{ fontSize: 14, color: '#1F3A5F', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              📦 Sala de Material
            </label>
            <p style={{ fontSize: 12, color: '#8A8A8A', margin: '0 0 12px' }}>
              Liste o que a equipe de Multimídia precisa preparar para este evento. A lista aparece no módulo Multimídia, na programação do dia.
            </p>
            {materiais.length === 0 ? (
              <p style={{ fontSize: 13, color: '#8A8A8A', margin: '0 0 10px' }}>Nenhum material listado ainda.</p>
            ) : (
              materiais.map((m, i) => (
                <div key={i} style={{ border: '1px solid #E4DED2', borderRadius: 8, padding: 10, marginBottom: 8, background: '#FFFFFF' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 8 }}>
                    <input
                      type="text"
                      value={m.item}
                      onChange={(e) => atualizarMaterial(i, 'item', e.target.value)}
                      placeholder="Item (ex.: Microfone sem fio)"
                      style={{ flex: 1, padding: '8px 10px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                    <input
                      type="text"
                      value={m.quantidade}
                      onChange={(e) => atualizarMaterial(i, 'quantidade', e.target.value)}
                      placeholder="Qtd."
                      style={{ width: 80, padding: '8px 10px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                    <button
                      type="button"
                      onClick={() => removerMaterial(i)}
                      style={{ background: '#FDECEC', color: '#B71C1C', border: 'none', borderRadius: 8, width: 36, fontSize: 14, cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    value={m.observacao}
                    onChange={(e) => atualizarMaterial(i, 'observacao', e.target.value)}
                    placeholder="Observação (opcional — ex.: testar pilhas antes do culto)"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
              ))
            )}
            <button
              type="button"
              onClick={adicionarMaterial}
              style={{ background: '#E8F0FA', color: '#1F3A5F', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              + Adicionar material
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: 4 }}>
            <button type="submit" disabled={carregando} style={{ flex: 1, padding: '12px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              {carregando ? 'Salvando...' : 'Salvar evento'}
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
