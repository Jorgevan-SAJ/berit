'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getPerfil } from '../../lib/perfil'
import { formatarMoeda, formatarDataBR, gerarExcelRelatorio, gerarPDFRelatorio } from '../../lib/relatorios'

function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

function mesAtual() {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
}

function primeiroDiaDoMes() {
  const hoje = new Date()
  return
