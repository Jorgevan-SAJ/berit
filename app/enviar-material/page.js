'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
const LIMITE_ARQUIVO = 50 * 1024 * 1024 // 50 MB por arquivo
function formatarTamanho(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
export default function EnviarMaterialPage() {
  const [carregando, setCarregando] = useState(true)
  const [evento, setEvento] = useState(null)
  const [erro, setErro] = useState('')
  const [nome, setNome] = useState('')
  const [contato, setContato] = useState('')
  const [descricao, setDescricao] = useState('')
  const [arquivos, setArquivos] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [concluido, setConcluido] = useState(false)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('evento')
    if (!id) {
      setErro('Link inválido. Peça à equipe da igreja um link de envio atualizado.')
      setCarregando(false)
      return
    }
    fetch(`/api/info-evento?evento=${id}`)
      .then((r) => r.json())
      .then((dados) => {
        if (dados.ok) {
          setEvento(dados.evento)
        } else {
          setErro(dados.mensagem || 'Não foi possível carregar o evento.')
        }
        setCarregando(false)
      })
      .catch(() => {
        setErro('Não foi possível conectar ao servidor. Tente novamente.')
        setCarregando(false)
      })
  }, [])
  // Correção: cada seleção ACRESCENTA os arquivos à lista (não substitui os anteriores)
  function escolherArquivos(e) {
    const novos = Array.from(e.target.files || [])
    e.target.value = '' // permite reselecionar o mesmo arquivo depois
    if (novos.length === 0) return
    const grande = novos.find((a) => a.size > LIMITE_ARQUIVO)
    if (grande) {
      setErro(`O arquivo "${grande.name}" passa de 50 MB. Envie vídeos muito grandes por link (YouTube/Drive) na descrição.`)
      return
    }
    setErro('')
    setArquivos((atual) => {
      const existentes = new Set(atual.map((a) => `${a.name}|${a.size}`))
      const adicionados = novos.filter((n) => !existentes.has(`${n.name}|${n.size}`))
      return [...atual, ...adicionados]
    })
  }
  function removerArquivo(i) {
    setArquivos((atual) => atual.filter((_, idx) => idx !== i))
  }
  async function enviar(e) {
    e.preventDefault()
    setErro('')
    if (!nome.trim()) {
      setErro('Informe o seu nome.')
      return
    }
    if (arquivos.length === 0) {
      setErro('Selecione pelo menos um arquivo para enviar.')
      return
    }
    setEnviando(true)
    try {
      for (const arquivo of arquivos) {
        // 1) O servidor valida o evento e autoriza o envio deste arquivo
        let autorizacao = null
        try {
          const resposta = await fetch('/api/material/upload-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              evento_id: evento.id,
              arquivo_nome: arquivo.name,
              arquivo_tamanho: arquivo.size,
            }),
          })
          autorizacao = await resposta.json()
        } catch {
          autorizacao = null
        }
        if (!autorizacao || !autorizacao.ok || !autorizacao.token) {
          setEnviando(false)
          setErro(autorizacao?.mensagem || `Não foi possível autorizar o envio de "${arquivo.name}". Tente novamente.`)
          return
        }
        // 2) O navegador envia direto ao armazenamento com a autorização recebida
        const { error: erroUpload } = await supabase.storage
          .from('materiais-eventos')
          .uploadToSignedUrl(autorizacao.caminho, autorizacao.token, arquivo)
        if (erroUpload) {
          setEnviando(false)
          setErro(`Não foi possível enviar o arquivo "${arquivo.name}" (${erroUpload.message}). Tente novamente.`)
          return
        }
        // 3) O servidor confirma que o arquivo chegou e registra o envio
        let registro = null
        try {
          const resposta = await fetch('/api/material/registrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              evento_id: evento.id,
              caminho: autorizacao.caminho,
              remetente: nome.trim(),
              contato: contato.trim(),
              descricao: descricao.trim(),
              arquivo_nome: arquivo.name,
              arquivo_tamanho: arquivo.size,
            }),
          })
          registro = await resposta.json()
        } catch {
          registro = null
        }
        if (!registro || !registro.ok) {
          setEnviando(false)
          setErro(`O arquivo "${arquivo.name}" foi enviado, mas houve um problema ao registrar (${registro?.mensagem || 'erro desconhecido'}). Tente novamente.`)
          return
        }
      }
      setEnviando(false)
      setConcluido(true)
    } catch (erroGeral) {
      setEnviando(false)
      setErro('Não foi possível conectar ao servidor. Tente novamente.')
    }
  }
  const estilo = {
    main: { minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" },
    header: { background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', textAlign: 'center' },
    logo: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' },
    card: { background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #E4DED2' },
    campo: { width: '100%', padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit' },
    rotulo: { fontSize: 13, color: '#2E2E2E', display: 'block', marginBottom: 6 },
    botao: { width: '100%', padding: '14px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  }
  return (
    <main style={estilo.main}>
      <header style={estilo.header}>
        <a href="/" style={estilo.logo}>Berit</a>
      </header>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 22, color: '#1F3A5F', margin: '0 0 4px' }}>Envio de material para a equipe de Multimídia</h1>
        <p style={{ fontSize: 14, color: '#8A8A8A', margin: '0 0 1.5rem' }}>
          Envie antecipadamente fotos, vídeos, playbacks e apresentações da sua participação. Sem precisar de cadastro.
        </p>
        {carregando ? (
          <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '2rem' }}>Carregando...</div>
        ) : erro && !evento ? (
          <div style={{ ...estilo.card, textAlign: 'center' }}>
            <div style={{ fontSize: 15, color: '#B71C1C', fontWeight: 600 }}>{erro}</div>
          </div>
        ) : concluido ? (
          <div style={{ ...estilo.card, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#4C8C6E', marginBottom: 8 }}>Material enviado com sucesso!</div>
            <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px', lineHeight: 1.5 }}>
              A equipe de Multimídia de {evento.igreja_nome || 'sua igreja'} já pode visualizar os arquivos para o evento <strong>{evento.titulo}</strong>. Obrigado!
            </p>
          </div>
        ) : (
          <>
            <div style={{ ...estilo.card, marginBottom: '1.5rem', background: '#E8F0FA', border: '1px solid #C9D9EC' }}>
              <div style={{ fontSize: 12, color: '#1F3A5F', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                {evento.igreja_nome || 'Igreja'}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1F3A5F' }}>{evento.titulo}</div>
              <div style={{ fontSize: 13, color: '#5A5A5A', marginTop: 4 }}>📅 {evento.quando}</div>
            </div>
            <form onSubmit={enviar} style={estilo.card}>
              {erro && (
                <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16, wordBreak: 'break-word' }}>{erro}</div>
              )}
              <label style={estilo.rotulo}>Seu nome *</label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" required style={estilo.campo} />
              <label style={estilo.rotulo}>WhatsApp ou contato (opcional)</label>
              <input type="text" value={contato} onChange={(e) => setContato(e.target.value)} placeholder="ex.: (11) 99999-0000" style={estilo.campo} />
              <label style={estilo.rotulo}>O que você está enviando?</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={2}
                placeholder="ex.: Playback das músicas 1 e 3 · Fotos do trabalho missionário · Link do vídeo no YouTube"
                style={estilo.campo}
              />
              <label style={estilo.rotulo}>Adicionar arquivos (clique quantas vezes quiser — eles se acumulam na lista)</label>
              <input
                type="file"
                multiple
                onChange={escolherArquivos}
                style={{ width: '100%', fontSize: 13, marginBottom: 6, boxSizing: 'border-box' }}
              />
              <p style={{ fontSize: 12, color: '#8A8A8A', margin: '0 0 12px', lineHeight: 1.5 }}>
                Aceita fotos, vídeos, áudios (MP3), PDF e apresentações. Limite de 50 MB por arquivo — vídeos maiores podem ir por link (YouTube/Drive) na descrição.
              </p>
              {arquivos.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: '#4C8C6E', fontWeight: 700, marginBottom: 6 }}>
                    {arquivos.length} arquivo(s) pronto(s) para envio
                  </div>
                  {arquivos.map((a, i) => (
                    <div key={`${a.name}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#F5F0E6', borderRadius: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: '#2E2E2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📎 {a.name} <span style={{ color: '#8A8A8A' }}>({formatarTamanho(a.size)})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removerArquivo(i)}
                        style={{ background: 'none', border: 'none', color: '#B71C1C', fontSize: 14, cursor: 'pointer', flexShrink: 0 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button type="submit" disabled={enviando} style={estilo.botao}>
                {enviando ? 'Enviando...' : 'Enviar material'}
              </button>
            </form>
          </>
        )}
      </div>
      <footer style={{ textAlign: 'center', padding: '1.5rem', fontSize: 12, color: '#8A8A8A' }}>
        Berit — Gestão Eclesiástica
      </footer>
    </main>
  )
}
