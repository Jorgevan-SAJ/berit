'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const DIAS_ORDEM = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const CORES_REDE = {
  Instagram: { cor: '#7B4FA6', bg: '#F3EAFB' },
  Facebook: { cor: '#1F3A5F', bg: '#E8F0FA' },
  YouTube: { cor: '#B71C1C', bg: '#FDECEC' },
  TikTok: { cor: '#2E2E2E', bg: '#F0EAE0' },
  'X (Twitter)': { cor: '#5A5A5A', bg: '#F0EAE0' },
  Outra: { cor: '#4C8C6E', bg: '#EAF4EE' },
}

const estilo = {
  main: { minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" },
  header: { background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem' },
  logo: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' },
  hero: { background: '#1F3A5F', color: '#FFFFFF', padding: '2.5rem 1.5rem', textAlign: 'center' },
  card: { background: '#FFFFFF', borderRadius: 12, border: '1px solid #E4DED2', padding: '1.5rem', marginBottom: '1rem' },
  tituloSecao: { fontSize: 16, fontWeight: 700, color: '#1F3A5F', margin: '0 0 12px' },
  campo: { padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
}

function formatarCNPJ(cnpj) {
  const d = String(cnpj || '').replace(/\D/g, '')
  if (d.length !== 14) return cnpj || ''
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

function formatarDataBR(iso) {
  if (!iso) return ''
  const partes = String(iso).slice(0, 10).split('-')
  if (partes.length !== 3) return ''
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function formatarHora(iso) {
  if (!iso) return ''
  const h = String(iso).slice(11, 16)
  return h.length === 5 ? h.replace(':', 'h') : ''
}

function ordenarCultos(lista) {
  return [...(lista || [])].sort((a, b) => DIAS_ORDEM.indexOf(a.dia) - DIAS_ORDEM.indexOf(b.dia))
}

function SeloVerificado() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.18)', color: '#FFFFFF', padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
        <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Dados verificados
    </span>
  )
}

function IconeWhatsApp({ tamanho = 18 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c
