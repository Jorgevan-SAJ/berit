'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { getPerfil } from '../../../lib/perfil'

function formatarMoeda(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function formatarData(iso) {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

function formatarDataHora(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

const CAMPOS = [
  { k: 'tipo', r: 'Tipo' },
  { k: 'descricao', r: 'Descrição' },
  { k: 'valor', r: 'Valor' },
  { k: 'categoria_id', r: 'Categoria' },
  { k: 'data_lancamento', r: 'Data' },
  { k: 'forma_pagamento', r: 'Forma de pagamento' },
  { k: 'membro_id', r: 'Membro' },
  { k: 'observacoes', r: 'Observações' },
]

export default function AuditoriaPage() {
  const [perfilAtual, setPerfilAtual] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [solicitacoes, setSolicitacoes] = useState([])
  const [historico, setHistorico] = useState([])
  const [categorias, setCategorias] = useState([])
  const [membros, setMembros] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [processandoId, setProcessandoId] = useState(null)

  // Permissões por perfil
  const podeVerAuditoria = perfilAtual && ['admin_master', 'tesouraria', 'conselho_fiscal'].includes(perfilAtual.perfil)
  const podeAgirAuditoria = perfilAtual && ['admin_master', 'tesouraria'].includes(perfilAtual.perfil)
  const ehConselhoFiscal = perfilAtual && perfilAtual.perfil === 'conselho_fiscal'

  useEffect(() => {
    getPerfil().then((p) => {
      setPerfilAtual(p)
      setVerificando(false)
      if (p && ['admin_master', 'tesouraria', 'conselho_fiscal'].includes(p.perfil)) carregarDados()
    })
  }, [])

  async function carregarDados() {
    setCarregando(true)
    const [pend, hist, cat, mem, usr] = await
