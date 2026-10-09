'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SeloFavorita({ igrejaId }) {
  const [ehFavorita, setEhFavorita] = useState(false)

  useEffect(() => {
    if (!igrejaId) return
    const deviceId = localStorage.getItem('berit_device_id')
    if (!deviceId) return
    supabase
      .from('favoritos_igrejas')
      .select('id')
      .eq('igreja_id', igrejaId)
      .eq('device_id', deviceId)
      .limit(1)
      .then(({ data }) => setEhFavorita(!!data && data.length > 0))
  }, [igrejaId])

  if (!ehFavorita) return null

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 12, backgroundColor: '#FBEFEA', color: '#8A4B2D', fontSize: 12, fontWeight: 600, verticalAlign: 'middle', marginLeft: 8 }}>
      ❤️ Você acompanha
    </span>
  )
}
