'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getPerfil, perfilLabel } from '../../lib/perfil'

const DIAS_SEMANA_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const ABAS_ANIVERSARIO = [
  { v: 'hoje', r: 'Hoje' },
  { v: 'semana', r: 'Esta semana' },
  { v: 'mes', r: 'Este mês' },
]
const ROTULOS_EVENTO = {
  culto: { r: 'Culto', cor: '#1F3A5F', bg: '#E8F0FA' },
  ensaio: { r: 'Ensaio', cor: '#4C8C6E', bg: '#EAF4EE' },
  reuniao: { r: 'Reunião', cor: '#B26A00', bg: '#FDF3E3' },
  evento: { r: 'Evento', cor: '#B71C1C', bg: '#FDECEC' },
  campanha: { r: 'Campanha', cor: '#7B4FA6', bg: '#F3EAFB' },
  outro: { r: 'Outro', cor: '#5A5A5A', bg: '#F0EAE0' },
}

function partesData(iso) {
  if (!iso) return null
  const [a, m, d] = String(iso).split('-').map(Number)
  if (!a || !m || !d) return null
  return { ano: a, mes: m, dia: d }
}

function rotuloDiaSemana(mes, dia) {
  const d = new Date(new Date().getFullYear(), mes - 1, dia)
  return DIAS_SEMANA_CURTO[d.getDay()]
}

function montarProximosEventos(eventos, hoje, limite) {
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  const itens = []
  eventos.forEach((e) => {
    const hora = e.hora_inicio ? String(e.hora_inicio).slice(0, 5) : ''
    const base = { id: e.id, titulo: e.titulo, tipo: e.tipo, local: e.local, hora }
    if (e.tipo_evento === 'permanente') {
      const ds = Number(e.dia_semana)
      if (Number.isNaN(ds) || ds < 0 || ds > 6) return
      const quando = new Date(inicioHoje)
      quando.setDate(quando.getDate() + ((ds - quando.getDay() + 7) % 7))
      itens.push({ ...base, quando, permanente: true })
      return
    }
    const p = partesData(e.data_inicio)
    if (!p) return
    const quando = new Date(p.ano, p.mes - 1, p.dia)
    if (quando < inicioHoje) return
    itens.push({ ...base, quando, permanente: false })
  })
  itens.sort((a, b) => a.quando - b.quando || a.hora.localeCompare(b.hora))
  return itens.slice(0, limite)
}

export default function AreaPage() {
  const [carregando, setCarregando] = useState(true)
  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [pendentes, setPendentes] = useState(0)
  const [toastVisivel, setToastVisivel] = useState(false)

  const [carregandoPainel, setCarregandoPainel] = useState(false)
  const [aniversariantes, setAniversariantes] = useState([])
  const [abaAniversario, setAbaAniversario] = useState('hoje')
  const [proximosEventos, setProximosEventos] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        window.location.href = '/login'
      } else {
        setUsuario(data.session.user)
        const p = await getPerfil()
        setPerfil(p)
        setCarregando(false)
        if (p && ['admin_master', 'tesouraria'].includes(p.perfil)) {
          const { count } = await supabase
            .from('solicitacoes_alteracao')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pendente')
            .neq('solicitado_por', data.session.user.id)
          setPendentes(count || 0)
        }
        if (p && ['admin_master', 'secretaria'].includes(p.perfil)) {
          carregarPainel()
        }
      }
    })
  }, [])

  async function carregarPainel() {
    setCarregandoPainel(true)
    const hoje = new Date()
    const [mem, ev] = await Promise.all([
      supabase.from('membros').select('nome, data_nascimento, situacao'),
      supabase.from('eventos').select('id, titulo, tipo, tipo_evento, dia_semana, data_inicio, hora_inicio, local'),
    ])
    const lista = (mem.data || [])
      .filter((m) => m.data_nascimento && m.situacao !== 'inativo')
      .map((m) => {
        const p = partesData(m.data_nascimento)
        if (!p) return null
        return { nome: m.nome, mes: p.mes, dia: p.dia, anoNascimento: p.ano }
      })
      .filter(Boolean)
      .sort((a, b) => a.dia - b.dia)
    setAniversariantes(lista)
    setProximosEventos(montarProximosEventos(ev.data || [], hoje, 5))
    setCarregandoPainel(false)
  }

  useEffect(() => {
    if (pendentes > 0 && !toastVisivel) {
      const jaVisto = typeof window !== 'undefined' && window.sessionStorage.getItem('berit_aviso_pendencia_visto') === '1'
      if (!jaVisto) {
        setToastVisivel(true)
        window.sessionStorage.setItem('berit_aviso_pendencia_visto', '1')
        const t = setTimeout(() => setToastVisivel(false), 8000)
        return () => clearTimeout(t)
      }
    }
  }, [pendentes, toastVisivel])

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
  const ehSomenteLeitura = perfil && ['tesouraria', 'conselho_fiscal'].includes(perfil.perfil)
  const podeFinancas = perfil && ['admin_master', 'tesouraria', 'conselho_fiscal'].includes(perfil.perfil)
  const podeMembros = perfil && ['admin_master', 'secretaria', 'tesouraria', 'conselho_fiscal'].includes(perfil.perfil)
  const podeAgenda = perfil && ['admin_master', 'secretaria', 'tesouraria', 'conselho_fiscal'].includes(perfil.perfil)
  const podePainel = perfil && ['admin_master', 'secretaria'].includes(perfil.perfil)
  const seloLeitura = { display: 'inline-block', background: '#E8F0FA', color: '#1F3A5F', padding: '2px 8px', borderRadius: 999, fontSize: 11, marginBottom: 6 }

  const hoje = new Date()
  const chavesSemana = new Set()
  for (let i = 0; i < 7; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i)
    chavesSemana.add(`${d.getMonth() + 1}-${d.getDate()}`)
  }
  const aniversariantesHoje = aniversariantes.filter((a) => a.mes === hoje.getMonth() + 1 && a.dia === hoje.getDate())
  const aniversariantesSemana = aniversariantes.filter((a) => chavesSemana.has(`${a.mes}-${a.dia}`))
  const aniversariantesMes = aniversariantes.filter((a) => a.mes === hoje.getMonth() + 1)
  const listaAniversariantes =
    abaAniversario === 'hoje' ? aniversariantesHoje : abaAniversario === 'semana' ? aniversariantesSemana : aniversariantesMes
  const vazioAniversario =
    abaAniversario === 'hoje'
      ? 'Nenhum aniversariante hoje.'
      : abaAniversario === 'semana'
        ? 'Nenhum aniversariante esta semana.'
        : 'Nenhum aniversariante este mês.'

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
      {toastVisivel && pendentes > 0 && (
        <div
          onClick={() => { window.location.href = '/financas/auditoria' }}
          style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 50, maxWidth: 560, width: 'calc(100% - 2rem)', background: '#1F3A5F', color: '#FFFFFF', borderRadius: 10, padding: '14px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', cursor: 'pointer', fontSize: 13, lineHeight: 1.5 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <span>
              ⚠️ <strong>Existem {pendentes} pendência(s) a confirmar na auditoria.</strong>{' '}
              Acesse Finanças e em seguida Auditoria para aprovar ou recusar as alterações.
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setToastVisivel(false) }}
              style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
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
              {ehSomenteLeitura && <span style={seloLeitura}>Somente leitura</span>}
              <p style={cardTexto}>
                {ehSomenteLeitura
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
              {pendentes > 0 && (
                <span
                  role="link"
                  tabIndex={0}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = '/financas/auditoria' }}
                  style={{ display: 'inline-block', background: '#FDF3E3', color: '#B26A00', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, marginBottom: 6, cursor: 'pointer' }}
                >
                  {pendentes} pendência(s) a confirmar →
                </span>
              )}
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
              {ehSomenteLeitura && <span style={seloLeitura}>Somente leitura</span>}
              <p style={cardTexto}>
                {ehSomenteLeitura
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

        {podePainel && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F' }}>🎂 Aniversariantes</div>
                <div style={{ display: 'flex', gap: 4, background: '#F5F0E6', borderRadius: 999, padding: 3 }}>
                  {ABAS_ANIVERSARIO.map((aba) => (
                    <button
                      key={aba.v}
                      onClick={() => setAbaAniversario(aba.v)}
                      style={{
                        border: 'none', borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        background: abaAniversario === aba.v ? '#1F3A5F' : 'transparent',
                        color: abaAniversario === aba.v ? '#FFFFFF' : '#5A5A5A',
                      }}
                    >
                      {aba.r}
                    </button>
                  ))}
                </div>
              </div>
              {carregandoPainel ? (
                <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '1.5rem' }}>Carregando...</div>
              ) : listaAniversariantes.length === 0 ? (
                <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '1.5rem' }}>{vazioAniversario}</div>
              ) : (
                <div>
                  {listaAniversariantes.map((a, i) => {
                    const idade = hoje.getFullYear() - a.anoNascimento
                    const ehHoje = a.mes === hoje.getMonth() + 1 && a.dia === hoje.getDate()
                    return (
                      <div
                        key={`${a.nome}-${a.dia}-${a.mes}`}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem',
                          padding: '9px 0', borderTop: i === 0 ? 'none' : '1px solid #F0EAE0',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#2E2E2E' }}>
                            {a.nome}
                            {ehHoje && (
                              <span style={{ marginLeft: 8, background: '#FDF3E3', color: '#B26A00', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>
                                hoje
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: '#8A8A8A' }}>
                            {rotuloDiaSemana(a.mes, a.dia)} · {String(a.dia).padStart(2, '0')}/{String(a.mes).padStart(2, '0')}
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: '#4C8C6E', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {idade} {idade === 1 ? 'ano' : 'anos'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1F3A5F' }}>📅 Próximos eventos</div>
                <a href="/agenda" style={{ fontSize: 12, color: '#1F3A5F', textDecoration: 'none', fontWeight: 600 }}>
                  Ver agenda →
                </a>
              </div>
              {carregandoPainel ? (
                <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '1.5rem' }}>Carregando...</div>
              ) : proximosEventos.length === 0 ? (
                <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '1.5rem' }}>Nenhum evento próximo.</div>
              ) : (
                <div>
                  {proximosEventos.map((e, i) => {
                    const rotulo = ROTULOS_EVENTO[e.tipo] || ROTULOS_EVENTO.outro
                    return (
                      <div
                        key={`${e.id}-${i}`}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem',
                          padding: '9px 0', borderTop: i === 0 ? 'none' : '1px solid #F0EAE0',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#2E2E2E' }}>{e.titulo}</div>
                          <div style={{ fontSize: 12, color: '#8A8A8A', marginTop: 3 }}>
                            {DIAS_SEMANA_CURTO[e.quando.getDay()]} · {String(e.quando.getDate()).padStart(2, '0')}/{String(e.quando.getMonth() + 1).padStart(2, '0')}
                            {e.hora ? ` · ${e.hora}` : ''}
                            {e.local ? ` · ${e.local}` : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <span style={{ background: rotulo.bg, color: rotulo.cor, padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {rotulo.r}
                          </span>
                          {e.permanente && (
                            <span style={{ background: '#E8F0FA', color: '#1F3A5F', padding: '2px 7px', borderRadius: 999, fontSize: 10 }}>
                              semanal
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
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
