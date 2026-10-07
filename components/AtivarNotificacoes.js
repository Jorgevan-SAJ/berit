'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function urlBase64ParaUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function AtivarNotificacoes() {
  const [estado, setEstado] = useState('carregando')
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setEstado('nao-suportado')
      return
    }
    if (Notification.permission === 'granted') setEstado('ativo')
    else if (Notification.permission === 'denied') setEstado('bloqueado')
    else setEstado('aguardando')
  }, [])

  async function ativar() {
    setOcupado(true)
    try {
      const permissao = await Notification.requestPermission()
      if (permissao !== 'granted') {
        setEstado('bloqueado')
        return
      }
      const registro = await navigator.serviceWorker.ready
      const inscricao = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ParaUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        ),
      })
      const { data: { user } } = await supabase.auth.getUser()
      const dados = { inscricao: inscricao.toJSON() }
      if (user) dados.user_id = user.id
      const { error } = await supabase
        .from('push_inscricoes')
        .upsert(dados, { onConflict: 'inscricao' })
      if (!error) setEstado('ativo')
    } catch (e) {
      console.error('Erro ao ativar notificações:', e)
    } finally {
      setOcupado(false)
    }
  }

  if (estado === 'carregando' || estado === 'nao-suportado') return null

  if (estado === 'ativo') {
    return (
      <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#EAF4EC', color: '#2E6B46', fontSize: 14 }}>
        🔔 Notificações ativadas neste dispositivo
      </div>
    )
  }

  if (estado === 'bloqueado') {
    return (
      <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#FBEFEA', color: '#8A4B2D', fontSize: 14 }}>
        Notificações bloqueadas — libere nas configurações do navegador para receber avisos da igreja.
      </div>
    )
  }

  return (
    <button
      onClick={ativar}
      disabled={ocupado}
      style={{ padding: '10px 18px', borderRadius: 8, border: 'none', backgroundColor: '#1F3A5F', color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
    >
      {ocupado ? 'Ativando...' : '🔔 Ativar notificações'}
    </button>
  )
}
