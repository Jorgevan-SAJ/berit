'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function urlBase64ParaUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

function obterDeviceId() {
  if (typeof window === 'undefined') return null
  let id = localStorage.getItem('berit_device_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('berit_device_id', id)
  }
  return id
}

export default function BotaoFavoritarIgreja({ igrejaId, temAdmin }) {
  const [favoritado, setFavoritado] = useState(false)
  const [verificando, setVerificando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    const deviceId = obterDeviceId()
    if (!deviceId || !igrejaId) return
    supabase
      .rpc('verificar_favorito', { p_igreja_id: igrejaId, p_device_id: deviceId })
      .then(({ data }) => {
        setFavoritado(!!data)
        setVerificando(false)
      })
  }, [igrejaId])

  async function favoritar() {
    setOcupado(true)
    try {
      const deviceId = obterDeviceId()
      const permissao = await Notification.requestPermission()
      if (permissao !== 'granted') {
        setMensagem('Notificações bloqueadas no navegador — libere nas configurações para acompanhar esta igreja.')
        setTimeout(() => setMensagem(''), 6000)
        return
      }
      const registro = await navigator.serviceWorker.ready
      const sub = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ParaUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        ),
      })
      const { error } = await supabase.rpc('favoritar_igreja', {
        p_igreja_id: igrejaId,
        p_device_id: deviceId,
        p_inscricao: sub.toJSON(),
      })
      if (!error) {
        setFavoritado(true)
        setMensagem(
          temAdmin
            ? '✅ Notificações desta igreja ativadas neste dispositivo'
            : '❤️ Igreja adicionada aos favoritos. Ela ainda não tem administrador — você receberá as notificações de atividades assim que ela adquirir o Berit.'
        )
        setTimeout(() => setMensagem(''), 6000)
      }
    } catch (e) {
      console.error('Erro ao favoritar:', e)
    } finally {
      setOcupado(false)
    }
  }

  async function desfavoritar() {
    setOcupado(true)
    const deviceId = obterDeviceId()
    await supabase.rpc('desfavoritar_igreja', {
      p_igreja_id: igrejaId,
      p_device_id: deviceId,
    })
    setFavoritado(false)
    setOcupado(false)
  }

  if (verificando || !igrejaId) return null

  return (
    <div style={{ width: '100%', maxWidth: 480, margin: '16px auto', textAlign: 'center' }}>
      {mensagem && (
        <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#EAF4EC', color: '#2E6B46', fontSize: 14, marginBottom: 10 }}>
          {mensagem}
        </div>
      )}
      {favoritado ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 20, backgroundColor: '#FBEFEA', color: '#8A4B2D', fontSize: 14, fontWeight: 600 }}>
          ❤️ Igreja favorita
          <button
            onClick={desfavoritar}
            disabled={ocupado}
            title="Deixar de acompanhar"
            style={{ border: 'none', background: 'transparent', color: '#8A4B2D', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}
          >
            ✕
          </button>
        </span>
      ) : (
        <button
          onClick={favoritar}
          disabled={ocupado}
          style={{ padding: '10px 18px', borderRadius: 8, border: 'none', backgroundColor: '#1F3A5F', color: '#FFFFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          {ocupado ? 'Ativando...' : '❤️ Acompanhar esta igreja'}
        </button>
      )}
    </div>
  )
}
