'use client'
import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'
import { getPerfil } from '../../lib/perfil'

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
  { valor: 'membro', rotulo: 'Membros' },
  { valor: 'congregado', rotulo: 'Congregados' },
  { valor: 'visitante', rotulo: 'Visitantes' },
]

const SITUACAO_ROTULO = {
  membro: 'Membro',
  congregado: 'Congregado',
  visitante: 'Visitante',
  inativo: 'Inativo',
}

const CORES_SITUACAO = {
  membro: { bg: '#EAF4EE', cor: '#4C8C6E' },
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
  const [perfilAtual, setPerfilAtual] = useState(null)
  const [verificando, setVerificando] = useState(true)
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
  const [consultando, setConsultando] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const podeVer = perfilAtual && ['admin_master', 'secretaria', 'tesouraria', 'conselho_fiscal'].includes(perfilAtual.perfil)
  const podeEditar = perfilAtual && ['admin_master', 'secretaria'].includes(perfilAtual.perfil)
  const ehSomenteLeitura = perfilAtual && ['tesouraria', 'conselho_fiscal'].includes(perfilAtual.perfil)

  async function carregar() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('membros')
      .select('*')
      .in('situacao', ['membro', 'congregado', 'visitante'])
      .order('nome')
    if (error) {
      setErro('Não foi possível carregar os membros.')
    } else {
      setMembros(data || [])
    }
    setCarregando(false)
  }

  useEffect(() => {
    getPerfil().then((p) => {
      setPerfilAtual(p)
      setVerificando(false)
      if (p && ['admin_master', 'secretaria', 'tesouraria', 'conselho_fiscal'].includes(p.perfil)) carregar()
    })
  }, [])

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
        Endereço: m.endereco || '',
        Bairro: m.bairro || '',
        Cidade: m.cidade || '',
        UF: m.uf || '',
        CEP: m.cep || '',
        'Nome do Pai': m.nome_pai || '',
        'Nome da Mãe': m.nome_mae || '',
        Situacao: SITUACAO_ROTULO[m.situacao] || m.situacao,
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

  const rotuloSexo = (s) => s === 'masculino' ? 'Masculino' : s === 'feminino' ? 'Feminino' : '—'

  if (verificando) {
    return (
      <main style={{ minHeight: '100vh', background: '#FAF6EF', fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center', fontSize: 14, color: '#8A8A8A' }}>
          Verificando permissões...
        </div>
      </main>
    )
  }

  if (!perfilAtual || !podeVer) {
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
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1F3A5F', marginBottom: 8 }}>Acesso restrito</div>
          <p style={{ fontSize: 14, color: '#5A5A5A', margin: '0 0 16px' }}>
            Esta área é exclusiva dos perfis <strong>Administrador</strong>, <strong>Secretaria</strong>, <strong>Tesouraria</strong> e <strong>Conselho Fiscal</strong>.
          </p>
          <a href="/area" style={{ color: '#1F3A5F', fontSize: 14 }}>Voltar para o início</a>
        </div>
      </main>
    )
  }

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
            <p style={{ fontSize: 14, color: '#8A8A8A', margin: 0 }}>
              Cadastro e gestão do rol de membros da igreja.
              {ehSomenteLeitura && ' Consulta em modo somente leitura.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {podeEditar && (
              <a href="/membros/inativos" style={{ background: '#F5F0E6', color: '#1F3A5F', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                Inativos
              </a>
            )}
            {podeEditar && (
              <a href="/membros/importar" style={{ background: '#FFFFFF', color: '#1F3A5F', border: '1px solid #1F3A5F', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                Importar dados
              </a>
            )}
            {podeEditar && (
              <button onClick={exportar} style={{ background: '#FFFFFF', color: '#1F3A5F', border: '1px solid #1F3A5F', padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Exportar
              </button>
            )}
            {podeEditar && (
              <a href="/membros/novo" style={{ background: '#D9A441', color: '#1F3A5F', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                + Novo membro
              </a>
            )}
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
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 700 }}>
              <thead>
                <tr style={{ background: '#F5F0E6', color: '#1F3A5F', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Nome</th>
                  <th style={{ padding: '12px 16px' }}>Idade</th>
                  <th style={{ padding: '12px 16px' }}>Sexo</th>
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
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#2E2E2E' }}>{m.nome}</div>
                        {(!m.sexo || !m.data_nascimento) && (
                          <span style={{ background: '#FDF3E3', color: '#B26A00', padding: '2px 8px', borderRadius: 999, fontSize: 11, display: 'inline-block', marginTop: 4 }}>
                            Dados incompletos
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#5A5A5A' }}>{idade === null ? '—' : `${idade} anos`}</td>
                      <td style={{ padding: '12px 16px', color: '#5A5A5A' }}>{rotuloSexo(m.sexo)}</td>
                      <td style={{ padding: '12px 16px', color: '#5A5A5A' }}>{formatarCelular(m.celular) || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: cores.bg, color: cores.cor, padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
                          {SITUACAO_ROTULO[m.situacao] || m.situacao}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button onClick={() => setConsultando(m)} style={{ background: 'none', border: 'none', color: '#1F3A5F', fontSize: 13, cursor: 'pointer', marginRight: 12 }}>
                          Consultar
                        </button>
                        {podeEditar && (
                          <>
                            <a href={`/membros/editar?id=${m.id}`} style={{ color: '#1F3A5F', marginRight: 12, fontSize: 13 }}>Editar</a>
                            <button onClick={() => setInativando(m)} style={{ background: 'none', border: 'none', color: '#B7791F', fontSize: 13, cursor: 'pointer', marginRight: 12 }}>
                              Inativar
                            </button>
                            <button onClick={() => setExcluindo(m)} style={{ background: 'none', border: 'none', color: '#B71C1C', fontSize: 13, cursor: 'pointer' }}>
                              Excluir
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {consultando && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '1.5rem', maxWidth: 560, width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1F3A5F' }}>Ficha do membro</div>
              <button onClick={() => setConsultando(null)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#8A8A8A', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: '0.6rem', fontSize: 14 }}>
              <div><strong style={{ color: '#1F3A5F' }}>Nome:</strong> {consultando.nome}</div>
              <div>
                <strong style={{ color: '#1F3A5F' }}>Idade / Faixa:</strong>{' '}
                {calcularIdade(consultando.data_nascimento) === null
                  ? '—'
                  : `${calcularIdade(consultando.data_nascimento)} anos (${FAIXA_ROTULO[faixaEtaria(calcularIdade(consultando.data_nascimento))] || '—'})`}
              </div>
              <div><strong style={{ color: '#1F3A5F' }}>Sexo:</strong> {rotuloSexo(consultando.sexo)}</div>
              <div><strong style={{ color: '#1F3A5F' }}>E-mail:</strong> {consultando.email || '—'}</div>
              <div><strong style={{ color: '#1F3A5F' }}>Celular:</strong> {formatarCelular(consultando.celular) || '—'}</div>
              <div><strong style={{ color: '#1F3A5F' }}>Data de nascimento:</strong> {formatarData(consultando.data_nascimento) || '—'}</div>
              <div><strong style={{ color: '#1F3A5F' }}>Data de batismo:</strong> {formatarData(consultando.data_batismo) || '—'}</div>
              <div><strong style={{ color: '#1F3A5F' }}>Data de recebimento:</strong> {formatarData(consultando.data_recebimento) || '—'}</div>
              {consultando.endereco && <div><strong style={{ color: '#1F3A5F' }}>Endereço:</strong> {consultando.endereco}</div>}
              {consultando.bairro && <div><strong style={{ color: '#1F3A5F' }}>Bairro:</strong> {consultando.bairro}</div>}
              {consultando.cidade && <div><strong style={{ color: '#1F3A5F' }}>Cidade / UF:</strong> {consultando.cidade}{consultando.uf ? ` / ${consultando.uf}` : ''}</div>}
              {consultando.cep && <div><strong style={{ color: '#1F3A5F' }}>CEP:</strong> {consultando.cep}</div>}
              {consultando.nome_pai && <div><strong style={{ color: '#1F3A5F' }}>Nome do pai:</strong> {consultando.nome_pai}</div>}
              {consultando.nome_mae && <div><strong style={{ color: '#1F3A5F' }}>Nome da mãe:</strong> {consultando.nome_mae}</div>}
              <div>
                <strong style={{ color: '#1F3A5F' }}>Situação:</strong>{' '}
                <span style={{ background: (CORES_SITUACAO[consultando.situacao] || { bg: '#F5F0E6', cor: '#8A8A8A' }).bg, color: (CORES_SITUACAO[consultando.situacao] || { bg: '#F5F0E6', cor: '#8A8A8A' }).cor, padding: '3px 8px', borderRadius: 999, fontSize: 12 }}>
                  {SITUACAO_ROTULO[consultando.situacao] || consultando.situacao}
                </span>
              </div>
              <div>
                <strong style={{ color: '#1F3A5F' }}>Observações:</strong>{' '}
                {consultando.observacoes ? (
                  <span style={{ whiteSpace: 'pre-line', color: '#2E2E2E' }}>{consultando.observacoes}</span>
                ) : '—'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: 20 }}>
              <button
                onClick={() => setConsultando(null)}
                style={{ flex: 1, padding: '12px', background: '#1F3A5F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Fechar
              </button>
              {podeEditar && (
                <a
                  href={`/membros/editar?id=${consultando.id}`}
                  style={{ flex: 1, padding: '12px', background: '#F5F0E6', color: '#1F3A5F', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}
                >
                  Editar cadastro
                </a>
              )}
            </div>
          </div>
        </div>
      )}
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
