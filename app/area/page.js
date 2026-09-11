'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getPerfil, perfilLabel } from '../../lib/perfil'

export default function AreaPage() {
  const [carregando, setCarregando] = useState(true)
  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        window.location.href = '/login'
      } else {
        setUsuario(data.session.user)
        const p = await getPerfil()
        setPerfil(p)
        setCarregando(false)
      }
    })
  }, [])

  if (carregando) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
        <div style={{ fontSize: 14, color: '#8A8A8A' }}>Carregando...</div>
      </main>
    )
  }

  const card = {
    background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', border: '1px solid #E4DED2',
    boxShadow: '0 2px 12px rgba(31,58,95,0.06)', textDecoration: 'none', display: 'block',
  }
  const cardTitulo = { fontSize: 16, fontWeight: 600, color: '#1F3A5F', marginBottom: 6 }
  const cardTexto = { fontSize: 13, color: '#8A8A8A', margin: 0 }

  const ehAdmin = perfil && perfil.perfil === 'admin_master'
  const ehConselhoFiscal = perfil && perfil.perfil === 'conselho_fiscal'
  const podeFinancas = perfil && ['admin_master', 'tesouraria', 'conselho_fiscal'].includes(perfil.perfil)
  const podeMembros = perfil && (perfil.perfil === 'admin_master' || perfil.perfil === 'secretaria' || perfil.perfil === 'conselho_fiscal')
  const podeAgenda = perfil && (perfil.perfil === 'admin_master' || perfil.perfil === 'secretaria' || perfil.perfil === 'conselho_fiscal')
  const seloLeitura = { display: 'inline-block', background: '#E8F0FA', color: '#1F3A5F', padding: '2px 8px', borderRadius: 999, fontSize: 11, marginBottom: 6 }

  return (
    <main style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
      <header style={{ background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Berit</div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <a
            href="/ajuda"
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}
          >
            Ajuda
          </a>
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
          >
            Sair
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Área da Igreja</h1>
        <p style={{ fontSize: 14, color: '#8A8A8A', margin: '0 0 2rem' }}>
          Bem-vindo{perfil?.nome ? `, ${perfil.nome}` : usuario?.email ? `, ${usuario.email}` : ''}
          {perfil ? ` · Perfil: ${perfilLabel(perfil.perfil)}` : ''} — gestão simples para igrejas.
          {ehConselhoFiscal && (
            <span style={{ display: 'block', marginTop: 6, color: '#4C8C6E' }}>
              🔍 Acesso de consulta em todos os módulos, em modo somente leitura (fiscalização).
            </span>
          )}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {podeMembros ? (
            <a href="/membros" style={card}>
              <div style={cardTitulo}>Membros</div>
              {ehConselhoFiscal && <span style={seloLeitura}>Somente leitura</span>}
              <p style={cardTexto}>
                {ehConselhoFiscal
                  ? 'Consulta do rol de membros — sem cadastro ou edição.'
                  : 'Cadastro e gestão do rol de membros. Clique para acessar.'}
              </p>
            </a>
          ) : (
            <div style={{ ...card, opacity: 0.6 }}>
              <div style={cardTitulo}>Membros</div>
              <p style={cardTexto}>Acesso restrito.</p>
            </div>
          )}

          {podeFinancas ? (
            <a href="/financas" style={card}>
              <div style={cardTitulo}>Finanças</div>
              {ehConselhoFiscal && <span style={seloLeitura}>Somente leitura</span>}
              <p style={cardTexto}>
                {ehConselhoFiscal
                  ? 'Consulta de lançamentos, relatórios e auditoria — modo somente leitura.'
                  : 'Entradas, saídas e relatório de dizimistas. Clique para acessar.'}
              </p>
            </a>
          ) : (
            <div style={{ ...card, opacity: 0.6 }}>
              <div style={cardTitulo}>Finanças</div>
              <p style={cardTexto}>Acesso restrito ao perfil Tesouraria.</p>
            </div>
          )}

          {ehAdmin && (
            <a href="/acessos" style={card}>
              <div style={cardTitulo}>Perfis de Acesso</div>
              <p style={cardTexto}>Crie usuários e controle as permissões da plataforma.</p>
            </a>
          )}

          {podeAgenda ? (
            <a href="/agenda" style={card}>
              <div style={cardTitulo}>Agenda</div>
              {ehConselhoFiscal && <span style={seloLeitura}>Somente leitura</span>}
              <p style={cardTexto}>
                {ehConselhoFiscal
                  ? 'Consulta de programações e eventos — sem cadastro ou edição.'
                  : 'Programações e eventos da igreja. Clique para acessar.'}
              </p>
            </a>
          ) : (
            <div style={{ ...card, opacity: 0.6 }}>
              <div style={cardTitulo}>Agenda</div>
              <p style={cardTexto}>Acesso restrito.</p>
            </div>
          )}

          <div style={card}>
            <div style={cardTitulo}>Diretório Público</div>
            <p style={cardTexto}>Busca de igrejas perto de você. Disponível na Fase 3.</p>
          </div>
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '1.5rem', fontSize: 12, color: '#8A8A8A' }}>
        <a href="/recuperar-acesso" style={{ color: '#8A8A8A', textDecoration: 'underline' }}>Recuperar acesso de administrador</a>
        <span style={{ margin: '0 8px' }}>·</span>
        <a href="mailto:beritinovacoes@gmail.com?subject=Contato%20Berit" style={{ color: '#8A8A8A', textDecoration: 'underline' }}>Fale conosco</a>
        <span style={{ margin: '0 8px' }}>·</span>
        Berit — Gestão simples para igrejas
      </footer>
    </main>
  )
}
