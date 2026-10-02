'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getPerfil, getStatusPlano } from '../../lib/perfil'
const TIPOS = [
  { v: 'culto', r: 'Culto', cor: '#1F3A5F', bg: '#E8F0FA' },
  { v: 'ensaio', r: 'Ensaio', cor: '#4C8C6E', bg: '#EAF4EE' },
  { v: 'reuniao', r: 'Reunião', cor: '#B26A00', bg: '#FDF3E3' },
  { v: 'evento', r: 'Evento', cor: '#B71C1C', bg: '#FDECEC' },
  { v: 'campanha', r: 'Campanha', cor: '#7B4FA6', bg: '#F3EAFB' },
  { v: 'outro', r: 'Outro', cor: '#5A5A5A', bg: '#F0EAE0' },
]
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DIAS_SEMANA_LABEL = ['Domingos', 'Segundas', 'Terças', 'Quartas', 'Quintas', 'Sextas', 'Sábados']
function rotuloTipo(v) {
  const t = TIPOS.find((x) => x.v === v)
  return t ? t.r : v
}
function corTipo(v) {
  const t = TIPOS.find((x) => x.v === v)
  return t || { cor: '#5A5A5A', bg: '#F0EAE0' }
}
function formatarData(iso) {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}
function formatarHora(h) {
  if (!h) return ''
  return h.slice(0, 5)
}
function mesAtual() {
  const h = new Date()
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}`
}
function nomeMes(ano, mes) {
  const nomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  return `${nomes[mes - 1]} de ${ano}`
}
export default function AgendaPage() {
  const [perfilAtual, setPerfilAtual] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [eventos, setEventos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mes, setMes] = useState(mesAtual())
  const [filtroTipo, setFiltroTipo] = useState('')
  const [selecionado, setSelecionado] = useState(null)
  const [excluindo, setExcluindo] = useState(null)
  const [salvando, setSalvando] = useState(false)
  // Item 11 — status do plano para o bloqueio funcional
  const [planoBloqueado, setPlanoBloqueado] = useState(false)
  const [trialTerminaEm, setTrialTerminaEm] = useState(null)
  const podeVer = perfilAtual && ['admin_master', 'secretaria', 'tesouraria', 'conselho_fiscal'].includes(perfilAtual.perfil)
  // Item 11 — escrita bloqueada com trial expirado
  const podeGerenciar = perfilAtual && ['admin_master', 'secretaria'].includes(perfilAtual.perfil) && !planoBloqueado
  const ehSomenteLeitura = perfilAtual && ['tesouraria', 'conselho_fiscal'].includes(perfilAtual.perfil)
  useEffect(() => {
    getPerfil().then(async (p) => {
      setPerfilAtual(p)
      setVerificando(false)
      if (p && ['admin_master', 'secretaria', 'tesouraria', 'conselho_fiscal'].includes(p.perfil)) {
        // Item 11 — verificação centralizada do status do plano
        const st = await getStatusPlano()
        setPlanoBloqueado(!!st.bloqueado)
        setTrialTerminaEm(st.trialTerminaEm || null)
        carregar()
      }
    })
  }, [])
  async function carregar() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .order('data_inicio', { ascending: true })
      .order('hora_inicio', { ascending: true })
    if (error) {
      setErro('Não foi possível carregar a agenda.')
    } else {
      setEventos(data || [])
    }
    setCarregando(false)
  }
  const [ano, mesNum] = mes.split('-').map(Number)
  const primeiro = new Date(ano, mesNum - 1, 1)
  const diasNoMes = new Date(ano, mesNum, 0).getDate()
  const offset = primeiro.getDay()
  const hojeISO = new Date().toISOString().slice(0, 10)
  const eventosAtivos = eventos.filter((e) => {
    if (e.tipo_evento === 'permanente') {
      return e.dia_semana !== null && e.dia_semana !== undefined
    }
    return (e.data_inicio || '') >= hojeISO
  })
  const especificosDoMes = eventosAtivos.filter((e) => e.tipo_evento !== 'permanente' && (e.data_inicio || '').startsWith(mes))
  const permanentes = eventosAtivos.filter((e) => e.tipo_evento === 'permanente')
  const filtrados = [...permanentes, ...especificosDoMes].filter((e) => !filtroTipo || e.tipo === filtroTipo)
  const eventosPorDia = {}
  filtrados.forEach((e) => {
    if (e.tipo_evento === 'permanente') {
      for (let d = 1; d <= diasNoMes; d++) {
        if (new Date(ano, mesNum - 1, d).getDay() === e.dia_semana) {
          if (!eventosPorDia[d]) eventosPorDia[d] = []
          eventosPorDia[d].push(e)
        }
      }
    } else {
      const dia = Number(e.data_inicio.slice(8, 10))
      if (!eventosPorDia[dia]) eventosPorDia[dia] = []
      eventosPorDia[dia].push(e)
    }
  })
  const celulas = []
  for (let i = 0; i < offset; i++) celulas.push(null)
  for (let d = 1; d <= diasNoMes; d++) celulas.push(d)
  function mudarMes(delta) {
    const d = new Date(ano, mesNum - 1 + delta, 1)
    setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  async function confirmarExclusao() {
    if (!excluindo) return
    setSalvando(true)
    const { error } = await supabase.from('eventos').delete().eq('id', excluindo.id)
    setSalvando(false)
    if (error) {
      setErro('Não foi possível excluir o evento.')
    } else {
      setExcluindo(null)
      setSelecionado(null)
      carregar()
    }
  }
  const dataFimTrial = trialTerminaEm
