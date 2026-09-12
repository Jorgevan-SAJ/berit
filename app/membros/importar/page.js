'use client'
import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../../../lib/supabase'
import { getPerfil } from '../../../lib/perfil'

const CAMPOS = [
  { chave: 'nome', rotulo: 'Nome (obrigatório)' },
  { chave: 'email', rotulo: 'E-mail' },
  { chave: 'celular', rotulo: 'Celular' },
  { chave: 'data_nascimento', rotulo: 'Data de nascimento' },
  { chave: 'data_batismo', rotulo: 'Data de batismo' },
  { chave: 'data_recebimento', rotulo: 'Data de recebimento' },
  { chave: 'situacao', rotulo: 'Situação' },
  { chave: 'observacoes', rotulo: 'Observações' },
]

const SUGESTOES = {
  nome: ['nome', 'nomedomembro', 'nomemembro', 'membro', 'nomecompleto', 'nome do membro'],
  email: ['email', 'emailmembro', 'emaildomembro', 'emailprincipal', 'e-mail'],
  celular: ['celular', 'telefone', 'telefonecelular', 'whatsapp', 'cel', 'fone', 'telefone celular'],
  data_nascimento: ['datadenascimento', 'nascimento', 'datanasc', 'nasc', 'data de nascimento'],
  data_batismo: ['datadebatismo', 'batismo', 'databatismo', 'data de batismo'],
  data_recebimento: ['dataderecebimento', 'recebimento', 'datarecebimento', 'data de recebimento'],
  situacao: ['situacao', 'status', 'condicao'],
  observacoes: ['observacoes', 'observacao', 'obs', 'notas'],
}

function normalizar(texto) {
  return (texto || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '')
}

function sugerirCampo(nomeColuna) {
  const n = normalizar(nomeColuna)
  for (const [campo, sinonimos] of Object.entries(SUGESTOES)) {
    if (sinonimos.some((s) => normalizar(s) === n)) return campo
  }
  return ''
}

function normalizarSituacao(valor) {
  const v = (valor || '').toString().trim().toLowerCase()
  if (v === 'ativo' || v === 'membro' || v === 'membro ativo' || v === 'membro(a)' || v === 'membro (a)') return 'membro'
  if (v === 'congregado' || v === 'congregado(a)' || v === 'congregado (a)') return 'congregado'
  if (v === 'visitante') return 'visitante'
  return v || 'membro'
}

function validarEmail(email) {
  if (!email) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function converterData(valor) {
  if (!valor) return null
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valor)) return valor.slice(0, 10)
  if (typeof valor === 'string' && /^\d{2}\/\d{2}\/\d{4}/.test(valor)) {
    const [d, m, a] = valor.split('/')
    return `${a}-${m}-${d}`
  }
  if (valor instanceof Date && !isNaN(valor)) return valor.toISOString().slice(0, 10)
  if (typeof valor === 'number' && valor > 20000 && valor < 60000) {
    const data = new Date(Math.round((valor - 25569) * 86400 * 1000))
    return data.toISOString().slice(0, 10)
  }
  return null
}

export default function ImportarMembros() {
  const [perfilAtual, setPerfilAtual] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const inputRef = useRef(null)
  const [etapa, setEtapa] = useState('upload')
  const [colunas, setColunas] = useState([])
  const [linhas, setLinhas] = useState([])
  const [mapeamento, setMapeamento] = useState({})
  const [erro, setErro] = useState('')
  const [processando, setProcessando] = useState(false)
  const [relatorio, setRelatorio] = useState(null)
  const [avisos, setAvisos] = useState([])

  const podeImportar = perfilAtual && ['admin_master', 'secretaria'].includes(perfilAtual.perfil)

  useEffect(() => {
    getPerfil().then((p) => {
      setPerfilAtual(p)
      setVerificando(false)
    })
  }, [])

  async function aoSelecionarArquivo(e) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setErro('')
    try {
      const reader = new FileReader()
      reader.onload = async (evento) => {
        try {
          const workbook = XLSX.read(evento.target.result, { type: 'array' })
          const primeiraAba = workbook.SheetNames[0]
          const planilha = workbook.Sheets[primeiraAba]
          const dados = XLSX.utils.sheet_to_json(planilha, { defval: '' })
          if (!dados.length) {
            setErro('O arquivo está vazio ou não tem linhas de dados.')
            return
          }
          const nomesColunas = Object.keys(dados[0])
          setColunas(nomesColunas)
          setLinhas(dados)
          const sugestao = {}
          for (const col of nomesColunas) {
            const campo = sugerirCampo(col)
            if (campo) sugestao[col] = campo
          }
          setMapeamento(sugestao)
          setEtapa('mapeamento')
        } catch {
          setErro('Não foi possível ler o arquivo. Use .xlsx, .xls ou .csv.')
        }
      }
      reader.readAsArrayBuffer(arquivo)
    } catch {
      setErro('Não foi possível ler o arquivo.')
    }
  }

  function validarLinhas() {
    const problemas = []
    const linhasValidas = []
    const colParaCampo = {}
    for (const [col, campo] of Object.entries(mapeamento)) {
      if (campo) colParaCampo[col] = campo
    }
    const camposMapeados = Object.values(colParaCampo)
    if (!camposMapeados.includes('nome')) {
      setErro('É obrigatório mapear a coluna que contém o Nome dos membros.')
      return null
    }
    linhas.forEach((linha, idx) => {
      const numeroLinha = idx + 2
      const registro = {}
      for (const [col, campo] of Object.entries(colParaCampo)) {
        registro[campo] = linha[col]
      }
      const nome = (registro.nome || '').toString().trim()
      if (!nome) {
        problemas.push({ linha: numeroLinha, tipo: 'erro', mensagem: 'Nome vazio' })
        return
      }
      if (registro.email &&
