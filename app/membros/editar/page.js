'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

function formatarCelular(valor) {
  const d = (valor || '').replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export default function EditarMembro() {
  const [form, setForm] = useState(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [naoEncontrado, setNaoEncontrado] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (!id) {
      setNaoEncontrado(true)
      return
    }
    supabase.from('membros').select('*').eq('id', id).single().then(({ data, error }) => {
      if (error || !data) {
        setNaoEncontrado(true)
      } else {
        setForm({
          nome: data.nome || '',
          email: data.email || '',
          celular: data.celular || '',
          sexo: data.sexo || '',
          data_nascimento: data.data_nascimento || '',
          data_batismo: data.data_batismo || '',
          data_recebimento: data.data_recebimento || '',
          situacao: data.situacao || 'ativo',
          observacoes: data.observacoes || '',
        })
      }
    })
  }, [])

  function atualizar(campo, valor) {
    setForm({ ...form, [campo]: valor })
  }

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    if (!form.nome.trim()) {
      setErro('O nome é obrigatório.')
      return
    }
    setCarregando(true)
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    const { error } = await supabase.from('membros').update({
      nome: form.nome.trim(),
      email: form.email.trim() || null,
      celular: form.celular.replace(/\D/g, '') || null,
