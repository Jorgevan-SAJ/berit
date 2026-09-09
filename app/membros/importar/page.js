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

function validarEmail(email) {
  if (!email) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function converterData(valor)
