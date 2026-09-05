'use client'

import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'

function formatarCelular(valor) {
  const d = (valor || '').replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function formatarData(valor) {
  if (!valor) return ''
  const partes = valor.split('-')
  if (partes.length !== 3) return valor
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null
  const nasc = new Date(dataNascimento + 'T00:00:00')
  const hoje = new Date()
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

function faixaEtaria(idade) {
  if (idade === null || idade === undefined) return 'sem-data'
  if (idade <= 11) return 'crianca'
  if (idade <= 17) return 'adolescente'
  if (idade <= 35) return 'jovem'
  if (idade <= 59) return 'adulto'
  return 'anciao'
}

const FAIXA_ROTULO = {
  crianca: 'Criança',
  adolescente: 'Adolescente',
  jovem: 'Jovem',
  adulto: 'Adulto',
  anciao: 'Ancião',
  'sem-data': '',
}

const FAIXAS = [
  { valor: '', rotulo: 'Todas as idades' },
  { valor: 'crianca', rotulo: 'Crianças (0 a 11)' },
  { valor: 'adolescente', rotulo: 'Adolescentes (12 a 17)' },
  { valor: 'jovem', rotulo: 'Jovens (18 a 35)' },
  { valor: 'adulto', rotulo: 'Adultos (36 a 59)' },
  { valor: 'anciao', rotulo: 'Anciãos (60+)' },
]

const SITUACOES = [
  { valor: '', rotulo: 'Todas as situações' },
  { valor: 'ativo', rotulo: 'Ativos' },
  { valor: 'congregado', rotulo: 'Congregados' },
  { valor: 'visitante', rotulo: 'Visitantes' },
]

const CORES_SITUACAO = {
  ativo: { bg: '#EAF4EE', cor: '#4C8C6E' },
  congregado: { bg: '#E8F0FA', cor: '#1F3A5F' },
  visitante: { bg: '#FFF8E1', cor: '#B7791F' },
}

const MOTIVOS = [
  'Falecido',
  'Abandono',
  'Em disciplina',
  'Transferido para outra igreja',
  'Mudança de cidade',
  'Outros',
]

export default function MembrosPage() {
  const [membros, setMembros] = useState([])
  const [busca, setBusca] = useState('')
  const [faixa, setFaixa] = useState('')
  const [sexo, setSexo] = useState('')
  const [situacao, setSituacao] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [inativando, setInativando] = useState(null)
  const [motivo, setMotivo] = useState(MOTIVOS[0])
  const [excluindo, setExcluindo] = useState(null)
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('membros')
      .select('*')
      .in('situacao', ['ativo', 'congregado', 'visitante'])
      .order('nome')
    if (error) {
      setErro('Não foi possível carregar os membros.')
    } else {
      setMembros(data || [])
    }
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])

  async function confirmarInativacao() {
    if (!inativando) return
    setSalvando(true)
    const { error } = await supabase
      .from('membros')
      .update({
        situacao: 'inativo',
        motivo_inativacao: motivo,
        data_inativacao: new Date().toISOString().slice(0, 10),
      })
      .eq('id', inativando.id)
    setSalvando(false)
    setInativando(null)
    setMotivo(MOTIVOS[0])
    if (error) {
      setErro('Não foi possível inativar o membro. Tente novamente.')
    } else {
      carregar()
    }
  }

  async function confirmarExclusao() {
    if (!excluindo) return
    setSalvando(true)
    const { error } = await supabase.from('membros').delete().eq('id', excluindo.id)
    setSalvando(false)
    if (error) {
      setErro('Não foi possível excluir o cadastro. Tente novamente.')
    } else {
      setExcluindo(null)
      carregar()
    }
  }

  function exportar() {
    const dados = filtrados.map((m) => {
      const idade = calcularIdade(m.data_nascimento)
      return {
        Nome: m.nome,
        'E-mail': m.email || '',
        Celular: formatarCelular(m.celular),
        Sexo: m.sexo || '',
        Idade: idade === null ? '' : idade,
        'Faixa Etária': FAIXA_ROTULO[faixaEtaria(idade)] || '',
        'Data de Nascimento': formatarData(m.data_nascimento),
        'Data de Batismo': formatarData(m.data_batismo),
        'Data de Recebimento': formatarData(m.data_recebimento),
        Situacao: m.situacao,
        Observações: m.observacoes || '',
      }
    })
    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Membros')
    XLSX.writeFile(wb, 'membros_berit.xlsx')
  }

  const filtrados = membros.filter((m) => {
    const texto = busca.trim().toLowerCase()
    const nomeOk = !texto ||
      (m.nome || '').toLowerCase().includes(texto) ||
      (m.email || '').toLowerCase().includes(texto)
    const idade = calcularIdade(m.data_nascimento)
    const faixaOk = !faixa || faixaEtaria(idade) === faixa
    const sexoOk = !sexo || (m.sexo || '') === sexo
    const situacaoOk = !situacao || (m.situacao || '') === situacao
    return nomeOk && faixaOk && sexoOk && situacaoOk
  })

  return (
    <main style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
      <header style={{ background: '#1F3A5F', color: '#FFFFFF', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/area" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', textDecoration: 'none' }}>
          Berit
        </a>
        <a href="/area" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>
          Voltar
        </a>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: 24, color: '#1F3A5F', margin: '0 0 4px' }}>Membros</h1>
            <p style={{ fontSize: 14, color: '#8A8A8A', margin: 0 }}>Cadastro e gestão do rol de membros da igreja.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <a href="/membros/inativos" style={{ background: '#F5F0E6', color: '#1F3A5F', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Inativos
            </a>
            <a href="/membros/importar" style={{ background: '#FFFFFF', color: '#1F3A5F', border: '1px solid #1F3A5F', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Importar dados
            </a>
            <button onClick={exportar} style={{ background: '#FFFFFF', color: '#1F3A5F', border: '1px solid #1F3A5F', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Exportar
            </button>
            <a href="/membros/novo" style={{ background: '#D9A441', color: '#1F3A5F', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              + Novo membro
            </a>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            style={{ padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', width: '100%' }}
          />
          <select value={faixa} onChange={(e) => setFaixa(e.target.value)} style={{ padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', width: '100%' }}>
            {FAIXAS.map((f) => (
              <option key={f.valor} value={f.valor}>{f.rotulo}</option>
            ))}
          </select>
          <select value={sexo} onChange={(e) => setSexo(e.target.value)} style={{ padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', width: '100%' }}>
            <option value="">Homens e mulheres</option>
            <option value="masculino">Homens</option>
            <option value="feminino">Mulheres</option>
          </select>
          <select value={situacao} onChange={(e) => setSituacao(e.target.value)} style={{ padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', width: '100%' }}>
            {SITUACOES.map((s) => (
              <option key={s.valor} value={s.valor}>{s.rotulo}</option>
            ))}
          </select>
        </div>

        {erro && (
          <div style={{ background: '#FDECEC', color: '#B71C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            {erro}
          </div>
        )}

        {carregando ? (
          <div style={{ fontSize: 14, color: '#8A8A8A', textAlign: 'center', padding: '2rem' }}>Carregando membros...</div>
        ) : filtrados.length === 0 ? (
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '2rem', textAlign: 'center', border: '1px solid #E4DED2', fontSize: 14, color: '#8A8A8A' }}>
            Nenhum membro encontrado com os filtros selecionados.
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E4DED2', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 780 }}>
              <thead>
                <tr style={{ background: '#F5F0E6', color: '#1F3A5F', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Nome</th>
                  <th style={{ padding: '12px 16px' }}>Idade</th>
                  <th style={{ padding: '12px 16px' }}>Sexo</th>
                  <th style={{ padding: '12px 16px' }}>E-mail</th>
                  <th style={{ padding: '12px 16px' }}>Celular</th>
                  <th style={{ padding: '12px 16px' }}>Situação</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((m) => {
                  const idade = calcularIdade(m.data_nascimento)
                  const cores = CORES_SITUACAO[m.situacao] || { bg: '#F5F0E6', cor: '#8A8A8A' }
                  return (
                    <tr key={m.id} style={{ borderTop: '1px solid #F0EAE0' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2E2E2E' }}>{m.nome}</td>
                      <td style={{ padding: '12px 16px', color: '#5A5A5A' }}>{idade === null ? '—' : `${idade} anos`}</td>
                      <td style={{ padding: '12px 16px', color: '#5A5A5A' }}>{m.sexo === 'masculino' ? 'Masculino' : m.sexo === 'feminino' ? 'Feminino' : '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#5A5A5A' }}>{m.email || '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#5A5A5A' }}>{formatarCelular(m.celular) || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: cores.bg, color: cores.cor, padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
                          {m.situacao}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <a href={`/membros/editar?id=${m.id}`} style={{ color: '#1F3A5F', marginRight: 12, fontSize: 13 }}>Editar</a>
                        <button onClick={() => setInativando(m)} style={{ background: 'none', border: 'none', color: '#B7791F', fontSize: 13, cursor: 'pointer', marginRight: 12 }}>
                          Inativar
                        </button>
                        <button onClick={() => setExcluindo(m)} style={{ background: 'none', border: 'none', color: '#B71C1C', fontSize: 13, cursor: 'pointer' }}>
                          Excluir
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {inativando && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', maxWidth: 420, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1F3A5F', marginBottom: 6 }}>Inativar membro</div>
            <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px' }}>
              Informe o motivo da saída de <strong>{inativando.nome}</strong>. O cadastro será preservado e movido para a pasta Inativos.
            </p>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E4DED2', borderRadius: 8, fontSize: 14, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit' }}
            >
              {MOTIVOS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={confirmarInativacao}
                disabled={salvando}
                style={{ flex: 1, padding: '12px', background: '#B7791F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                {salvando ? 'Salvando...' : 'Confirmar inativação'}
              </button>
              <button
                onClick={() => { setInativando(null); setMotivo(MOTIVOS[0]) }}
                style={{ flex: 1, padding: '12px', background: '#F5F0E6', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {excluindo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', maxWidth: 420, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#B71C1C', marginBottom: 6 }}>Excluir cadastro definitivamente</div>
            <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px' }}>
              Você deseja excluir o cadastro de <strong>{excluindo.nome}</strong> definitivamente? Esta ação <strong>não pode ser desfeita</strong> e todos os dados do membro serão apagados.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={confirmarExclusao}
                disabled={salvando}
                style={{ flex: 1, padding: '12px', background: '#B71C1C', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                {salvando ? 'Excluindo...' : 'Sim, excluir definitivamente'}
              </button>
              <button
                onClick={() => setExcluindo(null)}
                style={{ flex: 1, padding: '12px', background: '#F5F0E6', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
